# Pro Dev - Project Architecture Overview

**Last Updated:** November 22, 2025

## 1. Project Vision

**Pro Dev** is a keyboard typing trainer that helps users improve their typing speed and accuracy through a visual keyboard interface. The application highlights keys for users to press, tracking their performance over 60-second sessions.

### Initial Version (v1.0 - MVP) - Core Features
- **Visual Keyboard Layout**: Full keyboard displayed on screen
- **Key Highlighting**: Next key to press is highlighted
- **60-Second Timer**: Fixed session length
- **Simple Scoring**: Count correct key presses
- **Performance Metrics**: Keys per minute (KPM), accuracy percentage
- **Session History**: Store and display past sessions

### Future Expansion (Post v1.0)
- Code snippet typing (Python, React, JavaScript)
- Game modes (shooter, boss rush, etc.)
- Different difficulty levels
- Leaderboards and achievements
- Multiplayer support
- Custom typing sequences

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Rendering**: HTML/CSS (no Canvas needed for MVP)
- **State Management**: Redux Toolkit or React Context
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Keyboard Detection**: Native JavaScript KeyboardEvent API

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens) + bcrypt
- **Validation**: Zod
- **API Documentation**: OpenAPI/Swagger
- **WebSocket**: Socket.io (for future real-time features)

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest + React Testing Library (frontend), Jest + Supertest (backend)
- **Environment**: Docker + Docker Compose
- **CI/CD**: GitHub Actions (ready for future deployment)

---

## 3. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT TIER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Frontend (Port 5173)                 │ │
│  │                                                          │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │  Keyboard   │  │  Auth Pages  │  │  Dashboard   │  │ │
│  │  │  Trainer UI │  │  Components  │  │  Components  │  │ │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │         Redux Store (Session State)             │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │      Keyboard Event Handler + Timer             │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        SERVER TIER                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Express.js API (Port 3000)                   │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │ │
│  │  │    Auth      │  │     Game     │  │    User     │  │ │
│  │  │  Middleware  │  │   Services   │  │  Services   │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │          Business Logic Layer                   │   │ │
│  │  │  - Code Snippet Generator                       │   │ │
│  │  │  - Scoring Calculator                           │   │ │
│  │  │  - Enemy Wave Manager                           │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │            Prisma ORM Layer                     │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ TCP Connection
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE TIER                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           PostgreSQL 15+ (Port 5432)                    │ │
│  │                                                          │ │
│  │   Tables:                                                │ │
│  │   - users                                                │ │
│  │   - game_sessions                                        │ │
│  │   - game_results                                         │ │
│  │   - code_snippets                                        │ │
│  │   - user_statistics                                      │ │
│  │   - achievements (future)                                │ │
│  │   - leaderboards (future)                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Project Directory Structure

