# Pro Dev - Frontend Structure Documentation

**Last Updated:** November 22, 2025

## 1. Frontend Overview

### Technology Stack
- **Framework**: React 18.2+ with TypeScript 5+
- **Build Tool**: Vite 5+
- **State Management**: Redux Toolkit 2.0+
- **Routing**: React Router 6+
- **Styling**: Tailwind CSS 3+ + CSS Modules for game
- **HTTP Client**: Axios 1.6+
- **Form Handling**: React Hook Form + Zod validation
- **Game Rendering**: HTML5 Canvas API
- **Testing**: Vitest + React Testing Library

### Design Principles
1. **Component-based architecture**: Reusable, modular components
2. **Type safety**: Full TypeScript coverage
3. **Separation of concerns**: UI / Business logic / API calls
4. **Performance**: Optimized re-renders, memoization, code splitting
5. **Accessibility**: WCAG 2.1 AA compliance
6. **Responsive design**: Mobile-first approach (future)

---

## 2. Application Structure

### 2.1 Page Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    APPLICATION FLOW                         │
└────────────────────────────────────────────────────────────┘

         ┌──────────────┐
         │  HomePage    │  (Public)
         │  /           │
         └──────┬───────┘
                │
         ┌──────┴────────┐
         │               │
    ┌────▼─────┐   ┌────▼──────┐
    │ Login    │   │ Register  │  (Public)
    │ /login   │   │ /register │
    └────┬─────┘   └────┬──────┘
         │              │
         └──────┬───────┘
                │
         ┌──────▼─────────┐
         │  Dashboard     │  (Protected)
         │  /dashboard    │
         │                │
         │  - Statistics  │
         │  - History     │
         │  - Start Game  │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │   Game Page    │  (Protected)
         │   /game        │
         │                │
         │ ┌────────────┐ │
         │ │  Canvas    │ │
         │ │  Game Loop │ │
         │ │  Typing UI │ │
         │ └────────────┘ │
         └───────┬────────┘
                 │
         ┌───────▼────────┐
         │  Results       │  (Protected)
         │  /game/result  │
         │                │
         │  - Final Score │
         │  - Statistics  │
         │  - Replay Btn  │
         └────────────────┘
```

---

## 3. Redux Store Architecture

### 3.1 Store Structure

```typescript
// store/store.ts
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    loading: boolean,
    error: string | null
  },
  
  game: {
    session: GameSession | null,
    snippets: CodeSnippet[],
    currentSnippetIndex: number,
    currentTokenIndex: number,
    
    // Game state
    playerHealth: number,
    score: number,
    combo: number,
    maxCombo: number,
    wavesCompleted: number,
    
    // Enemies
    enemies: Enemy[],
    nextEnemyId: number,
    
    // Lasers
    lasers: Laser[],
    nextLaserId: number,
    
    // Metrics
    totalWordsTyped: number,
    correctWords: number,
    incorrectWords: number,
    damageDealt: number,
    damageTaken: number,
    startTime: number | null,
    
    // UI state
    gameStatus: 'idle' | 'loading' | 'playing' | 'paused' | 'ended',
    isPaused: boolean,
    loading: boolean,
    error: string | null
  },
  
  user: {
    statistics: UserStatistics | null,
    history: GameResult[],
    historyPagination: PaginationInfo,
    loading: boolean,
    error: string | null
  }
}
```

---

### 3.2 Auth Slice

**File**: `store/slices/authSlice.ts`

**State**:
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

**Actions**:
```typescript
// Thunks (async)
registerUser({ username, email, password, display_name })
loginUser({ email, password })
verifyToken()
logoutUser()

// Reducers (sync)
setUser(user)
setToken(token)
clearAuth()
setLoading(boolean)
setError(string)
```

**Storage**:
- Token stored in `localStorage` with key `prodev_token`
- Automatically loaded on app initialization
- Cleared on logout or 401 errors

**Usage Example**:
```typescript
// In component
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/slices/authSlice';

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);
  
  const handleSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };
};
```

---

### 3.3 Game Slice

**File**: `store/slices/gameSlice.ts`

**State**:
```typescript
interface GameState {
  // Session data
  session: GameSession | null;
  snippets: CodeSnippet[];
  currentSnippetIndex: number;
  currentTokenIndex: number;
  
  // Player state
  playerHealth: number;
  score: number;
  combo: number;
  maxCombo: number;
  wavesCompleted: number;
  
