import prisma from './src/config/database';

async function cleanup() {
  await prisma.typingSession.updateMany({
    where: { status: 'in_progress' },
    data: { status: 'abandoned' }
  });
  console.log('Cleaned up abandoned sessions');
  await prisma.$disconnect();
}

cleanup();
