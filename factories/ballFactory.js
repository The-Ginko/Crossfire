console.log('Loading ballFactory.js');


// src/factories/ballFactory.js
import {
  CATEGORY_BALL,
  CATEGORY_PUCK,
  CATEGORY_ARENA,
  CATEGORY_SENSOR,
  CATEGORY_ATTRACTOR,
  CATEGORY_BEARING,
  CATEGORY_WEDGE  
} from '/src/config/collisionCategories.js';

//debugging console logs at the top of all the factories report here
import * as categories from '/src/config/collisionCategories.js';
console.log('Categories seen by ballFactory:', categories);


export function createBall(scene, x, y, textureKey = 'ball0', {
  radius = null,
  frictionAir = 0.01,
  bounce = 0.9
} = {}) {
  const ball = scene.matter.add.sprite(x, y, textureKey);

  // Geometry/physics
  ball.setCircle(radius ?? (ball.width / 2));
  ball.setFrictionAir(frictionAir);
  ball.setBounce(bounce);

  // Flags for trough/attractor system
  ball.isBall = true;
  ball.attracted = false;

  // Collision filtering: category + mask
  if (ball.body) {
    ball.body.collisionFilter.category = CATEGORY_BALL;
    ball.body.collisionFilter.mask =
      CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_ATTRACTOR | CATEGORY_BEARING | CATEGORY_WEDGE;
  }

  return ball;
}

// Optional helper for lifecycle reuse
export function resetBallForRecycle(ball) {
  ball.attracted = false;
  if (ball.body) {
    ball.body.collisionFilter.category = CATEGORY_BALL;
    ball.body.collisionFilter.mask =
      CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_ATTRACTOR;
  }
}
