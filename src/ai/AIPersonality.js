// src/ai/AIPersonality.js
import { ClosestTargeting, ClosestToGoalTargeting } from './strategies/TargetingStrategy.js';
import { AimingStrategy } from './strategies/AimingStrategy.js';
import { NoCheckObstacle, RaycastObstacle } from './strategies/ObstacleStrategy.js';

export class AIPersonality {
    constructor(scene, launcher, side, profile) {
        this.scene = scene;
        this.launcher = launcher;
        this.side = side; // 'left' or 'right'

        // --- Profile ---
        if (!profile) {
            console.error(`[AIPersonality] CRITICAL ERROR for ${side} AI: Profile was undefined. Loading fallback.`);
            this.profile = {
                name: "FALLBACK_ROOKIE",
                aiming: { errorMargin: 0.1, predictiveStrength: 0.0, checkLineOfSight: false, repulsorCompensation: 0.0, aimRotationSpeedCap: 1.5, aimRotationAcceleration: 3.0, canBounceShot: false, bounceShotChance: 0, maxBounces: 1, bounceAngleSearchRangeDeg: 60, bounceAngleSearchStepDeg: 5, bounceTargetTolerance: 10 }, // Added bounce props to fallback
                timing: { reactionDelay: 750, fireRate: 1000 },
                reloading: { strategy: "empty", threshold: 0 },
                targeting: { strategy: "closest", canCounter: false }
            };
        } else {
            this.profile = profile;
        }

        // --- State Machine ---
        this.state = 'evaluating'; // evaluating, reacting, firing, reloading
        this.stateTimer = 0; // Generic timer for delays
        this.targetPuck = null; // The chosen puck *gameObject*
        this.targetBearing = null; // The chosen bearing *gameObject*
        this.allValidTargetInfos = []; // Store the full list from TargetingStrategy

        // --- Private properties ---
        this.lastShotTime = 0; // For fireRate
        this.targetAngleRad = 0; // The angle calculated *last frame* during reacting, used for firing
        this.currentAimSpeedRadPerSec = 0; // For smooth rotation

        // --- Strategy Instances ---
        this.targetingStrategy = this.createTargetingStrategy();
        this.aimingStrategy = this.createAimingStrategy();
        this.obstacleStrategy = this.createObstacleStrategy();

        // --- Aiming Threshold ---
        this.aimThresholdRad = Phaser.Math.DegToRad(1.0); // e.g., within 1 degree

        console.log(`[AIPersonality] ${this.side} AI loaded profile: ${this.profile.name}`);
    }

    // --- Factory Methods for Strategies --- // (Keep these as they are)
    createTargetingStrategy() {
        switch (this.profile.targeting.strategy) {
            case 'closestToGoal':
                return new ClosestToGoalTargeting(this.scene, this.launcher, this.profile);
            case 'closest':
            default:
                return new ClosestTargeting(this.scene, this.launcher, this.profile);
        }
    }

    createAimingStrategy() {
        return new AimingStrategy(this.scene, this.launcher, this.profile);
    }

    createObstacleStrategy() {
        if (this.profile.aiming.checkLineOfSight) {
            return new RaycastObstacle(this.scene, this.launcher, this.profile);
        } else {
            return new NoCheckObstacle(this.scene, this.launcher, this.profile);
        }
    }

    // --- Core AI Logic Methods (Now mostly delegate) --- // (Keep shouldReload as is)
     shouldReload() {
        const currentAmmo = this.scene.gameStateManager.getAmmo(this.side);
        switch (this.profile.reloading.strategy) {
            case 'threshold':
                if (currentAmmo < this.profile.reloading.threshold) {
                    return this.scene.gameStateManager.isBallInTrough(this.side);
                }
                return false;
            case 'empty':
            default:
                return currentAmmo === 0;
        }
    }

    // --- Helper for state transitions ---
    resetToEvaluating() {
        this.state = 'evaluating';
        this.targetPuck = null;
        this.targetBearing = null;
        this.allValidTargetInfos = []; // Clear the list
        this.currentAimSpeedRadPerSec = 0; // Reset rotation speed
    }


