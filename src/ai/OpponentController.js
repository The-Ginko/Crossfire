// src/ai/OpponentController.js

export class OpponentController {
    constructor(scene, launcher, side) {
        this.scene = scene;
        this.launcher = launcher;
        this.side = side; // 'left' or 'right'
        this.cooldown = 0;

        // Determine which ammo and text objects to use based on the side
        this.ammoProperty = side === 'left' ? 'launcherLeftAmmo' : 'launcherRightAmmo';
        this.ammoTextObject = side === 'left' ? this.scene.ammoLeftText : this.scene.ammoRightText;
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
        // It now checks the correct ammo property ('launcherLeftAmmo' or 'launcherRightAmmo')
        if (this.scene[this.ammoProperty] === 0) {
            // It now checks for balls attracted to the correct side ('left' or 'right')
            const attractedBallBody = this.scene.matter.world.getAllBodies().find(body =>
                body.gameObject?.attractedTo === this.side
            );

            // If a ball is available, "reload" it.
            if (attractedBallBody) {
                this.scene[this.ammoProperty]++;
                this.ammoTextObject.setText(`Ammo: ${this.scene[this.ammoProperty]}`);

                // Remove the reloaded ball from the game.
                this.scene.matter.world.remove(attractedBallBody);
                if (attractedBallBody.gameObject) {
                    attractedBallBody.gameObject.destroy();
                }
            }
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

            // Execute the fire command.
            this.launcher.fireBall();
            this.scene[this.ammoProperty]--;
            this.ammoTextObject.setText(`Ammo: ${this.scene[this.ammoProperty]}`);

            // 5. Set Cooldown: Prevent the AI from firing again immediately.
            this.cooldown = 500; // 500ms cooldown.
        }
    }
}
