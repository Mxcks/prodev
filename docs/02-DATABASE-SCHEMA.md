# Pro Dev - Database Schema Documentation

**Last Updated:** November 22, 2025

## 1. Database Overview

### Database Management System
- **DBMS**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Schema Management**: Prisma Migrations
- **Connection Pooling**: Prisma default pool (size: 10)

### Design Principles
1. **Normalization**: 3rd Normal Form (3NF) to minimize redundancy
2. **Referential Integrity**: Foreign keys with cascade rules
3. **Indexing Strategy**: Index all foreign keys and frequently queried fields
4. **Data Types**: Use appropriate PostgreSQL types for performance
5. **Timestamps**: All tables include created_at and updated_at
6. **Soft Deletes**: User accounts use soft delete (deleted_at)

---

## 2. Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       users          │
├──────────────────────┤
│ id (PK)             │◄────────────┐
│ username (UNIQUE)   │             │
│ email (UNIQUE)      │             │
│ password_hash       │             │
│ display_name        │             │
│ role                │             │
│ is_active           │             │
│ last_login_at       │             │
│ created_at          │             │
│ updated_at          │             │
│ deleted_at          │             │
└──────────────────────┘             │
         │                           │
         │ 1:1                       │
         ▼                           │
┌──────────────────────┐             │
│  user_statistics     │             │
├──────────────────────┤             │
│ id (PK)             │             │
│ user_id (FK, UNIQUE)│─────────────┘
│ total_games         │
│ total_playtime_sec  │
│ best_score          │
│ best_wpm            │
│ avg_wpm             │
│ avg_accuracy        │
│ total_words_typed   │
│ total_enemies_killed│
│ highest_wave        │
│ favorite_language   │
│ created_at          │
│ updated_at          │
└──────────────────────┘

┌──────────────────────┐
│       users          │
└──────────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────┐
│  typing_sessions    │
├──────────────────────┤
│ id (PK)             │◄────────────┐
│ user_id (FK)        │─────────────┤─────┐
│ session_token       │             │     │
│ key_sequence (JSON) │             │     │
│ started_at          │             │     │
│ ended_at            │             │     │
│ is_completed        │             │     │
│ created_at          │             │     │
└──────────────────────┘             │     │
         │                           │     │
         │ 1:1                       │     │
         ▼                           │     │
┌──────────────────────┐             │     │
│  typing_results     │             │     │
├──────────────────────┤             │     │
│ id (PK)             │             │     │
│ session_id (FK, UNQ)│─────────────┘     │
│ user_id (FK)        │───────────────────┘
│ total_keys_pressed  │
│ correct_keys        │
│ incorrect_keys      │
│ accuracy_percentage │
│ keys_per_minute     │
│ duration_seconds    │
│ ended_at            │
│ created_at          │
└──────────────────────┘

┌──────────────────────┐
│   code_snippets      │
├──────────────────────┤
│ id (PK)             │
│ language            │
│ difficulty          │
│ category            │
│ snippet_text        │
│ token_count         │
│ expected_wpm        │
│ is_active           │
│ usage_count         │
│ created_at          │
│ updated_at          │
└──────────────────────┘

┌──────────────────────┐
│  refresh_tokens      │  (Future Enhancement)
├──────────────────────┤
│ id (PK)             │
│ user_id (FK)        │─────► users.id
│ token_hash          │
│ expires_at          │
│ created_at          │
│ revoked_at          │
└──────────────────────┘

┌──────────────────────┐
│    achievements      │  (Future Enhancement)
├──────────────────────┤
│ id (PK)             │
│ name                │
│ description         │
│ requirement_type    │
│ requirement_value   │
│ icon_url            │
│ created_at          │
└──────────────────────┘

┌──────────────────────┐
│ user_achievements    │  (Future Enhancement)
├──────────────────────┤
│ id (PK)             │
│ user_id (FK)        │─────► users.id
│ achievement_id (FK) │─────► achievements.id
│ unlocked_at         │
│ created_at          │
└──────────────────────┘

