# Pro Dev - File Implementation Guide

**Last Updated:** November 22, 2025

## 1. Overview

This document provides a **detailed file-by-file breakdown** of every file needed for the Pro Dev project. Each entry includes:
- File path and name
- Purpose and responsibilities
- Key exports/imports
- Dependencies
- Database operations (if applicable)
- Implementation priority

---

## 2. Implementation Order

### Phase 1: Foundation (Week 1)
1. Database schema and migrations
2. Backend core infrastructure
3. Authentication system
4. Basic API endpoints

### Phase 2: Game Backend (Week 2)
1. Game session management
2. Snippet management
3. Scoring service
4. Statistics aggregation

### Phase 3: Frontend Core (Week 3)
1. React setup and routing
2. Redux store
3. Auth components
4. API service layer

### Phase 4: Game Frontend (Week 4)
1. Game engine
2. Canvas rendering
3. Game components
4. Input handling

### Phase 5: Polish (Week 5)
1. Dashboard and statistics
2. UI/UX improvements
3. Testing
4. Bug fixes

---

## 3. Backend Files

### 3.1 Database & Prisma

#### `backend/prisma/schema.prisma`

**Purpose**: Define database schema using Prisma ORM.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Content**: Complete schema with all models, enums, relations.

**Key Sections**:
```prisma
// Database connection
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Prisma Client generator
generator client {
  provider = "prisma-client-js"
}

// Models (users, user_statistics, game_sessions, game_results, code_snippets)
// Enums (UserRole, Language, Difficulty)
// Relations and indexes
```

**Database Operations**: Defines all tables and relationships.

**Dependencies**: None

**Next Steps**: Run `prisma migrate dev` to create database.

---

#### `backend/prisma/seed.ts`

**Purpose**: Populate database with initial data (code snippets, test users).

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `seed()` function

**Database Operations**:
- INSERT 50+ code_snippets (10 Python Easy, 10 Python Normal, etc.)
- INSERT 3 test users (test@example.com, admin@example.com, player@example.com)
- INSERT initial user_statistics records

**Dependencies**:
- `@prisma/client`

**Run Command**: `npm run prisma:seed`

**Implementation**:
```typescript
import { PrismaClient, Language, Difficulty } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional for dev)
  await prisma.gameResult.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.codeSnippet.deleteMany();
  await prisma.userStatistics.deleteMany();
  await prisma.user.deleteMany();
  
  // Seed users
  const users = await seedUsers();
  
  // Seed code snippets
  await seedCodeSnippets();
  
  console.log('Database seeded successfully');
}

async function seedUsers() {
  // Create test users with hashed passwords
}

async function seedCodeSnippets() {
  // Create snippets for each language/difficulty combination
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
```

---

### 3.2 Configuration Files

#### `backend/src/config/database.ts`

**Purpose**: Database connection configuration and Prisma client export.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `prisma` (PrismaClient instance)

**Implementation**:
```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
```

**Dependencies**:
- `@prisma/client`

**Used By**: All repositories

---

#### `backend/src/config/environment.ts`

**Purpose**: Load and validate environment variables.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `env` object

**Implementation**:
```typescript
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

// Validate critical env vars
if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev-secret-change-in-production') {
  throw new Error('JWT_SECRET must be set in production');
}
```

**Dependencies**:
- `dotenv`

---

#### `backend/src/config/constants.ts`

**Purpose**: Application-wide constants.

**Priority**: ⭐⭐ High (Phase 1)

**Key Exports**: Constants object

**Implementation**:
```typescript
export const CONSTANTS = {
  PLAYER: {
    INITIAL_HEALTH: 100,
    STARTING_POSITION: { x: 600, y: 700 },
  },
  
  LASER: {
    DAMAGE: 1,
    SPEED: 400,
    WIDTH: 4,
    HEIGHT: 20,
  },
  
  GAME: {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    MIN_PLAYTIME_SECONDS: 30,
    MAX_WPM_THRESHOLD: 150, // For cheat detection
  },
  
  SCORING: {
    CORRECT_TOKEN: 10,
    WAVE_COMPLETE: 100,
    MAX_COMBO_MULTIPLIER: 3.0,
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
};
```

