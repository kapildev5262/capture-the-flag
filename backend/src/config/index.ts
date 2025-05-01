// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

// Load environment variables from .env file
const result = dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

if (result.error) {
  logger.warn('No .env file found, using default or environment variables');
}

// Validate critical config
function validateConfig() {
  const requiredVars = ['RPC_URL', 'CONTRACT_ADDRESS'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateConfig();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  contractAddress: process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
};

// Log the configuration (with sensitive data masked)
logger.info('Configuration loaded', {
  port: config.port,
  contractAddress: config.contractAddress,
  rpcUrl: config.rpcUrl.replace(/\/v2\/.*$/, '/v2/****'), // Mask API keys
  cors: config.cors
});