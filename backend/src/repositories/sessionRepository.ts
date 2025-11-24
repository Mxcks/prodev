import prisma from '../config/database';

/**
 * Generate a random sequence of 200 keys (A-Z)
 */
export function generateKeySequence(): string[] {
  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const sequence: string[] = [];
  
  for (let i = 0; i < 200; i++) {
    const randomIndex = Math.floor(Math.random() * keys.length);
    sequence.push(keys[randomIndex]);
  }
  
  return sequence;
}

/**
 * Create a new typing session
 */
export async function createSession(userId: string) {
  const keySequence = generateKeySequence();
  
  return prisma.typingSession.create({
    data: {
      userId,
      status: 'in_progress',
      keySequence: JSON.stringify(keySequence),
    },
  });
}

/**
 * Get a session by ID
 */
export async function getSessionById(sessionId: string) {
  return prisma.typingSession.findUnique({
    where: { id: sessionId },
    include: {
      typingResults: true,
    },
  });
}

/**
 * Get user's active session
 */
export async function getActiveSession(userId: string) {
  return prisma.typingSession.findFirst({
    where: {
      userId,
      status: 'in_progress',
    },
    orderBy: {
      startedAt: 'desc',
    },
  });
}

/**
 * Record a key press result
 */
export async function recordKeyPress(data: {
  sessionId: string;
  targetKey: string;
  pressedKey: string | null;
  isCorrect: boolean;
  responseTime: number;
}) {
  return prisma.typingResult.create({
    data: {
      sessionId: data.sessionId,
      targetKey: data.targetKey,
      pressedKey: data.pressedKey,
      isCorrect: data.isCorrect,
      responseTime: data.responseTime,
    },
  });
}

/**
 * End a typing session
 */
export async function endSession(sessionId: string) {
  return prisma.typingSession.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      endedAt: new Date(),
    },
  });
}

/**
 * Get all results for a session
 */
export async function getSessionResults(sessionId: string) {
  return prisma.typingResult.findMany({
    where: { sessionId },
    orderBy: {
      keyPressedAt: 'asc',
    },
  });
}

/**
 * Get user's recent sessions
 */
export async function getUserSessions(userId: string, limit: number = 10) {
  return prisma.typingSession.findMany({
    where: { userId },
    orderBy: {
      startedAt: 'desc',
    },
    take: limit,
    include: {
      typingResults: true,
    },
  });
}
