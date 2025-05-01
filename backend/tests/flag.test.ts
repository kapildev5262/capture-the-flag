// tests/flag.test.ts
import request from 'supertest';
import { Express } from 'express';
import { FlagEvent, FlagStatus, LeaderboardEntry } from '../src/models/types';

// Mock ethers and the ethService BEFORE importing the app
jest.mock('ethers');

// Define mock data
const mockFlagStatus: FlagStatus = {
  currentOwner: '0x1234567890123456789012345678901234567890',
  lastCaptureTime: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
};

const mockEvents: FlagEvent[] = [
  {
    type: 'capture',
    address: '0x1234567890123456789012345678901234567890',
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    transactionHash: '0xabcd1234',
    blockNumber: 12345
  },
  {
    type: 'release',
    address: '0x1234567890123456789012345678901234567890',
    timestamp: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
    transactionHash: '0xabcd5678',
    blockNumber: 12346
  },
  {
    type: 'capture',
    address: '0x2234567890123456789012345678901234567890',
    timestamp: Math.floor(Date.now() / 1000) - 1200, // 20 minutes ago
    transactionHash: '0xabcd9012',
    blockNumber: 12347
  }
];

const mockLeaderboard: LeaderboardEntry[] = [
  {
    address: '0x1234567890123456789012345678901234567890',
    captureCount: 2
  },
  {
    address: '0x2234567890123456789012345678901234567890',
    captureCount: 1
  }
];

// Mock the ethService before importing app
jest.mock('../src/services/ethService', () => {
  // Create mock implementations
  const mockGetEvents = jest.fn().mockImplementation((limit, fromTimestamp) => {
    let events = [...mockEvents];
    
    if (fromTimestamp) {
      events = events.filter(event => event.timestamp >= fromTimestamp);
    }
    
    if (limit && limit > 0) {
      events = events.slice(0, limit);
    }
    
    return events;
  });

  const mockGetLeaderboard = jest.fn().mockImplementation((limit) => {
    if (limit && limit > 0) {
      return mockLeaderboard.slice(0, limit);
    }
    return mockLeaderboard;
  });

  const mockGetEventsByAddress = jest.fn().mockImplementation((address) => {
    return mockEvents.filter(event => event.address === address);
  });

  const mockGetFlagStatus = jest.fn().mockResolvedValue(mockFlagStatus);
  const mockInitialize = jest.fn().mockResolvedValue(undefined);

  // Return the mock module
  return {
    ethService: {
      initialize: mockInitialize,
      getFlagStatus: mockGetFlagStatus,
      getEvents: mockGetEvents,
      getLeaderboard: mockGetLeaderboard,
      getEventsByAddress: mockGetEventsByAddress
    },
    EthService: jest.fn().mockImplementation(() => {
      return {
        initialize: mockInitialize,
        getFlagStatus: mockGetFlagStatus,
        getEvents: mockGetEvents,
        getLeaderboard: mockGetLeaderboard,
        getEventsByAddress: mockGetEventsByAddress
      };
    })
  };
});

// Now import the app after all mocks are set up
import { initializeApp } from '../src/app';

// Initialize app before tests
let initializedApp: Express;

beforeAll(async () => {
  initializedApp = await initializeApp();
});

describe('Flag API Endpoints', () => {
  
  describe('GET /api/flag/status', () => {
    it('should return the current flag status', async () => {
      const response = await request(initializedApp)
        .get('/api/flag/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockFlagStatus);
    });
  });

  describe('GET /api/flag/events', () => {
    it('should return all events without filters', async () => {
      const response = await request(initializedApp)
        .get('/api/flag/events')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockEvents);
    });

    it('should apply limit when provided', async () => {
      const response = await request(initializedApp)
        .get('/api/flag/events?limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(mockEvents[0]);
    });

    it('should apply timestamp filter when provided', async () => {
      const timestamp = Math.floor(Date.now() / 1000) - 2000;
      const response = await request(initializedApp)
        .get(`/api/flag/events?from=${timestamp}`)
        .expect('Content-Type', /json/)
        .expect(200);

      const filteredEvents = mockEvents.filter(event => event.timestamp >= timestamp);
      expect(response.body).toEqual(filteredEvents);
    });
  });

  describe('GET /api/flag/leaderboard', () => {
    it('should return the leaderboard data', async () => {
      const response = await request(initializedApp)
        .get('/api/flag/leaderboard')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockLeaderboard);
    });

    it('should apply limit when provided', async () => {
      const response = await request(initializedApp)
        .get('/api/flag/leaderboard?limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(mockLeaderboard[0]);
    });
  });

  describe('GET /api/flag/address/:address/events', () => {
    it('should return events for a specific address', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const response = await request(initializedApp)
        .get(`/api/flag/address/${address}/events`)
        .expect('Content-Type', /json/)
        .expect(200);

      const expectedEvents = mockEvents.filter(event => event.address === address);
      expect(response.body).toEqual(expectedEvents);
    });

    it('should return 400 for invalid address format', async () => {
      const response = await request(initializedApp)
        .get('/api/flag/address/invalid-address/events')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.message).toContain('Invalid Ethereum address');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(initializedApp)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});