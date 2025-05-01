// src/controllers/flagController.ts
import { Request, Response } from 'express';
import { ethService } from '../services/ethService';
import { logger } from '../utils/logger';

export const getFlagStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await ethService.getFlagStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error in getFlagStatus controller', error);
    res.status(500).json({ message: 'Failed to get flag status', status: 500 });
  }
};

export const getEvents = (req: Request, res: Response): void => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const fromTimestamp = req.query.from ? parseInt(req.query.from as string, 10) : undefined;
    
    const events = ethService.getEvents(limit, fromTimestamp);
    res.json(events);
  } catch (error) {
    logger.error('Error in getEvents controller', error);
    res.status(500).json({ message: 'Failed to get events', status: 500 });
  }
};

export const getLeaderboard = (req: Request, res: Response): void => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const leaderboard = ethService.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Error in getLeaderboard controller', error);
    res.status(500).json({ message: 'Failed to get leaderboard', status: 500 });
  }
};

export const getAddressEvents = (req: Request, res: Response): void => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({ message: 'Invalid Ethereum address', status: 400 });
      return;
    }
    
    const events = ethService.getEventsByAddress(address);
    res.json(events);
  } catch (error) {
    logger.error('Error in getAddressEvents controller', error);
    res.status(500).json({ message: 'Failed to get address events', status: 500 });
  }
};