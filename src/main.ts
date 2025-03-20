import { setupInputHandlers, render, restart } from './snake/game';

(() => {
  // Initialize the Snake game in functional programming style
  setupInputHandlers();
  render();
  restart();
  
  console.log('Snake Game initialized with RxJS');
})();