---

### 3.3 Middleware

#### `backend/src/middleware/auth.middleware.ts`

**Purpose**: Validate JWT tokens and protect routes.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `authMiddleware`, `optionalAuthMiddleware`

**Implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { userRepository } from '../repositories/user.repository';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authorization token is required'
        }
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Optionally verify user still exists and is active
    const user = await userRepository.findById(decoded.user_id);
    
    if (!user || !user.is_active || user.deleted_at) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_INACTIVE',
          message: 'User account is inactive'
        }
      });
    }
    
    req.user = {
      id: decoded.user_id,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired token'
      }
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Same as authMiddleware but doesn't fail if no token
  // Used for public endpoints that have auth-optional features
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = { id: decoded.user_id, role: decoded.role };
    }
  } catch (error) {
    // Silently fail, continue without auth
  }
  next();
};
```

**Dependencies**:
- `jsonwebtoken`
- `../utils/jwt.util`
- `../repositories/user.repository`

**Used By**: Protected routes

---

#### `backend/src/middleware/error.middleware.ts`

**Purpose**: Centralized error handling.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `errorMiddleware`

**Implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.util';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });
  
  // Handle known errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    });
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors
      }
    });
  }
  
  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource already exists',
          details: error.meta
        }
      });
    }
  }
  
  // Unknown error - don't leak details in production
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? error.message : 'An unexpected error occurred',
      details: isDev ? error.stack : undefined
    }
  });
};
```

**Dependencies**:
- `zod`
- `@prisma/client`
- `../utils/logger.util`

---

#### `backend/src/middleware/validation.middleware.ts`

**Purpose**: Validate request data using Zod schemas.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `validate()`

**Implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      next(error); // Pass to error middleware
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

**Dependencies**:
- `zod`

---

#### `backend/src/middleware/logger.middleware.ts`

**Purpose**: Log HTTP requests.

**Priority**: ⭐⭐ High (Phase 1)

**Key Exports**: `loggerMiddleware`

**Implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      user_id: (req as any).user?.id,
      ip: req.ip,
      user_agent: req.get('user-agent'),
    });
  });
  
  next();
};
```

**Dependencies**:
- `../utils/logger.util`

---

#### `backend/src/middleware/rateLimit.middleware.ts`

**Purpose**: Rate limiting for endpoints.

**Priority**: ⭐⭐ High (Phase 1)

**Key Exports**: `authRateLimiter`, `gameRateLimiter`

**Implementation**:
```typescript
import rateLimit from 'express-rate-limit';
import { env } from '../config/environment';

export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: 5, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const gameRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.'
    }
  },
});
```

**Dependencies**:
- `express-rate-limit`

---

### 3.4 Utilities

#### `backend/src/utils/jwt.util.ts`

**Purpose**: JWT token generation and verification.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `generateToken()`, `verifyToken()`

**Implementation**:
```typescript
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';

