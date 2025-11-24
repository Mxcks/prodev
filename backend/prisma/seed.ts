import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
      statistics: {
        create: {
          totalSessions: 0,
          totalKeyPresses: 0,
          correctKeyPresses: 0,
          averageKPM: 0,
          bestKPM: 0,
          averageAccuracy: 0,
          bestAccuracy: 0,
          averageResponseTime: 0,
          bestResponseTime: 0,
        },
      },
    },
  });

  console.log('✅ Created test user:', { email: testUser.email, username: testUser.username });
  console.log('   Password: testpassword123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