┌──────────────────────┐
│    leaderboards      │  (Future Enhancement)
├──────────────────────┤
│ id (PK)             │
│ user_id (FK)        │─────► users.id
│ leaderboard_type    │
│ score               │
│ metadata (JSONB)    │
│ ranked_at           │
│ created_at          │
└──────────────────────┘
```

---

## 3. Table Definitions

### 3.1 users

**Purpose**: Store user account information and authentication credentials.

**Data Flow**:
- **INSERT**: During user registration (`POST /api/auth/register`)
- **SELECT**: During login authentication, token validation, profile fetches
- **UPDATE**: Profile updates, last login timestamp, password changes
- **SOFT DELETE**: Account deactivation (set deleted_at)

```prisma
model User {
  id              String    @id @default(uuid())
  username        String    @unique @db.VarChar(50)
  email           String    @unique @db.VarChar(255)
  password_hash   String    @db.VarChar(255)
  display_name    String    @db.VarChar(100)
  role            UserRole  @default(PLAYER)
  is_active       Boolean   @default(true)
  last_login_at   DateTime?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?
  
  // Relations
  statistics      UserStatistics?
  game_sessions   GameSession[]
  game_results    GameResult[]
  
  @@index([email])
  @@index([username])
  @@index([created_at])
  @@map("users")
}

enum UserRole {
  PLAYER
  ADMIN
  MODERATOR
}
```

**Field Descriptions**:

| Field          | Type          | Constraints                | Description                                    |
|----------------|---------------|----------------------------|------------------------------------------------|
| id             | UUID          | PK, NOT NULL               | Unique identifier for user                     |
| username       | VARCHAR(50)   | UNIQUE, NOT NULL           | User's login username (alphanumeric + _)       |
| email          | VARCHAR(255)  | UNIQUE, NOT NULL           | User's email address                           |
| password_hash  | VARCHAR(255)  | NOT NULL                   | bcrypt hashed password (never store plaintext) |
| display_name   | VARCHAR(100)  | NOT NULL                   | User's display name in UI                      |
| role           | ENUM          | NOT NULL, DEFAULT 'PLAYER' | User role for authorization                    |
| is_active      | BOOLEAN       | NOT NULL, DEFAULT true     | Account active status                          |
| last_login_at  | TIMESTAMP     | NULLABLE                   | Last successful login timestamp                |
| created_at     | TIMESTAMP     | NOT NULL, DEFAULT now()    | Account creation timestamp                     |
| updated_at     | TIMESTAMP     | NOT NULL, AUTO UPDATE      | Last update timestamp                          |
| deleted_at     | TIMESTAMP     | NULLABLE                   | Soft delete timestamp                          |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `username`
- UNIQUE INDEX on `email`
- INDEX on `created_at` (for admin queries)

**Database Operations by Endpoint**:

| Endpoint                   | Operation | Fields Accessed                              |
|----------------------------|-----------|----------------------------------------------|
| POST /api/auth/register    | INSERT    | All fields (except id, timestamps - auto)    |
| POST /api/auth/login       | SELECT    | email, password_hash, is_active              |
| POST /api/auth/login       | UPDATE    | last_login_at                                |
| GET /api/user/profile      | SELECT    | id, username, email, display_name, created_at|
| PUT /api/user/profile      | UPDATE    | display_name, updated_at                     |
| PUT /api/user/password     | UPDATE    | password_hash, updated_at                    |
| DELETE /api/user/account   | UPDATE    | deleted_at, is_active                        |

---

### 3.2 user_statistics

**Purpose**: Store aggregated statistics for each user across all game sessions.

**Data Flow**:
- **INSERT**: Automatically created when user registers (via trigger or app logic)
- **SELECT**: Dashboard, profile page, leaderboards
- **UPDATE**: After each game session ends (aggregation calculations)

```prisma
model UserStatistics {
  id                   String   @id @default(uuid())
  user_id              String   @unique
  total_games          Int      @default(0)
  total_playtime_sec   Int      @default(0)
  best_score           Int      @default(0)
  best_wpm             Float    @default(0)
  avg_wpm              Float    @default(0)
  avg_accuracy         Float    @default(0)
  total_words_typed    Int      @default(0)
  total_enemies_killed Int      @default(0)
  highest_wave         Int      @default(0)
  favorite_language    Language?
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  
  // Relations
  user                 User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([best_score])
  @@index([best_wpm])
  @@map("user_statistics")
}

