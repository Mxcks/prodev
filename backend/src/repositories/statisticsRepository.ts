import prisma from '../config/database';

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string) {
  return prisma.userStatistics.findUnique({
    where: { userId },
  });
}

/**
 * Update user statistics after a session
 */
export async function updateUserStatistics(data: {
  userId: string;
  sessionData: {
    totalKeyPresses: number;
    correctKeyPresses: number;
    averageResponseTime: number;
    kpm: number;
    accuracy: number;
  };
}) {
  const currentStats = await getUserStatistics(data.userId);

  if (!currentStats) {
    // This shouldn't happen as statistics are created with user
    throw new Error('User statistics not found');
  }

  const newTotalSessions = currentStats.totalSessions + 1;
  const newTotalKeyPresses = currentStats.totalKeyPresses + data.sessionData.totalKeyPresses;
  const newCorrectKeyPresses = currentStats.correctKeyPresses + data.sessionData.correctKeyPresses;

  // Calculate new averages
  const newAverageKPM =
    (currentStats.averageKPM * currentStats.totalSessions + data.sessionData.kpm) / newTotalSessions;
  const newAverageAccuracy =
    (currentStats.averageAccuracy * currentStats.totalSessions + data.sessionData.accuracy) / newTotalSessions;
  const newAverageResponseTime =
    (currentStats.averageResponseTime * currentStats.totalSessions + data.sessionData.averageResponseTime) /
    newTotalSessions;

  // Update best records
  const newBestKPM = Math.max(currentStats.bestKPM, data.sessionData.kpm);
  const newBestAccuracy = Math.max(currentStats.bestAccuracy, data.sessionData.accuracy);
  const newBestResponseTime =
    currentStats.bestResponseTime === 0
      ? data.sessionData.averageResponseTime
      : Math.min(currentStats.bestResponseTime, data.sessionData.averageResponseTime);

  return prisma.userStatistics.update({
    where: { userId: data.userId },
    data: {
      totalSessions: newTotalSessions,
      totalKeyPresses: newTotalKeyPresses,
      correctKeyPresses: newCorrectKeyPresses,
      averageKPM: newAverageKPM,
      bestKPM: newBestKPM,
      averageAccuracy: newAverageAccuracy,
      bestAccuracy: newBestAccuracy,
      averageResponseTime: newAverageResponseTime,
      bestResponseTime: newBestResponseTime,
      lastSessionAt: new Date(),
    },
  });
}
