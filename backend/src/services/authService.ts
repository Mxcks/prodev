import { AppError } from '../middleware/errorHandler';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import * as userRepository from '../repositories/userRepository';
import { RegisterInput, LoginInput } from '../validators/authValidators';

export async function register(input: RegisterInput) {
  // Check if email already exists
  const existingEmail = await userRepository.findUserByEmail(input.email);
  if (existingEmail) {
    throw new AppError(400, 'Email already registered');
  }

  // Check if username already exists
  const existingUsername = await userRepository.findUserByUsername(input.username);
  if (existingUsername) {
    throw new AppError(400, 'Username already taken');
  }

  // Hash password
  const hashedPassword = await hashPassword(input.password);

  // Create user
  const user = await userRepository.createUser({
    email: input.email,
    username: input.username,
    password: hashedPassword,
  });

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  };
}

export async function login(input: LoginInput) {
  // Find user by email
  const user = await userRepository.findUserByEmail(input.email);
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(input.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    statistics: user.statistics,
  };
}
