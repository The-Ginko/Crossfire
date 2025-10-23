// src/ai/strategies/AimingStrategy.js
import { CATEGORY_ARENA } from '/src/config/collisionCategories.js'; // Need ARENA category

export class AimingStrategy {
    constructor(scene, launcher, profile) {
        this.scene = scene;
        this.launcher = launcher;
        // We only need the 'aiming' sub-profile
        this.profile = profile.aiming;
        this.Matter = Phaser.Physics.Matter.Matter; // Cache Matter library
        this.Geom = Phaser.Geom; // Cache Geom library
    }

    /**
     * Calculates the final aim angle, potentially attempting a bounce shot.
     * @param {Phaser.GameObjects.Image} currentTargetBearing - The bearing chosen by the TargetingStrategy.
     * @param {Phaser.GameObjects.Image[]} allValidBearings - All bearings currently in play.
     * @returns {{angle: number, targetBearing: Phaser.GameObjects.Image | null }} - Object containing the calculated angle and the actual bearing being targeted (null if target lost).
     */
    calculateAimAngle(currentTargetBearing, allValidBearings) {
        let finalAngleRad = 0;
        let finalTargetBearing = currentTargetBearing; // Start assuming direct shot

        // --- Bounce Shot Logic ---
        if (this.profile.canBounceShot && currentTargetBearing?.body && allValidBearings && allValidBearings.length > 0) {
            if (Math.random() < this.profile.bounceShotChance) {
                 // console.log(`[${this.launcher.side} AI Aim] Attempting bounce shot...`);
                const bounceResult = this._findBounceShotAngle(allValidBearings);
                if (bounceResult) {
                    finalAngleRad = bounceResult.angle;
                    finalTargetBearing = bounceResult.targetBearing;
                    const errorMarginRad = this.profile.errorMargin;
                    const randomErrorRad = (Math.random() * 2 - 1) * errorMarginRad;
                    finalAngleRad += randomErrorRad;
                    return { angle: finalAngleRad, targetBearing: finalTargetBearing };
                } else {
                     // console.log(`[${this.launcher.side} AI Aim] No bounce shot found this attempt.`);
                }
            }
        }


        // --- Direct / Predictive Logic ---
        // (Keep Direct/Predictive logic as is)
        if (!currentTargetBearing?.body) {
             const safeAngle = (this.launcher.side === 'left') ? 0 : Math.PI;
             return { angle: safeAngle, targetBearing: null };
        }
        const launcherPos = this.launcher.getExitPoint();
         if (typeof launcherPos?.x !== 'number' || typeof launcherPos?.y !== 'number') {
            const safeAngle = (this.launcher.side === 'left') ? 0 : Math.PI;
            return { angle: safeAngle, targetBearing: null };
        }
        const targetPos = currentTargetBearing.body.position;
        const targetVel = currentTargetBearing.body.velocity;
        if (typeof targetPos?.x !== 'number' || typeof targetPos?.y !== 'number' || typeof targetVel?.x !== 'number' || typeof targetVel?.y !== 'number') {
             const safeAngle = (this.launcher.side === 'left') ? 0 : Math.PI;
             return { angle: safeAngle, targetBearing: null };
        }
        const directAngle = Phaser.Math.Angle.Between(launcherPos.x, launcherPos.y, targetPos.x, targetPos.y);
        const lookAheadFrames = 8;
        const futureX = targetPos.x + (targetVel.x * lookAheadFrames);
        const futureY = targetPos.y + (targetVel.y * lookAheadFrames);
        if (isNaN(futureX) || isNaN(futureY)) {
             let compensatedAngle = directAngle;
             const errorMarginRad = this.profile.errorMargin;
             const randomErrorRad = (Math.random() * 2 - 1) * errorMarginRad;
             finalAngleRad = compensatedAngle + randomErrorRad;
             return { angle: finalAngleRad, targetBearing: finalTargetBearing };
        }
        const angleToFuture = Phaser.Math.Angle.Between(launcherPos.x, launcherPos.y, futureX, futureY);
        const shortestDiff = Phaser.Math.Angle.ShortestBetween(Phaser.Math.RadToDeg(directAngle), Phaser.Math.RadToDeg(angleToFuture));
        const predictiveAngle = directAngle + Phaser.Math.DegToRad(shortestDiff * this.profile.predictiveStrength);
        let compensatedAngle = predictiveAngle;
        const K = this.profile.repulsorCompensation;
        if (K > 0 && this.scene.arena?.center?.cy) {
            const arenaCenterY = this.scene.arena.center.cy;
            const finalTargetPos = { x: futureX, y: futureY };
            const distance = Phaser.Math.Distance.Between(launcherPos.x, launcherPos.y, finalTargetPos.x, finalTargetPos.y);
            const yOffset = finalTargetPos.y - arenaCenterY;
             if (!isNaN(distance) && !isNaN(yOffset)) {
                const yDeflection = K * yOffset * distance;
                const compensatedTargetY = finalTargetPos.y - yDeflection;
                if (typeof finalTargetPos.x === 'number' && typeof compensatedTargetY === 'number' && !isNaN(compensatedTargetY)) {
                    compensatedAngle = Phaser.Math.Angle.Between(launcherPos.x, launcherPos.y, finalTargetPos.x, compensatedTargetY);
                }
            }
        }
        const errorMarginRad = this.profile.errorMargin;
        const randomErrorRad = (Math.random() * 2 - 1) * errorMarginRad;
        finalAngleRad = compensatedAngle + randomErrorRad;
        if (isNaN(finalAngleRad)) {
            finalAngleRad = (this.launcher.side === 'left') ? 0 : Math.PI;
            finalTargetBearing = null;
        }
        return { angle: finalAngleRad, targetBearing: finalTargetBearing };
    }