enum Language {
  PYTHON
  REACT
  JAVASCRIPT
  TYPESCRIPT
}
```

**Field Descriptions**:

| Field                | Type         | Constraints                 | Description                                  |
|----------------------|--------------|-----------------------------|----------------------------------------------|
| id                   | UUID         | PK, NOT NULL                | Unique identifier                            |
| user_id              | UUID         | FK, UNIQUE, NOT NULL        | Reference to users.id                        |
| total_games          | INTEGER      | NOT NULL, DEFAULT 0         | Total games played                           |
| total_playtime_sec   | INTEGER      | NOT NULL, DEFAULT 0         | Total playtime in seconds                    |
| best_score           | INTEGER      | NOT NULL, DEFAULT 0         | Highest score achieved                       |
| best_wpm             | FLOAT        | NOT NULL, DEFAULT 0         | Best words per minute                        |
| avg_wpm              | FLOAT        | NOT NULL, DEFAULT 0         | Average WPM across all games                 |
| avg_accuracy         | FLOAT        | NOT NULL, DEFAULT 0         | Average accuracy percentage                  |
| total_words_typed    | INTEGER      | NOT NULL, DEFAULT 0         | Cumulative words typed                       |
| total_enemies_killed | INTEGER      | NOT NULL, DEFAULT 0         | Cumulative enemies killed                    |
| highest_wave         | INTEGER      | NOT NULL, DEFAULT 0         | Highest wave reached                         |
| favorite_language    | ENUM         | NULLABLE                    | Most played language                         |
| created_at           | TIMESTAMP    | NOT NULL, DEFAULT now()     | Record creation timestamp                    |
| updated_at           | TIMESTAMP    | NOT NULL, AUTO UPDATE       | Last update timestamp                        |

**Calculation Logic** (in backend service after game ends):

```typescript
// After game_results is inserted:
UPDATE user_statistics SET
  total_games = total_games + 1,
  total_playtime_sec = total_playtime_sec + game_result.playtime_seconds,
  best_score = GREATEST(best_score, game_result.final_score),
  best_wpm = GREATEST(best_wpm, game_result.words_per_minute),
  avg_wpm = (avg_wpm * (total_games - 1) + game_result.words_per_minute) / total_games,
  avg_accuracy = (avg_accuracy * (total_games - 1) + game_result.accuracy_percentage) / total_games,
  total_words_typed = total_words_typed + game_result.total_words_typed,
  total_enemies_killed = total_enemies_killed + game_result.enemies_killed,
  highest_wave = GREATEST(highest_wave, game_result.waves_completed),
  updated_at = NOW()
WHERE user_id = game_result.user_id;
```

**Database Operations by Endpoint**:

| Endpoint                   | Operation | Fields Accessed                          |
|----------------------------|-----------|------------------------------------------|
| POST /api/auth/register    | INSERT    | user_id (all others default to 0)        |
| GET /api/user/stats        | SELECT    | All fields                               |
| POST /api/game/end         | UPDATE    | All aggregate fields                     |
| GET /api/leaderboard       | SELECT    | best_score, best_wpm, user_id            |

---

### 3.3 game_sessions

**Purpose**: Track individual game sessions from start to end.

**Data Flow**:
- **INSERT**: When user starts a new game (`POST /api/game/start`)
- **SELECT**: To validate active sessions, retrieve session data
- **UPDATE**: When game ends (set ended_at, is_completed)

```prisma
model GameSession {
  id               String      @id @default(uuid())
  user_id          String
  session_token    String      @unique @default(uuid())
  language         Language    
  difficulty       Difficulty  @default(NORMAL)
  started_at       DateTime    @default(now())
  ended_at         DateTime?
  is_completed     Boolean     @default(false)
  created_at       DateTime    @default(now())
  updated_at       DateTime    @updatedAt
  
  // Relations
  user             User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  game_result      GameResult?
  
  @@index([user_id])
  @@index([session_token])
  @@index([started_at])
  @@map("game_sessions")
}

