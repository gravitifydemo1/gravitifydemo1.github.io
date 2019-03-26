/**
 * A Gravitifiy node is an object floating in the canvas that
 * experiences mututal forces from other nodes.
 */
const GravitifyApplication = require('../graphics/GravitifyApplication');
const PIXI = require('pixi.js');
import { euclideanDistance } from './Vector2D'

const DEFAULT_DENSITY = 2;
const PI = Math.PI;

const defaultClipWidth = GravitifyApplication.globalGameConfig.width;
const defaultClipHeight = GravitifyApplication.globalGameConfig.height;

export class Node {

  constructor(initX, initY, radius, drawingObject, density=DEFAULT_DENSITY) {
    this.position = {
      x: initX,
      y: initY
    };

    this.velocity = {
      x: 0,
      y: 0
    }

    this.metrics = {
      density: density,
      mass: PI * radius * radius * density,
      radius: radius
    };

    this.drawingObject = drawingObject;
  }

  getX() {
    return this.position.x;
  }

  getY() {
    return this.position.y;
  }

  setX(newX) {
    this.position.x = newX;
  }

  setY(newY) {
    this.position.y = newY;
  }

  renderUpdate() {
    this.drawingObject.position.x = this.position.x;
    this.drawingObject.position.y = this.position.y;
  }

  /**
   * Returns whether the node {@code other} overlaps with this
   * node (with both having circular disk nature).
   *
   * @param other { Node } node to test for overlapping
   * @return { boolean } whether this & other overlap
   */
  isOverlapped(other) {
    const tRadius = this.metrics.radius, oRadius = other.metrics.radius;
    const tCenterX = this.getX() + tRadius, tCenterY = this.getY() + tRadius;
    const oCenterX = other.getX() + oRadius, oCenterY = other.getY() + oRadius;

    return (tRadius + oRadius) >
      euclideanDistance(tCenterX, tCenterY, oCenterX, oCenterY);
  }

}
