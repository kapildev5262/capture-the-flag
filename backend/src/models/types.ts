// src/models/types.ts
import { ethers } from 'ethers';

export interface FlagEvent {
  type: 'capture' | 'release';
  address: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
}

export interface FlagStatus {
  currentOwner: string;
  lastCaptureTime: number;
}

export interface LeaderboardEntry {
  address: string;
  captureCount: number;
}

export interface ErrorResponse {
  message: string;
  status: number;
}

export interface CaptureTheFlag extends ethers.Contract {
  captureFlag: () => Promise<ethers.ContractTransaction>;
  releaseFlag: () => Promise<ethers.ContractTransaction>;
  getFlagStatus: () => Promise<[string, ethers.BigNumber]>;
}