enum Difficulty {
  EASY
  NORMAL
  HARD
  EXPERT
}
```

**Field Descriptions**:

| Field          | Type          | Constraints                    | Description                              |
|----------------|---------------|--------------------------------|------------------------------------------|
| id             | UUID          | PK, NOT NULL                   | Unique identifier                        |
| user_id        | UUID          | FK, NOT NULL                   | Reference to users.id                    |
| session_token  | UUID          | UNIQUE, NOT NULL               | Token to validate session ownership      |
| language       | ENUM          | NOT NULL                       | Programming language for this session    |
| difficulty     | ENUM          | NOT NULL, DEFAULT 'NORMAL'     | Difficulty level                         |
| started_at     | TIMESTAMP     | NOT NULL, DEFAULT now()        | Session start time                       |
| ended_at       | TIMESTAMP     | NULLABLE                       | Session end time                         |
| is_completed   | BOOLEAN       | NOT NULL, DEFAULT false        | Whether session completed normally       |
| created_at     | TIMESTAMP     | NOT NULL, DEFAULT now()        | Record creation timestamp                |
| updated_at     | TIMESTAMP     | NOT NULL, AUTO UPDATE          | Last update timestamp                    |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `session_token`
- INDEX on `user_id` (foreign key)
- INDEX on `started_at` (for recent sessions queries)

**Database Operations by Endpoint**:

| Endpoint                   | Operation | Fields Accessed                                     |
|----------------------------|-----------|-----------------------------------------------------|
| POST /api/game/start       | INSERT    | user_id, language, difficulty, started_at           |
| POST /api/game/start       | SELECT    | COUNT(*) WHERE user_id = ? AND is_completed = false |
| POST /api/game/end         | SELECT    | id, user_id, session_token (validation)             |
| POST /api/game/end         | UPDATE    | ended_at, is_completed                              |
| GET /api/game/history      | SELECT    | All fields (with pagination)                        |

---

### 3.4 game_results

**Purpose**: Store detailed results and metrics from completed game sessions.

**Data Flow**:
- **INSERT**: When user completes or abandons a game (`POST /api/game/end`)
- **SELECT**: User history, statistics dashboard, leaderboards

```prisma
model GameResult {
  id                   String      @id @default(uuid())
  session_id           String      @unique
  user_id              String
  final_score          Int         
  waves_completed      Int         
  enemies_killed       Int         
  accuracy_percentage  Float       
  words_per_minute     Float       
  total_words_typed    Int         
  correct_words        Int         
  incorrect_words      Int         
  max_combo            Int         
  total_damage_dealt   Int         
  total_damage_taken   Int         
  playtime_seconds     Int         
  ended_at             DateTime    @default(now())
  created_at           DateTime    @default(now())
  
  // Relations
  session              GameSession @relation(fields: [session_id], references: [id], onDelete: Cascade)
  user                 User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([final_score])
  @@index([ended_at])
  @@map("game_results")
}
```

**Field Descriptions**:

| Field                | Type       | Constraints              | Description                                  |
|----------------------|------------|--------------------------|----------------------------------------------|
| id                   | UUID       | PK, NOT NULL             | Unique identifier                            |
| session_id           | UUID       | FK, UNIQUE, NOT NULL     | Reference to game_sessions.id                |
| user_id              | UUID       | FK, NOT NULL             | Reference to users.id (denormalized for speed)|
| final_score          | INTEGER    | NOT NULL                 | Total score achieved                         |
| waves_completed      | INTEGER    | NOT NULL                 | Number of waves completed                    |
| enemies_killed       | INTEGER    | NOT NULL                 | Total enemies defeated                       |
| accuracy_percentage  | FLOAT      | NOT NULL                 | (correct_words / total_words_typed) * 100    |
| words_per_minute     | FLOAT      | NOT NULL                 | (total_words_typed / playtime_seconds) * 60  |
| total_words_typed    | INTEGER    | NOT NULL                 | Total words/tokens typed                     |
| correct_words        | INTEGER    | NOT NULL                 | Number of correctly typed words              |
| incorrect_words      | INTEGER    | NOT NULL                 | Number of incorrectly typed words            |
| max_combo            | INTEGER    | NOT NULL                 | Highest combo multiplier achieved            |
| total_damage_dealt   | INTEGER    | NOT NULL                 | Total damage to enemies                      |
| total_damage_taken   | INTEGER    | NOT NULL                 | Total damage player received                 |
| playtime_seconds     | INTEGER    | NOT NULL                 | Total game duration in seconds               |
| ended_at             | TIMESTAMP  | NOT NULL, DEFAULT now()  | When game ended                              |
| created_at           | TIMESTAMP  | NOT NULL, DEFAULT now()  | Record creation timestamp                    |

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `session_id`
- INDEX on `user_id` (for user history queries)
- INDEX on `final_score` (for leaderboards)
- INDEX on `ended_at` (for recent games queries)

**Score Calculation** (performed in backend before INSERT):

```typescript
final_score = 
  (correct_words * 10) +                    // Base points
  (enemies_killed * 50) +                    // Enemy kill bonus
  (waves_completed * 100) +                  // Wave completion bonus
  (max_combo * 25) +                         // Combo bonus
  Math.floor(accuracy_percentage * 5) +      // Accuracy bonus
  Math.floor(words_per_minute * 2);          // Speed bonus
