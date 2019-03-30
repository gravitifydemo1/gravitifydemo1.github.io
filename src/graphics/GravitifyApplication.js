/**
 * Initializes the PIXI application and inserts the canavas
 * element into the DOM.
 */

import { ChartIO } from '../data/ChartIO'
import { EXP_MAF, AveragedChartIO } from '../data/AveragedChartIO'
import * as PIXI from 'pixi.js'

export const TIME_UNIT = 10/1000;
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

export const stateCharts = [
  new ChartIO(64, 'gravitify-momentum-graph', 'Net momentum'),
  new AveragedChartIO(64, 'gravitify-kinetic-energy-graph', 'Net K.E.', EXP_MAF(0.5))
];

export function init() {
  pixiApp.renderer.backgroundColor = 0xFFFFFF;
  document.getElementById('gravitify-canvas-container')
    .appendChild(pixiApp.view);
}
