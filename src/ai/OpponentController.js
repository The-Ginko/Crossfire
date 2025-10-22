// src/ai/OpponentController.js

export class OpponentController {
    constructor(scene, launcher, side) {
        this.scene = scene;
        this.launcher = launcher;
        this.side = side; // 'left' or 'right'
        this.cooldown = 0;
    }

         findClosestPuck() {
        // Safety check to ensure the puck objects exist on the scene.
        if (!this.scene.puck || !this.scene.triPuck) {
            return null;
        }

        // Create a list of the actual puck game objects.
        const pucks = [this.scene.puck.star, this.scene.triPuck.tri];
        let closestPuck = null;
        let minDistance = Infinity;

        for (const puck of pucks) {
            // --- THE FIX ---
            // If the puck is invalid, destroyed, or already scored (attracted),
            // skip it and move to the next potential target.
            if (!puck || !puck.body || puck.attracted) {
                continue;
            }

            const distance = Phaser.Math.Distance.Between(
                this.launcher.pivot.position.x,
                this.launcher.pivot.position.y,
                puck.body.position.x,
                puck.body.position.y
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestPuck = puck;
            }
        }
        
        return closestPuck;
    }

    
    update(time, delta) {
        // 1. Cooldown Logic: If the AI is on cooldown, do nothing.
        if (this.cooldown > 0) {
            this.cooldown -= delta;
            return;
        }

        const currentAmmo = this.scene.gameStateManager.getAmmo(this.side);
        
        // 2. Ammunition Management: If out of ammo, attempt to reload.
        if (currentAmmo === 0) {
        this.scene.gameStateManager.reloadLauncher(this.side);
        return; // Wait for next update cycle after requesting reload.
    }

        // 3. Target Selection: Find a puck to shoot at.
        const target = this.findClosestPuck();

        // 4. Aiming and Firing Logic
        if (target) {
            // Calculate the angle needed to hit the target.
            const targetAngle = Phaser.Math.Angle.Between(
                this.launcher.pivot.position.x,
                this.launcher.pivot.position.y,
                target.body.position.x,
                target.body.position.y
            );

            // Set the launcher's angle to the calculated target angle.
            this.launcher.setAngle(targetAngle);

            // Execute the fire command via the GameStateManager
            this.scene.gameStateManager.fireLauncher(this.side);

            // 5. Set Cooldown: Prevent the AI from firing again immediately.
            this.cooldown = 500; // 500ms cooldown.
        }
    }
}
