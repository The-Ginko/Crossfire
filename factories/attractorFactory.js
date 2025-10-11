console.log('Loading attractorFactory.js');


// src/factories/attractorFactory.js
import {
  CATEGORY_BALL,
  CATEGORY_ATTRACTOR
} from '/src/config/collisionCategories.js';

export function createAttractor(scene, x, y, width, height, effectiveRadius) {
  // A long, thin rectangle down the trough centerline
  const attractor = scene.matter.add.rectangle(x, y, width, height, {
    isStatic: true,
    isSensor: true,
    label: 'attractor',
    collisionFilter: {
      category: CATEGORY_ATTRACTOR,
      mask: CATEGORY_BALL
    }
  });

  // Attach update logic once per world
  if (!scene._hasAttractorUpdate) {
    scene._hasAttractorUpdate = true;

    scene.matter.world.on('beforeUpdate', function () {
      const allBodies = scene.matter.world.localWorld.bodies;

      for (const body of allBodies) {
        if (body.label === 'ball' && body.gameObject?.attracted) {
          const dx = attractor.position.x - body.position.x;
          const dy = attractor.position.y - body.position.y;
          const r2 = dx * dx + dy * dy;

          // Only apply force if within effective radius
          if (r2 < effectiveRadius * effectiveRadius) {
            const r = Math.sqrt(r2) || 1;
            const strength = 0.0005; // tune this
            const fx = (dx / r) * strength;
            const fy = (dy / r) * strength;

            scene.matter.body.applyForce(body, body.position, { x: fx, y: fy });
          }
        }
      }
    });
  }

  return attractor;
}
