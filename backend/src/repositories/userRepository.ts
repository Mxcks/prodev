import prisma from '../config/database';
import { User } from '@prisma/client';

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      ...data,
      statistics: {
        create: {}, // Initialize empty statistics
      },
    },
    include: {
      statistics: true,
    },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
    include: {
      statistics: true,
    },
  });
}
