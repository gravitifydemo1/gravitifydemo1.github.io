export function getMagnitude(v) {
  return Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2));
}

export function getCosineTheta(v) {
  return v.x / getMagnitude(v);
}

export function getSineTheta(v) {
  return v.y / getMagnitude(v);
}

export function getTheta(v) {
  return Math.atan(v.y/v.x);
}

export function euclideanDirection(x1,y1, x2,y2) {
  if (arguments.length === 2) {
    return euclideanDirection(x1.x, x1.y, y1.x, y1.y);
  }
  const slope = (y2-y1)/(x2-x1);

  if (x2 > x1) {
    return Math.atan(slope);
  } else {
    return Math.atan(slope) + Math.PI;
  }
}

export function euclideanDistance(x1,y1, x2,y2) {
  if (arguments.length === 2) {
    return euclideanDistance(x1.x, x1.y, y1.x, y1.y);
  }

  return Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
}

export function add2D(v1, v2) {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
}

export function multiplyScalar2D(v, k) {
  return {
    x: v.x * k,
    y: v.y * k
  };
}

export function unitVector(v) {
  const m = getMagnitude(v);
  return {
    x: v.x / m,
    y: v.y / m
  };
}

export function inDirection2D(v, o) {
  const m = (typeof v == 'object') ? getMagnitude(v) : v;
  return {
    x: Math.cos(o) * m,
    y: Math.sin(o) * m
  };
}

export function dotProduct(v1, v2) {
  return v1.x*v2.x + v1.y*v2.y;
}