   /**
 * Searches for a possible bounce shot angle off arena walls using analytic reflection.
 * @param {Phaser.GameObjects.Image[]} validBearings - All potential target bearings.
 * @returns {{angle: number, targetBearing: Phaser.GameObjects.Image} | null}
 * @private
 */
_findBounceShotAngle(validBearings) {
    const launcherPos = this.launcher.getExitPoint();
    if (!launcherPos || isNaN(launcherPos.x) || isNaN(launcherPos.y)) return null;

    const searchRangeRad = Phaser.Math.DegToRad(this.profile.bounceAngleSearchRangeDeg);
    const searchStepRad = Phaser.Math.DegToRad(this.profile.bounceAngleSearchStepDeg);
    const tolerance = this.profile.bounceTargetTolerance;
    const rayLength = 2000;

    // Pre-filter wall bodies
    const wallBodies = this.scene.matter.world.getAllBodies().filter(b =>
        b && !b.isSensor && b.isStatic && (b.collisionFilter.category & CATEGORY_ARENA) !== 0
    );
    if (wallBodies.length === 0 || validBearings.length === 0) return null;

    // Find center angle toward nearest bearing
    let centerAngle = 0, minDistSq = Infinity;
    for (const bearing of validBearings) {
        if (!bearing?.body?.position) continue;
        const distSq = Phaser.Math.Distance.Squared(
            launcherPos.x, launcherPos.y,
            bearing.body.position.x, bearing.body.position.y
        );
        if (distSq < minDistSq) {
            minDistSq = distSq;
            centerAngle = Phaser.Math.Angle.BetweenPoints(launcherPos, bearing.body.position);
        }
    }

    const startAngle = centerAngle - searchRangeRad / 2;
    const endAngle   = centerAngle + searchRangeRad / 2;

    // --- Angle sweep ---
    for (let angle = startAngle; angle <= endAngle; angle += searchStepRad) {
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        const rayEnd = {
            x: launcherPos.x + dir.x * rayLength,
            y: launcherPos.y + dir.y * rayLength
        };

        // Step 1: find first wall intersection
        let bestHit = null;
        for (const wall of wallBodies) {
            const verts = wall.vertices;
            for (let i = 0; i < verts.length; i++) {
                const p1 = verts[i], p2 = verts[(i + 1) % verts.length];
                const seg = new this.Geom.Line(p1.x, p1.y, p2.x, p2.y);
                const out = new this.Geom.Point();
                if (this.Geom.Intersects.LineToLine(
                    new this.Geom.Line(launcherPos.x, launcherPos.y, rayEnd.x, rayEnd.y),
                    seg, out
                )) {
                    const distSq = Phaser.Math.Distance.Squared(launcherPos.x, launcherPos.y, out.x, out.y);
                    if (distSq > 1e-6 && (!bestHit || distSq < bestHit.distSq)) {
                        bestHit = { x: out.x, y: out.y, seg: { p1, p2 }, distSq };
                    }
                }
            }
        }
        if (!bestHit) continue;

        // Step 2: compute reflection vector
        const segVec = { x: bestHit.seg.p2.x - bestHit.seg.p1.x, y: bestHit.seg.p2.y - bestHit.seg.p1.y };
        const segLen = Math.hypot(segVec.x, segVec.y);
        const nx = -segVec.y / segLen, ny = segVec.x / segLen; // outward normal
        const dot = dir.x * nx + dir.y * ny;
        const refl = { x: dir.x - 2 * dot * nx, y: dir.y - 2 * dot * ny };

        // Step 3: test reflected ray against bearings (analytic ray-circle)
        for (const bearing of validBearings) {
            const cx = bearing.body.position.x, cy = bearing.body.position.y;
            const dx = cx - bestHit.x, dy = cy - bestHit.y;
            const proj = dx * refl.x + dy * refl.y;
            if (proj < 0) continue; // behind reflection
            const closestX = bestHit.x + proj * refl.x;
            const closestY = bestHit.y + proj * refl.y;
            const distSq = (closestX - cx) ** 2 + (closestY - cy) ** 2;

            const radius = (bearing.displayWidth || 20) / 2; // fallback radius
            if (distSq <= (radius + tolerance) ** 2) {
                console.log(`!!! Bounce Shot Found: ${Phaser.Math.RadToDeg(angle).toFixed(1)}° → ${bearing.body.label}`);
                return { angle, targetBearing: bearing };
            }
        }
    }

    return null;
}
}

