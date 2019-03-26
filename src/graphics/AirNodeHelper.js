import * as PIXI from 'pixi.js'
const GravitifyApplication = require('./GravitifyApplication');

const BACKGROUND_FILL = 0x7fffd4;
const pixiApp = GravitifyApplication.pixiApp;
const renderer = pixiApp.renderer;

/**
 * Texture that shows an inactive air-node.
 */
export var defaultTexture;

function initDefaultTexture() {
  let nodeTexture = PIXI.RenderTexture.create(52, 52);
  let nodeGraphics = new PIXI.Graphics();

  nodeGraphics.beginFill(BACKGROUND_FILL);
  nodeGraphics.drawCircle(26, 26, 16);
  nodeGraphics.endFill();

  nodeGraphics.lineStyle(4, BACKGROUND_FILL);
  nodeGraphics.drawCircle(26, 26, 20);

  nodeGraphics.position.x = 0;
  nodeGraphics.position.y = 0;

  renderer.render(nodeGraphics, nodeTexture);
  defaultTexture = nodeTexture;
}

export function init() {
  initDefaultTexture();
}
