# Pro Dev - Backend API Documentation

**Last Updated:** November 22, 2025

## 1. API Overview

### Base Configuration
- **Base URL**: `http://localhost:3000/api` (development)
- **Production URL**: `https://api.prodev.com/api` (future)
- **API Version**: v1
- **Protocol**: REST with JSON payloads
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: 100 requests/15 minutes per IP (auth endpoints)

### Global Response Format

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional info */ }
  }
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## 2. Authentication Endpoints

### 2.1 Register New User

**Endpoint**: `POST /api/auth/register`

**Description**: Create a new user account.

**Authentication**: None (public endpoint)

**Request Body**:
```typescript
{
  username: string;      // 3-50 chars, alphanumeric + underscore
  email: string;         // Valid email format
  password: string;      // Min 8 chars, 1 uppercase, 1 number, 1 special char
  display_name: string;  // 2-100 chars
}
```

**Example Request**:
```json
{
  "username": "coderJohn",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "display_name": "John Doe"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "coderJohn",
      "email": "john@example.com",
      "display_name": "John Doe",
      "role": "PLAYER",
      "created_at": "2025-11-22T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Account created successfully"
}
```

**Error Responses**:
- `400`: Invalid input format
- `409`: Username or email already exists
- `422`: Validation failed (weak password, invalid email)

**Database Operations**:
1. **Validate** input using Zod schema
2. **Check** if username/email exists: `SELECT id FROM users WHERE username = ? OR email = ?`
3. **Hash** password using bcrypt (10 rounds)
4. **INSERT** into users table
5. **INSERT** into user_statistics table (default values)
6. **Generate** JWT token with user ID and role
7. **Return** user data + token

**Files Involved**:
- `routes/auth.routes.ts`: Route definition
- `controllers/auth.controller.ts`: Request handler
- `services/auth.service.ts`: Business logic
- `repositories/user.repository.ts`: Database access
- `validators/auth.validator.ts`: Input validation
- `utils/password.util.ts`: Password hashing
- `utils/jwt.util.ts`: Token generation

---

### 2.2 Login User

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and receive JWT token.

**Authentication**: None (public endpoint)

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Example Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "coderJohn",
      "email": "john@example.com",
      "display_name": "John Doe",
      "role": "PLAYER",
      "last_login_at": "2025-11-22T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Responses**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `403`: Account is deactivated

**Database Operations**:
1. **SELECT** user by email: `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`
2. **Verify** password using bcrypt.compare()
3. **Check** is_active = true
4. **UPDATE** last_login_at: `UPDATE users SET last_login_at = NOW() WHERE id = ?`
5. **Generate** JWT token
6. **Return** user data + token

**Files Involved**:
- `routes/auth.routes.ts`
- `controllers/auth.controller.ts`
- `services/auth.service.ts`
- `repositories/user.repository.ts`
- `validators/auth.validator.ts`
- `utils/password.util.ts`
- `utils/jwt.util.ts`

---

### 2.3 Verify Token

**Endpoint**: `GET /api/auth/verify`

**Description**: Verify JWT token validity and get current user info.

**Authentication**: Required (Bearer token)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "coderJohn",
      "email": "john@example.com",
      "display_name": "John Doe",
      "role": "PLAYER"
    }
  },
  "message": "Token is valid"
}
```

**Error Responses**:
- `401`: Invalid or expired token
- `404`: User not found

**Database Operations**:
1. **Decode** JWT token (done in middleware)
2. **SELECT** user: `SELECT id, username, email, display_name, role FROM users WHERE id = ? AND is_active = true AND deleted_at IS NULL`
3. **Return** user data

**Files Involved**:
- `routes/auth.routes.ts`
- `controllers/auth.controller.ts`
- `middleware/auth.middleware.ts`
- `repositories/user.repository.ts`

---

## 3. User Endpoints

### 3.1 Get User Profile

**Endpoint**: `GET /api/user/profile`

**Description**: Get current user's profile information.

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "coderJohn",
      "email": "john@example.com",
      "display_name": "John Doe",
      "role": "PLAYER",
      "created_at": "2025-11-01T10:30:00.000Z",
      "last_login_at": "2025-11-22T10:30:00.000Z"
    }
  }
}
```

