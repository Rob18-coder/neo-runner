import React, { useEffect, useRef, useState } from 'react';
import { Character, Obstacle, Particle, GroundDecor, Cloud, GameControlAction, ObstacleType } from '../types';
import { audio } from '../utils/audio';

// Color map for pixel editing
const COLOR_PALETTE: Record<string, string> = {
  '.': 'transparent',
  'G': '#4ade80', // Dino primary green
  'D': '#166534', // Dino shadow green
  'R': '#ef4444', // Red
  'O': '#f97316', // Orange
  'Y': '#facc15', // Yellow Gold
  'B': '#3b82f6', // Sky Blue
  'K': '#111827', // Black Charcoal
  'W': '#ffffff', // White
  'M': '#9d33d6', // Magenta
  'S': '#9ca3af', // Ground Gray
  'P': '#f472b6', // Pink
  'C': '#06b6d4', // Cyan
  'A': '#b45309', // Cactus Brown / Amber
};

// 16x16 or 16x12 custom pixel art grids
const SPRITES = {
  DINO_RUN1: [
    '....GGGGGG......',
    '....GGGGGGGG....',
    '....GGKKGGGG....',
    '....GGGGGGGG....',
    '....GGGGGGG.....',
    '....GGGGDD......',
    '....GGGGGGGG....',
    'GDGGGGGGGGGG....',
    'GDDGGGGGGGGG....',
    '.GDDGGGGGGGG....',
    '..DGGGGGGGG.....',
    '...DGGGGGGD.....',
    '....GGGGGG......',
    '....GG..GG......',
    '....KK..K.......',
    '....K...........',
  ],
  DINO_RUN2: [
    '....GGGGGG......',
    '....GGGGGGGG....',
    '....GGKKGGGG....',
    '....GGGGGGGG....',
    '....GGGGGGG.....',
    '....GGGGDD......',
    '....GGGGGGGG....',
    'GDGGGGGGGGGG....',
    'GDDGGGGGGGGG....',
    '.GDDGGGGGGGG....',
    '..DGGGGGGGG.....',
    '...DGGGGGGD.....',
    '....GGGGGG......',
    '....G...GG......',
    '....K....KK.....',
    '.........K......',
  ],
  DINO_JUMP: [
    '....GGGGGG......',
    '....GGGGGGGG....',
    '....GGKKGGGG....',
    '....GGGGGGGG....',
    '....GGGGGGG.....',
    '....GGGGDD......',
    '....GGGGGGGG....',
    'GDGGGGGGGGGG....',
    'GDDGGGGGGGGG....',
    '.GDDGGGGGGGG....',
    '..DGGGGGGGG.....',
    '...DGGGGGGD.....',
    '....GGGGGG......',
    '....GG..GG......',
    '....KK..KK......',
    '................',
  ],
  DINO_DUCK1: [
    '................',
    '................',
    '................',
    '................',
    '......GGGGGGGG..',
    '.....GGGGGGGGGG.',
    'GDGGGGGGKKGGGGG.',
    'GDDGGGGGGGGGGGG.',
    '.GDDGGGGGGGGGGG.',
    '..DGGGGGGGDDDDD.',
    '....GGGGGG......',
    '....GG..GG......',
    '....KK..K.......',
    '....K...........',
    '................',
    '................',
  ],
  DINO_DUCK2: [
    '................',
    '................',
    '................',
    '................',
    '......GGGGGGGG..',
    '.....GGGGGGGGGG.',
    'GDGGGGGGKKGGGGG.',
    'GDDGGGGGGGGGGGG.',
    '.GDDGGGGGGGGGGG.',
    '..DGGGGGGGDDDDD.',
    '....GGGGGG......',
    '....G...GG......',
    '....K....KK.....',
    '.........K......',
    '................',
    '................',
  ],
  DINO_DEAD: [
    '....GGGGGG......',
    '....GGGGGGGG....',
    '....GGKKGGGG....',
    '....GGKKGGGG....',
    '.....KKKKKK.....',
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    'KDKKKKKKKKKK....',
    'KDDKKKKKKKKK....',
    '.KDDKKKKKKKK....',
    '..DKKKKKKKK.....',
    '...DKKKKKKDK....',
    '....KKKKKK......',
    '....KK..KK......',
    '....WW..WW......',
    '................',
  ],
  CACTUS_SMALL: [
    '......AA........',
    '......AA........',
    '...AA.AA........',
    '...AA.AA.AA.....',
    '...AA.AA.AA.....',
    '...AAAAAAA......',
    '....AAAAA.......',
    '......AA........',
    '......AA........',
    '......AA........',
    '......AA........',
    '......AA........',
    '......AA........',
    '......AA........',
    '......AA........',
    '......AA........',
  ],
  CACTUS_LARGE: [
    '......AAAA......',
    '......AAAA......',
    '..AA..AAAA......',
    '..AA..AAAA..AA..',
    '..AA..AAAA..AA..',
    '..AAAAAAAAAAAA..',
    '..AAAAAAAAAA....',
    '....AAAAAA......',
    '......AAAA......',
    '......AAAA......',
    '......AAAA......',
    '......AAAA......',
    '......AAAA......',
    '......AAAA......',
    '......AAAA......',
    '......AAAA......',
  ],
  BIRD_WING_UP: [
    '......KK........',
    '.....KKKK.......',
    '....KKWKKO......',
    '..KKKKKKK.......',
    '..KKKKKKKK......',
    '..KKKKKK........',
    '..KKK...........',
    '.KK.............',
    'KK..............',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  BIRD_WING_DOWN: [
    '................',
    '................',
    '................',
    '................',
    '....KKWKKO......',
    '..KKKKKKK.......',
    '..KKKKKKKK......',
    '..KKKKKK........',
    '..KKIK..........',
    '.KKIKK..........',
    'KK.IK...........',
    '..I.............',
    '.I..............',
    '................',
    '................',
    '................',
  ],
  COIN_F1: [
    '.....YYYYYY.....',
    '....YWWWWWWY....',
    '...YWKKKKKWY...',
    '..YWKKYYYYWWY..',
    '..YKKYKKKKYKK..',
    '..YKKYKKKKYKK..',
    '..YKKYKKKKYKK..',
    '..YWKKYYYYWWY..',
    '...YWKWWWWWY...',
    '....YWWWWWWY....',
    '.....YYYYYY.....',
    '................',
  ],
  COIN_F2: [
    '......YYYY......',
    '.....YWWWWY.....',
    '....YWKKKKWY....',
    '...YWKKYYWWY...',
    '...YKKYKKYKK...',
    '...YKKYKKYKK...',
    '...YKKYKKYKK...',
    '...YWKKYYWWY...',
    '....YWKWWWY....',
    '.....YWWWWY.....',
    '......YYYY......',
    '................',
  ],
  COIN_F3: [
    '.......YY.......',
    '......YWWY......',
    '.....YWKKWY.....',
    '....YWKKYWWY....',
    '....YKKYKKYK....',
    '....YKKYKKYK....',
    '....YKKYKKYK....',
    '....YWKKYWWY....',
    '.....YWKWWY.....',
    '......YWWY......',
    '.......YY.......',
    '................',
  ],
  COIN_F4: [
    '.......Y........',
    '.......W........',
    '.......K........',
    '......WK........',
    '......KK........',
    '......KK........',
    '......KK........',
    '......WK........',
    '.......W........',
    '.......Y........',
    '................',
    '................',
  ],
  HEART: [
    '...RR...RR......',
    '..RRRR.RRRR.....',
    '.RRRRRRRRRRR....',
    '.RRRRRRRRRRR....',
    '..RRRRRRRRR.....',
    '...RRRRRRR......',
    '....RRRRR.......',
    '.....RRR........',
    '......R.........',
    '................',
    '................',
    '................',
  ]
};

// Fixed coordinate grid for scalable rendering
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 320;

interface GameCanvasProps {
  teachableAction: GameControlAction;
  onStatsChange: (score: number, coins: number, lives: number, gameOver: boolean) => void;
  gameSpeedMultiplier: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  teachableAction,
  onStatsChange,
  gameSpeedMultiplier,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<number | null>(null);

  // Core Game States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('retro_high_score') || '0');
  });

  // Game loop variables ref to prevent React stale state issues
  const stateRef = useRef<{
    character: Character;
    obstacles: Obstacle[];
    particles: Particle[];
    clouds: Cloud[];
    decorations: GroundDecor[];
    baseSpeed: number;
    currentSpeed: number;
    gameFrame: number;
    lastTime: number;
    screenShake: number;
    isInvulnerable: boolean;
    flashTime: boolean;
    gameOver: boolean;
    unlockedItems: string[];
    teachableActiveTime: Record<GameControlAction, boolean>;
  }>({
    character: {
      x: 100,
      y: GROUND_Y - 48,
      width: 48,
      height: 48,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      isDucking: false,
      score: 0,
      coins: 0,
      lives: 3,
      status: 'alive',
      hitCooldown: 0,
      frame: 0
    },
    obstacles: [],
    particles: [],
    clouds: [
      { x: 200, y: 80, speed: 0.3, width: 80, height: 30 },
      { x: 550, y: 50, speed: 0.25, width: 100, height: 40 },
      { x: 850, y: 90, speed: 0.35, width: 70, height: 25 },
    ],
    decorations: [],
    baseSpeed: 5,
    currentSpeed: 5,
    gameFrame: 0,
    lastTime: 0,
    screenShake: 0,
    isInvulnerable: false,
    flashTime: false,
    gameOver: false,
    unlockedItems: [],
    teachableActiveTime: {
      JUMP: false,
      DUCK: false,
      LEFT: false,
      RIGHT: false,
      NONE: false,
    }
  });

  const [localGameOver, setLocalGameOver] = useState<boolean>(false);
  const [localScore, setLocalScore] = useState<number>(0);
  const [localCoins, setLocalCoins] = useState<number>(0);
  const [localLives, setLocalLives] = useState<number>(3);

  // Initialize Ground decorations
  useEffect(() => {
    const list: GroundDecor[] = [];
    for (let i = 0; i < 30; i++) {
      list.push({
        x: Math.random() * CANVAS_WIDTH,
        y: GROUND_Y + 5 + Math.random() * 60,
        width: 3 + Math.random() * 10,
        color: Math.random() > 0.5 ? '#6b7280' : '#4b5563',
      });
    }
    stateRef.current.decorations = list;
  }, []);

  // Sync teachable command
  useEffect(() => {
    if (!isPlaying || stateRef.current.gameOver) return;

    const char = stateRef.current.character;

    if (teachableAction === 'JUMP') {
      if (!char.isJumping && !char.isDucking) {
        char.velocityY = -15; // JUMP velocity
        char.isJumping = true;
        audio.playJump();
        triggerBurst(char.x + char.width / 2, GROUND_Y, '#93c5fd', 8);
      }
    } else if (teachableAction === 'DUCK') {
      if (!char.isJumping) {
        if (!char.isDucking) {
          audio.playDuck();
        }
        char.isDucking = true;
        char.height = 36;
        char.y = GROUND_Y - 36;
      }
    } else if (teachableAction === 'NONE' || teachableAction === 'LEFT' || teachableAction === 'RIGHT') {
      // Return details
      if (char.isDucking) {
        char.isDucking = false;
        char.height = 48;
        char.y = GROUND_Y - 48;
      }
    }

    if (teachableAction === 'LEFT') {
      char.velocityX = -4;
    } else if (teachableAction === 'RIGHT') {
      char.velocityX = 4;
    } else {
      char.velocityX = 0;
    }

  }, [teachableAction, isPlaying]);

  // Handle local keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const char = stateRef.current.character;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!isPlaying) {
          startGame();
          return;
        }
        if (stateRef.current.gameOver) {
          startGame();
          return;
        }
        if (!char.isJumping && !char.isDucking) {
          char.velocityY = -15;
          char.isJumping = true;
          audio.playJump();
          // Spawn little jump dust particles
          triggerBurst(char.x + char.width/2, GROUND_Y, '#e5e7eb', 8);
        }
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (isPlaying && !char.isJumping) {
          if (!char.isDucking) {
            audio.playDuck();
          }
          char.isDucking = true;
          char.height = 36;
          char.y = GROUND_Y - 36;
        }
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (isPlaying) {
          char.velocityX = -4;
        }
      }

      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (isPlaying) {
          char.velocityX = 4;
        }
      }

      if (e.code === 'KeyR' && stateRef.current.gameOver) {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const char = stateRef.current.character;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (char.isDucking) {
          char.isDucking = false;
          char.height = 48;
          char.y = GROUND_Y - 48;
        }
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'ArrowRight' || e.code === 'KeyD') {
        char.velocityX = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  // Touch interface for mobile accessibility
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartRef.current;
    const char = stateRef.current.character;

    if (diffY < -30) {
      // Swiped Up -> Jump
      if (!char.isJumping && !char.isDucking) {
        char.velocityY = -15;
        char.isJumping = true;
        audio.playJump();
        triggerBurst(char.x + char.width / 2, GROUND_Y, '#ffffff', 8);
      }
      touchStartRef.current = null;
    } else if (diffY > 30) {
      // Swiped Down -> Duck
      if (!char.isJumping && !char.isDucking) {
        char.isDucking = true;
        char.height = 36;
        char.y = GROUND_Y - 36;
        audio.playDuck();
      }
      touchStartRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    const char = stateRef.current.character;
    if (char.isDucking) {
      char.isDucking = false;
      char.height = 48;
      char.y = GROUND_Y - 48;
    }
  };

  // Setup game start
  const startGame = () => {
    audio.playLevelUp();
    stateRef.current.character = {
      x: 100,
      y: GROUND_Y - 48,
      width: 48,
      height: 48,
      velocityY: 0,
      velocityX: 0,
      isJumping: false,
      isDucking: false,
      score: 0,
      coins: 0,
      lives: 3,
      status: 'alive',
      hitCooldown: 0,
      frame: 0
    };
    stateRef.current.obstacles = [];
    stateRef.current.particles = [];
    stateRef.current.baseSpeed = 5;
    stateRef.current.currentSpeed = 5;
    stateRef.current.gameFrame = 0;
    stateRef.current.gameOver = false;
    stateRef.current.screenShake = 0;

    setIsPlaying(true);
    setLocalGameOver(false);
    setLocalScore(0);
    setLocalCoins(0);
    setLocalLives(3);
    onStatsChange(0, 0, 3, false);
  };

  // Particle emitter helper
  const triggerBurst = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      stateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (color === '#f472b6' ? 2 : 0), // Floating up for hearts
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.floor(Math.random() * 20),
      });
    }
  };

  // Custom Sprite Drawing Engine
  const drawSpritePixelArt = (
    ctx: CanvasRenderingContext2D,
    spriteName: keyof typeof SPRITES,
    dx: number,
    dy: number,
    dWidth: number,
    dHeight: number,
    flipHorizontal = false
  ) => {
    const grid = SPRITES[spriteName];
    if (!grid) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const pixelW = dWidth / cols;
    const pixelH = dHeight / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const char = grid[r][c];
        const color = COLOR_PALETTE[char] || 'transparent';

        if (color !== 'transparent') {
          ctx.fillStyle = color;
          // Calculate column coordinate, account for horizontal flip
          const targetCol = flipHorizontal ? cols - 1 - c : c;
          ctx.fillRect(
            Math.floor(dx + targetCol * pixelW),
            Math.floor(dy + r * pixelH),
            Math.ceil(pixelW),
            Math.ceil(pixelH)
          );
        }
      }
    }
  };

  // Main Render/Update Cycle
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate dt
      if (!state.lastTime) state.lastTime = timestamp;
      state.lastTime = timestamp;

      // Update Frame counters
      state.gameFrame++;

      // 1. CLEAR & SHAKE TRANSFORMATION
      ctx.save();
      if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake;
        const shakeY = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(shakeX, shakeY);
        state.screenShake *= 0.9; // Decay shake
        if (state.screenShake < 0.2) state.screenShake = 0;
      }

      // Fill background (gorgeous retro deep indigo night/sunset or sleek space-slate)
      ctx.fillStyle = '#0f172a'; // Deep Navy Cosmic Slate
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw horizontal starry grids (very 8-bit classic neon look)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 100; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Draw moon or 8-bit Neon Sun in upper right
      const sunGradient = ctx.createLinearGradient(850, 40, 850, 140);
      sunGradient.addColorStop(0, '#f43f5e'); // Rose Pink Sunset
      sunGradient.addColorStop(1, '#eab308'); // Yellow Gold
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(850, 90, 45, 0, Math.PI * 2);
      ctx.fill();

      // Sun stripes (classic 8-bit synthwave sun slices)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(790, 92, 120, 4);
      ctx.fillRect(790, 104, 120, 6);
      ctx.fillRect(790, 118, 120, 8);

      // 2. BACKGROUND SCROLLING (Clouds & Space Particles)
      ctx.fillStyle = '#1e293b';
      state.clouds.forEach(cloud => {
        if (isPlaying && !state.gameOver) {
          cloud.x -= cloud.speed * gameSpeedMultiplier;
          if (cloud.x + cloud.width < 0) {
            cloud.x = CANVAS_WIDTH + Math.random() * 200;
            cloud.y = 30 + Math.random() * 100;
          }
        }
        // Render blocky pixel-cloud
        ctx.fillStyle = '#334155';
        ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
        ctx.fillRect(cloud.x + 10, cloud.y - 10, cloud.width - 20, 10);
        ctx.fillRect(cloud.x + 20, cloud.y + cloud.height, cloud.width - 40, 6);
      });

      // 3. DRAW GROUND & DEBRIS
      ctx.fillStyle = '#1e293b'; // ground line zone
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
      ctx.fillStyle = '#4ade80'; // classic neon high-tech moss separator line
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);

      // Scroll Ground debris details
      ctx.fillStyle = '#9ca3af';
      state.decorations.forEach(decor => {
        if (isPlaying && !state.gameOver) {
          decor.x -= state.currentSpeed * gameSpeedMultiplier;
          if (decor.x + decor.width < 0) {
            decor.x = CANVAS_WIDTH + Math.random() * 50;
          }
        }
        ctx.fillStyle = decor.color;
        ctx.fillRect(decor.x, decor.y, decor.width, 2);
      });

      // 4. CHARACTER PHYSICS AND UPDATE
      const char = state.character;
      if (isPlaying && !state.gameOver) {
        // Apply Gravity
        char.velocityY += 0.8; // gravity
        char.y += char.velocityY;

        // Apply Horizontal velocity
        char.x += char.velocityX;
        // Bound horizontally
        if (char.x < 20) char.x = 20;
        if (char.x > CANVAS_WIDTH - 150) char.x = CANVAS_WIDTH - 150;

        // Ground collision
        const activeGroundY = char.isDucking ? GROUND_Y - 36 : GROUND_Y - 48;
        if (char.y >= activeGroundY) {
          char.y = activeGroundY;
          char.velocityY = 0;
          char.isJumping = false;
        }

        // Hit Invulnerability logic
        if (char.hitCooldown > 0) {
          char.hitCooldown--;
        }

        // Dynamic speed rise with score
        state.currentSpeed = (state.baseSpeed + Math.floor(char.score / 350) * 0.7) * gameSpeedMultiplier;

        // Increment Score over time
        if (state.gameFrame % 5 === 0) {
          char.score += 1;
          if (char.score % 200 === 0) {
            audio.playLevelUp();
            // Flashing level-up state
            state.screenShake = 5;
          }
          onStatsChange(char.score, char.coins, char.lives, false);
          setLocalScore(char.score);
        }
      }

      // Draw Dino character (animate legs or change sprite depending on state)
      const animationFrame = Math.floor(state.gameFrame / 6) % 2;
      let targetSprite: keyof typeof SPRITES = 'DINO_RUN1';

      if (state.gameOver) {
        targetSprite = 'DINO_DEAD';
      } else if (char.isJumping) {
        targetSprite = 'DINO_JUMP';
      } else if (char.isDucking) {
        targetSprite = animationFrame === 0 ? 'DINO_DUCK1' : 'DINO_DUCK2';
      } else {
        targetSprite = animationFrame === 0 ? 'DINO_RUN1' : 'DINO_RUN2';
      }

      // Draw Dino character with flickering if hit invulnerable
      const shouldDrawChar = char.hitCooldown === 0 || Math.floor(state.gameFrame / 3) % 2 === 0;
      if (shouldDrawChar) {
        drawSpritePixelArt(
          ctx, 
          targetSprite, 
          char.x, 
          char.y, 
          char.width, 
          char.isDucking ? 36 : 48,
          char.velocityX < 0 // Flip sprite when moving backwards/left
        );
      }

      // 5. OBSTACLES MECHANICS (Spawning & Collision)
      const spawnCooldown = Math.max(70, 150 - Math.floor(char.score / 150) * 8);
      if (isPlaying && !state.gameOver && state.gameFrame % Math.floor(spawnCooldown + Math.random() * 40) === 0) {
        // Spawn obstacles
        const r = Math.random();
        let obsType: ObstacleType = 'CACTUS_SMALL';
        let width = 30;
        let height = 48;
        let obsY = GROUND_Y - height;

        if (char.score > 800 && r < 0.18) {
          obsType = 'PTERODACTYL_LOW'; // Bird (requires duck or high jump)
          width = 44;
          height = 36;
          obsY = GROUND_Y - 34; // Fly low (must duck!)
        } else if (char.score > 400 && r >= 0.18 && r < 0.32) {
          obsType = 'PTERODACTYL_HIGH'; // Bird high (must duck or jump small)
          width = 44;
          height = 36;
          obsY = GROUND_Y - 75; // Fly high (jump high avoids, or stand idle)
        } else if (r >= 0.32 && r < 0.45) {
          obsType = 'CACTUS_LARGE';
          width = 34;
          height = 56;
          obsY = GROUND_Y - height;
        } else if (char.score > 300 && r >= 0.45 && r < 0.55) {
          obsType = 'CACTUS_TRIPLE';
          width = 65;
          height = 42;
          obsY = GROUND_Y - height;
        } else if (r >= 0.55 && r < 0.8) {
          obsType = 'COIN';
          width = 24;
          height = 24;
          obsY = GROUND_Y - 45 - Math.random() * 70; // spawn in mid-air
        } else if (char.lives < 3 && r >= 0.92) {
          obsType = 'UPGRADE_HEART';
          width = 24;
          height = 24;
          obsY = GROUND_Y - 50 - Math.random() * 40;
        } else {
          obsType = 'CACTUS_SMALL';
          width = 24;
          height = 40;
          obsY = GROUND_Y - height;
        }

        state.obstacles.push({
          id: `${state.gameFrame}_${Math.random()}`,
          type: obsType,
          x: CANVAS_WIDTH,
          y: obsY,
          width,
          height,
          speed: state.currentSpeed,
          frame: 0
        });
      }

      // Render & Update obstacles
      state.obstacles.forEach((obs, index) => {
        if (isPlaying && !state.gameOver) {
          obs.x -= obs.speed;
        }

        // Draw obstacle
        let sprite: keyof typeof SPRITES = 'CACTUS_SMALL';
        if (obs.type === 'CACTUS_SMALL') {
          sprite = 'CACTUS_SMALL';
        } else if (obs.type === 'CACTUS_LARGE' || obs.type === 'CACTUS_TRIPLE') {
          sprite = 'CACTUS_LARGE';
        } else if (obs.type === 'PTERODACTYL_LOW' || obs.type === 'PTERODACTYL_HIGH') {
          // flap animation
          const birdFrame = Math.floor(state.gameFrame / 8) % 2;
          sprite = birdFrame === 0 ? 'BIRD_WING_UP' : 'BIRD_WING_DOWN';
        } else if (obs.type === 'COIN') {
          const coinFrame = Math.floor(state.gameFrame / 4) % 4;
          const coinFrames: (keyof typeof SPRITES)[] = ['COIN_F1', 'COIN_F2', 'COIN_F3', 'COIN_F4'];
          sprite = coinFrames[coinFrame];
        } else if (obs.type === 'UPGRADE_HEART') {
          sprite = 'HEART';
        }

        if (!obs.collected) {
          drawSpritePixelArt(ctx, sprite, obs.x, obs.y, obs.width, obs.height);
        }

        // Collision detection
        if (isPlaying && !state.gameOver && !obs.collected) {
          // Bounding box collision checking
          const buffer = 4; // micro-adjust padding for perfect retro hitbox feel
          const isColliding = 
            char.x + buffer < obs.x + obs.width - buffer &&
            char.x + char.width - buffer > obs.x + buffer &&
            char.y + buffer < obs.y + obs.height - buffer &&
            char.y + char.height - buffer > obs.y + buffer;

          if (isColliding) {
            if (obs.type === 'COIN') {
              // Collected Coin!
              obs.collected = true;
              char.coins += 1;
              char.score += 50; // extra points for coin
              audio.playCoin();
              triggerBurst(obs.x + obs.width/2, obs.y + obs.height/2, '#facc15', 8);
              onStatsChange(char.score, char.coins, char.lives, false);
              setLocalCoins(char.coins);
            } else if (obs.type === 'UPGRADE_HEART') {
              obs.collected = true;
              if (char.lives < 3) {
                char.lives += 1;
                setLocalLives(char.lives);
              }
              audio.playLevelUp();
              triggerBurst(obs.x + obs.width/2, obs.y + obs.height/2, '#f472b6', 10);
              onStatsChange(char.score, char.coins, char.lives, false);
            } else {
              // Hit hazardous obstacles (Cactus / Bird)
              if (char.hitCooldown === 0) {
                char.lives -= 1;
                state.screenShake = 12; // intense camera shake callback
                audio.playHit();
                triggerBurst(char.x + char.width/2, char.y + char.height/2, '#fca5a5', 15);
                setLocalLives(char.lives);

                if (char.lives <= 0) {
                  // GAME OVER!
                  state.gameOver = true;
                  setLocalGameOver(true);
                  audio.playGameOver();
                  onStatsChange(char.score, char.coins, 0, true);

                  // Update high score in storage
                  if (char.score > highScore) {
                    setHighScore(char.score);
                    localStorage.setItem('retro_high_score', String(char.score));
                  }
                } else {
                  // Hurt but alive: initiate invulnerability flash
                  char.hitCooldown = 60; // 1 second of invulnerability
                  onStatsChange(char.score, char.coins, char.lives, false);
                }
              }
            }
          }
        }
      });

      // Filter out off-screen or collected obstacles
      state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > -50 && !obs.collected);

      // 6. RENDER PARTICLES BURSTS
      state.particles.forEach((part, index) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life++;
        // Fade effect
        part.alpha = 1 - (part.life / part.maxLife);

        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.alpha;
        ctx.fillRect(part.x, part.y, part.size, part.size);
        ctx.globalAlpha = 1.0;
      });
      // Remove dead particles
      state.particles = state.particles.filter(p => p.life < p.maxLife);

      // 7. PRE-GAME / GAME OVER OVERLAYS
      if (!isPlaying) {
        // Aesthetic transparent overlay
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Blinking Insert Coin title text
        ctx.font = 'bold 24px "Courier New", Courier, monospace';
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('INSERT COIN TO PLAY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.font = '14px "Courier New", Courier, monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('[ PRESS SPACE OR CLICK PLAY GAME TO START ]', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        ctx.fillText('CONTROLS: SPACE/UP = JUMP | DOWN = DUCK | LEFT/RIGHT = ADJUST', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      } else if (state.gameOver) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.font = 'bold 36px "Courier New", Courier, monospace';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);

        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillStyle = '#facc15';
        ctx.fillText(`SCORE: ${Math.floor(char.score)} | COINS: ${char.coins}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

        ctx.font = '14px "Courier New", Courier, monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('PRESS "R" OR CLICK RESTART TO TRY AGAIN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);

  }, [isPlaying, highScore, gameSpeedMultiplier]);

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-xl border-4 border-black/30 bg-[#1e1b4b] shadow-2xl p-3 select-none overflow-hidden">
      {/* Cool CRT Retro scanline aesthetics overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.4)_100%)] z-10"></div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%]"></div>

      {/* Top dashboard */}
      <div className="flex flex-wrap justify-between items-center text-xs font-mono text-indigo-200 border-b border-white/5 pb-2.5 mb-2.5 px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center text-yellow-400 font-bold">
            <span className="inline-block w-2.5 h-2.5 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
            CABINET: ACTIVE
          </span>
          <span>HIGH SCORE: <strong className="text-yellow-400 font-extrabold retro-glow-yellow">{highScore.toString().padStart(6, '0')}</strong></span>
        </div>
        <div className="flex gap-4">
          <span>COINS: <strong className="text-yellow-400 font-bold">{localCoins}</strong></span>
          <span className="flex items-center">
            LIVES:&nbsp;
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="text-rose-500 mr-0.5 text-base transition-transform duration-300">
                {i < localLives ? '♥' : '♡'}
              </span>
            ))}
          </span>
          <span className="bg-black/40 text-yellow-400 border border-white/10 px-1.5 rounded uppercase font-bold tracking-wider animate-pulse">
            Speed: {gameSpeedMultiplier}X
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden bg-[#60a5fa] rounded-lg border-2 border-black/40">
        {/* Canvas element */}
        <canvas
          id="retro-game-stage"
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-auto aspect-[5/2]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {/* Live overlay action cue from teacher machine */}
        {teachableAction !== 'NONE' && (
          <div className="absolute bottom-2 left-2 bg-black/80 border-2 border-yellow-400 rounded px-2.5 py-1 text-[10px] font-mono text-yellow-400 uppercase tracking-widest z-20 shadow-2xl animate-bounce">
            📡 INPUT DIRECTIVE: <strong className="font-black">{teachableAction}</strong>
          </div>
        )}
      </div>

      {/* Retro Arcade buttons panel */}
      <div id="arcade-buttons" className="flex flex-wrap items-center justify-between mt-3.5 gap-2 px-2">
        <div className="flex items-center gap-2">
          {!isPlaying || localGameOver ? (
            <button
              id="btn-play-restart"
              onClick={startGame}
              className="px-6 py-2.5 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-mono font-black text-xs uppercase tracking-wider border-b-4 border-yellow-700 active:border-b-0 cursor-pointer shadow transition-all transform active:translate-y-1 select-none"
            >
              {localGameOver ? '🕹️ RESTART ACTION' : '🚀 INSERT COIN & PLAY'}
            </button>
          ) : (
            <button
              id="btn-quit"
              onClick={() => {
                stateRef.current.gameOver = true;
                setLocalGameOver(true);
                audio.playGameOver();
                onStatsChange(0, 0, 0, true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs border-b-4 border-rose-850 active:border-b-0 cursor-pointer transition-all transform active:translate-y-1 select-none"
            >
              🛑 QUIT GAME
            </button>
          )}

          <div className="flex gap-1.5 ml-2">
            <button
              id="btn-jump"
              onClick={() => {
                const char = stateRef.current.character;
                if (isPlaying && !stateRef.current.gameOver && !char.isJumping && !char.isDucking) {
                  char.velocityY = -15;
                  char.isJumping = true;
                  audio.playJump();
                  triggerBurst(char.x + char.width / 2, GROUND_Y, '#ffffff', 8);
                }
              }}
              className="w-11 h-10 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center font-black font-mono text-xs border-b-4 border-yellow-700 active:border-b-0 active:translate-y-0.5 active:pb-0 shadow transition-all cursor-pointer"
              title="Jump button"
            >
              A
            </button>
            <button
              id="btn-duck"
              onMouseDown={() => {
                const char = stateRef.current.character;
                if (isPlaying && !stateRef.current.gameOver && !char.isJumping) {
                  char.isDucking = true;
                  char.height = 36;
                  char.y = GROUND_Y - 36;
                  audio.playDuck();
                }
              }}
              onMouseUp={() => {
                const char = stateRef.current.character;
                if (char.isDucking) {
                  char.isDucking = false;
                  char.height = 48;
                  char.y = GROUND_Y - 48;
                }
              }}
              onTouchStart={() => {
                const char = stateRef.current.character;
                if (isPlaying && !stateRef.current.gameOver && !char.isJumping) {
                  char.isDucking = true;
                  char.height = 36;
                  char.y = GROUND_Y - 36;
                  audio.playDuck();
                }
              }}
              onTouchEnd={() => {
                const char = stateRef.current.character;
                if (char.isDucking) {
                  char.isDucking = false;
                  char.height = 48;
                  char.y = GROUND_Y - 48;
                }
              }}
              className="w-11 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center font-black font-mono text-xs border-b-4 border-indigo-900 active:border-b-0 active:translate-y-0.5 active:pb-0 shadow transition-all cursor-pointer"
              title="Duck button"
            >
              B
            </button>
          </div>
        </div>

        {/* Local controller details */}
        <div id="arcade-instruction" className="text-xs font-mono text-indigo-300 pr-2">
          <span>SCORE: <strong className="text-yellow-400 font-bold retro-glow-yellow">{Math.floor(localScore).toString().padStart(6, '0')}</strong></span>
        </div>
      </div>
    </div>
  );
};
