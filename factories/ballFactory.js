// factories/ballFactory.js (Reverted to Original)
import {
  CATEGORY_BALL,
  CATEGORY_PUCK,
  CATEGORY_ARENA,
  CATEGORY_SENSOR,
  CATEGORY_ATTRACTOR,
  CATEGORY_BEARING,
  CATEGORY_WEDGE,
  CATEGORY_REPULSOR
} from '/src/config/collisionCategories.js';

export function createBall(scene, x, y, textureKey = 'ball0', {
  radius = null,
  frictionAir = 0.01,
  bounce = 0.9
} = {}) {
  const ball = scene.matter.add.sprite(x, y, textureKey);

  ball.setCircle(radius ?? (ball.width / 2));
  ball.setFrictionAir(frictionAir);
  ball.setBounce(bounce);

  ball.isBall = true;
  ball.attracted = false;

  if (ball.body) {
    ball.body.collisionFilter.category = CATEGORY_BALL;
    ball.body.collisionFilter.mask =
      CATEGORY_BALL | CATEGORY_PUCK | CATEGORY_ARENA | CATEGORY_SENSOR | CATEGORY_ATTRACTOR | CATEGORY_BEARING | CATEGORY_WEDGE | CATEGORY_REPULSOR;
  }

  return ball;
}