/**
 * Handles the dynamics of the 'universe' of nodes.
 */

const GravitifyApplication = require('../graphics/GravitifyApplication');
import { KineticSurfaceFriction, BoostForce } from './Forces'
import { Node }  from './Node'
const NodeDrawer = require('../graphics/NodeDrawer');

import {
  add2D,
  multiplyScalar2D,
  euclideanDistance,
  euclideanDirection,
  inDirection2D,
  dotProduct
} from './Vector2D'

const floor = Math.floor;
const abs = Math.abs;
const globalGameConfig = GravitifyApplication.globalGameConfig;
const pixiApp = GravitifyApplication.pixiApp;

const winWidth = globalGameConfig.width;
const winHeight = globalGameConfig.height;

function pushAndGetArray(array, elem) {

}

/**
 * Returns whether the node displayed at {@code (nodeX, nodeY)}
 * is partially/fully out of the canvas.
 *
 * @param nodeX { Number } x coordinate of top-left corner
 * @param nodeY { Number } y coordinate of top-left corner
 * @param nodeRadius { Number | Node } radius of node or the node
 * @return whether the node has some part out of the canvas
 */
function isOutOfBounds(nodeX, nodeY, nodeRadius) {
  if (typeof nodeRadius == 'object')
    nodeRadius = nodeRadius.metrics.radius;
  else if (nodeRadius === undefined)
    throw "Undefined nodeRadius for isOutOfBounds()";
  const nodeDiameter = nodeRadius * 2;
  return (nodeX < 0) || (nodeY < 0) ||
            (nodeX > winWidth - nodeDiameter) ||
            (nodeY > winHeight - nodeDiameter);
}

function toInBoundsX(nodeX, nodeDiameter) {
  if (nodeX < 0)
    return 0;
  return (nodeX <= winWidth - nodeDiameter) ? nodeX :
            winWidth - nodeDiameter;
}

function toInBoundsY(nodeY, nodeDiameter) {
  if (nodeY < 0)
    return 0;
  return (nodeY <= winHeight - nodeDiameter) ? nodeY :
            winHeight - nodeDiameter;
}

/**
 * Prevents exponential function from continuing forever and
 * creating a never-stopping process. Minute values below .01
 * are zeroed out.
 *
 * rectify should be applied on vector magnitudes like
 * x,y positions/velocity/accelaration.
 */
function rectify(mag) {
  if (floor(abs(mag)) <= .01)
    return 0;
  return mag;
}

/**
 */
function applyDifferentialAsStack(...differentials) {
  for (let i = 1; i < differentials.length; i++) {
    differentials[i].x += differentials[i-1].x;
    differentials[i].y += differentials[i-1].y;
  }
}

/**
 * Applies an elastic impulsive force on the node, when it
 * collides with the nodiversal (canvas) boundary. There is
 * no loss of kinetic energy (speed), only the direction of
 * momentum is changed.
 *
 * It assumes that the magnitude of velocity perpendicular to
 * the boundary is not zero.
 *
 * NOTE: You may ask on which boundary does a node collide if
 * both x & y are out-of-bounds. Well then, it would first
 * collide with the vertical wall, then on the 2nd clock tick,
 * it would collide with the horizontal wall.
 *
 * @param node { Node } the node object which has collided
 *    with the boundary. The actual collision point is
 *    determined by finding the intersection of the line-of-velocity
 *    with the line-of-boundary.
 */
