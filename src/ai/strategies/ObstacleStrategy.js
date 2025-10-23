/**
 * src/ai/strategies/ObstacleStrategy.js
 *
 * Contains the logic for how an AI checks for line of sight (LOS).
 */
import { CATEGORY_ARENA, CATEGORY_PUCK, CATEGORY_BEARING, CATEGORY_WEDGE } from '/src/config/collisionCategories.js';

// Base class (Interface)
class ObstacleStrategy {
    constructor(scene, launcher, profile) {
        this.scene = scene;
        this.launcher = launcher;
        this.profile = profile.aiming; // 'checkLineOfSight' is in the aiming block
    }

    /**
     * Checks if the path to the target is clear.
     * @param {Phaser.GameObjects.Image} targetBearing - The bearing being aimed at.
     * @param {Phaser.GameObjects.Image} targetPuck - The puck body (star/tri) associated with the bearing.
     * @returns {boolean} True if the path is clear, false otherwise.
     */
    isPathClear(targetBearing, targetPuck) {
        // Default implementation does no check
        return true;
    }
}

// Strategy 1: Does not perform any checks.
export class NoCheckObstacle extends ObstacleStrategy {
    constructor(scene, launcher, profile) {
        super(scene, launcher, profile);
    }

    // Always returns true, the path is always "clear"
    isPathClear(targetBearing, targetPuck) {
        return true;
    }
}

// Strategy 2: Performs a raycast to check for blocking objects.
export class RaycastObstacle extends ObstacleStrategy {
    constructor(scene, launcher, profile) {
        super(scene, launcher, profile);
        this.opponentGoalLabel = this.launcher.side === 'left' ? 'goal_right' : 'goal_left';
        
        // Define what this strategy considers an "obstacle"
        // This is the key: it includes other pucks/bearings and the arena.
        this.obstacleCategories = CATEGORY_ARENA | CATEGORY_WEDGE;
    }

    isPathClear(targetBearing, targetPuck) {
        const launcherPos = this.launcher.getExitPoint(); // Ray starts from the nose
        const targetPos = targetBearing.body.position;
        const targetBearingBodyId = targetBearing.body.id;
        const targetPuckBodyId = targetPuck.body.id;

        const bodiesInPath = Phaser.Physics.Matter.Matter.Query.ray(
            this.scene.matter.world.getAllBodies(),
            launcherPos,
            targetPos,
            1 // rayWidth = 1 (a thin ray)
        );

        if (bodiesInPath.length > 0) {
            for (const hit of bodiesInPath) {
                const hitBody = hit.body;
                const hitBodyId = hitBody.id;
                const hitLabel = hitBody.label || 'unknown';

                // --- IGNORE SELF & TARGET ---
                
                // 1. Ignore the opponent's goal sensor
                if (hitBody.label === this.opponentGoalLabel) {
                    continue;
                }

                // 2. Ignore the bearing we are aiming at
                if (hitBodyId === targetBearingBodyId) {
                    continue;
                }
                
                // 3. Ignore the puck body associated with that bearing
                if (hitBodyId === targetPuckBodyId) {
                    continue;
                }

                // --- CHECK FOR OBSTACLES ---
                // Check if the hit body is in our obstacle list
                if ((hitBody.collisionFilter.category & this.obstacleCategories) !== 0) {
                    // It's an arena wall, wedge, or *another* puck/bearing.
                    // The path is blocked.
                    return false;
                }
            }
        }

        // We hit nothing, or only hit things we can ignore. Path is clear.
        return true;
    }
}