interface TokenPayload {
  user_id: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRATION,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

**Dependencies**:
- `jsonwebtoken`

---

#### `backend/src/utils/password.util.ts`

**Purpose**: Password hashing and verification.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `hashPassword()`, `verifyPassword()`

**Implementation**:
```typescript
import bcrypt from 'bcrypt';
import { env } from '../config/environment';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

**Dependencies**:
- `bcrypt`

---

#### `backend/src/utils/logger.util.ts`

**Purpose**: Structured logging utility.

**Priority**: ⭐⭐ High (Phase 1)

**Key Exports**: `logger` object

**Implementation**:
```typescript
import winston from 'winston';
import { env } from '../config/environment';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

**Dependencies**:
- `winston`

---

#### `backend/src/utils/error.util.ts`

**Purpose**: Custom error classes.

**Priority**: ⭐⭐ High (Phase 1)

**Key Exports**: Error classes

**Implementation**:
```typescript
export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Validation failed', public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

### 3.5 Validators

#### `backend/src/validators/auth.validator.ts`

**Purpose**: Zod schemas for authentication requests.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `registerSchema`, `loginSchema`

**Implementation**: See Backend API Documentation section 10.1

**Dependencies**:
- `zod`

---

#### `backend/src/validators/game.validator.ts`

**Purpose**: Zod schemas for game requests.

**Priority**: ⭐⭐⭐ Critical (Phase 2)

**Key Exports**: `startGameSchema`, `endGameSchema`

**Implementation**: See Backend API Documentation section 10.2

**Dependencies**:
- `zod`

---

#### `backend/src/validators/user.validator.ts`

**Purpose**: Zod schemas for user requests.

**Priority**: ⭐⭐ High (Phase 1)

**Key Exports**: `updateProfileSchema`, `changePasswordSchema`

**Implementation**:
```typescript
import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(100),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain special character'),
});
```

---

### 3.6 Repositories

#### `backend/src/repositories/user.repository.ts`

**Purpose**: Database operations for users table.

**Priority**: ⭐⭐⭐ Critical (Phase 1)

**Key Exports**: `userRepository` object

**Database Operations**:
- `create()`: INSERT INTO users
- `findById()`: SELECT FROM users WHERE id
- `findByEmail()`: SELECT FROM users WHERE email
- `findByUsername()`: SELECT FROM users WHERE username
- `update()`: UPDATE users SET ... WHERE id
- `softDelete()`: UPDATE users SET deleted_at WHERE id

**Implementation**:
```typescript
import { prisma } from '../config/database';
import { User, Prisma } from '@prisma/client';