**Database Operations**:
1. **SELECT** user by ID from JWT: `SELECT id, username, email, display_name, role, created_at, last_login_at FROM users WHERE id = ?`

**Files Involved**:
- `routes/user.routes.ts`
- `controllers/user.controller.ts`
- `services/user.service.ts`
- `repositories/user.repository.ts`
- `middleware/auth.middleware.ts`

---

### 3.2 Update User Profile

**Endpoint**: `PUT /api/user/profile`

**Description**: Update user's display name.

**Authentication**: Required

**Request Body**:
```typescript
{
  display_name: string;  // 2-100 chars
}
```

**Example Request**:
```json
{
  "display_name": "John Smith"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "coderJohn",
      "email": "john@example.com",
      "display_name": "John Smith",
      "updated_at": "2025-11-22T11:00:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

**Database Operations**:
1. **Validate** input
2. **UPDATE** user: `UPDATE users SET display_name = ?, updated_at = NOW() WHERE id = ?`
3. **SELECT** updated user
4. **Return** updated data

**Files Involved**:
- `routes/user.routes.ts`
- `controllers/user.controller.ts`
- `services/user.service.ts`
- `repositories/user.repository.ts`
- `validators/user.validator.ts`

---

### 3.3 Change Password

**Endpoint**: `PUT /api/user/password`

**Description**: Change user's password (requires current password).

**Authentication**: Required

**Request Body**:
```typescript
{
  current_password: string;
  new_password: string;  // Min 8 chars, 1 uppercase, 1 number, 1 special char
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- `401`: Current password is incorrect
- `422`: New password doesn't meet requirements

**Database Operations**:
1. **SELECT** user with password_hash: `SELECT password_hash FROM users WHERE id = ?`
2. **Verify** current password with bcrypt
3. **Hash** new password
4. **UPDATE** password: `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`

**Files Involved**:
- `routes/user.routes.ts`
- `controllers/user.controller.ts`
- `services/user.service.ts`
- `repositories/user.repository.ts`
- `validators/user.validator.ts`
- `utils/password.util.ts`

---

### 3.4 Get User Statistics

**Endpoint**: `GET /api/user/statistics`

**Description**: Get user's aggregated game statistics.

**Authentication**: Required

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_games": 47,
      "total_playtime_sec": 14250,
      "total_playtime_formatted": "3h 57m",
      "best_score": 8450,
      "best_wpm": 78.5,
      "avg_wpm": 62.3,
      "avg_accuracy": 94.2,
      "total_words_typed": 3521,
      "total_enemies_killed": 892,
      "highest_wave": 12,
      "favorite_language": "PYTHON",
      "created_at": "2025-11-01T10:30:00.000Z",
      "updated_at": "2025-11-22T10:30:00.000Z"
    }
  }
}
```

**Database Operations**:
1. **SELECT** statistics: `SELECT * FROM user_statistics WHERE user_id = ?`
2. **Format** data (convert seconds to hours/minutes)

**Files Involved**:
- `routes/user.routes.ts`
- `controllers/user.controller.ts`
- `services/user.service.ts`
- `services/statistics.service.ts`
- `repositories/statistics.repository.ts`

---

### 3.5 Delete Account

**Endpoint**: `DELETE /api/user/account`

**Description**: Soft delete user account (sets deleted_at).

**Authentication**: Required

**Request Body**:
```typescript
{
  password: string;  // Require password confirmation
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses**:
- `401`: Incorrect password

**Database Operations**:
1. **SELECT** user: `SELECT password_hash FROM users WHERE id = ?`
2. **Verify** password
3. **UPDATE** user: `UPDATE users SET deleted_at = NOW(), is_active = false WHERE id = ?`
4. All related data (sessions, results, statistics) remains but user cannot log in

**Files Involved**:
- `routes/user.routes.ts`
- `controllers/user.controller.ts`
- `services/user.service.ts`
- `repositories/user.repository.ts`
- `validators/user.validator.ts`

---

## 4. Game Endpoints

### 4.1 Start Game Session

**Endpoint**: `POST /api/game/start`

**Description**: Initialize a new game session and get code snippets.

**Authentication**: Required

**Request Body**:
```typescript
{
  language: "PYTHON" | "REACT" | "JAVASCRIPT" | "TYPESCRIPT";
  difficulty: "EASY" | "NORMAL" | "HARD" | "EXPERT";
}
```

**Example Request**:
```json
{
  "language": "PYTHON",
  "difficulty": "NORMAL"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "session": {
      "session_id": "650e8400-e29b-41d4-a716-446655440001",
      "session_token": "750e8400-e29b-41d4-a716-446655440002",
      "language": "PYTHON",
      "difficulty": "NORMAL",
      "started_at": "2025-11-22T10:30:00.000Z"
    },
    "snippets": [
      {
        "id": "snippet-001",
        "text": "for i in range(10):\n    print(i * 2)",
        "tokens": ["for", "i", "in", "range", "(", "10", ")", ":", "print", "(", "i", "*", "2", ")"],
        "token_count": 14,
        "expected_wpm": 50
      },
      {
        "id": "snippet-002",
        "text": "def calculate_sum(a, b):\n    return a + b",
        "tokens": ["def", "calculate_sum", "(", "a", ",", "b", ")", ":", "return", "a", "+", "b"],
        "token_count": 12,
        "expected_wpm": 48
      }
      // ... 8 more snippets for first 10 waves
    ],
    "game_config": {
      "initial_health": 100,
      "enemy_spawn_rate": 2.0,
      "damage_per_enemy": 10,
      "wave_count_start": 3
    }
  },
  "message": "Game session started"
}
```

**Error Responses**:
- `400`: Invalid language or difficulty
- `409`: User already has an active incomplete session

**Business Logic**:
1. Check for existing incomplete sessions
2. Create new game_session record
3. Select 10-15 code snippets matching language/difficulty
4. Tokenize snippets (split into typable units)
5. Update snippet usage_count
6. Return session data + snippets

**Database Operations**:
1. **CHECK** active session: `SELECT id FROM game_sessions WHERE user_id = ? AND is_completed = false`
2. **INSERT** session: `INSERT INTO game_sessions (user_id, language, difficulty) VALUES (?, ?, ?)`
3. **SELECT** snippets: 
   ```sql
   SELECT * FROM code_snippets 
   WHERE language = ? AND difficulty = ? AND is_active = true 
   ORDER BY usage_count ASC, RANDOM() 
   LIMIT 10
   ```
4. **UPDATE** snippet usage: `UPDATE code_snippets SET usage_count = usage_count + 1 WHERE id IN (?)`

**Files Involved**:
- `routes/game.routes.ts`
- `controllers/game.controller.ts`
- `services/game.service.ts`
- `services/snippet.service.ts`
- `repositories/game.repository.ts`
- `repositories/snippet.repository.ts`
- `validators/game.validator.ts`

---

### 4.2 End Game Session

**Endpoint**: `POST /api/game/end`

**Description**: Submit game results and end session.

**Authentication**: Required

**Request Body**:
```typescript
{
  session_id: string;
  session_token: string;
  final_score: number;
  waves_completed: number;
  enemies_killed: number;
  total_words_typed: number;
  correct_words: number;
  incorrect_words: number;
  max_combo: number;
  total_damage_dealt: number;
  total_damage_taken: number;
  playtime_seconds: number;
}
```

**Example Request**:
```json
{
  "session_id": "650e8400-e29b-41d4-a716-446655440001",
  "session_token": "750e8400-e29b-41d4-a716-446655440002",
  "final_score": 7250,
  "waves_completed": 8,
  "enemies_killed": 76,
  "total_words_typed": 142,
  "correct_words": 135,
  "incorrect_words": 7,
  "max_combo": 15,
  "total_damage_dealt": 3800,
  "total_damage_taken": 40,
  "playtime_seconds": 325
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "result": {
      "id": "result-001",
      "final_score": 7250,
      "waves_completed": 8,
      "enemies_killed": 76,
      "accuracy_percentage": 95.07,
      "words_per_minute": 26.25,
      "total_words_typed": 142,
      "correct_words": 135,
      "incorrect_words": 7,
      "max_combo": 15,
      "playtime_seconds": 325,
      "ended_at": "2025-11-22T10:35:25.000Z"
    },
    "rank": {
      "percentile": 68.5,
      "is_personal_best": true,
      "previous_best": 6800
    },
    "updated_statistics": {
      "total_games": 48,
      "avg_wpm": 62.5,
      "avg_accuracy": 94.3,
      "best_score": 7250
    }
  },
  "message": "Game results saved successfully"
}
```

**Error Responses**:
- `400`: Invalid session_id or missing fields
- `401`: session_token doesn't match or user doesn't own session
- `404`: Session not found
- `409`: Session already completed

**Business Logic**:
1. Validate session ownership (session_token + user_id match)
2. Calculate derived metrics (accuracy %, WPM)
3. Validate score authenticity (server-side recalculation)
4. Insert game_results
5. Update game_sessions (set ended_at, is_completed)
6. Update user_statistics (aggregations)
7. Calculate rank/percentile
8. Return comprehensive results

**Database Operations**:
1. **SELECT** session: `SELECT * FROM game_sessions WHERE id = ? AND session_token = ? AND user_id = ?`
2. **CHECK** not completed: Validate `is_completed = false`
3. **Calculate** metrics:
   ```typescript
   accuracy_percentage = (correct_words / total_words_typed) * 100
   words_per_minute = (total_words_typed / playtime_seconds) * 60
   ```
4. **INSERT** result:
   ```sql
   INSERT INTO game_results (
     session_id, user_id, final_score, waves_completed, enemies_killed,
     accuracy_percentage, words_per_minute, total_words_typed, correct_words,
     incorrect_words, max_combo, total_damage_dealt, total_damage_taken,
     playtime_seconds
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ```
5. **UPDATE** session: `UPDATE game_sessions SET ended_at = NOW(), is_completed = true WHERE id = ?`
6. **UPDATE** statistics:
   ```sql
   UPDATE user_statistics SET
     total_games = total_games + 1,
     total_playtime_sec = total_playtime_sec + ?,
     best_score = GREATEST(best_score, ?),
     best_wpm = GREATEST(best_wpm, ?),
     avg_wpm = (avg_wpm * (total_games - 1) + ?) / total_games,
     avg_accuracy = (avg_accuracy * (total_games - 1) + ?) / total_games,
     total_words_typed = total_words_typed + ?,
     total_enemies_killed = total_enemies_killed + ?,
     highest_wave = GREATEST(highest_wave, ?),
     updated_at = NOW()
   WHERE user_id = ?
   ```
7. **SELECT** updated statistics
8. **CALCULATE** percentile rank:
   ```sql
   SELECT COUNT(*) FROM game_results 
   WHERE final_score < ? AND user_id != ?
   ```

**Files Involved**:
- `routes/game.routes.ts`
- `controllers/game.controller.ts`
- `services/game.service.ts`
- `services/scoring.service.ts`
- `services/statistics.service.ts`
- `repositories/game.repository.ts`
- `repositories/statistics.repository.ts`
- `validators/game.validator.ts`

---

### 4.3 Get Game History

**Endpoint**: `GET /api/game/history`

**Description**: Get paginated list of user's past game sessions.

**Authentication**: Required

**Query Parameters**:
```typescript
{
  page?: number;       // Default: 1
  limit?: number;      // Default: 20, Max: 100
  sort?: "date" | "score" | "wpm";  // Default: "date"
  order?: "asc" | "desc";           // Default: "desc"
  language?: Language;               // Optional filter
}
```

**Example Request**:
```
GET /api/game/history?page=1&limit=10&sort=score&order=desc
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "result-001",
        "session_id": "session-001",
        "language": "PYTHON",
        "difficulty": "NORMAL",
        "final_score": 7250,
        "waves_completed": 8,
        "enemies_killed": 76,
        "accuracy_percentage": 95.07,
        "words_per_minute": 26.25,
        "playtime_seconds": 325,
        "ended_at": "2025-11-22T10:35:25.000Z"
      }
      // ... 9 more results
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_results": 48,
      "limit": 10
    }
  }
}
```

**Database Operations**:
1. **SELECT** with JOIN and pagination:
   ```sql
   SELECT 
     gr.*,
     gs.language,
     gs.difficulty
   FROM game_results gr
   JOIN game_sessions gs ON gr.session_id = gs.id
   WHERE gr.user_id = ?
     AND (? IS NULL OR gs.language = ?)
   ORDER BY 
     CASE WHEN ? = 'score' THEN gr.final_score END DESC,
     CASE WHEN ? = 'wpm' THEN gr.words_per_minute END DESC,
     CASE WHEN ? = 'date' THEN gr.ended_at END DESC
   LIMIT ? OFFSET ?
   ```
2. **COUNT** total results for pagination

**Files Involved**:
- `routes/game.routes.ts`
- `controllers/game.controller.ts`
- `services/game.service.ts`
- `repositories/game.repository.ts`

---

### 4.4 Get Single Game Result

**Endpoint**: `GET /api/game/result/:id`

**Description**: Get detailed results for a specific game.

**Authentication**: Required

**Path Parameters**:
- `id`: Game result UUID

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "result": {
      "id": "result-001",
      "session_id": "session-001",
      "language": "PYTHON",
      "difficulty": "NORMAL",
      "final_score": 7250,
      "waves_completed": 8,
      "enemies_killed": 76,
      "accuracy_percentage": 95.07,
      "words_per_minute": 26.25,
      "total_words_typed": 142,
      "correct_words": 135,
      "incorrect_words": 7,
      "max_combo": 15,
      "total_damage_dealt": 3800,
      "total_damage_taken": 40,
      "playtime_seconds": 325,
      "started_at": "2025-11-22T10:30:00.000Z",
      "ended_at": "2025-11-22T10:35:25.000Z"
    }
  }
}
```

**Error Responses**:
- `403`: Result belongs to another user
- `404`: Result not found

**Database Operations**:
1. **SELECT** with JOIN:
   ```sql
   SELECT 
     gr.*,
     gs.language,
     gs.difficulty,
     gs.started_at
   FROM game_results gr
   JOIN game_sessions gs ON gr.session_id = gs.id
   WHERE gr.id = ? AND gr.user_id = ?
   ```

**Files Involved**:
- `routes/game.routes.ts`
- `controllers/game.controller.ts`
- `services/game.service.ts`
- `repositories/game.repository.ts`

---

## 5. Leaderboard Endpoints (Future Enhancement)

### 5.1 Get Global Leaderboard

**Endpoint**: `GET /api/leaderboard/global`

**Description**: Get top players by score, WPM, or other metrics.

**Authentication**: Optional (public data)

**Query Parameters**:
```typescript
{
  metric?: "score" | "wpm" | "accuracy";  // Default: "score"
  timeframe?: "daily" | "weekly" | "all_time";  // Default: "all_time"
  language?: Language;  // Optional filter
  limit?: number;  // Default: 100
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user": {
          "username": "speedDemon",
          "display_name": "Speed Demon"
        },
        "score": 12450,
        "games_played": 156,
        "updated_at": "2025-11-22T09:15:00.000Z"
      }
      // ... more entries
    ],
    "user_rank": {
      "rank": 45,
      "percentile": 85.2
    }
  }
}
```

**Database Operations**:
1. **SELECT** top users:
   ```sql
   SELECT 
     u.username,
     u.display_name,
     us.best_score,
     us.best_wpm,
     us.avg_accuracy,
     us.total_games,
     us.updated_at
   FROM user_statistics us
   JOIN users u ON us.user_id = u.id
   WHERE u.is_active = true AND u.deleted_at IS NULL
   ORDER BY 
     CASE WHEN ? = 'score' THEN us.best_score END DESC,
     CASE WHEN ? = 'wpm' THEN us.best_wpm END DESC,
     CASE WHEN ? = 'accuracy' THEN us.avg_accuracy END DESC
   LIMIT ?
   ```

---

## 6. Admin Endpoints (Future Enhancement)

### 6.1 Manage Code Snippets

**Endpoints**:
- `GET /api/admin/snippets` - List all snippets
- `POST /api/admin/snippets` - Create new snippet
- `PUT /api/admin/snippets/:id` - Update snippet
- `DELETE /api/admin/snippets/:id` - Deactivate snippet

**Authentication**: Required (ADMIN role)

---

## 7. Middleware Details

### 7.1 Authentication Middleware

**File**: `middleware/auth.middleware.ts`

**Purpose**: Validate JWT tokens and attach user info to request.

**Logic**:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token signature and expiration
3. Decode payload to get user ID
4. Optionally: Fetch user from database to ensure still active
5. Attach user data to `req.user`
6. Call `next()`

**Usage**:
```typescript
router.get('/protected', authMiddleware, controller.protectedRoute);
```

**JWT Payload Structure**:
```typescript
{
  user_id: string;
  role: UserRole;
  iat: number;  // Issued at
  exp: number;  // Expiration (24 hours from iat)
}
```

---

### 7.2 Error Handling Middleware

**File**: `middleware/error.middleware.ts`

**Purpose**: Centralized error handling and response formatting.

**Logic**:
1. Catch all errors from routes/controllers
2. Log error details (stack trace in development)
3. Format error response based on error type
4. Return appropriate HTTP status code
5. Don't leak sensitive info in production

**Error Types**:
- `ValidationError` → 422
- `AuthenticationError` → 401
- `AuthorizationError` → 403
- `NotFoundError` → 404
- `ConflictError` → 409
- `RateLimitError` → 429
- `DatabaseError` → 500
- `UnknownError` → 500

---

### 7.3 Validation Middleware

**File**: `middleware/validation.middleware.ts`

**Purpose**: Validate request body/params using Zod schemas.

**Logic**:
1. Accept a Zod schema as parameter
2. Validate `req.body`, `req.query`, or `req.params`
3. If invalid, throw `ValidationError` with details
4. If valid, call `next()`

**Usage**:
```typescript
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);
```

---

### 7.4 Rate Limiting Middleware

**File**: `middleware/rateLimit.middleware.ts`

**Purpose**: Prevent abuse of authentication endpoints.

**Configuration**:
```typescript
// Auth endpoints: 5 requests per 15 minutes
// Game endpoints: 100 requests per 15 minutes
// Other endpoints: No limit (for now)
```

**Implementation**:
- Use `express-rate-limit` package
- Store in memory for v1.0 (Redis in future)
- Return 429 with Retry-After header

---

### 7.5 Logger Middleware

**File**: `middleware/logger.middleware.ts`

**Purpose**: Log all HTTP requests.

**Logged Data**:
- Method + Path
- Status code
- Response time
- User ID (if authenticated)
- IP address
- User agent

**Output Format** (JSON):
```json
{
  "timestamp": "2025-11-22T10:30:00.000Z",
  "method": "POST",
  "path": "/api/game/start",
  "status": 201,
  "duration_ms": 45,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "ip": "192.168.1.100"
}
```

---

## 8. Service Layer Architecture

### 8.1 auth.service.ts

**Responsibilities**:
- User registration logic
- Login authentication
- Password validation
- Token generation
- Token verification

**Key Functions**:
```typescript
async register(data: RegisterDto): Promise<{ user: User; token: string }>
async login(email: string, password: string): Promise<{ user: User; token: string }>
async verifyToken(token: string): Promise<User>
async changePassword(userId: string, oldPass: string, newPass: string): Promise<void>
```

**Dependencies**:
- `user.repository.ts`: Database access
- `password.util.ts`: Password hashing/verification
- `jwt.util.ts`: Token operations

---

### 8.2 game.service.ts

**Responsibilities**:
- Start game session
- End game session
- Validate session ownership
- Calculate game metrics

**Key Functions**:
```typescript
async startSession(userId: string, data: StartGameDto): Promise<GameStartResponse>
async endSession(userId: string, data: EndGameDto): Promise<GameEndResponse>
async getHistory(userId: string, params: HistoryParams): Promise<PaginatedResults>
async getResult(userId: string, resultId: string): Promise<GameResult>
```

**Dependencies**:
- `game.repository.ts`
- `snippet.service.ts`
- `scoring.service.ts`
- `statistics.service.ts`

---

### 8.3 snippet.service.ts

**Responsibilities**:
- Select appropriate code snippets
- Tokenize snippets
- Update usage counts
- Manage snippet rotation

**Key Functions**:
```typescript
async getSnippetsForGame(language: Language, difficulty: Difficulty, count: number): Promise<Snippet[]>
async tokenizeSnippet(snippet: string): Promise<string[]>
async updateUsageCounts(snippetIds: string[]): Promise<void>
```

**Tokenization Logic**:
```typescript
// Split code into typable tokens
// Example: "for i in range(10):" 
// → ["for", "i", "in", "range", "(", "10", ")", ":"]
```

---

### 8.4 scoring.service.ts

**Responsibilities**:
- Calculate final score
- Validate score authenticity
- Calculate derived metrics (WPM, accuracy)
- Determine rank/percentile

**Key Functions**:
```typescript
async calculateScore(data: GameMetrics): Promise<number>
async validateScore(clientScore: number, gameData: GameMetrics): Promise<boolean>
async calculateWPM(wordsTyped: number, seconds: number): Promise<number>
async calculateAccuracy(correct: number, total: number): Promise<number>
async calculatePercentile(userId: string, score: number): Promise<number>
```

**Score Formula**:
```typescript
score = 
  (correct_words × 10) +           // Base typing points
  (enemies_killed × 50) +          // Combat points
  (waves_completed × 100) +        // Progress points
  (max_combo × 25) +               // Skill bonus
  (accuracy_percentage × 5) +      // Accuracy bonus
  (words_per_minute × 2);          // Speed bonus
