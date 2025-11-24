# Pro Dev - Game Mechanics Documentation

**Last Updated:** November 22, 2025

## 1. Game Concept Overview

**Pro Dev** is a typing-based defense game where players defend against waves of enemies (representing bugs, errors, and crashes) by typing code snippets. Each correctly typed token fires a laser that damages enemies. The game combines fast-paced action with programming education.

### Core Gameplay Loop

```
1. Wave Start
   ↓
2. Enemies Spawn (falling toward player)
   ↓
3. Player Types Code Tokens
   ↓
4. Correct Token → Fire Laser
   ↓
5. Laser Hits Enemy → Damage/Destroy
   ↓
6. Destroy All Enemies → Wave Complete
   ↓
7. Load Next Snippet → New Wave
   ↓
8. Repeat until Player Health = 0
```

---

## 2. Game Modes (v1.0)

### 2.1 Survival Mode (Primary)

**Objective**: Survive as many waves as possible

**Win Condition**: None (endless waves with increasing difficulty)

**Lose Condition**: Player health reaches 0

**Features**:
- Progressive difficulty (enemies get faster and tougher)
- Wave-based progression
- Code snippets rotate every wave
- Score accumulation

---

### 2.2 Future Modes (Post-v1.0)

#### Time Attack
- Complete as many snippets as possible in 5 minutes
- No enemies, focus on typing speed
- Accuracy affects time bonuses

#### Boss Rush
- Face off against large "boss" enemies
- Require completing multiple snippets to defeat
- Special attack patterns

#### Multiplayer Co-op
- 2-4 players defend together
- Shared snippet pool
- Combo bonuses for typing same tokens

---

## 3. Player Mechanics

### 3.1 Player Stats

```typescript
interface PlayerStats {
  health: number;          // 100 max, game over at 0
  position: { x, y };      // Fixed at bottom center
  fireRate: number;        // Lasers per second (1.0 default)
  damageMultiplier: number;// Damage multiplier (1.0 default)
}
```

**Health System**:
- Starts at 100
- Loses health when enemy reaches player position
- Damage varies by enemy type (5-20 per hit)
- No health regeneration
- Visual feedback: health bar color changes
  - Green: 100-60
  - Yellow: 59-30
  - Red: 29-1

**Position**:
- Player is stationary at bottom center (x: 600, y: 700)
- Cannot move (tower defense style)
- Turret rotates toward nearest enemy (visual only)

---

### 3.2 Typing Mechanics

#### Token-Based Input

Code snippets are broken into **tokens** (typable units):

```typescript
// Example Python snippet
"for i in range(10):"

// Tokenized
["for", "i", "in", "range", "(", "10", ")", ":"]
```

**Token Rules**:
1. **Keywords**: Whole words (e.g., "for", "def", "return")
2. **Identifiers**: Variable/function names (e.g., "calculate_sum")
3. **Operators**: Individual symbols (e.g., "=", "+", "==")
4. **Punctuation**: Individual characters (e.g., "(", ")", ",", ":")
5. **Strings**: Complete strings (e.g., `"hello"`)
6. **Numbers**: Complete numbers (e.g., "42", "3.14")

#### Typing Flow

```
1. Display current token highlighted
2. User types in input field
3. Every keystroke validated:
   - Matches token prefix → Continue
   - Doesn't match → Visual error feedback (red flash)
4. Token completed (exact match):
   - Clear input field
   - Fire laser
   - Increment correct words counter
   - Update combo
   - Advance to next token
5. Token failed (user typed too many chars):
   - Clear input field
   - Increment incorrect words counter
   - Reset combo to 0
   - Advance to next token (skip)
```

#### Case Sensitivity
- **Sensitive**: All tokens must match exact case
- Example: "Python" ≠ "python"

#### Whitespace
- **Ignored**: Tokenization removes whitespace
- User doesn't type spaces between tokens
- Visual display shows spacing for readability

---

### 3.3 Laser Mechanics

**Laser Properties**:
```typescript
interface Laser {
  id: number;
  x: number;
  y: number;
  width: 4;
  height: 20;
  speed: 400;          // pixels/second
  damage: 1;           // base damage
  color: "#00FF00";    // green
}
```

**Firing Logic**:
1. Correct token typed
2. Laser spawns at player position (x: player.x + 38, y: player.y)
3. Travels upward at constant speed
4. On collision with enemy:
   - Deal damage to enemy
   - Laser destroyed
   - Spawn impact particles
5. Remove laser if goes off-screen (y < -20)

**Fire Rate**:
- Limited by typing speed (no artificial delay)
- Player can fire as fast as they can type correctly
- Combo bonus increases laser damage, not fire rate