function applyBoundaryImpluse(node) {
  // Finds the actual point-of-collision by finding the
  // intersection of line-of-motion with the boundary.

  let boundaryIndex;// 0 = LEFT, 1 = TOP, 2 = RIGHT, 3 = BOTTOM
  const nodeX = node.getX(), nodeY = node.getY();
  const nodeDiameter = node.metrics.radius * 2;

  if (nodeX < 0)
    boundaryIndex = 0;
  else if (nodeY < 0)
    boundaryIndex = 1;
  else if (nodeX > winWidth - nodeDiameter)
    boundaryIndex = 2;
  else if (nodeY > winHeight - nodeDiameter)
    boundaryIndex = 3;
  else
    throw "applyBoundaryImpluse() called on an node that has not " +
      "collided with the nodiversal boundary @(" + nodeX + ", " + nodeY + ")";
  /**
   * The line-motion can be written as:
   *
   * y - y0    v(y)
   * ------ =  ---- , where v(y) & v(x) are velocities and
   * x - x0    v(x)      x0 & y0 are nodeX and nodeY
   *
   * We can invert the fractions too. With this equation, it
   * it easy to calculate (x,y) where one coordinate is given
   * (by the boundary).
   */

  // (colliX, colliY) is our point-of-collision. We have to
  // change the velocity in the direction perpendicular to the
  // collision by multiplying by -1. We also have to set the
  // position of the node so that the touching point is at
  // (colliX, colliY) and it's not out of bounds.
  let colliX, colliY;

  // Vertical boundary (x = constant)
  if (boundaryIndex % 2 == 0) {
    const boundX = (boundaryIndex == 0) ? 0 : winWidth - nodeDiameter;
    const vYvX_ratio = node.velocity.y / node.velocity.x;

    colliX = boundX;
    colliY = vYvX_ratio*(colliX - nodeX) + nodeY;
    node.velocity.x *= -1;
  } else {
    const boundY = (boundaryIndex == 1) ? 0 : winHeight - nodeDiameter;
    const vXvY_ratio = node.velocity.x / node.velocity.y;

    colliY = boundY;
    colliX = vXvY_ratio*(colliY - nodeY) + nodeX;
    node.velocity.y *= -1;
  }

  node.position.x = toInBoundsX(colliX, nodeDiameter);
  node.position.y = toInBoundsY(colliY, nodeDiameter);
}

/**
 * If dx & dy are given:
 * Translates the node by shifting it by dx in x and
 * dy in y.
 *
 * If dx & dy are not given:
 * Translates the node by its velocity.x & velocity.y
 *
 * However, if the resulting position is out-of-bounds
 * then an boundary-impulse is applied.
 *
 * @param node { Node } translational target
 * @param dx { Number, optional } shift in x
 * @param dy { Number, optional } shift in y
 */
function applyTranslation(node, dx, dy) {
  if (dx == undefined)
    dx = node.velocity.x;
  if (dy == undefined)
    dy = node.velocity.y;

  const newX = rectify(node.getX() + dx);
  const newY = rectify(node.getY() + dy);

  node.position.x = newX;
  node.position.y = newY;

  if (isOutOfBounds(newX, newY, node.metrics.radius)) {
    applyBoundaryImpluse(node, newX, newY);
  }
}

/**
 * The universe of 'nodes', where all nodes are circular entities
 * isolated in the canvas's 2D space.
 *
 * Nodiverse relies on its 'looper' to maintain the state of time
 * and all dependent states (like position & forces). Starting &
 * stopping the looper essentially unpauses & pauses the flow of
 * time in the nodiverse. The looper uses two clocks - the time
 * clock & the animation-rendering clock. The former clock is used
 * to update actual positions of nodes, while on each tick of the
 * animation-rendering clock - the displayed positions are updated.
 *
 * NOTE: The circular disk nature of nodes over-simplifies collision
 * detection.
 *
 * NOTE: Objects in the nodiverse should not go faster than their
 * own size per frame. This can cause collision detection to fail.
 */
class Nodiverse {

