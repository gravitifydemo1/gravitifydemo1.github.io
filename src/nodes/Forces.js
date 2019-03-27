import { Node } from './Node'
const GravitifyApplication = require('../graphics/GravitifyApplication');
import * as Vector2D from './Vector2D'

const globalGameConfig = GravitifyApplication.globalGameConfig;
const TIME_UNIT = GravitifyApplication.TIME_UNIT;

/*
 * interface Force
 *
 * getCasualAcc() - accelaration on object
 */

/**
 * Friction caused b/w universe & node
 */
export class KineticSurfaceFriction {

  /**
   * Constructs a frictional force object that applies
   * on any moving target. The accelaration produced is
   * equal to {@code fk * g * TIME_UNIT^2}
   */
  constructor(target, fk) {
    this.target = target;
    this.acc = -fk * globalGameConfig.g * TIME_UNIT;
  }

  getCasualAcc() {
    const v = this.target.velocity;

    if (this.acc >= Vector2D.getMagnitude(v)) {
      return {
        x: -v.x, y: -v.y
      };
    }

    return {
      x: (v.x != 0) ? Vector2D.getCosineTheta(v) * this.acc : 0,
      y: (v.y != 0) ? Vector2D.getSineTheta(v) * this.acc : 0
    }
  }

}

export class BoostForce {

  constructor(target, boost = 4) {
    this.target = target;
    this.boost = boost;
  }

  getCasualAcc() {
    let dir = (Math.random() - .5) * 2 * Math.PI;
    const target = this.target;

    if (target.velocity.x ==0  && target.velocity.y == 0)
      return {
        x: Math.floor(Math.cos(dir) * this.boost),
        y: Math.floor(Math.sin(dir) * this.boost)
      };
    else
      return {
        x: 0,
        y: 0
      };
  }

}