  // Entities
  enemies: Enemy[];
  nextEnemyId: number;
  lasers: Laser[];
  nextLaserId: number;
  
  // Metrics
  totalWordsTyped: number;
  correctWords: number;
  incorrectWords: number;
  damageDealt: number;
  damageTaken: number;
  startTime: number | null;
  
  // UI state
  gameStatus: GameStatus;
  isPaused: boolean;
  loading: boolean;
  error: string | null;
}

type GameStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';
```

**Actions**:
```typescript
// Thunks (async)
startGameSession({ language, difficulty })
endGameSession()

// Reducers (sync) - Game loop updates
spawnEnemy(enemy)
removeEnemy(id)
updateEnemyPosition(id, position)
damageEnemy(id, damage)

fireLaser(laser)
removeLaser(id)
updateLaserPosition(id, position)

handleCorrectToken()
handleIncorrectToken()
updateScore(points)
updateCombo(value)
resetCombo()

takeDamage(amount)
completeWave()
nextSnippet()
advanceToken()

pauseGame()
resumeGame()
resetGame()
```

**Usage in Game Loop**:
```typescript
// In GameEngine.ts
import { store } from '@/store/store';
import { gameSlice } from '@/store/slices/gameSlice';

class GameEngine {
  update(deltaTime: number) {
    const gameState = store.getState().game;
    
    // Update enemies
    gameState.enemies.forEach(enemy => {
      const newPos = this.calculateNewPosition(enemy, deltaTime);
      store.dispatch(gameSlice.actions.updateEnemyPosition(enemy.id, newPos));
      
      // Check if reached player
      if (newPos.y >= PLAYER_Y_POSITION) {
        store.dispatch(gameSlice.actions.takeDamage(enemy.damage));
        store.dispatch(gameSlice.actions.removeEnemy(enemy.id));
      }
    });
    
    // Update lasers
    // ... similar logic
  }
}
```

---

### 3.4 User Slice

**File**: `store/slices/userSlice.ts`

**State**:
```typescript
interface UserState {
  statistics: UserStatistics | null;
  history: GameResult[];
  historyPagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    limit: number;
  };
  loading: boolean;
  error: string | null;
}
```

**Actions**:
```typescript
// Thunks
fetchUserStatistics()
fetchGameHistory({ page, limit, sort, order })
updateProfile({ display_name })
changePassword({ current_password, new_password })

// Reducers
setStatistics(stats)
setHistory(results, pagination)
appendHistory(results)
clearHistory()
```

---

## 4. Component Hierarchy

### 4.1 Top-Level Component Tree

```
<App>
  <Router>
    <Layout>
      <Header>
        <Logo />
        <Navigation />
        <UserMenu />
      </Header>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/game/result/:id" element={<ResultPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      <Footer />
    </Layout>
  </Router>
</App>
```

---

### 4.2 Common Components

#### Button Component

**File**: `components/common/Button/Button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
}
```

**Usage**:
```tsx
<Button variant="primary" size="lg" onClick={handleStartGame}>
  Start Game
</Button>
```

---

#### Input Component

**File**: `components/common/Input/Input.tsx`

**Props**:
```typescript
interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}
```

**Integrates with React Hook Form**:
```tsx
<Input
  label="Email"
  type="email"
  {...register('email')}
  error={errors.email?.message}
/>
```

---

#### Modal Component

**File**: `components/common/Modal/Modal.tsx`

**Props**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}
```

**Features**:
- Backdrop with blur
- Escape key to close
- Focus trap
- Smooth animations
- Portal rendering

---

#### Loader Component

**File**: `components/common/Loader/Loader.tsx`

**Props**:
```typescript
interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
}
```

---

### 4.3 Auth Components

#### LoginForm

**File**: `components/auth/LoginForm/LoginForm.tsx`

**Features**:
- React Hook Form integration
- Zod validation
- Show/hide password toggle
- Remember me checkbox (future)
- Loading state on submit
- Error display