**Targeting**:
- Lasers travel straight up (no homing)
- Player must time shots with enemy positions
- Multiple lasers can hit same enemy

---

## 4. Enemy Mechanics

### 4.1 Enemy Types

```typescript
type EnemyType = 'bug' | 'error' | 'crash' | 'virus';

interface EnemyConfig {
  type: EnemyType;
  displayName: string;
  color: string;
  health: number;
  speed: number;        // pixels/second
  damage: number;       // to player on reach
  points: number;       // score on kill
  width: number;
  height: number;
}
```

**Enemy Configurations**:

| Type   | HP | Speed | Damage | Points | Color    | Intro Wave |
|--------|----|----- |--------|--------|----------|------------|
| Bug    | 1  | 50   | 5      | 10     | #FF6B6B  | 1          |
| Error  | 2  | 40   | 10     | 20     | #FFA500  | 3          |
| Crash  | 3  | 30   | 15     | 50     | #DC143C  | 6          |
| Virus  | 5  | 25   | 20     | 100    | #8B008B  | 10         |

---

### 4.2 Enemy Behavior

#### Spawning

**Spawn Logic**:
```typescript
// Wave-based spawn rate
baseSpawnInterval = 2.0 seconds;
currentInterval = max(0.5, baseSpawnInterval - (wavesCompleted * 0.1));

// Enemy type distribution by wave
wave 1-2:   100% bug
wave 3-5:   60% bug, 40% error
wave 6-9:   40% bug, 40% error, 20% crash
wave 10+:   30% bug, 30% error, 30% crash, 10% virus
```

**Spawn Position**:
- Random x-position (0 to canvas.width - enemy.width)
- Start above screen (y: -60)
- Ensures enemies don't overlap on spawn

#### Movement

**Vertical Movement**:
```typescript
newY = currentY + (speed * deltaTime);
```

- Constant downward movement
- Speed varies by enemy type
- No horizontal movement (straight fall)
- Accelerates slightly with wave progression:
  ```typescript
  adjustedSpeed = baseSpeed * (1 + wavesCompleted * 0.05);
  ```

#### Reaching Player

When enemy.y >= player.y:
1. Player takes damage (enemy.damage)
2. Enemy removed from game
3. Combo reset to 0
4. Screen shake effect
5. Red flash overlay

---

### 4.3 Enemy Health & Damage

**Taking Damage**:
```typescript
enemy.health -= laser.damage * player.damageMultiplier * comboMultiplier;

if (enemy.health <= 0) {
  // Enemy destroyed
  removeEnemy(enemy.id);
  addScore(enemy.points * comboMultiplier);
  incrementCombo();
  spawnParticles(enemy.position, enemy.color);
}
```

**Health Bar**:
- Displayed above enemy
- Green when > 50% health
- Yellow when 25-50% health
- Red when < 25% health
- Width: 40px, Height: 4px

---

## 5. Scoring System

### 5.1 Score Sources

```typescript
// Base points
correctToken = 10 points
enemyKilled = enemy.points (10-100)
waveCompleted = 100 points

// Multipliers
comboMultiplier = min(3.0, 1 + (combo - 1) * 0.1)
// Combo 1: 1.0x, Combo 5: 1.4x, Combo 10: 1.9x, Combo 20+: 3.0x

// Final calculation during game
scorePerAction = basePoints * comboMultiplier
```

### 5.2 Final Score Calculation

At game end, total score recalculated on backend:

```typescript
finalScore = 
  (correctWords * 10) +                    // Typing accuracy
  (enemiesKilled * averageEnemyPoints) +   // Combat performance
  (wavesCompleted * 100) +                 // Progress
  (maxCombo * 25) +                        // Skill bonus
  Math.floor(accuracy * 5) +               // Accuracy bonus (0-500)
  Math.floor(wpm * 2);                     // Speed bonus
```

**Example**:
```
Player stats:
- Correct words: 200
- Enemies killed: 150 (average 25 points each)
- Waves completed: 8
- Max combo: 18
- Accuracy: 95%
- WPM: 65

Final score:
= (200 * 10) + (150 * 25) + (8 * 100) + (18 * 25) + (95 * 5) + (65 * 2)
= 2000 + 3750 + 800 + 450 + 475 + 130
= 7605 points
```

---

### 5.3 Combo System

**Combo Mechanics**:
```typescript
// Increment
correctToken() → combo++
enemyKilled() → combo++  // Indirect via correct typing

// Reset
incorrectToken() → combo = 0
enemyReachesPlayer() → combo = 0
```