```

**Database Operations by Endpoint**:

| Endpoint                   | Operation | Fields Accessed                              |
|----------------------------|-----------|----------------------------------------------|
| POST /api/game/end         | INSERT    | All fields (calculated from client data)     |
| GET /api/game/history      | SELECT    | All fields (with user join)                  |
| GET /api/game/result/:id   | SELECT    | All fields                                   |
| GET /api/leaderboard       | SELECT    | user_id, final_score, ended_at               |
| GET /api/user/stats        | SELECT    | Aggregate functions (AVG, MAX, SUM)          |

---

### 3.5 code_snippets

**Purpose**: Store code snippets used in the game for typing challenges.

**Data Flow**:
- **INSERT**: During database seeding, admin panel (future)
- **SELECT**: When generating snippets for game session
- **UPDATE**: Update usage_count after snippet is used

```prisma
model CodeSnippet {
  id              String     @id @default(uuid())
  language        Language   
  difficulty      Difficulty 
  category        String     @db.VarChar(50)
  snippet_text    String     @db.Text
  token_count     Int        
  expected_wpm    Float      
  is_active       Boolean    @default(true)
  usage_count     Int        @default(0)
  created_at      DateTime   @default(now())
  updated_at      DateTime   @updatedAt
  
  @@index([language, difficulty])
  @@index([is_active])
  @@index([usage_count])
  @@map("code_snippets")
}
```

**Field Descriptions**:

| Field         | Type          | Constraints                 | Description                                  |
|---------------|---------------|-----------------------------|----------------------------------------------|
| id            | UUID          | PK, NOT NULL                | Unique identifier                            |
| language      | ENUM          | NOT NULL                    | Programming language of snippet              |
| difficulty    | ENUM          | NOT NULL                    | Difficulty level                             |
| category      | VARCHAR(50)   | NOT NULL                    | Category (e.g., 'loops', 'functions', 'jsx') |
| snippet_text  | TEXT          | NOT NULL                    | The actual code snippet                      |
| token_count   | INTEGER       | NOT NULL                    | Number of typable tokens in snippet          |
| expected_wpm  | FLOAT         | NOT NULL                    | Expected WPM for average player              |
| is_active     | BOOLEAN       | NOT NULL, DEFAULT true      | Whether snippet is active in rotation        |
| usage_count   | INTEGER       | NOT NULL, DEFAULT 0         | How many times snippet has been used         |
| created_at    | TIMESTAMP     | NOT NULL, DEFAULT now()     | Record creation timestamp                    |
| updated_at    | TIMESTAMP     | NOT NULL, AUTO UPDATE       | Last update timestamp                        |

**Indexes**:
- PRIMARY KEY on `id`
- COMPOUND INDEX on `(language, difficulty)` - for snippet selection
- INDEX on `is_active` - to filter active snippets
- INDEX on `usage_count` - to implement rotation/fairness

**Example Snippets**:

```javascript
// Python - Easy
{
  language: 'PYTHON',
  difficulty: 'EASY',
  category: 'variables',
  snippet_text: 'name = "John"\nage = 25\nprint(name)',
  token_count: 8,
  expected_wpm: 40
}

