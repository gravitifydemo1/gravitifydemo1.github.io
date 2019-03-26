const AirNodeHelper = require('./AirNodeHelper');
const GravitifyApplication = require('./GravitifyApplication');
const PIXI = require('pixi.js');

const pixiApp = GravitifyApplication.pixiApp;
const renderer = pixiApp.renderer;
const stage = pixiApp.stage;
const Sprite = PIXI.Sprite;

const airNodes = [];

module.exports =  {

  drawInit: function() {
    AirNodeHelper.init();
  },
  AirNode: AirNodeHelper

}