```
prodev/
├── docs/                           # All documentation
│   ├── 01-PROJECT-ARCHITECTURE.md
│   ├── 02-DATABASE-SCHEMA.md
│   ├── 03-BACKEND-API.md
│   ├── 04-FRONTEND-STRUCTURE.md
│   ├── 05-GAME-MECHANICS.md
│   └── 06-FILE-IMPLEMENTATION-GUIDE.md
│
├── backend/                        # Backend API server
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma database schema
│   │   ├── migrations/            # Database migrations
│   │   └── seed.ts                # Database seeding script
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── environment.ts
│   │   │   └── constants.ts
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── logger.middleware.ts
│   │   ├── routes/                # API route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── game.routes.ts
│   │   │   └── index.ts
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── game.controller.ts
│   │   ├── services/              # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── game.service.ts
│   │   │   ├── snippet.service.ts
│   │   │   ├── scoring.service.ts
│   │   │   └── statistics.service.ts
│   │   ├── repositories/          # Database access layer
│   │   │   ├── user.repository.ts
│   │   │   ├── game.repository.ts
│   │   │   ├── snippet.repository.ts
│   │   │   └── statistics.repository.ts
│   │   ├── validators/            # Request validation schemas
│   │   │   ├── auth.validator.ts
│   │   │   ├── user.validator.ts
│   │   │   └── game.validator.ts
│   │   ├── types/                 # TypeScript type definitions
│   │   │   ├── user.types.ts
│   │   │   ├── game.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── index.ts
│   │   ├── utils/                 # Utility functions
│   │   │   ├── jwt.util.ts
│   │   │   ├── password.util.ts
│   │   │   ├── logger.util.ts
│   │   │   └── error.util.ts
│   │   ├── app.ts                 # Express app setup
│   │   └── server.ts              # Server entry point
│   ├── tests/                     # Backend tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── setup.ts
│   ├── .env.example
│   ├── .env.development
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── frontend/                       # React frontend
│   ├── public/
│   │   ├── assets/                # Static assets
│   │   │   ├── images/
│   │   │   ├── sounds/
│   │   │   └── fonts/
│   │   └── index.html
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── common/           # Reusable UI components
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   └── Loader/
│   │   │   ├── auth/             # Authentication components
│   │   │   │   ├── LoginForm/
│   │   │   │   ├── RegisterForm/
│   │   │   │   └── ProtectedRoute/
│   │   │   ├── game/             # Game-specific components
│   │   │   │   ├── GameCanvas/
│   │   │   │   ├── TypingInput/
│   │   │   │   ├── GameHUD/
│   │   │   │   ├── EnemySprite/
│   │   │   │   ├── PlayerSprite/
│   │   │   │   └── LaserEffect/
│   │   │   ├── dashboard/        # User dashboard components
│   │   │   │   ├── StatsCard/
│   │   │   │   ├── ProgressChart/
│   │   │   │   └── HistoryTable/
│   │   │   └── layout/           # Layout components
│   │   │       ├── Header/
│   │   │       ├── Footer/
│   │   │       └── Sidebar/
│   │   ├── pages/                # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── GamePage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── store/                # Redux store
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── gameSlice.ts
│   │   │   │   └── userSlice.ts
│   │   │   ├── hooks.ts
│   │   │   └── store.ts
│   │   ├── services/             # API service layer
│   │   │   ├── api.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── game.service.ts
│   │   │   └── user.service.ts
│   │   ├── game/                 # Game engine code
│   │   │   ├── engine/
│   │   │   │   ├── GameEngine.ts
│   │   │   │   ├── Renderer.ts
│   │   │   │   ├── InputHandler.ts
│   │   │   │   └── AnimationManager.ts
│   │   │   ├── entities/
│   │   │   │   ├── Player.ts
│   │   │   │   ├── Enemy.ts
│   │   │   │   ├── Laser.ts
│   │   │   │   └── Entity.ts (base class)
│   │   │   ├── systems/
│   │   │   │   ├── CollisionSystem.ts
│   │   │   │   ├── MovementSystem.ts
│   │   │   │   ├── SpawnSystem.ts
│   │   │   │   └── ScoringSystem.ts
│   │   │   ├── managers/
│   │   │   │   ├── WaveManager.ts
│   │   │   │   ├── CodeSnippetManager.ts
│   │   │   │   └── ParticleManager.ts
│   │   │   └── utils/
│   │   │       ├── MathUtils.ts
│   │   │       ├── ColorUtils.ts
│   │   │       └── SoundManager.ts
│   │   ├── types/                # TypeScript types
│   │   │   ├── game.types.ts
│   │   │   ├── user.types.ts
│   │   │   └── api.types.ts
│   │   ├── utils/                # Utility functions
│   │   │   ├── localStorage.ts
│   │   │   ├── validators.ts
│   │   │   └── formatters.ts
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useGame.ts
│   │   │   └── useWebSocket.ts
│   │   ├── styles/               # Global styles
│   │   │   ├── globals.css
│   │   │   └── game.css
│   │   ├── config/               # Frontend configuration
│   │   │   └── constants.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── tests/                    # Frontend tests
│   │   ├── components/
│   │   ├── game/
│   │   └── setup.ts
│   ├── .env.example
│   ├── .env.development
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
│
├── docker/                        # Docker configuration
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── postgres.Dockerfile
│
├── .github/                       # GitHub workflows
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── docker-compose.yml             # Docker compose setup
├── docker-compose.dev.yml         # Development override
├── .gitignore
├── README.md
└── LICENSE
```