**Visual Feedback**:
- Display current combo in HUD
- Flash effect when combo > 5
- "COMBO!" text pulses
- Color changes:
  - White: 1-4
  - Yellow: 5-9
  - Orange: 10-14
  - Red: 15+

**Multiplier Benefits**:
- Applies to score only (not damage in v1.0)
- Max 3x multiplier at combo 20+
- High risk, high reward gameplay

---

## 6. Wave System

### 6.1 Wave Structure

```typescript
interface Wave {
  number: number;
  snippet: CodeSnippet;
  enemiesRequired: number;
  enemiesKilled: number;
  spawnRate: number;        // seconds between spawns
  difficulty: number;       // 1.0 base, increases per wave
}
```

**Wave Progression**:
```typescript
wave 1:  10 enemies, 2.0s spawn rate
wave 2:  12 enemies, 1.9s spawn rate
wave 3:  14 enemies, 1.8s spawn rate
...
wave 10: 28 enemies, 1.0s spawn rate
wave 11+: +2 enemies per wave, min 0.5s spawn rate
```

---

### 6.2 Wave Completion

**Conditions**:
1. All spawned enemies must be cleared
2. Minimum enemies killed threshold met
3. Current snippet completed (all tokens typed)

**On Completion**:
1. Pause enemy spawning
2. Show "WAVE COMPLETE" message
3. Award +100 bonus points
4. Load next code snippet
5. Reset enemy counters
6. Resume with increased difficulty
7. Brief 2-second intermission

**Wave Failure**:
- Cannot fail a wave (only game over)
- Enemies keep spawning until player dies

---

### 6.3 Snippet Rotation