    // --- Core Update Loop ---
    update(time, delta) {
        const deltaSec = delta / 1000.0;

        if (this.scene.gameStateManager.gameState !== 'playing') {
            return;
        }

        if (this.stateTimer > 0) {
            this.stateTimer -= delta;
        }

        // --- AI STATE MACHINE ---
        switch (this.state) {

            case 'evaluating':
                if (this.shouldReload()) {
                    this.state = 'reloading';
                    this.currentAimSpeedRadPerSec = 0;
                    break;
                }

                // --- DELEGATE & STORE BOTH RESULTS ---
                const targetingResult = this.targetingStrategy.findTarget();

                // Check if targetingResult is valid and has the expected structure
                if (targetingResult && targetingResult.bestTarget && targetingResult.allValidTargets) {
                    this.targetPuck = targetingResult.bestTarget.puck;
                    this.targetBearing = targetingResult.bestTarget.bearing;
                    this.allValidTargetInfos = targetingResult.allValidTargets; // Store the list

                    if (this.targetBearing?.body) {
                        this.state = 'reacting';
                        this.stateTimer = this.profile.timing.reactionDelay;
                        // Angle calculation moved to reacting state
                    } else {
                         console.error(`[${this.side} AI Eval] Target ${this.targetPuck?.texture?.key} found, but its bearing is invalid! Resetting.`);
                         this.resetToEvaluating();
                    }
                } else {
                    // findTarget returned null or an invalid structure (e.g., no valid pucks)
                    // console.log(`[${this.side} AI Eval] findTarget returned NULL or invalid. No valid targets found. Staying in evaluating.`);
                    // Ensure state is reset if we stay here
                    this.resetToEvaluating(); // Stay in evaluating, but ensure target refs are null
                    this.state = 'evaluating'; // Explicitly stay
                }
                break;

            case 'reacting':
                // Stale target check - MUST run before anything else
                // Also check if allValidTargetInfos list is populated
                if (!this.targetPuck || !this.targetPuck.active || this.targetPuck.attracted ||
                    !this.targetBearing || !this.targetBearing.active || !this.targetBearing.body ||
                    !this.allValidTargetInfos || this.allValidTargetInfos.length === 0 ) {
                    console.warn(`[${this.side} AI React] Target or valid list became stale during reaction! Resetting.`);
                    this.resetToEvaluating();
                    break;
                }

                // --- DYNAMIC AIMING LOGIC ---
                // 1. Calculate the *desired* angle THIS frame
                // --- PASS THE LIST OF VALID BEARINGS ---
                const validBearingsOnly = this.allValidTargetInfos.map(info => info.bearing);
                const aimResult = this.aimingStrategy.calculateAimAngle(this.targetBearing, validBearingsOnly);
                const desiredAngleRad = aimResult.angle;
                // --- Check if bounce shot changed the target ---
                if (aimResult.targetBearing !== this.targetBearing) {
                    // console.log(`[${this.side} AI React] Bounce shot selected new target: ${aimResult.targetBearing.body.label}`);
                    this.targetBearing = aimResult.targetBearing;
                    // Find the corresponding puck for the new bearing (needed for LOS check later)
                    const newTargetInfo = this.allValidTargetInfos.find(info => info.bearing === this.targetBearing);
                    this.targetPuck = newTargetInfo ? newTargetInfo.puck : null;
                     if (!this.targetPuck) { // Failsafe
                        console.error(`[${this.side} AI React] Bounce shot changed bearing, but couldn't find matching puck! Resetting.`);
                        this.resetToEvaluating();
                        break;
                     }
                }
                // --- END BOUNCE TARGET UPDATE ---


                // 2. Get current angle
                const currentAngleRad = this.launcher.getAngle();

                // 3. Calculate difference and direction
                let shortestDiffRad = Phaser.Math.Angle.Wrap(desiredAngleRad - currentAngleRad);
                const direction = Math.sign(shortestDiffRad);

                // 4. Get profile values for rotation
                const accel = this.profile.aiming.aimRotationAcceleration;
                const speedCap = this.profile.aiming.aimRotationSpeedCap;

                // 5. Apply acceleration/deceleration
                this.currentAimSpeedRadPerSec += direction * accel * deltaSec;

                // 6. Apply speed cap
                this.currentAimSpeedRadPerSec = Phaser.Math.Clamp(this.currentAimSpeedRadPerSec, -speedCap, speedCap);

                // 7. Calculate angle change for this frame
                let angleChangeThisFrame = this.currentAimSpeedRadPerSec * deltaSec;

                // 8. Overshoot prevention
                let isAimed = false;
                if (Math.abs(angleChangeThisFrame) >= Math.abs(shortestDiffRad)) {
                    angleChangeThisFrame = shortestDiffRad;
                    this.currentAimSpeedRadPerSec = 0;
                    isAimed = true;
                } else {
                     isAimed = Math.abs(shortestDiffRad) < this.aimThresholdRad;
                     if (isAimed) {
                         this.currentAimSpeedRadPerSec = 0;
                     }
                }

                // 9. Apply the rotation
                const newAngle = currentAngleRad + angleChangeThisFrame;
                this.launcher.setAngle(newAngle);

                // 10. Store the angle we are *actually* pointing at for the firing state
                this.targetAngleRad = newAngle;

                // Check transition conditions: Timer AND Aimed
                if (this.stateTimer <= 0 && isAimed) {
                    this.state = 'firing';
                    this.stateTimer = this.profile.timing.fireRate;
                    this.currentAimSpeedRadPerSec = 0;
                }
                break;

            case 'firing':
                // Stale target check
                if (!this.targetPuck || !this.targetPuck.active || this.targetPuck.attracted ||
                    !this.targetBearing || !this.targetBearing.active || !this.targetBearing.body) {
                    console.warn(`[${this.side} AI Fire] Target became stale during firing! Resetting.`);
                    this.resetToEvaluating();
                    break;
                }

                // Cooldown check
                if (this.stateTimer <= 0) {
                    this.resetToEvaluating();
                    break;
                }

                 // Aim Check
                 const currentFiringAngle = this.launcher.getAngle();
                 const desiredFiringAngle = this.targetAngleRad; // Use angle stored from reacting
                 const firingDiff = Phaser.Math.Angle.Wrap(desiredFiringAngle - currentFiringAngle);
                 if (Math.abs(firingDiff) > this.aimThresholdRad) {
                     console.warn(`[${this.side} AI Fire] Aim drifted (${firingDiff.toFixed(3)} rad) during firing cooldown. Resetting.`);
                     this.resetToEvaluating();
                     break;
                 }


                // Fire on first frame possible after cooldown/aiming
                if (time - this.lastShotTime > this.profile.timing.fireRate) {

                    // Check Line of Sight using the obstacle strategy
                    // Pass the final target bearing and puck (could have been changed by bounce shot)
                    if (!this.obstacleStrategy.isPathClear(this.targetBearing, this.targetPuck)) {
                        // Path blocked
                        this.resetToEvaluating();
                        break;
                    }

                    // Path is clear, FIRE! Use the angle stored from the end of reacting
                    this.launcher.setAngle(this.targetAngleRad);
                    this.scene.gameStateManager.fireLauncher(this.side);
                    this.lastShotTime = time;

                    // Immediately go back to evaluating after firing
                    this.resetToEvaluating();
                    break; // Exit firing state immediately
                }
                break;

            case 'reloading':
                const reloaded = this.scene.gameStateManager.reloadLauncher(this.side);

                if (reloaded) {
                    if (!this.shouldReload()) {
                        this.state = 'evaluating';
                    }
                } else {
                     console.warn(`[${this.side} AI Reload] Reload failed (trough likely empty). Switching to evaluating.`);
                    this.state = 'evaluating';
                }
                break;
        }
    }
}

