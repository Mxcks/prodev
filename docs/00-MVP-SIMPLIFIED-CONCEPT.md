# Pro Dev - Simplified MVP Concept

**Last Updated:** November 23, 2025

## 🎯 MVP Vision: Keyboard Typing Trainer

This document describes the **simplified first draft** concept that replaces the complex game mechanics with a straightforward keyboard training application.

---

## 1. Core Concept

**Pro Dev MVP** is a keyboard typing trainer that helps users improve their typing speed and accuracy through visual feedback on a virtual keyboard.

### Key Principles
- **Simple**: One game mode, clear objective
- **Visual**: See the keyboard, know what to press
- **Timed**: 60-second sessions keep it focused
- **Educational**: Learn keyboard layout through practice

---

## 2. How It Works

### User Experience Flow

```
1. User clicks "Start Session"
   ↓
2. 60-second timer starts
   ↓
3. Virtual keyboard displays on screen
   ↓
4. System highlights ONE key to press (e.g., "A" key glows green)
   ↓
5. User presses that key:
   - CORRECT: Key flashes success, score +1, next key highlights
   - INCORRECT: Key flashes error, move to next key anyway
   ↓
6. Repeat until 60 seconds elapsed
   ↓
7. Display results:
   - Total keys pressed
   - Correct vs incorrect
   - Accuracy percentage
   - Keys per minute (KPM)
```

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│                     TIMER: 00:42                        │
│                    SCORE: 28/32                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     VIRTUAL KEYBOARD (QWERTY LAYOUT)                    │
│                                                         │
│     [Q][W][E][R][T][Y][U][I][O][P]                     │
│      [A][S][D][F][G][H][J][K][L]                       │
│       [Z][X][C][V][B][N][M]                            │
│                                                         │
│     Current key "F" is highlighted in GREEN             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   Live Stats:  KPM: 42  |  Accuracy: 87.5%             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Key Generation

### Random Key Sequence
- System generates random sequence of keys before session starts
- Includes all letter keys (A-Z)
- Can include numbers and symbols in future
- Stored as JSON array: `["F", "J", "D", "K", "S", "L", ...]`

### Example Sequence
```json
{
  "session_id": "uuid-123",
  "key_sequence": ["F", "J", "D", "K", "S", "L", "A", "semicolon", "G", "H", ...],
  "total_keys": 200
}
```

---

## 4. Simplified Database Schema

### Tables Needed (4 tables only)

#### **users**
```typescript
{
  id: UUID
  username: string (unique)
  email: string (unique)
  password_hash: string
  display_name: string
  created_at: timestamp
}
```

#### **typing_sessions**
```typescript
{
  id: UUID
  user_id: UUID (FK → users)
  session_token: UUID
  key_sequence: JSON (array of strings)
  started_at: timestamp
  ended_at: timestamp?
  is_completed: boolean
}
```

#### **typing_results**
```typescript
{
  id: UUID
  session_id: UUID (FK → typing_sessions)
  user_id: UUID (FK → users)
  total_keys_pressed: number
  correct_keys: number
  incorrect_keys: number
  accuracy_percentage: float
  keys_per_minute: float
  duration_seconds: number (always 60)
  ended_at: timestamp
}
```

#### **user_statistics**
```typescript
{
  id: UUID
  user_id: UUID (FK → users, unique)
  total_sessions: number
  best_kpm: float
  avg_kpm: float
  avg_accuracy: float
  total_keys_pressed: number
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 5. Simplified Backend API

### Auth Endpoints (unchanged)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify`

### Session Endpoints
```typescript
POST /api/session/start
Request: { user_id }
Response: {
  session_id: UUID,
  session_token: UUID,
  key_sequence: string[],  // 200 random keys
  started_at: timestamp
}

POST /api/session/end
Request: {
  session_id: UUID,
  session_token: UUID,
  total_keys_pressed: number,
  correct_keys: number,
  incorrect_keys: number,
  duration_seconds: number
}
Response: {
  result: {
    accuracy_percentage: float,
    keys_per_minute: float,
    ...
  },
  updated_statistics: { ... },
  is_personal_best: boolean
}
```

