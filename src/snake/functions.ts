import { State, Position } from '../snake/types';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  GRID_SIZE, 
  INITIAL_SNAKE_LENGTH,
  INITIAL_SPEED 
} from '../snake/constants';

/**
 * Creates the initial game state
 */
export const createInitialState = (): State => {
  // Start with a snake of INITIAL_SNAKE_LENGTH segments at the center
  const centerX = Math.floor(GAME_WIDTH / GRID_SIZE / 2) * GRID_SIZE;
  const centerY = Math.floor(GAME_HEIGHT / GRID_SIZE / 2) * GRID_SIZE;
  
  const snake: Position[] = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: centerX - i * GRID_SIZE, y: centerY });
  }

  return {
    snake,
    apple: generateApplePosition(snake),
    direction: 'RIGHT',
    score: 0,
    gameOver: false,
    speed: INITIAL_SPEED
  };
};

/**
 * Generates a random position for the apple that doesn't overlap with the snake
 */
export const generateApplePosition = (snake: Position[]): Position => {
  const maxX = GAME_WIDTH / GRID_SIZE;
  const maxY = GAME_HEIGHT / GRID_SIZE;
  
  let newPosition: Position;
  do {
    newPosition = {
      x: Math.floor(Math.random() * maxX) * GRID_SIZE,
      y: Math.floor(Math.random() * maxY) * GRID_SIZE
    };
  } while (snake.some(segment => segment.x === newPosition.x && segment.y === newPosition.y));
  
  return newPosition;
};