```

---

### 8.5 statistics.service.ts

**Responsibilities**:
- Update user aggregate statistics
- Calculate running averages
- Determine favorite language
- Format statistics for display

**Key Functions**:
```typescript
async updateStatistics(userId: string, gameResult: GameResult): Promise<UserStatistics>
async getStatistics(userId: string): Promise<FormattedStatistics>
async calculateFavoriteLanguage(userId: string): Promise<Language | null>
```

**Update Logic**:
```typescript
// Running average formula
new_avg = (old_avg × (n - 1) + new_value) / n

// Where n = total_games after increment
```

---

## 9. Repository Layer (Data Access)

### 9.1 user.repository.ts

**Functions**:
```typescript
async create(data: CreateUserDto): Promise<User>
async findById(id: string): Promise<User | null>
async findByEmail(email: string): Promise<User | null>
async findByUsername(username: string): Promise<User | null>
async update(id: string, data: Partial<User>): Promise<User>
async softDelete(id: string): Promise<void>
async updateLastLogin(id: string): Promise<void>
```

---

### 9.2 game.repository.ts

**Functions**:
```typescript
async createSession(data: CreateSessionDto): Promise<GameSession>
async findSessionById(id: string): Promise<GameSession | null>
async findActiveSession(userId: string): Promise<GameSession | null>
async updateSession(id: string, data: Partial<GameSession>): Promise<GameSession>
async createResult(data: CreateResultDto): Promise<GameResult>
async findResultById(id: string): Promise<GameResult | null>
async findUserResults(userId: string, params: PaginationParams): Promise<PaginatedResults>
```

---

### 9.3 snippet.repository.ts

**Functions**:
```typescript
async findByLanguageAndDifficulty(language: Language, difficulty: Difficulty, limit: number): Promise<CodeSnippet[]>
async incrementUsageCount(ids: string[]): Promise<void>
async findById(id: string): Promise<CodeSnippet | null>
async create(data: CreateSnippetDto): Promise<CodeSnippet>
async update(id: string, data: Partial<CodeSnippet>): Promise<CodeSnippet>
async deactivate(id: string): Promise<void>
```

---

### 9.4 statistics.repository.ts

**Functions**:
```typescript
async create(userId: string): Promise<UserStatistics>
async findByUserId(userId: string): Promise<UserStatistics | null>
async update(userId: string, data: Partial<UserStatistics>): Promise<UserStatistics>
async incrementGames(userId: string): Promise<void>
async updateBestScores(userId: string, score: number, wpm: number): Promise<void>
```

---

## 10. Validation Schemas (Zod)

### 10.1 auth.validator.ts

```typescript
export const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string()
    .email("Invalid email format")
    .max(255),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  display_name: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must not exceed 100 characters")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
