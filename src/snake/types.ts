// Game types and interfaces

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface State {
  snake: Position[];
  apple: Position;
  direction: Direction;
  score: number;
  gameOver: boolean;
  speed: number; // ms between ticks
}

export type Action = 
  | { type: 'TURN_LEFT' }
  | { type: 'TURN_RIGHT' }
  | { type: 'TURN_UP' }
  | { type: 'TURN_DOWN' }
  | { type: 'TICK' }
  | { type: 'EAT_APPLE' }
  | { type: 'COLLIDE_BOUNDARY' }
  | { type: 'COLLIDE_SELF' }
  | { type: 'SPEED_UP' }
  | { type: 'SPEED_DOWN' }
  | { type: 'RESTART' };
  