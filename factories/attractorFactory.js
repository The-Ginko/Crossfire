// factories/attractorFactory.js (With dynamic point calculation)
import { CATEGORY_ATTRACTOR, CATEGORY_BALL } from '/src/config/collisionCategories.js';

export function createAttractor(scene, centerX, centerY, chainHeight, effectiveRadius, ballDiameter) {

  // --- DYNAMIC CALCULATION ---
  // Use Math.floor to get a whole number, ensuring at least 2 points for a line.
  const numPoints = Math.max(2, Math.floor(chainHeight / ballDiameter));

  const pointRadius = 10;

  for (let i = 0; i < numPoints; i++) {
    const pointX = centerX;
    // Distribute points evenly along the height. Using (numPoints - 1) ensures the
    // first and last points are at the very ends of the chain.
    const pointY = (centerY - chainHeight / 2) + (chainHeight / (numPoints - 1)) * i;

    scene.matter.add.circle(pointX, pointY, pointRadius, {
      label: 'attractor',
      isStatic: false,
      isSensor: false,
      mass: 10000,
      inverseInertia: 0,
      inverseMass: 0,
      collisionFilter: {
        category: CATEGORY_ATTRACTOR,
        mask: 0
      },
      attractors: [
        function(bodyA, bodyB) {
          // Check if the body's gameObject exists, is flagged as 'attracted',
          // and is either a ball or one of the pucks.
          const isAttractable = bodyB.gameObject?.attracted &&
                                (bodyB.gameObject.isBall ||
                                 bodyB.gameObject.texture?.key === 'starPuck' ||
                                 bodyB.gameObject.texture?.key === 'TrianglePuck');

          if (isAttractable) {
            const distanceSq = Phaser.Math.Distance.Squared(
                bodyA.position.x, bodyA.position.y,
                bodyB.position.x, bodyB.position.y
            );

            if (distanceSq < effectiveRadius * effectiveRadius) {
              const acceleration = 0.001;
              return {
                x: (bodyA.position.x - bodyB.position.x) * acceleration,
                y: (bodyA.position.y - bodyB.position.y) * acceleration
              };
            }
          }
        }
      ]
    });
  }

  return null;
}