```

---

### 10.2 game.validator.ts

```typescript
export const startGameSchema = z.object({
  language: z.enum(["PYTHON", "REACT", "JAVASCRIPT", "TYPESCRIPT"]),
  difficulty: z.enum(["EASY", "NORMAL", "HARD", "EXPERT"])
});

export const endGameSchema = z.object({
  session_id: z.string().uuid(),
  session_token: z.string().uuid(),
  final_score: z.number().int().min(0),
  waves_completed: z.number().int().min(0),
  enemies_killed: z.number().int().min(0),
  total_words_typed: z.number().int().min(0),
  correct_words: z.number().int().min(0),
  incorrect_words: z.number().int().min(0),
  max_combo: z.number().int().min(0),
  total_damage_dealt: z.number().int().min(0),
  total_damage_taken: z.number().int().min(0),
  playtime_seconds: z.number().int().min(1)
}).refine(data => data.correct_words + data.incorrect_words === data.total_words_typed, {
  message: "correct_words + incorrect_words must equal total_words_typed"
});
```

---

## 11. Error Codes Reference

| Code                    | HTTP Status | Description                           |
|-------------------------|-------------|---------------------------------------|
| AUTH_INVALID_CREDENTIALS| 401         | Incorrect email or password           |
| AUTH_TOKEN_EXPIRED      | 401         | JWT token has expired                 |
| AUTH_TOKEN_INVALID      | 401         | JWT token is malformed or invalid     |
| AUTH_ACCOUNT_DISABLED   | 403         | User account is deactivated           |
| AUTH_INSUFFICIENT_PERMS | 403         | User lacks required permissions       |
| USER_NOT_FOUND          | 404         | User ID does not exist                |
| USER_ALREADY_EXISTS     | 409         | Username or email already taken       |
| SESSION_NOT_FOUND       | 404         | Game session ID not found             |
| SESSION_ALREADY_ACTIVE  | 409         | User has an incomplete session        |
| SESSION_ALREADY_COMPLETE| 409         | Cannot modify completed session       |
| SESSION_INVALID_TOKEN   | 401         | Session token doesn't match           |
| VALIDATION_ERROR        | 422         | Request data failed validation        |
| RATE_LIMIT_EXCEEDED     | 429         | Too many requests                     |
| INTERNAL_ERROR          | 500         | Unexpected server error               |

---

## 12. API Testing Examples (Postman/cURL)

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testUser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "display_name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Start Game (with token)

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/game/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "language": "PYTHON",
    "difficulty": "NORMAL"
  }'
```

### Get Statistics

```bash
curl -X GET http://localhost:3000/api/user/statistics \
  -H "Authorization: Bearer $TOKEN"
```

---

## Document Owner
Backend Development Team

**Last Review**: November 22, 2025  
**Next Review**: Sprint 2