---

## 5. Data Flow Architecture

### Authentication Flow
```
1. User Registration/Login
   Client → POST /api/auth/register → Backend
   Backend → Validate input → Hash password → Save to DB
   Backend → Generate JWT → Return to Client
   Client → Store JWT in localStorage → Redirect to Dashboard

2. Authenticated Requests
   Client → Add JWT to Authorization header → Backend
   Backend → Auth Middleware validates JWT → Extract user ID
   Backend → Process request with user context → Return response
```

### Typing Session Flow
```
1. Start Session
   Client → POST /api/session/start → Backend
   Backend → Create typing_session record → Generate key sequence
   Backend → Return session_id + key_sequence → Client
   Client → Start 60-second timer → Display keyboard

2. During Session (Client-side)
   - Highlight next key to press
   - User presses key
   - If correct → Increment score, move to next key
   - If incorrect → Increment error count, move to next key
   - Update real-time metrics (KPM, accuracy)
   - Timer reaches 0 → Session ends

3. End Session
   Client → POST /api/session/end → Backend
   Backend → Validate session → Calculate final metrics
   Backend → Update typing_results table
   Backend → Update user_statistics aggregate
   Backend → Return final stats → Client
   Client → Display results screen
```

### Statistics Aggregation Flow
```
After Each Game:
   - game_results inserted with detailed metrics
   - user_statistics updated (running averages)
   - Fields recalculated: total_games, avg_wpm, avg_accuracy, best_score
   - Client fetches updated stats for dashboard display
```

---

## 6. Security Architecture

### Authentication
- **JWT tokens** with 24-hour expiration
- **Refresh token** mechanism (future enhancement)
- **Password requirements**: Min 8 chars, 1 uppercase, 1 number, 1 special
- **bcrypt hashing** with salt rounds = 10

### Authorization
- **Role-based access control** (RBAC) - prepared for admin roles
- **Route protection** via auth middleware
- **User-scoped data** - users can only access their own data

### API Security
- **Rate limiting** on authentication endpoints
- **Request validation** using Zod schemas
- **SQL injection prevention** via Prisma ORM (parameterized queries)
- **XSS protection** via input sanitization
- **CORS configuration** for trusted origins
- **Helmet.js** for security headers

### Data Privacy
- **Environment variables** for sensitive config
- **No passwords in logs**
- **User data isolation** in database queries

---

## 7. Performance Considerations

### Frontend Optimization
- **Canvas rendering**: 60 FPS target with requestAnimationFrame
- **Sprite sheet** usage for efficient rendering
- **Object pooling** for bullets/particles to reduce GC pressure
- **Lazy loading** for routes
- **Code splitting** for smaller bundle sizes
- **Memoization** for expensive React components

### Backend Optimization
- **Database indexing** on frequently queried fields
- **Connection pooling** via Prisma
- **Caching strategy** for code snippets (future: Redis)
- **Pagination** for history/leaderboard queries
- **Async operations** for non-blocking I/O

### Database Optimization
- **Proper indexing** on foreign keys and search fields
- **Normalized schema** to reduce redundancy
- **Efficient queries** with Prisma's query optimization
- **Batch operations** for bulk updates

---

## 8. Scalability Roadmap

### Phase 1 (Current - v1.0)
- Monolithic backend with PostgreSQL
- Client-side game logic
- REST API for data persistence

### Phase 2 (Future)
- **WebSocket** integration for real-time multiplayer
- **Redis caching** for snippets and leaderboards
- **Microservices** separation (Auth, Game, Stats)
- **CDN** for static assets
- **Load balancing** for multiple backend instances

