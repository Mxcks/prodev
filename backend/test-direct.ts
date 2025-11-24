import prisma from './src/config/database';
import * as sessionRepository from './src/repositories/sessionRepository';

async function test() {
  try {
    console.log('Testing session creation...');
    const session = await sessionRepository.createSession('9ce4b3a3-8c1e-4195-b3a4-4ad6c2f7f995');
    console.log('Success:', session);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