  constructor(nodeCount=15) {
    this.nodeCount = nodeCount;
    this.nodes = new Array(nodeCount);

    const step = globalGameConfig.width / nodeCount;
    for (let nIdx = 0; nIdx < nodeCount; nIdx++) {
      let pos = nIdx*step + Math.random()*step;
      let drawingObject = new PIXI.Sprite(NodeDrawer.AirNode.defaultTexture);

      pixiApp.stage.addChild(drawingObject);
      const node = new Node(pos, pos, 26, drawingObject);
      this.nodes[nIdx] = node;

      node.nodeTracker = {
        forces: [  //new KineticSurfaceFriction(node, -1.5),
                  new BoostForce(node) ]
        // just friction & boost (keeping it in motion)
      }
    }

    this.render = this.render.bind(this);
    this.renderRecursive = this.renderRecursive.bind(this);
    this.updateTime = this.updateTime.bind(this);

    this.uiActive = true;
  }

  startLooper() {
    this.updateClock = setInterval(this.updateTime, 1 / GravitifyApplication.TIME_UNIT);
    this.renderRecursive();
  }

  stopLooper() {
    const updateClock = this.updateClock;
    if (updateClock != undefined) {
      clearInterval(updateClock);
    }
  }

  updateTime() {
    this.nodes.forEach(function(node) {
      // Apply force differential
      let netAcc = { x: 0, y: 0 };
      node.nodeTracker.forces.forEach(function(force) {
        const forceAcc = force.getCasualAcc();
        netAcc.x += forceAcc.x;
        netAcc.y += forceAcc.y;
      });
      applyDifferentialAsStack(netAcc, node.velocity);
      if (Math.abs(node.velocity.x) < 1)
        node.velocity.x = 0;
      if (Math.abs(node.velocity.y) < 1)
          node.velocity.y = 0;

      applyTranslation(node);// based on velocity
    });

    this._applyCollisionImpulse();
  }

  render() {
    this.nodes.forEach(function(node) {
      node.renderUpdate();
    });

    pixiApp.render();
  }

  renderRecursive() {
    this.render();

    if (this.uiActive)
      requestAnimationFrame(this.renderRecursive);
  }

  /**
   * Groups all the nodes in this nodiverse, with mutual overlapping.
   *
   * Each node is assigned an {@code nodalGroup} array that stores
   * the node indexes into the {@code node} array with which the node
   * overlaps with.
   */
  _detectCollidedNodes() {
    const nodeCount = this.nodeCount;
    const nodes = this.nodes;
    for (let i = 0; i < nodeCount; i++) {
      if (nodes[i].nodalGroup !== undefined &&
            nodes[i].nodalGroup.length != 1) {
        nodes[i].inOverlapAlready = true;
      } else {
        nodes[i].inOverlapAlready = false;
      }

      nodes[i].nodalGroup = [ nodes[i] ];
      nodes[i].nodalGroup.marked = false;
    }

    for (let i = 0; i < nodeCount; i++) {
      const iNode = nodes[i];
      for (let j = i + 1; j < nodeCount; j++) {
        const jNode = nodes[j];

        if (iNode.isOverlapped(jNode)) {
          let newNodalGroup = iNode.nodalGroup.concat(jNode.nodalGroup);
          iNode.nodalGroup = newNodalGroup;
          jNode.nodalGroup = newNodalGroup;
        }
      }
    }
  }

  /**
   * Applies the impulsive forces on each node.
   */
  _applyCollisionImpulse() {
    this._detectCollidedNodes();
    // Impulse is equal to sum of other nodes' momentum. That's wrong physically
    const nodes = this.nodes;
    const nodeCount = this.nodeCount;

    for (let i = 0; i < nodeCount; i++) {
      nodes[i].originalVelocity = nodes[i].velocity;
    }

    for (let i = 0; i < nodeCount; i++) {
      const node = this.nodes[i];
      const nodalGroup = node.nodalGroup;
      const nodeMomentum = multiplyScalar2D(node.velocity, node.metrics.mass);

      if (nodalGroup.length > 1 && !node.inOverlapAlready) {
        node.velocity = multiplyScalar2D(node.velocity, -1);
      }
    }
  }

}

export default Nodiverse;