// Python - Normal
{
  language: 'PYTHON',
  difficulty: 'NORMAL',
  category: 'loops',
  snippet_text: 'for i in range(10):\n    print(i * 2)',
  token_count: 11,
  expected_wpm: 50
}

// React - Normal
{
  language: 'REACT',
  difficulty: 'NORMAL',
  category: 'component',
  snippet_text: 'const Button = ({ onClick }) => {\n  return <button onClick={onClick}>Click</button>\n}',
  token_count: 15,
  expected_wpm: 55
}
```

**Selection Algorithm** (in backend service):

```typescript
// Pseudo-code for snippet selection
SELECT * FROM code_snippets
WHERE language = :language
  AND difficulty = :difficulty
  AND is_active = true
ORDER BY usage_count ASC, RANDOM()
LIMIT :count;

// Then update usage_count for selected snippets
UPDATE code_snippets
SET usage_count = usage_count + 1
WHERE id IN (:selected_ids);
```

**Database Operations by Endpoint**:

| Endpoint                   | Operation | Fields Accessed                              |
|----------------------------|-----------|----------------------------------------------|
| POST /api/game/start       | SELECT    | All fields WHERE language & difficulty match |
| POST /api/game/start       | UPDATE    | usage_count (increment)                      |
| GET /api/snippets          | SELECT    | All fields (admin endpoint, future)          |
| POST /api/snippets         | INSERT    | All fields (admin endpoint, future)          |
| PUT /api/snippets/:id      | UPDATE    | snippet_text, difficulty, is_active          |

---

## 4. Database Migrations Strategy

### Migration Files Structure
```
backend/prisma/migrations/
├── 20251122_000001_init/
│   └── migration.sql
├── 20251122_000002_add_refresh_tokens/
│   └── migration.sql
└── 20251122_000003_add_achievements/
    └── migration.sql
```

### Initial Migration (v1.0)

```sql
-- 20251122_000001_init/migration.sql

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ADMIN', 'MODERATOR');
CREATE TYPE "Language" AS ENUM ('PYTHON', 'REACT', 'JAVASCRIPT', 'TYPESCRIPT');
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'NORMAL', 'HARD', 'EXPERT');

-- Create users table
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP,
    
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- Create user_statistics table
CREATE TABLE "user_statistics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "total_games" INTEGER NOT NULL DEFAULT 0,
    "total_playtime_sec" INTEGER NOT NULL DEFAULT 0,
    "best_score" INTEGER NOT NULL DEFAULT 0,
    "best_wpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_wpm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avg_accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_words_typed" INTEGER NOT NULL DEFAULT 0,
    "total_enemies_killed" INTEGER NOT NULL DEFAULT 0,
    "highest_wave" INTEGER NOT NULL DEFAULT 0,
    "favorite_language" "Language",
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_statistics_user_id_key" ON "user_statistics"("user_id");
CREATE INDEX "user_statistics_best_score_idx" ON "user_statistics"("best_score");
CREATE INDEX "user_statistics_best_wpm_idx" ON "user_statistics"("best_wpm");

ALTER TABLE "user_statistics" ADD CONSTRAINT "user_statistics_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create game_sessions table
CREATE TABLE "game_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_token" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language" "Language" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'NORMAL',
    "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_sessions_session_token_key" ON "game_sessions"("session_token");
