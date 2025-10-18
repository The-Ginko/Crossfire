// src/managers/GameStateManager.js
import { createStarPuck, createTrianglePuck } from '/factories/puckFactory.js';

export class GameStateManager {
  constructor(scene) {
    this.scene = scene;

    // Default state values
    this.gameState = 'countdown';
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.launcherLeftAmmo = 0;
    this.launcherRightAmmo = 0;
    this.scoredPucks = 0;
    this.winScore = 3;
    this.gameMode = 'Classic';
  }

  init(settings) {
    // Apply settings passed from the main menu
    this.gameMode = settings.gameMode || 'Classic';
    this.winScore = this.gameMode === 'Blitz' ? 5 : 3; // Example of mode-specific logic

    // Reset dynamic state for a new game
    this.gameState = 'countdown';
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.scoredPucks = 0;
    this.launcherLeftAmmo = 20;
    this.launcherRightAmmo = 20;
  }

  setGameState(newState) {
    this.gameState = newState;
  }

  puckScored(side, puckGameObject) {
    if (side === 'left') {
      this.scoreLeft++;
    } else {
      this.scoreRight++;
    }
    this.scene.uiManager.updateScores(this.scoreLeft, this.scoreRight);

    // Check for a win condition
    if (this.gameMode !== 'Debug') {
      if (this.scoreLeft >= this.winScore) {
        this.setGameState('gameOver');
        this.scene.uiManager.handleGameOver('P1');
      } else if (this.scoreRight >= this.winScore) {
        this.setGameState('gameOver');
        this.scene.uiManager.handleGameOver('P2');
      } else {
        this._handlePuckRespawn(puckGameObject);
      }
    } else {
      this._handlePuckRespawn(puckGameObject);
    }
  }

  _handlePuckRespawn(puckGameObject) {
    const cx = this.scene.scale.width / 2;
    const cy = this.scene.scale.height / 2;

    if (this.gameMode === 'Blitz') {
      const isStarPuck = puckGameObject.texture.key === 'starPuck';
      this.scene.time.delayedCall(this.scene.blitzPuckReturnDelay, () => {
        if (isStarPuck) {
          this.scene.destroyPuck(this.scene.puck, 'star');
          this.scene.puck = createStarPuck(this.scene, cx, cy);
        } else {
          this.scene.destroyPuck(this.scene.triPuck, 'triangle');
          this.scene.triPuck = createTrianglePuck(this.scene, cx + 300, cy);
        }
      });
    } else if (this.gameMode === 'Classic' || this.gameMode === 'Debug') {
      this.scoredPucks++;
      if (this.scoredPucks >= 2) {
        this.setGameState('paused');
        this.scene.time.delayedCall(1000, () => {
          this.scene.destroyPuck(this.scene.puck, 'star');
          this.scene.destroyPuck(this.scene.triPuck, 'triangle');
          this.scene.puck = createStarPuck(this.scene, cx, cy);
          this.scene.triPuck = createTrianglePuck(this.scene, cx + 300, cy);
          this.scoredPucks = 0;
          this.scene.uiManager.startRoundCountdown(); // This sets gameState back to 'countdown' then 'playing'
        });
      }
    }
  }

  fireLauncher(side) {
    if (this.gameState !== 'playing') return;

    if (side === 'left' && this.launcherLeftAmmo > 0) {
      this.scene.leftLauncher.fireBall();
      this.launcherLeftAmmo--;
    } else if (side === 'right' && this.launcherRightAmmo > 0) {
      this.scene.rightLauncher.fireBall();
      this.launcherRightAmmo--;
    }
    this.scene.uiManager.updateAmmo(this.launcherLeftAmmo, this.launcherRightAmmo);
  }

  reloadLauncher(side) {
    if (this.gameState !== 'playing') return;

    const attractedBallBody = this.scene.matter.world.getAllBodies().find(body =>
      body.gameObject?.attractedTo === side
    );

    if (attractedBallBody) {
      if (side === 'left') {
        this.launcherLeftAmmo++;
      } else {
        this.launcherRightAmmo++;
      }
      this.scene.uiManager.updateAmmo(this.launcherLeftAmmo, this.launcherRightAmmo);

      this.scene.matter.world.remove(attractedBallBody);
      if (attractedBallBody.gameObject) {
        attractedBallBody.gameObject.destroy();
      }
    }
  }
}