### Phase 3 (Future)
- **Kubernetes** deployment
- **Horizontal scaling** of game servers
- **Real-time analytics** with event streaming
- **Global leaderboards** with sharding

---

## 9. Development Workflow

### Local Development Setup
1. Clone repository
2. Install Docker & Docker Compose
3. Run `docker-compose up -d` (PostgreSQL)
4. Backend: `cd backend && pnpm install && pnpm prisma migrate dev && pnpm dev`
5. Frontend: `cd frontend && pnpm install && pnpm dev`
6. Access: Frontend at http://localhost:5173, Backend at http://localhost:3000

### Git Workflow
- **Main branch**: Production-ready code
- **Develop branch**: Integration branch
- **Feature branches**: `feature/feature-name`
- **Bugfix branches**: `bugfix/bug-name`
- **Pull requests** required for merges to main/develop

### Testing Strategy
- **Unit tests**: Individual functions and components
- **Integration tests**: API endpoints with test database
- **E2E tests**: Critical user flows (future)
- **Test coverage target**: 80%+

---

## 10. Deployment Architecture (Future)

### Production Environment
```
Client → Cloudflare CDN → Frontend (Vercel/Netlify)
Client → API Gateway → Backend (AWS ECS / Railway / Render)
Backend → RDS PostgreSQL (AWS) or Managed PostgreSQL
Backend → Redis Cache (AWS ElastiCache)
Backend → S3 for assets (future)
```

### Environment Configurations
- **Development**: Local Docker setup
- **Staging**: Cloud-based mirror of production
- **Production**: Fully managed cloud services

---

## 11. Monitoring & Logging (Future)

### Application Monitoring
- **Error tracking**: Sentry
- **Performance monitoring**: New Relic or DataDog
- **Uptime monitoring**: Pingdom or UptimeRobot

### Logging Strategy
- **Structured logging** with Winston
- **Log levels**: error, warn, info, debug
- **Centralized logs**: LogDNA or CloudWatch

---

## 12. Key Design Decisions

### Why Prisma?
- Type-safe database queries
- Automatic migrations
- Excellent TypeScript integration
- Active community and maintenance

### Why Canvas over WebGL/Pixi.js?
- Simpler for 2D game with basic graphics
- Better React integration
- Lower learning curve for team
- Sufficient for v1.0 requirements
- Can migrate to Pixi.js if performance issues arise

### Why Redux Toolkit?
- Predictable state management
- DevTools for debugging
- Good for complex game state
- Easy to scale

### Why Separate Client/Server Validation?
- Defense in depth
- Client validation for UX (immediate feedback)
- Server validation for security (never trust client)

---

## 13. Risk Mitigation

### Technical Risks
- **Canvas performance**: Mitigated by object pooling, sprite sheets
- **Database bottlenecks**: Mitigated by indexing, connection pooling
- **JWT expiration issues**: Mitigated by refresh token strategy (future)

### User Experience Risks
- **Learning curve**: Mitigated by tutorial/onboarding (future)
- **Difficulty balance**: Mitigated by adjustable difficulty settings
- **Rage quit potential**: Mitigated by progressive difficulty, checkpoints

---

## 14. Success Metrics

### Technical Metrics
- API response time < 100ms (p95)
- Frontend FPS ≥ 55
- Database query time < 50ms (p95)
- Zero critical security vulnerabilities

### User Metrics (Future)
- Daily active users (DAU)
- Average session duration
- Retention rate (Day 1, Day 7, Day 30)
- User typing speed improvement over time

---

## 15. Next Steps

1. **Database Schema Design** → See `02-DATABASE-SCHEMA.md`
2. **Backend API Specification** → See `03-BACKEND-API.md`
3. **Frontend Structure** → See `04-FRONTEND-STRUCTURE.md`
4. **Game Mechanics** → See `05-GAME-MECHANICS.md`
5. **File Implementation Guide** → See `06-FILE-IMPLEMENTATION-GUIDE.md`

---

**Document Owner**: Development Team  
**Review Schedule**: Every sprint  
**Last Review**: November 22, 2025
