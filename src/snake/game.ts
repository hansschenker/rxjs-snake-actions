import { BehaviorSubject, fromEvent, interval, Subject } from "rxjs";
import {
  filter,
  map,
  scan,
  share,
  startWith,
  withLatestFrom,
} from "rxjs/operators";

import { Action, State } from "./types";
import { createInitialState, generateApplePosition } from "../snake/functions";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GRID_SIZE,
  MIN_SPEED,
  MAX_SPEED,
} from "../snake/constants";

// let canvasElm: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let actions$: BehaviorSubject<Action> = new BehaviorSubject<Action>({
  type: "RESTART",
});
let state$: BehaviorSubject<State> = new BehaviorSubject(createInitialState());
let tickSubject$: Subject<number>;
let tickSubscription: any;

// Set up canvas
const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
ctx = canvas.getContext("2d")!;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// actions$ = new Subject<Action>();
tickSubject$ = new Subject<number>();

// Listen for speed changes and adjust the tick interval
state$
  .pipe(
    map((state) => state.speed),
    filter((speed) => !isNaN(speed) && speed > 0)
  )
  .subscribe((speed) => {
    // Unsubscribe from existing tick subscription if any
    if (tickSubscription) {
      tickSubscription.unsubscribe();
    }

    // Create new interval based on updated speed
    tickSubscription = interval(speed).subscribe(() => {
      tickSubject$.next(Date.now());
    });
  });

// Process tick events
tickSubject$
  .pipe(
    withLatestFrom(state$),
    filter(([_, state]) => !state.gameOver)
  )
  .subscribe(() => {
    actions$.next({ type: "TICK" });
  });

const gameReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "TURN_LEFT":
      // Prevent 180 degree turns
      return state.direction === "RIGHT"
        ? state
        : { ...state, direction: "LEFT" };

    case "TURN_RIGHT":
      return state.direction === "LEFT"
        ? state
        : { ...state, direction: "RIGHT" };

    case "TURN_UP":
      return state.direction === "DOWN" ? state : { ...state, direction: "UP" };

    case "TURN_DOWN":
      return state.direction === "UP" ? state : { ...state, direction: "DOWN" };

    case "TICK":
      if (state.gameOver) {
        return state;
      }

      // Get current head position
      const head = state.snake[0];

      // Calculate new head position based on direction
      const newHead: { x: number; y: number } = { ...head };
      switch (state.direction) {
        case "LEFT":
          newHead.x -= GRID_SIZE;
          break;
        case "RIGHT":
          newHead.x += GRID_SIZE;
          break;
        case "UP":
          newHead.y -= GRID_SIZE;
          break;
        case "DOWN":
          newHead.y += GRID_SIZE;
          break;
      }

      // Check for collisions
      if (
        // Boundary collision
        newHead.x < 0 ||
        newHead.x >= GAME_WIDTH ||
        newHead.y < 0 ||
        newHead.y >= GAME_HEIGHT ||
        // Self collision (skip the tail since it will move)
        state.snake
          .slice(0, -1)
          .some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        return { ...state, gameOver: true };
      }

      // Check if snake eats the apple
      const eatsApple =
        newHead.x === state.apple.x && newHead.y === state.apple.y;

      // Create new snake: add new head at the beginning
      const newSnake = [newHead, ...state.snake];

      // If not eating an apple, remove the tail; otherwise keep it to grow
      if (!eatsApple) {
        newSnake.pop();
      }

      return {
        ...state,
        snake: newSnake,
        // Generate new apple position if the current one was eaten
        apple: eatsApple ? generateApplePosition(newSnake) : state.apple,
        // Increase score if apple was eaten
        score: eatsApple ? state.score + 10 : state.score,
      };

    case "EAT_APPLE":
      // This action is merged into the TICK action handler
      return state;

    case "COLLIDE_BOUNDARY":
    case "COLLIDE_SELF":
      // These actions are merged into the TICK action handler
      return { ...state, gameOver: true };

    case "SPEED_UP":
      // Increase speed by decreasing the interval between ticks
      return {
        ...state,
        speed: Math.max(MIN_SPEED, state.speed - 10), // Minimum speed limit
      };

    case "SPEED_DOWN":
      // Decrease speed by increasing the interval between ticks
      return {
        ...state,
        speed: Math.min(MAX_SPEED, state.speed + 10), // Maximum speed limit
      };

    case "RESTART":
      // If there's an active tick subscription, unsubscribe
      if (tickSubscription) {
        tickSubscription.unsubscribe();
      }
      return createInitialState();

    default:
      return state;
  }
};

