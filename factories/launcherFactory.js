console.log('Loading launcherFactory.js');


// src/factories/launcherFactory.js

import { createBall } from '/factories/ballFactory.js'; // adjust path if needed

export function createLauncher(scene, side, arenaBounds, config, {
  pivotOffset = 40,             // distance from wall pivot to launcher body
  barrelLength = 80,            // distance from pivot to barrel tip
  launchForceMagnitude = 0.02,  // force applied to launched balls
  ballTexture = 'ball0',        // texture key for ball sprite
  exitOffset = 0                // inset adjustment
} = {}) {
  const { matter, add } = scene;

  // --- Sprite ---
  const sprite = add.sprite(0, 0, 'launcher');
  sprite.setOrigin(0.5, 0.5);

  // --- Pivot point (on back wall) ---
  const pivotX = side === 'left'
    ? arenaBounds.xOuterLeft - (arenaBounds.wallT * 2)
    : arenaBounds.xOuterRight + (arenaBounds.wallT * 2);
  const pivotY = (arenaBounds.yTop + arenaBounds.yBot) / 2;

  const pivot = matter.add.circle(pivotX, pivotY, 2, {
    isStatic: true,
    label: `launcher_pivot_${side}`
  });

  // --- Launcher body (non-colliding rectangle) ---
  const body = matter.add.rectangle(
    pivotX + (side === 'left' ? pivotOffset : -pivotOffset),
    pivotY,
    sprite.width,
    sprite.height,
    { isStatic: true, isSensor: true, label: `launcher_body_${side}` }
  );

  // Link sprite to body
  sprite.setPosition(body.position.x, body.position.y);

  // --- Angle state ---
  let angle = config.initialAngle ?? 0;

  function setAngle(rad) {
    angle = rad;
    matter.body.setAngle(body, angle);

    // Recompute body position relative to pivot
    const centerOffset = Math.abs(pivotOffset);
    const dx = Math.cos(angle) * centerOffset;
    const dy = Math.sin(angle) * centerOffset;
    matter.body.setPosition(body, { x: pivotX + dx, y: pivotY + dy });

    // Sync sprite
    sprite.setRotation(angle);
    sprite.setPosition(body.position.x, body.position.y);
  }

  function getAngle() {
    return angle;
  }

  // --- Exit point helper ---
  function getExitPoint() {
    const halfLength = sprite.width / 2;
    // Vector from pivot to body center
    const dx = body.position.x - pivotX;
    const dy = body.position.y - pivotY;
    const centerDist = Math.sqrt(dx * dx + dy * dy);

    // Distance from pivot to nose = centerDist + halfLength
    const barrelLen = centerDist + halfLength;

    return {
      x: pivotX + Math.cos(angle) * barrelLen,
      y: pivotY + Math.sin(angle) * barrelLen
    };
  }

  // --- Ball firing ---
  function fireBall() {
    const exit = getExitPoint();

    // Create a ball sprite with a circular Matter body
    const ball = createBall(scene, exit.x, exit.y, config.ballTexture, {
      collisionGroup: -1, // ignore attractors until scored
      frictionAir: 0.01,
      bounce: 0.9
    });

    // Apply force along the current angle
    const forceX = Math.cos(angle) * launchForceMagnitude;
    const forceY = Math.sin(angle) * launchForceMagnitude;
    ball.applyForce({ x: forceX, y: forceY });

    return ball;
  }

  // Initialize with config angle
  setAngle(angle);

  return {
    side,
    sprite,
    body,
    pivot,
    setAngle,
    getAngle,
    getExitPoint,
    fireBall,
    launchForceMagnitude,
    ballTexture, // expose for reference
    exitOffset,  // expose for tweaking
    config
  };
}
