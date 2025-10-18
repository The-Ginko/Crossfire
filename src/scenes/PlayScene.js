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

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.gameState = 'playing'; // The game starts in a 'playing' state.

    // Manager references
    this.uiManager = null;
    this.inputManager = null;
    this.gameStateManager = null;
    this.collisionManager = null;
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
    this.gameStateManager.init({ gameMode: this.gameMode });

    this.inputManager = new InputManager(this);
    this.inputManager.init({ playerCount: this.playerCount, humanPlayerSide: this.humanPlayerSide });

    this.collisionManager = new CollisionManager(this);
    this.collisionManager.init();


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
    if (this.playerCount === 0) {
        this.opponents.push(new OpponentController(this, this.leftLauncher, 'left'));
        this.opponents.push(new OpponentController(this, this.rightLauncher, 'right'));
    } else if (this.playerCount === 1) {
        if (this.humanPlayerSide === 'left') {
            this.opponents.push(new OpponentController(this, this.rightLauncher, 'right'));
        } else {
            this.opponents.push(new OpponentController(this, this.leftLauncher, 'left'));
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
  }

  update(time, delta) {
    if (this.gameStateManager.gameState !== 'playing') return;

    this.inputManager.update();

    // Update all active AI opponents
    this.opponents.forEach(opponent => {
        opponent.update(time, delta);
    });
  }
}

