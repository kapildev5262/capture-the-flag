// src/services/ethService.ts
import { ethers } from 'ethers';
import { FlagEvent, FlagStatus, LeaderboardEntry, CaptureTheFlag } from '../models/types';
import { config } from '../config';
import { logger } from '../utils/logger';

// ABI for the CaptureTheFlag contract
const contractAbi = [
  "event FlagCaptured(address indexed capturer, uint256 timestamp)",
  "event FlagReleased(address indexed releaser, uint256 timestamp)",
  "function captureFlag() external",
  "function releaseFlag() external",
  "function getFlagStatus() external view returns (address owner, uint256 captureTime)"
];

export class EthService {
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private contract: CaptureTheFlag | null = null;
  private eventCache: FlagEvent[] = [];
  private leaderboard: Map<string, number> = new Map();
  private isInitialized = false;
  private initializationAttempts = 0;
  
  // Maximum number of connection retry attempts
  private maxRetryAttempts = parseInt(process.env.CONNECTION_RETRY_ATTEMPTS || '5', 10);
  // Delay between retries in milliseconds
  private retryDelay = parseInt(process.env.CONNECTION_RETRY_DELAY || '2000', 10);

  constructor() {
    // Defer connection to initialize method
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.connectToEthereum();
      
      // Load past events
      await this.loadPastEvents();
      
      // Set up event listeners for real-time updates
      this.setupEventListeners();
      
      this.isInitialized = true;
      logger.info('EthService initialized successfully');
    } catch (error) {
      this.initializationAttempts++;
      
      if (this.initializationAttempts < this.maxRetryAttempts) {
        const retryDelaySeconds = this.retryDelay / 1000;
        logger.warn(`Failed to initialize EthService (attempt ${this.initializationAttempts}/${this.maxRetryAttempts}). Retrying in ${retryDelaySeconds} seconds...`);
        
        // Set up retry with delay
        setTimeout(() => {
          this.initialize().catch(e => {
            logger.error('Retry initialization failed', e);
          });
        }, this.retryDelay);
        
        return;
      }
      
      logger.error('Failed to initialize EthService after multiple attempts', error);
      throw new Error('Failed to initialize Ethereum service');
    }
  }

  private async connectToEthereum(): Promise<void> {
    try {
      // Validate RPC URL
      if (!config.rpcUrl) {
        throw new Error('RPC URL is not configured properly');
      }

      logger.info(`Connecting to Ethereum network at ${config.rpcUrl}`);
      
      // Create provider
      this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      
      // Test connection
      const network = await this.provider.getNetwork();
      logger.info(`Connected to network: ${network.name} (chainId: ${network.chainId})`);
      
      // Check contract address
      if (!ethers.utils.isAddress(config.contractAddress)) {
        throw new Error(`Invalid contract address: ${config.contractAddress}`);
      }
      
      // Create contract instance
      this.contract = new ethers.Contract(
        config.contractAddress,
        contractAbi,
        this.provider
      ) as unknown as CaptureTheFlag;
      
      logger.info(`Contract interface initialized at ${config.contractAddress}`);
    } catch (error) {
      logger.error('Failed to connect to Ethereum network', error);
      this.provider = null;
      this.contract = null;
      throw error;
    }
  }

  private async loadPastEvents(): Promise<void> {
    if (!this.provider || !this.contract) {
      throw new Error('Provider or contract not initialized');
    }
    
    try {
      const currentBlock = await this.provider.getBlockNumber();
      logger.info(`Current block number: ${currentBlock}`);
      
      // Load last 10000 blocks or from genesis if less
      const fromBlock = Math.max(0, currentBlock - 10000);
      logger.info(`Loading events from block ${fromBlock} to ${currentBlock}`);

      // Get capture events
      const captureFilter = this.contract.filters.FlagCaptured();
      const captureEvents = await this.contract.queryFilter(captureFilter, fromBlock);
      
      // Get release events
      const releaseFilter = this.contract.filters.FlagReleased();
      const releaseEvents = await this.contract.queryFilter(releaseFilter, fromBlock);

      // Process events
      for (const event of captureEvents) {
        const args = event.args as unknown as [string, ethers.BigNumber];
        this.processEvent({
          type: 'capture',
          address: args[0],
          timestamp: args[1].toNumber(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      for (const event of releaseEvents) {
        const args = event.args as unknown as [string, ethers.BigNumber];
        this.processEvent({
          type: 'release',
          address: args[0],
          timestamp: args[1].toNumber(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber
        });
      }

      logger.info(`Loaded ${captureEvents.length} capture and ${releaseEvents.length} release events`);
    } catch (error) {
      logger.error('Error loading past events', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    // Listen for new capture events
    this.contract.on('FlagCaptured', (capturer: string, timestamp: ethers.BigNumber, event: ethers.Event) => {
      this.processEvent({
        type: 'capture',
        address: capturer,
        timestamp: timestamp.toNumber(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
      logger.info(`New flag capture by ${capturer}`);
    });

    // Listen for new release events
    this.contract.on('FlagReleased', (releaser: string, timestamp: ethers.BigNumber, event: ethers.Event) => {
      this.processEvent({
        type: 'release',
        address: releaser,
        timestamp: timestamp.toNumber(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
      logger.info(`Flag released by ${releaser}`);
    });
  }

  private processEvent(event: FlagEvent): void {
    // Add to event cache
    this.eventCache.push(event);

    // Update leaderboard for capture events
    if (event.type === 'capture') {
      const currentCount = this.leaderboard.get(event.address) || 0;
      this.leaderboard.set(event.address, currentCount + 1);
    }
  }

  public async getFlagStatus(): Promise<FlagStatus> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      const [currentOwner, lastCaptureTime] = await this.contract.getFlagStatus();
      return {
        currentOwner,
        lastCaptureTime: lastCaptureTime.toNumber()
      };
    } catch (error) {
      logger.error('Error getting flag status', error);
      throw new Error('Failed to get flag status from the contract');
    }
  }

  public getEvents(limit?: number, fromTimestamp?: number): FlagEvent[] {
    let filteredEvents = [...this.eventCache];
    
    // Filter by timestamp if provided
    if (fromTimestamp) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= fromTimestamp);
    }
    
    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if provided
    if (limit && limit > 0) {
      filteredEvents = filteredEvents.slice(0, limit);
    }
    
    return filteredEvents;
  }

  public getLeaderboard(limit?: number): LeaderboardEntry[] {
    // Convert Map to array and sort by capture count
    const leaderboardArray: LeaderboardEntry[] = Array.from(
      this.leaderboard.entries()
    ).map(([address, captureCount]) => ({
      address,
      captureCount
    }));
    
    // Sort by capture count (highest first)
    leaderboardArray.sort((a, b) => b.captureCount - a.captureCount);
    
    // Apply limit if provided
    if (limit && limit > 0) {
      return leaderboardArray.slice(0, limit);
    }
    
    return leaderboardArray;
  }

  public getEventsByAddress(address: string): FlagEvent[] {
    return this.eventCache.filter(event => event.address.toLowerCase() === address.toLowerCase())
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Graceful shutdown
  public shutdown(): void {
    if (this.provider) {
      logger.info('Shutting down Ethereum service connections');
      // Remove all listeners
      this.provider.removeAllListeners();
      if (this.contract) {
        this.contract.removeAllListeners();
      }
    }
  }
}

// Create a singleton instance
export const ethService = new EthService();