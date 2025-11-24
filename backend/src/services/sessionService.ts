import { AppError } from '../middleware/errorHandler';
import * as sessionRepository from '../repositories/sessionRepository';
import * as statisticsRepository from '../repositories/statisticsRepository';
import { RecordKeyPressInput } from '../validators/sessionValidators';

/**
 * Start a new typing session
 */
export async function startSession(userId: string) {
  // Check if user already has an active session
  const activeSession = await sessionRepository.getActiveSession(userId);
  if (activeSession) {
    throw new AppError(400, 'You already have an active session. Please complete or abandon it first.');
  }

  // Create new session
  const session = await sessionRepository.createSession(userId);

  return {
    id: session.id,
    keySequence: JSON.parse(session.keySequence),
    startedAt: session.startedAt,
    duration: session.duration,
  };
}

/**
 * Record a key press for a session
 */
export async function recordKeyPress(sessionId: string, userId: string, input: RecordKeyPressInput) {
  // Verify session exists and belongs to user
  const session = await sessionRepository.getSessionById(sessionId);
  
  if (!session) {
    throw new AppError(404, 'Session not found');
  }

  if (session.userId !== userId) {
    throw new AppError(403, 'You do not have permission to access this session');
  }

  if (session.status !== 'in_progress') {
    throw new AppError(400, 'Session is not active');
  }

  // Record the key press
  const result = await sessionRepository.recordKeyPress({
    sessionId,
    targetKey: input.targetKey,
    pressedKey: input.pressedKey || null,
    isCorrect: input.isCorrect,
    responseTime: input.responseTime,
  });

  return {
    id: result.id,
    targetKey: result.targetKey,
    pressedKey: result.pressedKey,
    isCorrect: result.isCorrect,
    responseTime: result.responseTime,
    keyPressedAt: result.keyPressedAt,
  };
}

/**
 * End a typing session and calculate statistics
 */
export async function endSession(sessionId: string, userId: string) {
  // Verify session exists and belongs to user
  const session = await sessionRepository.getSessionById(sessionId);
  
  if (!session) {
    throw new AppError(404, 'Session not found');
  }

  if (session.userId !== userId) {
    throw new AppError(403, 'You do not have permission to access this session');
  }

  if (session.status !== 'in_progress') {
    throw new AppError(400, 'Session is not active');
  }

  // Get all results for the session
  const results = await sessionRepository.getSessionResults(sessionId);

  if (results.length === 0) {
    throw new AppError(400, 'No key presses recorded for this session');
  }

  // Calculate statistics
  const totalKeyPresses = results.length;
  const correctKeyPresses = results.filter((r: any) => r.isCorrect).length;
  const accuracy = (correctKeyPresses / totalKeyPresses) * 100;

  // Calculate average response time
  const totalResponseTime = results.reduce((sum: number, r: any) => sum + r.responseTime, 0);
  const averageResponseTime = totalResponseTime / totalKeyPresses;

  // Calculate KPM (Keys Per Minute) - based on 60 second session
  const sessionDurationMinutes = session.duration / 60;
  const kpm = correctKeyPresses / sessionDurationMinutes;

  // End the session
  await sessionRepository.endSession(sessionId);

  // Update user statistics
  const updatedStats = await statisticsRepository.updateUserStatistics({
    userId,
    sessionData: {
      totalKeyPresses,
      correctKeyPresses,
      averageResponseTime,
      kpm,
      accuracy,
    },
  });

  return {
    sessionId: session.id,
    totalKeyPresses,
    correctKeyPresses,
    accuracy,
    kpm,
    averageResponseTime,
    statistics: updatedStats,
  };
}

/**
 * Get a specific session
 */
export async function getSession(sessionId: string, userId: string) {
  const session = await sessionRepository.getSessionById(sessionId);
  
  if (!session) {
    throw new AppError(404, 'Session not found');
  }

  if (session.userId !== userId) {
    throw new AppError(403, 'You do not have permission to access this session');
  }

  return {
    id: session.id,
    userId: session.userId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    status: session.status,
    duration: session.duration,
    keySequence: JSON.parse(session.keySequence),
    results: session.typingResults,
  };
}

/**
 * Get user's session history
 */
export async function getUserSessionHistory(userId: string, limit: number = 10) {
  const sessions = await sessionRepository.getUserSessions(userId, limit);

  return sessions.map((session: any) => ({
    id: session.id,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    status: session.status,
    duration: session.duration,
    totalKeyPresses: session.typingResults.length,
    correctKeyPresses: session.typingResults.filter((r: any) => r.isCorrect).length,
  }));
}