export const userRepository = {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  },
  
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },
  
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },
  
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } });
  },
  
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },
  
  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deleted_at: new Date(), is_active: false },
    });
  },
  
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { last_login_at: new Date() },
    });
  },
};
```

**Dependencies**:
- `@prisma/client`
- `../config/database`

---

**Note**: Due to length constraints, I'll continue with the remaining 100+ files in a summarized format. The pattern above applies to all files.

---

## 4. Summary of Remaining Files

### Backend (continued)

**Repositories** (Phase 1-2):
- `game.repository.ts`: Game sessions and results CRUD
- `snippet.repository.ts`: Code snippet operations
- `statistics.repository.ts`: User statistics aggregation

**Services** (Phase 1-2):
- `auth.service.ts`: Registration, login, token verification
- `user.service.ts`: Profile, password management
- `game.service.ts`: Start/end game session logic
- `snippet.service.ts`: Snippet selection and tokenization
- `scoring.service.ts`: Score calculation and validation
- `statistics.service.ts`: Statistics updates and retrieval

**Controllers** (Phase 1-2):
- `auth.controller.ts`: Handle auth route requests
- `user.controller.ts`: Handle user route requests
- `game.controller.ts`: Handle game route requests

**Routes** (Phase 1-2):
- `auth.routes.ts`: Define auth endpoints
- `user.routes.ts`: Define user endpoints
- `game.routes.ts`: Define game endpoints
- `index.ts`: Combine all routes

**Core** (Phase 1):
- `app.ts`: Express app setup with middleware
- `server.ts`: Start HTTP server

**Types** (Phase 1-2):
- `user.types.ts`: User-related TypeScript interfaces
- `game.types.ts`: Game-related TypeScript interfaces
- `api.types.ts`: API request/response types

---

### Frontend Files

**Pages** (Phase 3-4):
- `HomePage.tsx`: Landing page
- `LoginPage.tsx`: Login form page
- `RegisterPage.tsx`: Registration page
- `DashboardPage.tsx`: User dashboard
- `GamePage.tsx`: Main game page
- `ResultPage.tsx`: Game results display
- `NotFoundPage.tsx`: 404 page

**Components - Common** (Phase 3):
- `Button/`: Reusable button component
- `Input/`: Form input component
- `Modal/`: Modal dialog component
- `Loader/`: Loading spinner

**Components - Auth** (Phase 3):
- `LoginForm/`: Login form logic
- `RegisterForm/`: Registration form logic
- `ProtectedRoute/`: Route guard

**Components - Game** (Phase 4):
- `GameCanvas/`: Canvas element wrapper
- `TypingInput/`: Typing input handler
- `GameHUD/`: Heads-up display
- `PlayerSprite/`, `EnemySprite/`, `LaserEffect/`: Sprites

**Components - Dashboard** (Phase 5):
- `StatsCard/`: Statistics display card
- `ProgressChart/`: Performance chart
- `HistoryTable/`: Game history table

**Game Engine** (Phase 4):
- `engine/GameEngine.ts`: Main game loop
- `engine/Renderer.ts`: Canvas rendering
- `engine/InputHandler.ts`: Keyboard input
- `entities/Player.ts`, `Enemy.ts`, `Laser.ts`: Game entities
- `systems/CollisionSystem.ts`, `MovementSystem.ts`, `SpawnSystem.ts`: Game systems
- `managers/WaveManager.ts`, `CodeSnippetManager.ts`: Game managers

**Redux Store** (Phase 3):
- `store/store.ts`: Configure Redux store
- `store/hooks.ts`: Typed hooks
- `slices/authSlice.ts`: Auth state management
- `slices/gameSlice.ts`: Game state management
- `slices/userSlice.ts`: User data management

**Services** (Phase 3):
- `services/api.service.ts`: Axios setup
- `services/auth.service.ts`: Auth API calls
- `services/game.service.ts`: Game API calls
- `services/user.service.ts`: User API calls

**Utils** (Phase 3):
- `utils/localStorage.ts`: Local storage helpers
- `utils/validators.ts`: Client-side validation
- `utils/formatters.ts`: Data formatting

**Hooks** (Phase 3-4):
- `hooks/useAuth.ts`: Authentication hook
- `hooks/useGame.ts`: Game state hook

**Types** (Phase 3):
- `types/game.types.ts`: Game TypeScript types
- `types/user.types.ts`: User TypeScript types
- `types/api.types.ts`: API TypeScript types

---

## 5. Configuration Files

### Root Level
- `.gitignore`: Git ignore patterns
- `docker-compose.yml`: Docker setup
- `README.md`: Project documentation

### Backend
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `.env.example`: Environment variable template
- `.eslintrc.json`: ESLint rules
- `.prettierrc`: Prettier formatting

### Frontend
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `vite.config.ts`: Vite build configuration
- `tailwind.config.js`: Tailwind CSS setup
- `.env.example`: Environment variable template
- `.eslintrc.json`: ESLint rules
- `.prettierrc`: Prettier formatting

---

## 6. Testing Files (Future)

### Backend Tests
- `tests/unit/services/*.test.ts`: Service unit tests
- `tests/integration/api/*.test.ts`: API integration tests
- `tests/setup.ts`: Test configuration

### Frontend Tests
- `tests/components/*.test.tsx`: Component tests
- `tests/game/*.test.ts`: Game engine tests
- `tests/setup.ts`: Test configuration

---

## 7. Quick Start Implementation Checklist

### Week 1: Backend Foundation
- [ ] Setup PostgreSQL database
- [ ] Create `schema.prisma`
- [ ] Run migrations
- [ ] Create `seed.ts` and seed database
- [ ] Implement authentication (services, controllers, routes)
- [ ] Test auth endpoints with Postman

### Week 2: Game Backend
- [ ] Implement game session management
- [ ] Implement snippet service
- [ ] Implement scoring service
- [ ] Test game flow end-to-end

### Week 3: Frontend Core
- [ ] Setup React + Vite
- [ ] Configure Redux store
- [ ] Implement auth pages (login, register)
- [ ] Implement protected routing
- [ ] Connect to backend API

### Week 4: Game Frontend
- [ ] Implement game engine
- [ ] Create typing input component
- [ ] Implement canvas rendering
- [ ] Connect game to backend

### Week 5: Polish & Launch
- [ ] Implement dashboard
- [ ] Add statistics displays
- [ ] UI/UX improvements
- [ ] Testing and bug fixes
- [ ] Deploy to production

---

## Document Owner
Full Stack Development Team

**Last Review**: November 22, 2025  
**Implementation Start**: November 25, 2025  
**Target Launch**: December 30, 2025 (5 weeks)
