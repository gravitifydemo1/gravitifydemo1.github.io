import * as PIXI from 'pixi.js'
const GravitifyApplication = require('./GravitifyApplication');

const BACKGROUND_FILL = 0x7fffd4;
const pixiApp = GravitifyApplication.pixiApp;
const renderer = pixiApp.renderer;

/**
 * Texture that shows an inactive air-node.
 */
export var defaultTexture;

function initDefaultTexture(radius=18) {
  const diameter = 2 * radius;
  let nodeTexture = PIXI.RenderTexture.create(diameter, diameter);
  let nodeGraphics = new PIXI.Graphics();

  nodeGraphics.beginFill(BACKGROUND_FILL);
  nodeGraphics.drawCircle(radius, radius, radius - 5);
  nodeGraphics.endFill();

  nodeGraphics.lineStyle(2, BACKGROUND_FILL);
  nodeGraphics.drawCircle(radius, radius, radius);

  nodeGraphics.position.x = 0;
  nodeGraphics.position.y = 0;

  renderer.render(nodeGraphics, nodeTexture);
  defaultTexture = nodeTexture;
}

export function init() {
  initDefaultTexture();
}
