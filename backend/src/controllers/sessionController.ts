import { Request, Response, NextFunction } from 'express';
import * as sessionService from '../services/sessionService';
import { recordKeyPressSchema } from '../validators/sessionValidators';
import { AppError } from '../middleware/errorHandler';

export async function startSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const session = await sessionService.startSession(req.user.userId);

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
}

export async function recordKeyPress(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const { sessionId } = req.params;
    const validatedData = recordKeyPressSchema.parse(req.body);

    const result = await sessionService.recordKeyPress(sessionId, req.user.userId, validatedData);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return next(new AppError(400, 'Validation error: ' + error.message));
    }
    next(error);
  }
}

export async function endSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const { sessionId } = req.params;

    const summary = await sessionService.endSession(sessionId, req.user.userId);

    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const { sessionId } = req.params;

    const session = await sessionService.getSession(sessionId, req.user.userId);

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
}

export async function getSessionHistory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const sessions = await sessionService.getUserSessionHistory(req.user.userId, limit);

    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
}
