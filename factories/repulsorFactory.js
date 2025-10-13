// factories/repulsorFactory.js (Final Version Based on Sanity Check)

import { CATEGORY_BALL, CATEGORY_PUCK } from '/src/config/collisionCategories.js';

const CATEGORY_REPULSOR = 0x0080;

export function createRepulsor(scene, x, y, radius, troughAttractorRange) {

    const repulsor = scene.matter.add.circle(x, y, radius, {
        label: 'repulsor',
        isStatic: false, // Must be dynamic, just like the working example
        isSensor: false,

        // The proven non-collision method
        collisionFilter: {
            category: CATEGORY_REPULSOR,
            mask: 0
        },

        // The correct top-level property with our asymmetrical logic
        attractors: [
            function(bodyA, bodyB) {
                // bodyA is the repulsor, bodyB is the other body
                const distanceSq = Phaser.Math.Distance.Squared(
                    bodyA.position.x, bodyA.position.y,
                    bodyB.position.x, bodyB.position.y
                );

                // Only apply force within the defined range
                if (distanceSq < radius * radius) {
                    let acceleration = 0;

                    if (bodyB.gameObject?.isBall && bodyB.gameObject?.attracted) {
                        acceleration = -0.002;
                    } else if (bodyB.gameObject?.isBall) {
                        acceleration = -0.0001;
                    } else if (bodyB.gameObject?.body?.label.startsWith('puck')) {
                        acceleration = -0.00005;
                    }

                    if (acceleration !== 0) {
                        return {
                            x: (bodyA.position.x - bodyB.position.x) * acceleration,
                            y: (bodyA.position.y - bodyB.position.y) * acceleration
                        };
                    }
                }
            }
        ]
    });

    return repulsor;
}