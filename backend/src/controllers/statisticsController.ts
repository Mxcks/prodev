import { Request, Response, NextFunction } from 'express';
import * as statisticsRepository from '../repositories/statisticsRepository';
import { AppError } from '../middleware/errorHandler';

export async function getStatistics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const statistics = await statisticsRepository.getUserStatistics(req.user.userId);

    if (!statistics) {
      return next(new AppError(404, 'Statistics not found'));
    }

    res.status(200).json(statistics);
  } catch (error) {
    next(error);
  }
}
