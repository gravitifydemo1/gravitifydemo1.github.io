/**
 * Handles the dynamics of the 'universe' of nodes.
 */
import * as GravitifyApplication from '../graphics/GravitifyApplication'
import { KineticSurfaceFriction, BoostForce } from './Forces'
import { Node }  from './Node'
const NodeDrawer = require('../graphics/NodeDrawer');
import * as PIXI from 'pixi.js'

import {
  getMagnitude,
  add2D,
  sub2D,
  multiplyScalar2D,
  euclideanDistance,
  euclideanDirection,
  inDirection2D,
  slope,
  dotProduct
} from './Vector2D'

const floor = Math.floor;
const abs = Math.abs;
const globalGameConfig = GravitifyApplication.globalGameConfig;
const pixiApp = GravitifyApplication.pixiApp;
const stateCharts = GravitifyApplication.stateCharts;

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
 * Calculates whether two nodes are expected to collide if their
 * velocities remain approximately linear till their point of
 * collision. It also assumes the particles are overlapping already.
 *
 * This is done by finding the intersection of their linear
 * line-of-motion as: y - y0 = (v.y/v.x) * x + x0 where (x,y)
 * is the variable point. This equation is transformed into
 * line-intercept form: y = m1x+c1 & y = m2x+c2
 *
 * The intersection is: (-[c1-c2]/[m1-m2], [c1m2-c2m1]/[m2-m1])
 *
 * Parametric x equations: x = v.x * t + x0 => t = (x-x0)/v.x
 *
 * If both particles reach the intersection in the future, then
 * the collision is expected.
 */
function isCollisionPending(node1, node2) {
  const s1 = node1.position, s2 = node2.position;
  const v1 = node1.velocity, v2 = node2.velocity;
  const m1 = v1.y / v1.x, m2 = v2.y / v2.x;
  const c1 = s1.x + s1.y, c2 = s2.x + s2.y;
  const r1 = node1.metrics.radius, r2 = node2.metrics.radius;

  if (m1 == m2) {
    return add2D(v1, v2).x === 0;
  }

  const pm = -1 / slope(s1, s2);
  const midx = (s1.x+s2.x) / 2, midy = (s1.y+s2.y) / 2;
  const c = (midy-pm*midx);
  const upperNodeIs1 = ((s1.x*pm) - s1.y + c) > 0;
  const upperNodeIs2 = ((s2.x*pm) - s2.y + c) > 0;
  if (upperNodeIs1 === upperNodeIs2) {
    throw "logic error";
  }

  const upperNode = (upperNodeIs1) ? node1 : node2;
  const lowerNode = (upperNodeIs1) ? node2 : node1;
  if (!((upperNode.velocity.y/upperNode.velocity.x) < pm) &&
    !((lowerNode.velocity.y/lowerNode.velocity.x)) > pm) {
    return false;
  }

  const x = -(c1-c2)/(m1-m2);

  const t1 = (x - s1.x) / v1.x;
  const t2 = (x - s2.x) / v2.x;

  if (t1 === Math.NaN || t2 === Math.NaN)
    return false;
  if (Math.abs(t1)*getMagnitude(v1) < node1.metrics.radius*2 ||
      Math.abs(t2)*getMagnitude(v2) < node2.metrics.radius*2)
    return false;
  console.log("Collision pending");
  return true;
}

function applyCollisionToResult(node1, node2) {
  const m1 = node1.metrics.mass, m2 = node2.metrics.mass;
  const ux1 = node1.originalVelocity.x, ux2 = node2.originalVelocity.x;
  const uy1 = node1.originalVelocity.y, uy2 = node2.originalVelocity.y;

  return {// v1
    x: ((m1-m2)*ux1 + 2*m2*ux2) / (m1+m2),
    y: ((m1-m2)*uy1 + 2*m2*uy2) / (m1+m2)
  };
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
      const node = new Node(pos, pos, 18, drawingObject);
      this.nodes[nIdx] = node;

      node.nodeTracker = {
        forces: [  //new KineticSurfaceFriction(node, .1),
                  new BoostForce(node)
                ]
        // just friction & boost (keeping it in motion)
      }
      node.oldNodalGroup = [];
      node.id = nIdx;
    }

    this.render = this.render.bind(this);
    this.renderRecursive = this.renderRecursive.bind(this);
    this.updateTime = this.updateTime.bind(this);

    this.uiActive = true;
  }

  startLooper() {
    this.clock = 0;
    this.updateClock = setInterval(this.updateTime, 1000 * GravitifyApplication.TIME_UNIT);
    this.renderRecursive();
  }

  stopLooper() {
    const updateClock = this.updateClock;
    if (updateClock != undefined) {
      clearInterval(updateClock);
    }
  }

  updateTime() {
    ++this.clock;
    const nodes = this.nodes;
    nodes.forEach(function(node) {
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

    if (this.clock % 20 != 0) {
      return;
    }
    let psum = {x:0,y:0};
    let ksum = 0;
    for (let i =0; i < this.nodes.length; i++) {
      const n = nodes[i];
      let vm = getMagnitude(n.velocity);
      let m = n.metrics.mass;
      psum = add2D(psum, n.velocity);
      ksum += 0.5 * m * vm * vm;
    }
    stateCharts[0].addData(getMagnitude(psum));
    stateCharts[1].addData(ksum);
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
      nodes[i].nodalGroup = [ ];
    }

    for (let i = 0; i < nodeCount; i++) {
      const iNode = nodes[i];
      for (let j = i + 1; j < nodeCount; j++) {
        const jNode = nodes[j];

        if (iNode.isOverlapped(jNode)) {
          iNode.nodalGroup.push(jNode);
          jNode.nodalGroup.push(iNode);
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
      if (nodes[i].nodalGroup.length > 0) {
        nodes[i].velocity = {x:0, y:0};
        nodes[i].clusterDistance = [];
      }
    }

    for (let i = 0; i < nodeCount; i++) {
      const node = this.nodes[i];
      const nodalGroup = node.nodalGroup;
      const nodeMomentum = multiplyScalar2D(node.velocity, node.metrics.mass);

      if (nodalGroup.length > 0)
        for (let j = 0; j < nodalGroup.length; j++) {
          node.clusterDistance[nodalGroup[j].id] = euclideanDistance(node.position, nodalGroup[j].position);
          if (node.oldNodalGroup.includes(nodalGroup[j]) &&
            node.clusterDistance[nodalGroup[j].id] > node.oldClusterDistance[nodalGroup[j].id])
            continue;

          let dv = applyCollisionToResult(node, nodalGroup[j]);
          node.velocity = add2D(node.velocity, multiplyScalar2D(dv, 1 / nodalGroup.length));
        }
    }

    for (let i = 0; i < nodeCount; i++) {
      this.nodes[i].oldNodalGroup = this.nodes[i].nodalGroup;
      this.nodes[i].oldClusterDistance = this.nodes[i].clusterDistance;
      this.nodes[i].velocity.x = Math.min(this.nodes[i].velocity.x, this.nodes[i].metrics.radius * 2);
      this.nodes[i].velocity.y = Math.min(this.nodes[i].velocity.y, this.nodes[i].metrics.radius * 2);
    }
  }

}

export default Nodiverse;
