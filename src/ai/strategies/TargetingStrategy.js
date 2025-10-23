// src/ai/strategies/TargetingStrategy.js

/**
 * Base class for targeting strategies (not used directly).
 * Subclasses implement different ways to choose a target.
 */
class BaseTargeting {
    constructor(scene, launcher, profile) {
        this.scene = scene;
        this.launcher = launcher;
        // We only need the 'targeting' sub-profile
        this.profile = profile.targeting; // Ensure profile has 'targeting'
        this.opponentGoalLabel = launcher.side === 'left' ? 'goal_right' : 'goal_left';
    }

    /**
     * Finds the best target puck and returns it along with all valid targets found.
     * @returns {{
     * bestTarget: {puck: Phaser.GameObjects.Image, bearing: Phaser.GameObjects.Image} | null,
     * allValidTargets: {puck: Phaser.GameObjects.Image, bearing: Phaser.GameObjects.Image}[]
     * } | null} Info object or null if no valid targets exist at all.
     */
    findTarget() {
        // Safety check: ensure pucks and their structure exist
         if (!this.scene.puck?.star?.body || !this.scene.puck?.bearing?.body ||
             !this.scene.triPuck?.tri?.body || !this.scene.triPuck?.bearing2?.body) {
            console.error("[TargetingStrategy] Puck structure incomplete in scene.");
            return null; // Return null if structure is broken
        }

        // Filter pucks that are valid targets (active, have body, not scored)
        const validPuckInfos = [
            { puck: this.scene.puck.star, bearing: this.scene.puck.bearing },
            { puck: this.scene.triPuck.tri, bearing: this.scene.triPuck.bearing2 }
        ].filter(info => {
            // Ensure both puck and bearing, and their bodies, are valid and puck not scored
            return info.puck && info.puck.active && info.puck.body && !info.puck.attracted &&
                   info.bearing && info.bearing.active && info.bearing.body;
        });


        if (validPuckInfos.length === 0) {
            // console.log("[TargetingStrategy] No valid pucks found after filtering.");
            // Return null but indicate no valid targets were found in a way AIPersonality can check
             return { bestTarget: null, allValidTargets: [] };
        }

        // --- Apply the specific strategy logic ---
        // applyStrategyLogic now receives the list and returns ONLY the best one
        const bestTargetInfo = this.applyStrategyLogic(validPuckInfos);

        // Return both the best target and the full list of valid ones
        return { bestTarget: bestTargetInfo, allValidTargets: validPuckInfos };
    }

    /**
     * Placeholder for the specific strategy logic. Should be overridden.
     * Selects the best target *from* the provided list.
     * @param {{puck: Phaser.GameObjects.Image, bearing: Phaser.GameObjects.Image}[]} validPuckInfos
     * @returns {{puck: Phaser.GameObjects.Image, bearing: Phaser.GameObjects.Image} | null} The single best target info object.
     */
    applyStrategyLogic(validPuckInfos) {
        // Base class does nothing, should be overridden
        console.warn("[BaseTargeting] applyStrategyLogic called on base class!");
        return validPuckInfos.length > 0 ? validPuckInfos[0] : null; // Default safe return
    }
}


/**
 * Targets the valid puck closest to the launcher's pivot point.
 */
export class ClosestTargeting extends BaseTargeting {
    applyStrategyLogic(validPuckInfos) {
        const launcherPos = this.launcher.pivot.position;
        let bestTargetInfo = null;
        let bestMetric = Infinity;

        for (const info of validPuckInfos) {
            // Distance from launcher to the puck's BEARING (center of mass)
            const currentMetric = Phaser.Math.Distance.Squared(
                launcherPos.x, launcherPos.y,
                info.bearing.body.position.x, info.bearing.body.position.y
            );

            if (currentMetric < bestMetric) {
                bestMetric = currentMetric;
                bestTargetInfo = info;
            }
        }
         // console.log("[ClosestTargeting] Best target:", bestTargetInfo?.puck?.texture?.key);
        return bestTargetInfo; // Return only the best one
    }
}

/**
 * Targets the valid puck closest to the opponent's goal sensor.
 */
export class ClosestToGoalTargeting extends BaseTargeting {
     applyStrategyLogic(validPuckInfos) {
        // Find the AI's opponent's goal sensor
        const opponentGoal = this.scene.matter.world.getAllBodies().find(body => {
            return body.label === this.opponentGoalLabel;
        });

        // Failsafe if sensor not found
        const goalPos = opponentGoal ? opponentGoal.position : { x: (this.launcher.side === 'left' ? this.scene.scale.width : 0), y: this.scene.scale.height / 2 };

        let bestTargetInfo = null;
        let bestMetric = Infinity;

        for (const info of validPuckInfos) {
            // Distance from puck's BEARING to the opponent's goal
             const currentMetric = Phaser.Math.Distance.Squared(
                info.bearing.body.position.x, info.bearing.body.position.y,
                goalPos.x, goalPos.y
            );

            if (currentMetric < bestMetric) {
                bestMetric = currentMetric;
                bestTargetInfo = info;
            }
        }
         // console.log("[ClosestToGoalTargeting] Best target:", bestTargetInfo?.puck?.texture?.key);
        return bestTargetInfo; // Return only the best one
    }
}