**Form Schema**:
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
```

**State Management**:
- Dispatches `loginUser` thunk on submit
- Redirects to dashboard on success
- Displays errors from Redux state

---

#### RegisterForm

**File**: `components/auth/RegisterForm/RegisterForm.tsx`

**Features**:
- Multi-field validation
- Password strength indicator
- Confirm password field
- Real-time validation feedback

**Form Schema**:
```typescript
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain special character'),
  confirm_password: z.string(),
  display_name: z.string().min(2).max(100)
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password']
});
```

---

#### ProtectedRoute

**File**: `components/auth/ProtectedRoute/ProtectedRoute.tsx`

**Purpose**: Wrapper for routes that require authentication.

**Logic**:
```typescript
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const location = useLocation();
  
  if (loading) {
    return <Loader fullScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};
```

---

### 4.4 Game Components

#### GameCanvas

**File**: `components/game/GameCanvas/GameCanvas.tsx`

**Purpose**: Main canvas element for game rendering.

**Structure**:
```tsx
const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Initialize game engine
    gameEngineRef.current = new GameEngine(canvas);
    gameEngineRef.current.start();
    
    return () => {
      gameEngineRef.current?.stop();
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="game-canvas"
    />
  );
};
```

**Responsibilities**:
- Canvas element rendering
- Game engine initialization
- Cleanup on unmount

---

#### TypingInput

**File**: `components/game/TypingInput/TypingInput.tsx`

**Purpose**: Handle user typing input during gameplay.

**Features**:
- Auto-focus on mount
- Character-by-character validation
- Visual feedback (correct/incorrect)
- Disable during pause/game over

**Structure**:
```tsx
const TypingInput = () => {
  const dispatch = useAppDispatch();
  const { snippets, currentSnippetIndex, currentTokenIndex } = useAppSelector(state => state.game);
  const [inputValue, setInputValue] = useState('');
  
  const currentSnippet = snippets[currentSnippetIndex];
  const currentToken = currentSnippet?.tokens[currentTokenIndex];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Check if token completed
    if (value === currentToken) {
      dispatch(handleCorrectToken());
      setInputValue('');
    } else if (value.length > currentToken.length) {
      // Token failed
      dispatch(handleIncorrectToken());
      setInputValue('');
    }
  };
  
  return (
    <div className="typing-input-container">
      <div className="snippet-display">
        {currentSnippet?.tokens.map((token, idx) => (
          <span
            key={idx}
            className={cn(
              'token',
              idx < currentTokenIndex && 'completed',
              idx === currentTokenIndex && 'active'
            )}
          >
            {token}
          </span>
        ))}
      </div>
      
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        className="typing-input"
        autoFocus
        placeholder="Type here..."
      />
    </div>
  );
};
```

---

#### GameHUD

**File**: `components/game/GameHUD/GameHUD.tsx`

**Purpose**: Display game stats overlay (health, score, combo, wave).

**Structure**:
```tsx
const GameHUD = () => {
  const {
    playerHealth,
    score,
    combo,
    wavesCompleted,
    isPaused
  } = useAppSelector(state => state.game);
  
  return (
    <div className="game-hud">
      <div className="hud-top">
        <div className="health-bar">
          <span>HP</span>
          <div className="bar">
            <div className="fill" style={{ width: `${playerHealth}%` }} />
          </div>
          <span>{playerHealth}/100</span>
        </div>
        
        <div className="wave-counter">
          Wave: {wavesCompleted + 1}
        </div>
      </div>
      
      <div className="hud-bottom">
        <div className="score">
          Score: {score.toLocaleString()}
        </div>
        
        <div className={cn('combo', combo > 5 && 'active')}>
          {combo > 1 && `${combo}x COMBO!`}
        </div>
      </div>
      
      {isPaused && (
        <div className="pause-overlay">
          <h2>PAUSED</h2>
          <p>Press ESC to resume</p>
        </div>
      )}
    </div>
  );
};
```

---

#### PlayerSprite

**File**: `components/game/PlayerSprite.tsx` (used in game engine)

**Purpose**: Player character visual representation.

**Rendering**:
```typescript
export class PlayerSprite {
  x: number;
  y: number;
  width: number = 80;
  height: number = 80;
  
  draw(ctx: CanvasRenderingContext2D) {
    // Draw player character (spaceship, programmer avatar, etc.)
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Add details (turret, etc.)
    ctx.fillStyle = '#2E5C8A';
    ctx.fillRect(this.x + 30, this.y - 10, 20, 10);
  }
}
```

---

#### EnemySprite

**File**: `components/game/EnemySprite.ts`

**Purpose**: Enemy visual representation.

**Types**:
```typescript
type EnemyType = 'bug' | 'error' | 'crash' | 'virus';

