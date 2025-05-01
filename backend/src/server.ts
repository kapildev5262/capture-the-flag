// src/server.ts
import { config } from './config';
import { initializeApp } from './app';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    const app = await initializeApp();
    
    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Connecting to contract at ${config.contractAddress}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Start the server
startServer();