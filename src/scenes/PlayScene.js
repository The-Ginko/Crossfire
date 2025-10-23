// src/scenes/PlayScene.js
import { createStarPuck, createTrianglePuck } from '/factories/puckFactory.js';
import { createArena } from '/factories/arenaFactory.js';
import { createLauncher, } from '/factories/launcherFactory.js';
import { createAttractor } from '/factories/attractorFactory.js';
import { createRepulsor } from '/factories/repulsorFactory.js';
import { OpponentController } from '/src/ai/OpponentController.js';
import { UIManager } from '/src/managers/UIManager.js';
import { InputManager } from '/src/managers/InputManager.js';
import { GameStateManager } from '/src/managers/GameStateManager.js';
import { CollisionManager } from '/src/managers/CollisionManager.js';
import { DebugMenuManager } from '/src/managers/DebugMenuManager.js';
import { AIPersonality } from '/src/ai/AIPersonality.js';
import { PlayerBehaviorTracker } from '/src/managers/PlayerBehaviorTracker.js'; // --- NEW IMPORT ---

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.gameState = 'playing'; // The game starts in a 'playing' state.

    // Manager references
    this.uiManager = null;
    this.inputManager = null;
    this.gameStateManager = null;
    this.collisionManager = null;
    this.debugMenuManager = null;
    this.playerTracker = null; // --- NEW PROPERTY ---
  }

  init(data) {
    // THE FIX: Default to an empty object if no data is passed
    const settings = data || {};

    // Now, use the 'settings' object, which is guaranteed to exist
    this.gameMode = settings.gameMode || 'Classic';
    this.playerCount = settings.playerCount !== undefined ? settings.playerCount : 2;
    this.humanPlayerSide = settings.humanPlayerSide || 'left';
  }
    

  preload() {
    // Arena
    this.load.image('arena', 'assets/Arena_Graphic.png');

    // Launcher Assets
    this.load.image('launcher', 'assets/launcher.png');
    this.load.image('ball0', 'assets/ball_0.png');
    
    // Star puck assets
    this.load.image('bearing', 'assets/Bearing.png');
    this.load.image('starPuck', 'assets/StarPuck.png');
    this.load.xml('starPuckRaw', 'assets/StarPuck_Raw.svg');

    // Triangle puck assets
    this.load.image('bearing2', 'assets/bearing2.png');
    this.load.image('TrianglePuck', 'assets/TrianglePuck.png');
    this.load.xml('TrianglePuck_Raw', 'assets/TrianglePuck_Raw.svg');

    // --- AI Profiles ---
    this.load.json('defaultProfile', 'src/ai/profiles/default.json');
    this.load.json('rookieProfile', 'src/ai/profiles/rookie.json');
    this.load.json('veteranProfile', 'src/ai/profiles/veteran.json');
    this.load.json('tricksterProfile', 'src/ai/profiles/trickster.json');
  }

  create() {
    const cw = this.scale.width;
    const ch = this.scale.height;
    const cx = cw / 2;
    const cy = ch / 2;
    
    //Ball measuring logic for setting constant
    const sampleBall = this.add.sprite(-100, -100, 'ball0').setVisible(false);
    const ballRadius = sampleBall.width / 2;
    const ballDiameter = sampleBall.width;
    sampleBall.destroy();


    // Mouse spring for dragging
    this.input.mouse?.disableContextMenu();
    this.matter.add.mouseSpring({ length: 0, stiffness: 0.9 });

    // Spawn pucks
    this.puck = createStarPuck(this, cx, cy);
    this.triPuck = createTrianglePuck(this, cx + 300, cy);

    // Build arena (horizontal orientation)
    this.arena = createArena(this, cx, cy, this.puck);
    const arena = this.arena;

    // Trough attractors
    const troughHeight = arena.arenaHeight - 2 * arena.throatInset;
    const effectiveRadius = 150;
    const leftTroughX = arena.bounds.xLeft - arena.goalDepth / 2;
    createAttractor(this, leftTroughX, cy, troughHeight, effectiveRadius, ballDiameter);
    const rightTroughX = arena.bounds.xRight + arena.goalDepth / 2;
    createAttractor(this, rightTroughX, cy, troughHeight, effectiveRadius, ballDiameter);

    // Center Repulsor
    const repulsorRadius = this.arena.arenaWidth * 0.5;
    createRepulsor(this, this.arena.center.cx, this.arena.center.cy, repulsorRadius);
    
    // Instantiate Managers
    this.uiManager = new UIManager(this);
    this.uiManager.createUI();

    this.gameStateManager = new GameStateManager(this);
    this.gameStateManager.init({ gameMode: this.gameMode, playerCount: this.playerCount });

    this.inputManager = new InputManager(this);
    this.inputManager.init({ playerCount: this.playerCount, humanPlayerSide: this.humanPlayerSide });

    this.collisionManager = new CollisionManager(this);
    this.collisionManager.init();

    this.debugMenuManager = new DebugMenuManager(this);
    this.debugMenuManager.init();

    // --- NEW: Player Tracker ---
    this.playerTracker = new PlayerBehaviorTracker(this);
    // Tell the tracker which side the human is on
    const humanSide = (this.playerCount === 1) ? this.humanPlayerSide : 'none';
    this.playerTracker.init(humanSide);
    // --- END NEW ---


    // --- CAMERA AUTO-FIT + STATIC POSITIONING ---
    if (this.arena?.bounds) {
        const { xOuterLeft, xOuterRight, yTop, yBot } = this.arena.bounds;
        const topMarginPercentage = 0.20;
        const viewportHeight = this.scale.height;
        const viewportWidth = this.scale.width;
        const topMarginInPixels = viewportHeight * topMarginPercentage;
        const availableHeight = viewportHeight - topMarginInPixels;
        const fullWidth = xOuterRight - xOuterLeft;
        const fullHeight = yBot - yTop;
        const zoomX = viewportWidth / fullWidth;
        const zoomY = availableHeight / fullHeight;
        const zoom = Math.min(zoomX, zoomY);
        this.cameras.main.setZoom(zoom);
        const centerX = this.arena.center.cx;
        const verticalOffset = (topMarginInPixels / 2) / zoom;
        const centerY = this.arena.center.cy - verticalOffset;
        this.cameras.main.centerOn(centerX, centerY);
    }


    // Launcher Creation
    this.leftLauncher = createLauncher(this, 'left', arena.bounds, {
      initialAngle: 0,
      ballTexture: 'ball0',
      ballRadius: ballRadius,
      exitOffset: 40
    });

    this.rightLauncher = createLauncher(this, 'right', arena.bounds, {
      initialAngle: Math.PI,
      ballTexture: 'ball0',
      ballRadius: ballRadius,
      exitOffset: 40
    });

      // --- AI Opponent Setup ---
    this.opponents = [];
    const rookieProfile = this.cache.json.get('rookieProfile');
    const veteranProfile = this.cache.json.get('veteranProfile');
    const tricksterProfile = this.cache.json.get('tricksterProfile');

    // --- NEW: Safety checks ---
    if (!rookieProfile) {
        console.error("[PlayScene] CRITICAL: 'rookieProfile' JSON not found in cache. AI will fail.");
    }
    if (!veteranProfile) {
        console.error("[PlayScene] CRITICAL: 'veteranProfile' JSON not found in cache. AI will fail.");
    }
    if (!tricksterProfile) {
        console.error("[PlayScene] CRITICAL: 'tricksterProfile' JSON not found in cache. AI will fail.");
    }
    // --- END NEW ---

    if (this.playerCount === 0) {
        // 0-Player (AI vs AI): Rookie vs Veteran for testing
        const leftPersonality = new AIPersonality(this, this.leftLauncher, 'left', rookieProfile);
        this.opponents.push(new OpponentController(leftPersonality));
        
        const rightPersonality = new AIPersonality(this, this.rightLauncher, 'right', veteranProfile);
        this.opponents.push(new OpponentController(rightPersonality));

    } else if (this.playerCount === 1) {
        // 1-Player (Human vs AI): Player vs Rookie
        if (this.humanPlayerSide === 'left') {
            const rightPersonality = new AIPersonality(this, this.rightLauncher, 'right', rookieProfile);
            this.opponents.push(new OpponentController(rightPersonality));
        } else {
            const leftPersonality = new AIPersonality(this, this.leftLauncher, 'left', rookieProfile);
            this.opponents.push(new OpponentController(leftPersonality));
        }
    }

    this.uiManager.startRoundCountdown();
  }

  destroyPuck(puck, type) {
    if (!puck) return;
    try {
      this.matter.world.removeConstraint(puck.constraint);
    } catch {}
    if (type === 'star') {
      puck.star.destroy();
      puck.bearing.destroy();
    } else if (type === 'triangle') {
      puck.tri.destroy();
      puck.bearing2.destroy();
    }
  }

  respawnPucks() {
    // This method encapsulates the entire process, making it atomic.
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // 1. Destroy the old pucks
    this.destroyPuck(this.puck, 'star');
    this.destroyPuck(this.triPuck, 'triangle');

    // 2. Immediately nullify the references to prevent any other system from accessing them
    this.puck = null;
    this.triPuck = null;

    // 3. Create and assign the new pucks
    this.puck = createStarPuck(this, cx, cy);
    this.triPuck = createTrianglePuck(this, cx + 300, cy);

    // --- NEW: Reset player tracker ---
    if (this.playerTracker) {
        this.playerTracker.reset();
    }
    // --- END NEW ---
  }

  update(time, delta) {
    // The debug manager should always update to draw aiming lines.
    this.debugMenuManager.update();

    // Only run active game logic if the state is 'playing'
    if (this.gameStateManager.gameState !== 'playing') return;

    // InputManager has its own internal check for the pause state
    this.inputManager.update();

    // Prevent AI from updating while paused
    if (this.gameStateManager.isPaused) return;

    // Update all active AI opponents
    this.opponents.forEach(opponent => {
        opponent.update(time, delta);
    });
  }
}