interface EnemyConfig {
  type: EnemyType;
  color: string;
  health: number;
  damage: number;
  speed: number;
  points: number;
}

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  bug: { color: '#FF6B6B', health: 1, damage: 5, speed: 1.0, points: 10 },
  error: { color: '#FFA500', health: 2, damage: 10, speed: 0.8, points: 20 },
  crash: { color: '#DC143C', health: 3, damage: 15, speed: 0.6, points: 50 },
  virus: { color: '#8B008B', health: 5, damage: 20, speed: 0.5, points: 100 }
};
```

---

#### LaserEffect

**File**: `components/game/LaserEffect.ts`

**Purpose**: Laser projectile visual.

**Rendering**:
```typescript
export class LaserEffect {
  x: number;
  y: number;
  width: number = 4;
  height: number = 20;
  speed: number = 400; // pixels per second
  color: string = '#00FF00';
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Add glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }
  
  update(deltaTime: number) {
    this.y -= this.speed * deltaTime;
  }
}
```

---

### 4.5 Dashboard Components

#### StatsCard

**File**: `components/dashboard/StatsCard/StatsCard.tsx`

**Purpose**: Display individual statistic.

**Props**:
```typescript
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
}
```

**Usage**:
```tsx
<StatsCard
  title="Total Games"
  value={statistics.total_games}
  icon={<GameIcon />}
/>

<StatsCard
  title="Best WPM"
  value={statistics.best_wpm.toFixed(1)}
  icon={<SpeedIcon />}
  change={{ value: 12.5, isPositive: true }}
/>
```

---

#### ProgressChart

**File**: `components/dashboard/ProgressChart/ProgressChart.tsx`

**Purpose**: Visualize performance over time.

**Library**: Chart.js or Recharts

**Data**:
```typescript
interface ChartData {
  labels: string[]; // Dates
  datasets: [{
    label: 'WPM',
    data: number[],
    borderColor: string,
    backgroundColor: string
  }, {
    label: 'Accuracy %',
    data: number[],
    borderColor: string,
    backgroundColor: string
  }]
}
```

---

#### HistoryTable

**File**: `components/dashboard/HistoryTable/HistoryTable.tsx`

**Purpose**: Display paginated game history.

**Features**:
- Sortable columns
- Pagination controls
- Click row to view detailed results
- Loading state

**Columns**:
- Date/Time
- Language
- Difficulty
- Score
- WPM
- Accuracy
- Waves
- Actions (View details)

---

### 4.6 Layout Components

#### Header

**File**: `components/layout/Header/Header.tsx`

**Structure**:
```tsx
<header className="header">
  <div className="container">
    <Logo />
    
    <Navigation>
      {isAuthenticated ? (
        <>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/game">Play</NavLink>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </>
      )}
    </Navigation>
    
    {isAuthenticated && <UserMenu />}
  </div>
