/**
 * Initializes the PIXI application and inserts the canavas
 * element into the DOM.
 */

import * as PIXI from 'pixi.js'

export const TIME_UNIT = 30/1000;
export const globalGameConfig = {
  height: 512,
  width: 512,
  g: 10
};

export const pixiApp = new PIXI.Application({
  alpha: 0xFF,
  antialias: true,
  height: globalGameConfig.height,
  width: globalGameConfig.width
});

export function init() {
  pixiApp.renderer.backgroundColor = 0xFFFFFF;
  document.getElementById('gravitify-canvas-container')
    .appendChild(pixiApp.view);
}
