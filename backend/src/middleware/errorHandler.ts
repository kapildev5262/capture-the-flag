// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../models/types';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const status = 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`Error processing request: ${message}`, err);
  
  res.status(status).json({
    status,
    message
  });
};