</header>
```

---

#### UserMenu

**File**: `components/layout/UserMenu/UserMenu.tsx`

**Features**:
- Dropdown menu
- User avatar/initials
- Profile link
- Settings (future)
- Logout button

---

## 5. Game Engine Architecture

### 5.1 GameEngine Class

**File**: `game/engine/GameEngine.ts`

**Responsibilities**:
- Main game loop (update + render)
- Coordinate all game systems
- Handle timing and delta time
- Manage game lifecycle

**Structure**:
```typescript
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: Renderer;
  private inputHandler: InputHandler;
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  
  // Systems
  private collisionSystem: CollisionSystem;
  private movementSystem: MovementSystem;
  private spawnSystem: SpawnSystem;
  
  // Managers
  private waveManager: WaveManager;
  private particleManager: ParticleManager;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.renderer = new Renderer(this.ctx);
    this.inputHandler = new InputHandler(canvas);
    
    this.collisionSystem = new CollisionSystem();
    this.movementSystem = new MovementSystem();
    this.spawnSystem = new SpawnSystem();
    
    this.waveManager = new WaveManager();
    this.particleManager = new ParticleManager();
  }
  
  start() {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  private gameLoop = () => {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  private update(deltaTime: number) {
    const gameState = store.getState().game;
    
    if (gameState.gameStatus !== 'playing' || gameState.isPaused) {
      return;
    }
    
    // Update systems
    this.movementSystem.update(deltaTime);
    this.collisionSystem.update();
    this.spawnSystem.update(deltaTime);
    this.waveManager.update();
    this.particleManager.update(deltaTime);
  }
  
  private render() {
    const gameState = store.getState().game;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render background
    this.renderer.drawBackground();
    
    // Render game entities
    this.renderer.drawPlayer();
    this.renderer.drawEnemies(gameState.enemies);
    this.renderer.drawLasers(gameState.lasers);
    this.renderer.drawParticles(this.particleManager.particles);
    
    // Render effects
    this.renderer.drawEffects();
  }
}
```

---

### 5.2 Renderer Class

**File**: `game/engine/Renderer.ts`

**Responsibilities**:
- All canvas drawing operations
- Sprite rendering
- Visual effects
- Background rendering

**Key Methods**:
```typescript
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  drawBackground() {
    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.ctx.canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Grid lines (optional)
    this.drawGrid();
  }
  
  drawPlayer() {
    const player = new PlayerSprite(600, 700); // Center bottom
    player.draw(this.ctx);
  }
  
  drawEnemies(enemies: Enemy[]) {
    enemies.forEach(enemy => {
      const sprite = new EnemySprite(enemy);
      sprite.draw(this.ctx);
      
      // Health bar
      this.drawHealthBar(enemy);
    });
  }
  
  drawLasers(lasers: Laser[]) {
    lasers.forEach(laser => {
      const effect = new LaserEffect(laser);
      effect.draw(this.ctx);
    });
  }
  
  drawParticles(particles: Particle[]) {
    particles.forEach(particle => {
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      this.ctx.globalAlpha = 1.0;
    });
  }
  
  private drawHealthBar(enemy: Enemy) {
    const barWidth = 40;
    const barHeight = 4;
    const barX = enemy.x + (enemy.width - barWidth) / 2;
    const barY = enemy.y - 10;
    
    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Health fill
    const healthPercent = enemy.health / enemy.maxHealth;
    this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : '#F44336';
    this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }
}
```

---

### 5.3 Input Handler

**File**: `game/engine/InputHandler.ts`

**Responsibilities**:
- Keyboard event handling
- Pause/resume game
- ESC key handling

**Structure**:
```typescript
export class InputHandler {
  private canvas: HTMLCanvasElement;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  private handleKeyDown = (e: KeyboardEvent) => {
    const gameState = store.getState().game;
    
    switch (e.key) {
      case 'Escape':
        if (gameState.gameStatus === 'playing') {
          if (gameState.isPaused) {
            store.dispatch(gameSlice.actions.resumeGame());
          } else {
            store.dispatch(gameSlice.actions.pauseGame());
          }
        }
        break;
        
      // Add more hotkeys as needed
    }
  };
  
