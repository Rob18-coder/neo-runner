export type GameControlAction = 'JUMP' | 'DUCK' | 'LEFT' | 'RIGHT' | 'NONE';

export interface Character {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  velocityX: number;
  isJumping: boolean;
  isDucking: boolean;
  score: number;
  coins: number;
  lives: number;
  status: 'alive' | 'hit' | 'gameover';
  hitCooldown: number; // For flickering invulnerability effect
  frame: number;
}

export type ObstacleType = 
  | 'CACTUS_SMALL' 
  | 'CACTUS_LARGE' 
  | 'CACTUS_TRIPLE' 
  | 'PTERODACTYL_HIGH' 
  | 'PTERODACTYL_LOW' 
  | 'COIN' 
  | 'UPGRADE_HEART';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  frame: number;
  collected?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface GroundDecor {
  x: number;
  y: number;
  width: number;
  color: string;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
}

export interface TeachableMachineConfig {
  modelUrl: string;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  classMappings: Record<string, GameControlAction>; // Map class name from model to Game Action
  detectedClass: string;
  confidence: number;
}

export interface KeyboardBindings {
  jump: string[];
  duck: string[];
  left: string[];
  right: string[];
}