CREATE INDEX "game_sessions_user_id_idx" ON "game_sessions"("user_id");
CREATE INDEX "game_sessions_started_at_idx" ON "game_sessions"("started_at");

ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create game_results table
CREATE TABLE "game_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "final_score" INTEGER NOT NULL,
    "waves_completed" INTEGER NOT NULL,
    "enemies_killed" INTEGER NOT NULL,
    "accuracy_percentage" DOUBLE PRECISION NOT NULL,
    "words_per_minute" DOUBLE PRECISION NOT NULL,
    "total_words_typed" INTEGER NOT NULL,
    "correct_words" INTEGER NOT NULL,
    "incorrect_words" INTEGER NOT NULL,
    "max_combo" INTEGER NOT NULL,
    "total_damage_dealt" INTEGER NOT NULL,
    "total_damage_taken" INTEGER NOT NULL,
    "playtime_seconds" INTEGER NOT NULL,
    "ended_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "game_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_results_session_id_key" ON "game_results"("session_id");
CREATE INDEX "game_results_user_id_idx" ON "game_results"("user_id");
CREATE INDEX "game_results_final_score_idx" ON "game_results"("final_score");
CREATE INDEX "game_results_ended_at_idx" ON "game_results"("ended_at");

ALTER TABLE "game_results" ADD CONSTRAINT "game_results_session_id_fkey" 
    FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create code_snippets table
CREATE TABLE "code_snippets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language" "Language" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "snippet_text" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL,
    "expected_wpm" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "code_snippets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "code_snippets_language_difficulty_idx" ON "code_snippets"("language", "difficulty");
CREATE INDEX "code_snippets_is_active_idx" ON "code_snippets"("is_active");
CREATE INDEX "code_snippets_usage_count_idx" ON "code_snippets"("usage_count");

-- Create trigger for updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_snippets_updated_at BEFORE UPDATE ON code_snippets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 5. Database Seeding

### Seed Data Script Location
`backend/prisma/seed.ts`

### Seed Data Content

```typescript
// Seed 50+ code snippets across languages and difficulties
// Seed 3 test users (test@example.com, admin@example.com, player@example.com)
// Seed 10 sample game_results for testing dashboard

const snippets = [
  // Python - Easy (10 snippets)
  { language: 'PYTHON', difficulty: 'EASY', category: 'variables', ... },
  
  // Python - Normal (10 snippets)
  { language: 'PYTHON', difficulty: 'NORMAL', category: 'loops', ... },
  
  // Python - Hard (5 snippets)
  { language: 'PYTHON', difficulty: 'HARD', category: 'classes', ... },
  
  // React - Easy (10 snippets)
  { language: 'REACT', difficulty: 'EASY', category: 'jsx', ... },
  
  // React - Normal (10 snippets)
  { language: 'REACT', difficulty: 'NORMAL', category: 'hooks', ... },
  
  // React - Hard (5 snippets)
  { language: 'REACT', difficulty: 'HARD', category: 'custom-hooks', ... },
];
```

### Running Seeds

```bash
# Development
npm run prisma:seed

# Production (initial setup)
npm run prisma:migrate:deploy
npm run prisma:seed:production
```

---

## 6. Query Performance Optimization

### Indexing Strategy

| Table             | Index                              | Purpose                                    |
|-------------------|------------------------------------|--------------------------------------------|
| users             | email (unique)                     | Fast login lookups                         |
| users             | username (unique)                  | Unique constraint + profile lookups        |
| users             | created_at                         | Admin queries for user registration trends |
| user_statistics   | user_id (unique)                   | Foreign key + 1:1 relationship             |
| user_statistics   | best_score                         | Leaderboard queries                        |
| user_statistics   | best_wpm                           | Leaderboard queries                        |
| game_sessions     | user_id                            | User's game history                        |
| game_sessions     | session_token (unique)             | Session validation                         |
| game_sessions     | started_at                         | Recent sessions queries                    |
| game_results      | user_id                            | User's results history                     |
| game_results      | session_id (unique)                | 1:1 relationship with sessions             |
| game_results      | final_score                        | Leaderboard sorting                        |
| game_results      | ended_at                           | Recent games queries                       |
| code_snippets     | (language, difficulty) composite   | Snippet selection queries                  |
| code_snippets     | is_active                          | Filter active snippets                     |
| code_snippets     | usage_count                        | Fair rotation of snippets                  |