  cleanup() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

---

### 5.4 Collision System

**File**: `game/systems/CollisionSystem.ts`

**Responsibilities**:
- Detect laser-enemy collisions
- Handle collision consequences
- Optimize with spatial partitioning (future)

**Algorithm**:
```typescript
export class CollisionSystem {
  update() {
    const gameState = store.getState().game;
    const { lasers, enemies } = gameState;
    
    lasers.forEach(laser => {
      enemies.forEach(enemy => {
        if (this.checkCollision(laser, enemy)) {
          this.handleCollision(laser, enemy);
        }
      });
    });
  }
  
  private checkCollision(laser: Laser, enemy: Enemy): boolean {
    return (
      laser.x < enemy.x + enemy.width &&
      laser.x + laser.width > enemy.x &&
      laser.y < enemy.y + enemy.height &&
      laser.y + laser.height > enemy.y
    );
  }
  
  private handleCollision(laser: Laser, enemy: Enemy) {
    // Damage enemy
    store.dispatch(gameSlice.actions.damageEnemy(enemy.id, laser.damage));
    
    // Remove laser
    store.dispatch(gameSlice.actions.removeLaser(laser.id));
    
    // Spawn particle effect
    this.spawnImpactParticles(laser.x, laser.y);
    
    // Update score
    store.dispatch(gameSlice.actions.updateScore(10));
    
    // Check if enemy destroyed
    const updatedEnemy = store.getState().game.enemies.find(e => e.id === enemy.id);
    if (updatedEnemy && updatedEnemy.health <= 0) {
      store.dispatch(gameSlice.actions.removeEnemy(enemy.id));
      store.dispatch(gameSlice.actions.updateScore(enemy.points));
      this.spawnDeathParticles(enemy.x, enemy.y);
    }
  }
}
```

---

### 5.5 Movement System

**File**: `game/systems/MovementSystem.ts`

**Responsibilities**:
- Update positions of all moving entities
- Handle off-screen removal

**Structure**:
```typescript
export class MovementSystem {
  update(deltaTime: number) {
    this.updateEnemies(deltaTime);
    this.updateLasers(deltaTime);
  }
  
  private updateEnemies(deltaTime: number) {
    const { enemies } = store.getState().game;
    
    enemies.forEach(enemy => {
      const newY = enemy.y + enemy.speed * deltaTime * 60; // Adjust for 60fps baseline
      
      if (newY >= 700) {
        // Reached player
        store.dispatch(gameSlice.actions.takeDamage(enemy.damage));
        store.dispatch(gameSlice.actions.removeEnemy(enemy.id));
        store.dispatch(gameSlice.actions.resetCombo());
      } else {
        store.dispatch(gameSlice.actions.updateEnemyPosition(enemy.id, { x: enemy.x, y: newY }));
      }
    });
  }
  
  private updateLasers(deltaTime: number) {
    const { lasers } = store.getState().game;
    
    lasers.forEach(laser => {
      const newY = laser.y - laser.speed * deltaTime * 60;
      
      if (newY < -20) {
        // Off screen
        store.dispatch(gameSlice.actions.removeLaser(laser.id));
      } else {
        store.dispatch(gameSlice.actions.updateLaserPosition(laser.id, { x: laser.x, y: newY }));
      }
    });
  }
}
```

---

### 5.6 Spawn System

**File**: `game/systems/SpawnSystem.ts`

**Responsibilities**:
- Spawn enemies based on wave difficulty
- Manage spawn timing
- Enemy placement logic

**Structure**:
```typescript
export class SpawnSystem {
  private spawnTimer: number = 0;
  private spawnInterval: number = 2.0; // seconds
  
  update(deltaTime: number) {
    const { gameStatus, wavesCompleted } = store.getState().game;
    
    if (gameStatus !== 'playing') return;
    
    this.spawnTimer += deltaTime;
    
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnEnemy();
      this.spawnTimer = 0;
      
      // Increase difficulty over time
      this.spawnInterval = Math.max(0.5, 2.0 - wavesCompleted * 0.1);
    }
  }
  
  private spawnEnemy() {
    const wave = store.getState().game.wavesCompleted;
    const type = this.selectEnemyType(wave);
    const x = Math.random() * (1200 - 60); // Random x position
    
    const enemy: Enemy = {
      id: store.getState().game.nextEnemyId,
      type,
      x,
      y: -60, // Start above screen
      width: 60,
      height: 60,
      health: this.getEnemyHealth(type),
      maxHealth: this.getEnemyHealth(type),
      speed: this.getEnemySpeed(type),
      damage: this.getEnemyDamage(type),
      points: this.getEnemyPoints(type)
    };
    
    store.dispatch(gameSlice.actions.spawnEnemy(enemy));
  }
  
  private selectEnemyType(wave: number): EnemyType {
    if (wave < 3) return 'bug';
    if (wave < 6) return Math.random() > 0.5 ? 'bug' : 'error';
    if (wave < 10) {
      const rand = Math.random();
      if (rand < 0.4) return 'bug';
      if (rand < 0.8) return 'error';
      return 'crash';
    }
    // Wave 10+
    const rand = Math.random();
    if (rand < 0.3) return 'bug';
    if (rand < 0.6) return 'error';
    if (rand < 0.9) return 'crash';
    return 'virus';
  }
}
```

---

### 5.7 Wave Manager

**File**: `game/managers/WaveManager.ts`

**Responsibilities**:
- Track wave completion
- Load next code snippet
- Increase difficulty

**Structure**:
```typescript
export class WaveManager {
  private enemiesKilledThisWave: number = 0;
  private enemiesRequiredForWave: number = 10;
  
  update() {
    const { enemies, wavesCompleted } = store.getState().game;
    
    // Check if wave completed (no enemies left and killed enough)
    if (enemies.length === 0 && this.enemiesKilledThisWave >= this.enemiesRequiredForWave) {
      this.completeWave();
    }
  }
  
  private completeWave() {
    store.dispatch(gameSlice.actions.completeWave());
    store.dispatch(gameSlice.actions.nextSnippet());
    
    // Reset wave tracking
    this.enemiesKilledThisWave = 0;
    this.enemiesRequiredForWave += 2; // Increase difficulty
    
    // Bonus for wave completion
    store.dispatch(gameSlice.actions.updateScore(100));
  }
}
```

---

## 6. Service Layer (API Calls)

### 6.1 API Service Base

**File**: `services/api.service.ts`

**Purpose**: Axios instance with interceptors.

**Setup**:
```typescript
import axios from 'axios';
import { store } from '@/store/store';
import { authSlice } from '@/store/slices/authSlice';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add token
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      store.dispatch(authSlice.actions.clearAuth());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### 6.2 Auth Service

**File**: `services/auth.service.ts`

**Methods**:
```typescript
export const authService = {
  async register(data: RegisterDto) {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },
  
  async login(data: LoginDto) {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },
  
  async verifyToken() {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  }
};
```

---

### 6.3 Game Service

**File**: `services/game.service.ts`

**Methods**:
```typescript
export const gameService = {
  async startSession(data: StartGameDto) {
    const response = await apiClient.post('/game/start', data);
    return response.data;
  },
  
  async endSession(data: EndGameDto) {
    const response = await apiClient.post('/game/end', data);
    return response.data;
  },
  
  async getHistory(params: HistoryParams) {
    const response = await apiClient.get('/game/history', { params });
    return response.data;
  },
  
  async getResult(id: string) {
    const response = await apiClient.get(`/game/result/${id}`);
    return response.data;
  }
};
```

---

### 6.4 User Service

**File**: `services/user.service.ts`

**Methods**:
```typescript
export const userService = {
  async getProfile() {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
  
  async getStatistics() {
    const response = await apiClient.get('/user/statistics');
    return response.data;
  },
  
  async updateProfile(data: UpdateProfileDto) {
    const response = await apiClient.put('/user/profile', data);
    return response.data;
  },
  
  async changePassword(data: ChangePasswordDto) {
    const response = await apiClient.put('/user/password', data);
    return response.data;
  }
};
```

---

## 7. Routing Configuration

**File**: `App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import GamePage from '@/pages/GamePage';
import ResultPage from '@/pages/ResultPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/game/result/:id" element={<ResultPage />} />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
```

---

## 8. Styling Architecture

### 8.1 Tailwind Configuration

**File**: `tailwind.config.js`

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2ff',
          500: '#4A90E2',
          700: '#2E5C8A'
        },
        danger: {
          500: '#F44336',
          700: '#D32F2F'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      }
    }
  },
  plugins: []
};
```

---

### 8.2 CSS Modules for Game

**File**: `game.module.css`

```css
.gameContainer {
  position: relative;
  width: 1200px;
  height: 800px;
  margin: 0 auto;
  background: #1a1a2e;
  border-radius: 8px;
  overflow: hidden;
}

.gameCanvas {
  display: block;
  width: 100%;
  height: 100%;
}

.typingInputContainer {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;
}

.snippetDisplay {
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
  font-family: 'Fira Code', monospace;
  font-size: 18px;
  color: #fff;
  margin-bottom: 10px;
}

.token {
  margin: 0 4px;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background 0.2s;
}

.token.completed {
  background: rgba(76, 175, 80, 0.3);
  color: #4CAF50;
}

.token.active {
  background: rgba(74, 144, 226, 0.5);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 9. Performance Optimizations

### 9.1 Code Splitting

```typescript
// Lazy load pages
const GamePage = lazy(() => import('@/pages/GamePage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));

// Use with Suspense
<Suspense fallback={<Loader fullScreen />}>
  <GamePage />
</Suspense>
```

---

### 9.2 Memoization

```typescript
// Expensive component
const ExpensiveChart = memo(({ data }: Props) => {
  // Heavy rendering logic
  return <Chart data={data} />;
});

// Use useMemo for expensive calculations
const sortedHistory = useMemo(() => {
  return history.sort((a, b) => b.final_score - a.final_score);
}, [history]);
```

---

### 9.3 Object Pooling (Game Entities)

```typescript
// Reuse enemy/laser objects instead of creating new ones
class ObjectPool<T> {
  private pool: T[] = [];
  
  get(factory: () => T): T {
    return this.pool.pop() || factory();
  }
  
  release(obj: T) {
    this.pool.push(obj);
  }
}
```

---

## Document Owner
Frontend Development Team

**Last Review**: November 22, 2025  
**Next Review**: Sprint 3
