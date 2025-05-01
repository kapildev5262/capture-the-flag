// src/utils/logger.ts
export const logger = {
    info: (message: string, meta?: Record<string, unknown>): void => {
      console.log(`[INFO] ${message}`, meta || '');
    },
    error: (message: string, error?: unknown): void => {
      console.error(`[ERROR] ${message}`, error || '');
    },
    warn: (message: string, meta?: Record<string, unknown>): void => {
      console.warn(`[WARN] ${message}`, meta || '');
    }
  };