### Query Optimization Examples

**Bad Query** (N+1 problem):
```typescript
const sessions = await prisma.gameSession.findMany({ where: { user_id } });
for (const session of sessions) {
  const result = await prisma.gameResult.findUnique({ where: { session_id: session.id } });
}
```

**Good Query** (use include):
```typescript
const sessions = await prisma.gameSession.findMany({
  where: { user_id },
  include: { game_result: true }
});
```

**Pagination for Large Datasets**:
```typescript
const results = await prisma.gameResult.findMany({
  where: { user_id },
  orderBy: { ended_at: 'desc' },
  take: 20,
  skip: page * 20,
});
```

---

## 7. Data Integrity Rules

### Foreign Key Constraints

- `user_statistics.user_id` → `users.id` (CASCADE on delete)
- `game_sessions.user_id` → `users.id` (CASCADE on delete)
- `game_results.session_id` → `game_sessions.id` (CASCADE on delete)
- `game_results.user_id` → `users.id` (CASCADE on delete)

**Rationale for CASCADE**: When a user is deleted, all associated data should be removed to prevent orphaned records.

### Business Rules Enforced by Database

1. **Unique usernames and emails**: Enforced by UNIQUE constraints
2. **One statistics record per user**: Enforced by UNIQUE constraint on user_id
3. **One result per session**: Enforced by UNIQUE constraint on session_id
4. **Non-nullable critical fields**: Enforced by NOT NULL constraints
5. **Valid enum values**: Enforced by PostgreSQL ENUM types

### Application-Level Validations

These are enforced in backend services, NOT in database:
- Password strength requirements
- Email format validation
- Score calculation accuracy
- Session timeout logic (30 minutes inactive)
- WPM calculation accuracy

---

## 8. Backup and Recovery Strategy

### Backup Schedule (Production)
- **Full backup**: Daily at 2 AM UTC
- **Incremental backup**: Every 6 hours
- **Retention**: 30 days
- **Tool**: `pg_dump` or managed service backups (AWS RDS, etc.)

### Recovery Point Objective (RPO)
- **Target**: 6 hours maximum data loss

### Recovery Time Objective (RTO)
- **Target**: 1 hour maximum downtime

### Backup Command Example
```bash
pg_dump -U postgres -h localhost -d prodev_production > backup_$(date +%Y%m%d).sql
```

---

## 9. Future Enhancements

### Phase 2 Tables (Post v1.0)

#### refresh_tokens
- Store JWT refresh tokens for longer sessions
- Enable token revocation

#### achievements
- Store achievement definitions
- Track unlock conditions

#### user_achievements
- Many-to-many relationship between users and achievements
- Track unlock timestamps

#### leaderboards
- Separate table for optimized leaderboard queries
- Support different leaderboard types (daily, weekly, all-time)
- Use materialized views for performance

#### user_settings
- Store user preferences (theme, sound, controls)
- Language preferences
- Notification settings

#### friend_relationships
- Support friend system for multiplayer
- Track friend requests and status

### Caching Strategy (Future)
- **Redis cache** for leaderboards (TTL: 5 minutes)
- **Redis cache** for user statistics (TTL: 10 minutes)
- **Redis cache** for code snippets (TTL: 1 hour)

---

## 10. Database Monitoring

### Key Metrics to Track
- Query response time (p50, p95, p99)
- Connection pool usage
- Slow query log (> 100ms)
- Table sizes and growth rate
- Index usage statistics
- Cache hit rate

### Monitoring Tools
- **Prisma Studio**: Development database UI
- **PostgreSQL pg_stat**: Built-in statistics
- **DataDog / New Relic**: Production monitoring
- **PgHero**: PostgreSQL performance dashboard

---

## Document Owner
Development Team

**Last Review**: November 22, 2025  
**Next Review**: After v1.0 launch
