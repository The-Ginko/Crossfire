// src/managers/CollisionManager.js

export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
  }

  init() {
    this.scene.matter.world.on('collisionstart', (event) => {
      this._handleCollision(event);
    });
  }

  _handleCollision(event) {
    event.pairs.forEach(({ bodyA, bodyB }) => {
      const goA = bodyA.gameObject;
      const goB = bodyB.gameObject;

      // --- Identify the participants in the collision ---
      const puck = this._identifyGameObject(goA, goB, ['starPuck', 'TrianglePuck']);
      const ball = this._identifyGameObject(goA, goB, ['ball']);
      
      const isLeftSensor = (bodyA.label === 'goal_left' || bodyB.label === 'goal_left');
      const isRightSensor = (bodyA.label === 'goal_right' || bodyB.label === 'goal_right');
      const isRepulsorSensor = (bodyA.label === 'repulsorSensor' || bodyB.label === 'repulsorSensor');

      // --- Process the collision based on who hit what ---

      // If a ball hits the repulsor's SENSOR, mark it as "in play".
      if (ball && isRepulsorSensor && !ball.isInPlay) {
          ball.isInPlay = true;
      }
      
      if (isLeftSensor || isRightSensor) {
        const side = isLeftSensor ? 'left' : 'right';

        if (puck) {
          this._handlePuckSensorCollision(puck, side);
        }

        if (ball) {
          this._handleBallSensorCollision(ball, side);
        }
      }
    });
  }

  _identifyGameObject(goA, goB, texturePrefixes) {
    for (const prefix of texturePrefixes) {
      if (goA?.texture?.key?.startsWith(prefix)) return goA;
      if (goB?.texture?.key?.startsWith(prefix)) return goB;
    }
    return null;
  }

  _handlePuckSensorCollision(puck, side) {
    if (puck && !puck.attracted) {
      // Apply visual and physics changes to the puck itself
      puck.attracted = true;
      puck.setTint(0x00ff00); // Green tint to show it's "captured"
      puck.setFrictionAir(0.05);

      // Delegate the scoring and game state logic to the GameStateManager
      this.scene.gameStateManager.puckScored(side, puck);
    }
  }

  _handleBallSensorCollision(ball, side) {
    // A ball can only be captured if it has entered the playfield and is not already captured.
    if (ball && ball.isInPlay && !ball.attracted) {
      // Apply visual and physics changes to the ball
      ball.attracted = true;
      ball.attractedTo = side; // Tag the ball for the correct trough
      ball.setFrictionAir(0.05);

      // Set a different tint based on the goal it entered
      const tint = side === 'left' ? 0xff0000 : 0xfe9900; // Red for left, Orange for right
      ball.setTint(tint);

      // This call was removed as it was calling a non-existent function and was redundant.
      // All necessary state changes are handled directly above.
    }
  }
}

