// src/managers/GameStateManager.js

export class GameStateManager {
  constructor(scene) {
    this.scene = scene;

    // Core game state
    this.gameState = 'countdown';
    this.isPaused = false; // Added per plan

    // Game settings from Main Menu
    this.gameMode = 'Classic';
    this.playerCount = 2;

    // Scoring and Puck Tracking
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.scoredPucks = 0;
    this.winScore = 3;

    // Ammunition
    this.ammoLeft = 20;
    this.ammoRight = 20;
  }

  init(settings) {
    this.gameMode = settings.gameMode;
    this.playerCount = settings.playerCount;

    // Reset scores and ammo for a new game
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.scoredPucks = 0;
    this.ammoLeft = 20;
    this.ammoRight = 20;
    this.setGameState('countdown');
    
    this.scene.uiManager.updateScores(this.scoreLeft, this.scoreRight);
    this.scene.uiManager.updateAmmo(this.ammoLeft, this.ammoRight);
  }

  setGameState(newState) {
    this.gameState = newState;
    console.log(`Game state changed to: ${newState}`);
  }

  // Added per plan
  togglePause() {
    // Only allow pausing during active gameplay, or unpausing if already paused.
    if (this.gameState !== 'playing' && !this.isPaused) {
      return;
    }

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Pause physics and show the menu
      this.scene.matter.world.pause();
      this.scene.debugMenuManager.show();
    } else {
      // Resume physics and hide the menu
      this.scene.matter.world.resume();
      this.scene.debugMenuManager.hide();
    }
  }

  /**
   * Fires a launcher and tracks if it was a human shot.
   * @param {string} side - 'left' or 'right'
   * @param {boolean} [isHumanShot=false] - Was this shot fired by a human?
   * @returns {boolean} - True if a shot was fired, false otherwise.
   */
  fireLauncher(side, isHumanShot = false) {
    if (this.gameState !== 'playing' || this.isPaused) return false;

    let fired = false;
    if (side === 'left' && this.ammoLeft > 0) {
      this.scene.leftLauncher.fireBall();
      this.ammoLeft--;
      fired = true;
    } else if (side === 'right' && this.ammoRight > 0) {
      this.scene.rightLauncher.fireBall();
      this.ammoRight--;
      fired = true;
    }

    if (fired) {
      this.scene.uiManager.updateAmmo(this.ammoLeft, this.ammoRight);
      
      // --- THIS IS THE NEW LOGIC ---
      // If a human fired, tell the tracker.
      if (isHumanShot && this.scene.playerTracker) {
        this.scene.playerTracker.recordHumanShot();
      }
      // --- END NEW LOGIC ---
    }
    
    return fired; // Return success
  }

  isBallInTrough(side) {
    const attractedBallBody = this.scene.matter.world.getAllBodies().find(body =>
      body.gameObject?.attractedTo === side
    );
    return !!attractedBallBody; // Returns true if a body is found, false if not
  }
  
  /**
   * Reloads a launcher from the trough.
   * @param {string} side - 'left' or 'right'
   * @returns {boolean} - True if a reload was successful, false otherwise.
   */
  reloadLauncher(side) {
    if (this.gameState !== 'playing' || this.isPaused) return false;

    const attractedBallBody = this.scene.matter.world.getAllBodies().find(body =>
      body.gameObject?.attractedTo === side
    );

    if (attractedBallBody) {
      if (side === 'left') {
        this.ammoLeft++;
      } else {
        this.ammoRight++;
      }

      this.scene.uiManager.updateAmmo(this.ammoLeft, this.ammoRight);
      this.scene.matter.world.remove(attractedBallBody);
      if (attractedBallBody.gameObject) {
        attractedBallBody.gameObject.destroy();
      }
      return true; // Reload was successful
    }
    
    return false; // No ball to reload
  }
  
  puckScored(side, puckGameObject) {
    if (side === 'left') {
      this.scoreLeft++;
    } else {
      this.scoreRight++;
    }
    this.scene.uiManager.updateScores(this.scoreLeft, this.scoreRight);

    if (this.gameMode !== 'Debug') {
      if (this.scoreLeft >= this.winScore) {
        this.scene.uiManager.handleGameOver('P1');
      } else if (this.scoreRight >= this.winScore) {
        this.scene.uiManager.handleGameOver('P2');
      } else {
        this.handlePuckRespawn(puckGameObject);
      }
    } else {
      this.handlePuckRespawn(puckGameObject);
    }
  }

  handlePuckRespawn(puckGameObject) {
    if (this.gameMode === 'Classic' || this.gameMode === 'Debug') {
      this.scoredPucks++;
      if (this.scoredPucks >= 2) {
        this.setGameState('paused'); // A temporary state
        this.scene.time.delayedCall(1000, () => {
          this.scene.respawnPucks();
          this.scoredPucks = 0;
          this.scene.uiManager.startRoundCountdown();
        });
      }
    }
  }

  getAmmo(side) {
      return side === 'left' ? this.ammoLeft : this.ammoRight;
  }
}