### Statistics Endpoints
```typescript
GET /api/user/statistics
Response: {
  total_sessions: number,
  best_kpm: float,
  avg_kpm: float,
  avg_accuracy: float,
  ...
}

GET /api/session/history?page=1&limit=20
Response: {
  sessions: [
    {
      id: UUID,
      ended_at: timestamp,
      keys_pressed: number,
      accuracy: float,
      kpm: float
    },
    ...
  ],
  pagination: { ... }
}
```

---

## 6. Simplified Frontend Structure

### Pages
1. **Home Page** - Landing, login/register
2. **Dashboard** - User stats, history, start button
3. **Trainer Page** - The main keyboard trainer
4. **Results Page** - Session results display

### Components

#### KeyboardDisplay
```tsx
<KeyboardDisplay 
  currentKey="F"
  pressedKey={lastPressed}
  onKeyPress={(key) => handleKeyPress(key)}
/>
```

**Features**:
- Render visual keyboard layout (QWERTY)
- Highlight current target key
- Show visual feedback on press (correct/incorrect)
- Listen to keyboard events

#### SessionTimer
```tsx
<SessionTimer 
  duration={60}
  onComplete={() => handleSessionEnd()}
/>
```

**Features**:
- Countdown from 60 to 0
- Display prominently
- Auto-end session when timer hits 0

#### LiveStats
```tsx
<LiveStats 
  score={correctKeys}
  total={totalKeys}
  kpm={currentKPM}
  accuracy={currentAccuracy}
/>
```

---

## 7. Frontend State Management

### Redux Store (Simplified)

```typescript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean
  },
  
  session: {
    sessionId: string | null,
    sessionToken: string | null,
    keySequence: string[],
    currentIndex: number,
    correctKeys: number,
    incorrectKeys: number,
    startTime: number,
    timeRemaining: number,
    isActive: boolean,
    status: 'idle' | 'active' | 'ended'
  },
  
  statistics: {
    totalSessions: number,
    bestKPM: number,
    avgKPM: number,
    avgAccuracy: number,
    history: SessionResult[]
  }
}
```

### Key Actions

```typescript
// Session actions
startSession() // POST to backend, initialize state
handleKeyPress(key: string) // Validate, update counts, move to next
endSession() // POST to backend, show results
resetSession() // Clear state

// Stats actions
fetchStatistics()
fetchHistory(page: number)
```

---

## 8. Implementation Timeline (1-2 Weeks)

### Week 1: Backend Foundation
**Days 1-2**: Database & Auth
- Setup PostgreSQL
- Create 4 tables
- Implement registration/login

**Days 3-4**: Session Management
- Create session endpoints
- Key sequence generation
- Result calculation

**Days 5-7**: Statistics & Testing
- Statistics aggregation
- History endpoint
- API testing

### Week 2: Frontend
**Days 1-2**: Setup & Auth
- React + Vite setup
- Login/Register pages
- Protected routes

**Days 3-4**: Keyboard Trainer
- KeyboardDisplay component
- SessionTimer component
- Keyboard event handling
- Connect to backend API

**Days 5-6**: Dashboard & Polish
- Statistics display
- History table
- Results page
- UI improvements

**Day 7**: Testing & Deploy
- E2E testing
- Bug fixes
- Deploy to production

---

## 9. Key Sequence Generation Algorithm

### Backend Service

```typescript
function generateKeySequence(length: number = 200): string[] {
  const keys = [
    // Letters (primary focus)
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z',
    
    // Future: Add numbers and symbols
    // '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    // 'space', 'comma', 'period', ...
  ];
  
  const sequence = [];
  
  for (let i = 0; i < length; i++) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    sequence.push(randomKey);
  }
  
  return sequence;
}
```

### Balanced Distribution (Future Enhancement)
- Ensure each key appears at least X times
- Weight common letters (E, T, A, O, I) higher
- Practice finger combinations
- Include digraphs (TH, ER, ON, AN)

---

## 10. Scoring & Metrics

### Keys Per Minute (KPM)
```typescript
KPM = (total_keys_pressed / duration_seconds) * 60
// Example: (42 keys / 60 seconds) * 60 = 42 KPM
```

### Accuracy Percentage
```typescript
accuracy = (correct_keys / total_keys_pressed) * 100
// Example: (38 correct / 42 total) * 100 = 90.48%
```

