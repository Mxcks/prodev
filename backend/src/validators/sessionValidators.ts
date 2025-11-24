import { z } from 'zod';

export const startSessionSchema = z.object({
  // No body needed - session duration is fixed at 60 seconds
});

export const recordKeyPressSchema = z.object({
  targetKey: z.string().length(1, 'Target key must be a single character'),
  pressedKey: z.string().length(1, 'Pressed key must be a single character').optional(),
  responseTime: z.number().int().positive('Response time must be positive'),
  isCorrect: z.boolean(),
});

export const endSessionSchema = z.object({
  // Session ID comes from URL params
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type RecordKeyPressInput = z.infer<typeof recordKeyPressSchema>;
export type EndSessionInput = z.infer<typeof endSessionSchema>;
