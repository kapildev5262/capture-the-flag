// src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import * as flagController from './controllers/flagController';
import { ethService } from './services/ethService';
import { logger } from './utils/logger';

// Create Express application
const app: Express = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: config.cors.origin,
  methods: config.cors.methods
}));

// Routes
app.get('/api/flag/status', flagController.getFlagStatus);
app.get('/api/flag/events', flagController.getEvents);
app.get('/api/flag/leaderboard', flagController.getLeaderboard);
app.get('/api/flag/address/:address/events', flagController.getAddressEvents);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Error handler middleware (should be last)
app.use(errorHandler);

// Initialize Ethereum service before starting the server
export const initializeApp = async (): Promise<Express> => {
  try {
    await ethService.initialize();
    logger.info('Ethereum service initialized');
    return app;
  } catch (error) {
    logger.error('Failed to initialize app', error);
    throw error;
  }
};

export default app;
