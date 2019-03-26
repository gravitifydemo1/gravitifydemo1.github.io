import * as GravitifyApplication from './graphics/GravitifyApplication'
import NodeDrawer from './graphics/NodeDrawer'
import Nodiverse from './nodes/Nodiverse'

window.onload = function() {
  GravitifyApplication.init();
  NodeDrawer.drawInit();

  const nodiverse = new Nodiverse();
  nodiverse.startLooper();
}