**Selection Process**:
1. On wave complete, advance to next snippet in array
2. If array exhausted, request new batch from backend
3. Maintain difficulty level (don't decrease)
4. Rotate languages if preference not set

**Snippet Difficulty Scaling**:
- Waves 1-3: EASY snippets
- Waves 4-7: NORMAL snippets
- Waves 8+: HARD snippets
- User can override in settings (future)

---

## 7. Difficulty Settings

### 7.1 Difficulty Levels

```typescript
enum Difficulty {
  EASY,
  NORMAL,
  HARD,
  EXPERT
}
```

**EASY**:
- Shorter code snippets (5-8 tokens)
- Slower enemy spawn rate (2.5s base)
- Fewer enemy types (only bugs/errors)
- Lower enemy speed (-20%)
- Less damage from enemies (-30%)

**NORMAL** (Default):
- Medium snippets (8-15 tokens)
- Standard spawn rate (2.0s base)
- All enemy types
- Standard speeds and damage

**HARD**:
- Longer snippets (12-20 tokens)
- Faster spawn rate (1.5s base)
- More tough enemies (more crashes/viruses)
- Higher enemy speed (+20%)
- More damage (+30%)

**EXPERT**:
- Complex snippets (15-30 tokens)
- Rapid spawn rate (1.0s base)
- Predominantly tough enemies
- Maximum enemy speed (+50%)
- Maximum damage (+50%)
- Reduced starting health (75)

---

### 7.2 Language Selection

**Supported Languages**:
- Python
- React/JSX
- JavaScript
- TypeScript (future)

**Language Differences**:
- Syntax patterns
- Token complexity
- Average snippet length
- No gameplay advantage (balanced)

**Language Preference**:
- Set at game start
- Stored in user profile (future)
- Can change between games

---

## 8. User Interface & Feedback

### 8.1 HUD Elements

**Top Bar**:
```
┌──────────────────────────────────────────────────┐
│  HP [████████░░] 80/100        WAVE: 5           │
└──────────────────────────────────────────────────┘
```

**Bottom Bar**:
```
┌──────────────────────────────────────────────────┐
│  SCORE: 3,450           12x COMBO!               │
│  WPM: 68  │  ACC: 94%  │  TIME: 05:23           │
└──────────────────────────────────────────────────┘
```

**Snippet Display** (above typing input):
```
┌────────────────────────────────────────┐
│  [for] [i] [in] range ( 10 ):         │ ← Completed tokens (green)
│   ███                                  │ ← Current token (blue highlight)
│      [print] [(] [i] [*] [2] [)]      │ ← Remaining tokens (white)
└────────────────────────────────────────┘
```

---

### 8.2 Visual Effects

#### Particle Systems

**Laser Impact**:
```typescript
// When laser hits enemy
spawnParticles({
  count: 5,
  position: { x: laser.x, y: laser.y },
  color: '#00FF00',
  velocity: random(-2, 2),
  lifetime: 0.5,
  size: 3
});
```

**Enemy Death**:
```typescript
// When enemy destroyed
spawnParticles({
  count: 15,
  position: { x: enemy.x + enemy.width/2, y: enemy.y + enemy.height/2 },
  color: enemy.color,
  velocity: random(-5, 5),
  lifetime: 1.0,
  size: 5,
  gravity: 200
});
```

**Player Damage**:
- Screen shake (3px amplitude, 0.3s duration)
- Red overlay flash (0.2s fade)
- Health bar animation

---

#### Animations

**Typing Feedback**:
- Correct token: Green flash + bounce animation
- Incorrect token: Red flash + shake animation
- Input field: Pulsing border on active

**Enemy Animations**:
- Spawn: Fade in + scale up (0.3s)
- Movement: Gentle rotation (-5° to +5°)
- Damage: Flash white + scale pulse
- Death: Fade out + spin + explode particles

**Combo Effects**:
- Combo text: Scale pulse on increment
- High combo (10+): Rainbow color cycle
- Max combo (20+): Glow effect

---

### 8.3 Audio Design (Future Enhancement)

**Sound Effects**:
- Laser fire: "Pew" sound (high-pitched, short)
- Laser hit: Impact sound (metallic clang)
- Enemy death: Explosion sound (varies by type)
- Correct token: Positive "ding"
- Incorrect token: Negative "buzz"
- Player damage: Bass "thud" + grunt
- Wave complete: Triumphant chord
- Game over: Sad trombone

**Music**:
- Menu: Calm, ambient electronica
- Gameplay: Upbeat, driving electronic music
- Intensity increases with wave number
- Boss waves: Epic orchestral

**Volume Controls**:
- Master volume
- SFX volume
- Music volume
- Separate sliders in settings

---

## 9. Performance Metrics

### 9.1 Real-Time Tracking

**Words Per Minute (WPM)**:
```typescript
// Calculated live during game
currentWPM = (totalWordsTyped / (elapsedTimeSeconds / 60));

// Updated every 5 seconds for smooth display
```

**Accuracy**:
```typescript
accuracy = (correctWords / totalWordsTyped) * 100;

// Displayed as percentage (e.g., 94.5%)
```

**Damage Stats**:
```typescript
damageDealt = sum of all damage to enemies
damageTaken = sum of all damage to player

// Used for final results screen
```

---

### 9.2 End-Game Metrics

Displayed on results screen:

```typescript
interface GameResultMetrics {
  finalScore: number;
  wavesCompleted: number;
  enemiesKilled: number;
  
  // Typing performance
  totalWordsTyped: number;
  correctWords: number;
  incorrectWords: number;
  accuracy: number;           // Percentage
  wordsPerMinute: number;
  
  // Combat performance
  maxCombo: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  
  // Time
  playtimeSeconds: number;
  playtimeFormatted: string;  // "05:23"
  
  // Rankings
  personalBest: boolean;
  globalRank: number | null;  // Future
  percentile: number;         // 0-100
}
```

---

## 10. Game States

### 10.1 State Machine

```typescript
type GameStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';
```

**State Transitions**:
```
idle → loading (user clicks "Start Game")
loading → playing (session data received from backend)
playing ⇄ paused (user presses ESC)
playing → ended (player health = 0)
ended → idle (user clicks "Play Again")
```

**State Behaviors**:

| State   | Game Loop | Input | Enemies | Rendering |
|---------|-----------|-------|---------|-----------|
| idle    | ❌        | ❌    | ❌      | Menu only |
| loading | ❌        | ❌    | ❌      | Spinner   |
| playing | ✅        | ✅    | ✅      | Full      |
| paused  | ❌        | ESC   | ❌      | Frozen    |
| ended   | ❌        | ❌    | ❌      | Results   |

---

### 10.2 Pause Mechanics

**Trigger**:
- ESC key pressed
- Window loses focus (future)
- User clicks pause button

**Behavior**:
- Freeze all game entities (no updates)
- Continue rendering last frame
- Display "PAUSED" overlay
- Show resume/quit options

**Resume**:
- ESC key pressed again
- Click "Resume" button
- 3-2-1 countdown before resuming (future)

---

### 10.3 Game Over

**Trigger**:
- Player health reaches 0

**Sequence**:
1. Stop all game systems
2. Play game over animation
3. Calculate final metrics
4. Send results to backend
5. Wait for response
6. Display results screen
7. Show options: Replay, Dashboard, Quit

**Results Screen Elements**:
- Final score (large, prominent)
- Performance breakdown (WPM, accuracy, etc.)
- Personal best indicator
- Global rank (if available)
- Share button (future)
- Replay button
- Back to dashboard button

---

## 11. Cheat Prevention

### 11.1 Client-Side Validation

**Input Validation**:
- No auto-complete allowed
- No paste functionality
- Must type character-by-character
- Time between keystrokes tracked (future anti-cheat)

**Score Validation**:
- Client calculates score for immediate feedback
- Backend recalculates and validates on game end
- If mismatch > 10%, flag for review

---

### 11.2 Server-Side Verification

**Session Validation**:
```typescript
// Backend checks:
1. session_token matches user_id
2. Session is still active (not already completed)
3. Elapsed time is reasonable (not too fast)
4. Score matches expected range for metrics

// Suspicious activity flags:
- WPM > 150 (humanly possible but rare)
- Accuracy > 99% (possible but suspicious if consistent)
- Score disproportionate to metrics
- Session completed in < 30 seconds
```

**Rate Limiting**:
- Max 10 game sessions per hour per user
- Prevents score farming

---

## 12. Accessibility Features

### 12.1 Visual

**Color Blindness Support** (future):
- Colorblind mode with alternative palettes
- Deuteranopia (red-green)
- Protanopia (red-green)
- Tritanopia (blue-yellow)

**High Contrast Mode**:
- Increased contrast for UI elements
- Larger health bars
- Bolder fonts

**Text Scaling**:
- Adjustable UI text size (80%-150%)
- Snippet text size adjustment

---

### 12.2 Gameplay Assists

**Slow Mode** (future):
- 50% game speed
- Doesn't affect score (separate leaderboard)
- For learning/practice

**Practice Mode** (future):
- No enemies, just typing
- Infinite time
- Focus on accuracy and speed

**Tutorial**:
- Interactive first-time experience
- Explains mechanics step-by-step
- Can replay from settings

---

## 13. Balancing Considerations

### 13.1 Difficulty Curve

**Target Progression**:
- Wave 1: 100% success rate (easy introduction)
- Wave 5: 80% of players reach
- Wave 10: 50% of players reach
- Wave 20: 20% of players reach
- Wave 30+: < 5% of players reach

**Adjustment Levers**:
1. Enemy spawn rate
2. Enemy health/speed
3. Player starting health
4. Snippet complexity
5. Combo multiplier cap

---

### 13.2 Playtesting Targets

**Average Session**:
- Duration: 5-10 minutes
- Waves completed: 5-8
- Final score: 3,000-6,000
- WPM: 40-70
- Accuracy: 85-95%

**Engaged Players**:
- Want to replay to improve score
- Feel "almost made it" on death
- See clear skill progression

**Retention Goals**:
- Day 1: 60% return
- Week 1: 30% return
- Month 1: 15% active

---

## 14. Future Enhancements

### 14.1 Gameplay Additions

**Power-Ups** (collectible mid-game):
- **Rapid Fire**: Double fire rate for 10 seconds
- **Shield**: Block 2 enemy hits
- **Nuke**: Clear all enemies on screen
- **Slow Time**: 50% enemy speed for 15 seconds
- **Health Pack**: Restore 25 health

**Boss Enemies**:
- Appear every 5 waves
- Much larger, higher HP
- Requires completing full snippet to damage
- Special attack patterns
- Bonus rewards on defeat

**Procedural Snippets**:
- Dynamically generated code
- Ensures uniqueness
- Scales to player skill level

---

### 14.2 Meta Progression

**Player Levels**:
- XP earned from games
- Level up unlocks cosmetics
- Prestige system at max level

**Unlockables**:
- Player skins (avatars)
- Laser colors/effects
- Background themes
- Sound packs

**Daily Challenges**:
- "Complete 3 games with Python"
- "Achieve 50+ WPM"
- "Reach wave 15"
- Reward: Bonus XP, currency

**Achievements**:
- "First Blood" - Kill first enemy
- "Speed Demon" - 100 WPM in a game
- "Perfectionist" - 100% accuracy in a game
- "Survivor" - Reach wave 20
- "Combo Master" - 30x combo

---

## 15. Known Issues & Limitations (v1.0)

**Technical Limitations**:
1. Canvas rendering may struggle on low-end devices
2. No mobile support (desktop only)
3. No touch input handling

**Gameplay Limitations**:
1. Single game mode only
2. No multiplayer
3. No save/resume (must complete in one session)
4. Limited snippet pool (50 snippets per language)

**Future Improvements**:
1. Optimize rendering with object pooling
2. Add sprite sheets for better performance
3. Implement WebGL for more effects
4. Mobile-responsive design
5. Cloud save for cross-device play

---

## Document Owner
Game Design Team

**Last Review**: November 22, 2025  
**Next Review**: After alpha testing  
**Playtesting Phase**: Week of December 2, 2025
