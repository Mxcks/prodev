import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { registerSchema, loginSchema } from '../validators/authValidators';
import { AppError } from '../middleware/errorHandler';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const result = await authService.register(validatedData);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return next(new AppError(400, 'Validation error: ' + error.message));
    }
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await authService.login(validatedData);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return next(new AppError(400, 'Validation error: ' + error.message));
    }
    next(error);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    const profile = await authService.getProfile(req.user.userId);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
}