actions$.pipe(
  startWith({ type: "RESTART" } as Action),
  scan(gameReducer, createInitialState()),
  share()
);

// Set up the game loop
actions$
  .pipe(
    startWith({ type: "RESTART" } as Action),
    scan(gameReducer, createInitialState()),
    share()
  )
  .subscribe((state) => state$.next(state));

// Set up input handling
setupInputHandlers();

// Start rendering
render();

/**
 * Game state reducer - handles all game actions
 */

/**
 * Sets up keyboard and button input handlers
 */
export function setupInputHandlers(): void {
  // Keyboard controls
  fromEvent<KeyboardEvent>(document, "keydown")
    .pipe(
      filter((event) => {
        // Prevent default browser behavior for arrow keys
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
            event.key
          )
        ) {
          event.preventDefault();
        }
        return true;
      }),
      map((event) => {
        switch (event.key) {
          case "ArrowLeft":
            return { type: "TURN_LEFT" } as Action;
          case "ArrowRight":
            return { type: "TURN_RIGHT" } as Action;
          case "ArrowUp":
            return { type: "TURN_UP" } as Action;
          case "ArrowDown":
            return { type: "TURN_DOWN" } as Action;
          case "+":
            return { type: "SPEED_UP" } as Action;
          case "-":
            return { type: "SPEED_DOWN" } as Action;
          case "r":
          case "R":
            return { type: "RESTART" } as Action;
          default:
            return null;
        }
      }),
      filter((action): action is Action => action !== null)
    )
    .subscribe((action) => actions$.next(action));

  // Button controls
  const buttonIds = {
    "btn-left": "TURN_LEFT",
    "btn-right": "TURN_RIGHT",
    "btn-up": "TURN_UP",
    "btn-down": "TURN_DOWN",
    "btn-faster": "SPEED_UP",
    "btn-slower": "SPEED_DOWN",
    "btn-restart": "RESTART",
  };

  Object.entries(buttonIds).forEach(([id, actionType]) => {
    const button = document.getElementById(id);
    if (button) {
      fromEvent(button, "click").subscribe(() => {
        actions$.next({ type: actionType } as Action);
      });
    }
  });
}

/**
 * Sets up the dynamic game loop based on current speed
 */

/**
 * Renders the game state to the canvas
 */
export function render(): void {
  // Subscribe to state changes and render the game
  state$.subscribe((state) => {
    // Clear the canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw grid lines for visual reference
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 0.5;

    // Vertical grid lines
    for (let x = 0; x <= GAME_WIDTH; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y <= GAME_HEIGHT; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // Draw the snake
    state.snake.forEach((segment, index) => {
      // Make the head a different color
      if (index === 0) {
        ctx.fillStyle = "#00CC00"; // Head color
      } else {
        // Gradient from green to darker green for the body
        const greenValue = Math.max(100, 255 - index * 10);
        ctx.fillStyle = `rgb(0, ${greenValue}, 0)`;
      }
      ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);

      // Add a border to each segment
      ctx.strokeStyle = "#002200";
      ctx.lineWidth = 1;
      ctx.strokeRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE);
    });

    // Draw the apple
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.arc(
      state.apple.x + GRID_SIZE / 2,
      state.apple.y + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add a small stem to the apple
    ctx.fillStyle = "#663300";
    ctx.fillRect(state.apple.x + GRID_SIZE / 2 - 1, state.apple.y - 2, 2, 5);

    // Draw score
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${state.score}`, 10, 30);

    // Draw speed
    ctx.fillText(`Speed: ${Math.round(1000 / state.speed)}`, 10, 60);

    // Draw game over message
    if (state.gameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
      ctx.fillText(
        `Final Score: ${state.score}`,
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 10
      );
      ctx.font = "20px Arial";
      ctx.fillText("Press R to restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }
  });
}

// Public methods to manually trigger actions
export const turnLeft = (): void => {
  actions$.next({ type: "TURN_LEFT" });
};

export const turnRight = (): void => {
  actions$.next({ type: "TURN_RIGHT" });
};

export const turnUp = (): void => {
  actions$.next({ type: "TURN_UP" });
};

export const turnDown = (): void => {
  actions$.next({ type: "TURN_DOWN" });
};

export const speedUp = (): void => {
  actions$.next({ type: "SPEED_UP" });
};

export const speedDown = (): void => {
  actions$.next({ type: "SPEED_DOWN" });
};

export const restart = (): void => {
  actions$.next({ type: "RESTART" });
};

export const getGameControls = () => {
  return { turnLeft, turnRight, turnUp, turnDown, speedUp, speedDown, restart };
};
