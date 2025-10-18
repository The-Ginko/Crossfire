// src/ai/OpponentController.js

export class OpponentController {
    constructor(scene, launcher, side) {
        this.scene = scene;
        this.launcher = launcher;
        this.side = side; // 'left' or 'right'
        this.cooldown = 0;
    }

    findClosestPuck() {
        const pucks = [this.scene.puck, this.scene.triPuck];
        let closestPuck = null;
        let minDistance = Infinity;

        for (const puck of pucks) {
            if (puck && puck.star && puck.star.body) { // Check for star puck
                const distance = Phaser.Math.Distance.Between(
                    this.launcher.pivot.position.x,
                    this.launcher.pivot.position.y,
                    puck.star.body.position.x,
                    puck.star.body.position.y
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPuck = puck.star;
                }
            } else if (puck && puck.tri && puck.tri.body) { // Check for triangle puck
                const distance = Phaser.Math.Distance.Between(
                    this.launcher.pivot.position.x,
                    this.launcher.pivot.position.y,
                    puck.tri.body.position.x,
                    puck.tri.body.position.y
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPuck = puck.tri;
                }
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

        // 2. Ammunition Management: If out of ammo, attempt to reload.
        if ((this.scene.gameStateManager.launcherLeftAmmo === 0 && this.side === 'left') || (this.scene.gameStateManager.launcherRightAmmo === 0 && this.side === 'right')) {
            this.scene.gameStateManager.reloadLauncher(this.side);
            return; // Wait until next update cycle after attempting to reload.
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