### Score Display
```typescript
// Simple ratio display
"Score: 38/42"  // correct / total

// Or percentage
"Score: 90.5%"
```

---

## 11. Visual Design

### Color Scheme
- **Idle key**: Light gray (#E5E7EB)
- **Highlighted key**: Green (#10B981) - "Press me!"
- **Correct press**: Flash bright green (#34D399)
- **Incorrect press**: Flash red (#EF4444)
- **Pressed key**: Dark gray (#6B7280)

### Key Animations
```css
/* Highlight pulse */
@keyframes pulse {
  0%, 100% { 
    background-color: #10B981;
    transform: scale(1);
  }
  50% { 
    background-color: #34D399;
    transform: scale(1.05);
  }
}

/* Correct flash */
@keyframes correctFlash {
  0% { background-color: #34D399; }
  100% { background-color: #E5E7EB; }
}

/* Incorrect flash */
@keyframes incorrectFlash {
  0% { background-color: #EF4444; }
  100% { background-color: #E5E7EB; }
}
```

---

## 12. Future Enhancements (Post-MVP)

### Phase 2: Enhanced Typing
- Add numbers (0-9)
- Add symbols (!, @, #, etc.)
- Add special keys (Shift, Enter, Space)
- Uppercase vs lowercase

### Phase 3: Learning Modes
- Practice specific keys/rows
- Finger-specific training
- Common word typing
- Code snippet typing (return to original vision!)

### Phase 4: Gamification
- Daily streaks
- Achievements
- Leaderboards
- Multiplayer typing races

### Phase 5: Full Game
- Implement original game concept
- Enemies, lasers, waves
- Code snippet combat
- Multiple game modes

---

## 13. Success Metrics

### User Engagement
- **Target**: Users complete 3+ sessions per day
- **Measure**: Average sessions per user
- **Goal**: 70% retention after Day 1

### Performance Improvement
- **Target**: Users improve KPM by 10% after 10 sessions
- **Measure**: Compare first 3 sessions avg to last 3 sessions avg
- **Goal**: 60% of users show improvement

### Technical Performance
- **Target**: Session load time < 200ms
- **Measure**: API response time
- **Goal**: 95% of requests under 200ms

---

## 14. MVP Feature Checklist

### Must Have (MVP Launch)
- [x] User registration/login
- [x] Start 60-second typing session
- [x] Display keyboard layout
- [x] Highlight next key
- [x] Detect key presses (correct/incorrect)
- [x] Live timer countdown
- [x] End session at 60 seconds
- [x] Calculate and display results
- [x] Save results to database
- [x] Show statistics dashboard
- [x] View session history

### Nice to Have (Post-Launch Week 1)
- [ ] Tutorial/onboarding
- [ ] Keyboard shortcuts (Space to start)
- [ ] Sound effects
- [ ] Better animations
- [ ] Dark mode

### Future Features
- [ ] Mobile support
- [ ] Practice specific keys
- [ ] Custom session duration
- [ ] Export results
- [ ] Share to social media

---

## 15. Comparison: MVP vs Original Vision

| Feature | Original Game Vision | MVP Keyboard Trainer |
|---------|---------------------|---------------------|
| **Complexity** | High (enemies, waves, lasers) | Low (just keyboard) |
| **Session Length** | Variable (until death) | Fixed (60 seconds) |
| **Input Type** | Code snippets/tokens | Individual keys |
| **Visual Style** | Canvas game (shooter) | HTML/CSS keyboard |
| **Scoring** | Points, combos, waves | Keys/minute, accuracy |
| **Difficulty** | Progressive waves | Consistent |
| **Implementation** | 4-5 weeks | 1-2 weeks |
| **Database Tables** | 5+ tables | 4 tables |
| **Lines of Code** | ~15,000+ | ~5,000 |

### Why Start with MVP?

1. **Faster to Market**: Launch in 1-2 weeks vs 1-2 months
2. **Validate Core Loop**: Is typing practice engaging?
3. **Learn User Behavior**: What features do users want?
4. **Technical Foundation**: Auth, database, API all reusable
5. **Pivot Potential**: Easy to add game elements later

---

## Document Owner
Product Team

**Status**: ✅ Approved for MVP Development  
**Implementation Start**: November 25, 2025  
**Target MVP Launch**: December 6, 2025 (2 weeks)
