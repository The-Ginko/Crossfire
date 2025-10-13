// src/scenes/PlayScene.js
import { createStarPuck, createTrianglePuck } from '/factories/puckFactory.js';
import { createArena } from '/factories/arenaFactory.js';
import { createLauncher, } from '/factories/launcherFactory.js';
import { createAttractor } from '/factories/attractorFactory.js';
import { createRepulsor } from '/factories/repulsorFactory.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.leftOccupied = false;
    this.rightOccupied = false;
    this.gameState = 'playing'; // The game starts in a 'playing' state.
    this.scoreLeftText = null;
    this.scoreRightText = null;
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

    //log arena height and width
    console.log('Arena height:', arena.arenaHeight);
    console.log('Arena width:', arena.arenaWidth);
    console.log('Throat inset:', arena.throatInset);
    console.log('xLeft:', arena.bounds.xLeft);
    console.log('xRight:', arena.bounds.xRight);

    // Example: left and right trough attractors
    const troughHeight = arena.arenaHeight - 2 * arena.throatInset;
    const effectiveRadius = 150; // The range for each point in the chain
    
    // Calculate the center of the left trough (behind the goal line)
    const leftTroughX = arena.bounds.xLeft - arena.goalDepth / 2;
    createAttractor(this, leftTroughX, cy, troughHeight, effectiveRadius, ballDiameter);

    // Calculate the center of the right trough (behind the goal line)
    const rightTroughX = arena.bounds.xRight + arena.goalDepth / 2;
    createAttractor(this, rightTroughX, cy, troughHeight, effectiveRadius, ballDiameter);


    // --- Create the Center Repulsor ---
        const repulsorRadius = this.arena.arenaWidth * 0.5; // Example: radius is 50% of the arena width
        createRepulsor(this, this.arena.center.cx, this.arena.center.cy, repulsorRadius);


    // --- 2. Create the Score UI Text ---
    const scoreTextStyle = {
        fontSize: '48px',
        fill: '#FFFFFF',
        fontFamily: '"Press Start 2P", Arial', // A retro game font
        stroke: '#000000',
        strokeThickness: 8
    };

    // Create Left Score Text (Player 1)
    this.scoreLeftText = this.add.text(50, 30, `P1: ${this.scoreLeft}`, scoreTextStyle)
        .setOrigin(0, 0.5) // Position from the left side
        .setScrollFactor(0); // Fixes it to the camera

    // Create Right Score Text (Player 2)
    this.scoreRightText = this.add.text(this.scale.width - 50, 30, `P2: ${this.scoreRight}`, scoreTextStyle)
        .setOrigin(1, 0.5) // Position from the right side
        .setScrollFactor(0); // Fixes it to the camera

    // Camera fit
    if (this.arena?.bounds) {
      const { xLeft, xRight, yTop, yBot } = this.arena.bounds;
      const arenaWidth  = xRight - xLeft;
      const arenaHeight = yBot - yTop;

      this.cameras.main.setBounds(xLeft, yTop, arenaWidth, arenaHeight);
      this.cameras.main.centerOn((xLeft + xRight) / 2, (yTop + yBot) / 2);
      const zoomX = this.scale.width  / arenaWidth;
      const zoomY = this.scale.height / arenaHeight;
      const zoom  = Math.min(zoomX, zoomY);
      this.cameras.main.setZoom(zoom);

      this.cameras.main.startFollow(this.puck.star, true, 0.15, 0.15);
    }

    // Launcher Creation
    // Left launcher, pointing right (angle 0)
this.leftLauncher = createLauncher(this, 'left', arena.bounds, {
  initialAngle: 0,
  ballTexture: 'ball0',
  ballRadius: ballRadius, // Use the true, measured radius
  exitOffset: 40   // pulls spawn point 10px back into the barrel
});
console.log('Left launcher created:', this.leftLauncher);

// Right launcher, pointing left (angle PI)
this.rightLauncher = createLauncher(this, 'right', arena.bounds, {
  initialAngle: Math.PI,
  ballTexture: 'ball0',
  ballRadius: ballRadius, // Use the true, measured radius
  exitOffset: 40   // pulls spawn point 10px back into the barrel
});
console.log('Right launcher created:', this.rightLauncher);

      this.keys = this.input.keyboard.addKeys({
     leftUp: 'W', leftDown: 'S',
      rightUp: 'UP', rightDown: 'DOWN'
   });
    
    // --- Input bindings ---
  // Left launcher fires on SPACE
  this.input.keyboard.on('keydown-SPACE', () => {
    // Only allow firing when the game is in the 'playing' state
    if (this.gameState !== 'playing') return;
    this.leftLauncher.fireBall(this);
  });

  // Right launcher fires on ENTER
  this.input.keyboard.on('keydown-ENTER', () => {
    // Only allow firing when the game is in the 'playing' state
    if (this.gameState !== 'playing') return;
    this.rightLauncher.fireBall(this);
  });

    // Respawn key (R)
    this.input.keyboard.on('keydown-R', () => {
      this.destroyPuck(this.puck, 'star');
      this.destroyPuck(this.triPuck, 'triangle');

      this.puck = createStarPuck(this, cx, cy);
      this.triPuck = createTrianglePuck(this, cx + 300, cy);

      this.cameras.main.startFollow(this.puck.star, true, 0.15, 0.15);
      this.leftOccupied = false;
      this.rightOccupied = false;
    });
    //debug graphics
      this.debugGraphics = this.add.graphics();

    // --- COLLISION LISTENERS (Star + Triangle pucks + Balls) ---
this.matter.world.on('collisionstart', (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    const goA = bodyA.gameObject;
    const goB = bodyB.gameObject;

    const aIsPuck = goA?.texture?.key === 'starPuck' || goA?.texture?.key === 'TrianglePuck';
    const bIsPuck = goB?.texture?.key === 'starPuck' || goB?.texture?.key === 'TrianglePuck';

    const aIsLeftSensor  = bodyA.label === 'goal_left';
    const bIsLeftSensor  = bodyB.label === 'goal_left';
    const aIsRightSensor = bodyA.label === 'goal_right';
    const bIsRightSensor = bodyB.label === 'goal_right';

    // --- Existing puck scoring logic ---
    if ((aIsPuck && bIsLeftSensor) || (bIsPuck && aIsLeftSensor)) {
      if (!this.leftOccupied) {
        this.leftOccupied = true;
        this.scoreLeft++;
        this.scoreLeftText.setText(`P1: ${this.scoreLeft}`); // Update the text
        console.log('Left goal scored:', this.scoreLeft);
      }
    }

    if ((aIsPuck && bIsRightSensor) || (bIsPuck && aIsRightSensor)) {
      if (!this.rightOccupied) {
        this.rightOccupied = true;
        this.scoreRight++;
        this.scoreRightText.setText(`P2: ${this.scoreRight}`); // Update the text
        console.log('Right goal scored:', this.scoreRight);
      }
    }

    // --- NEW: Ball attraction flagging ---
    const aIsBall = goA?.texture?.key?.startsWith('ball');
    const bIsBall = goB?.texture?.key?.startsWith('ball');

    if ((aIsBall && (bIsLeftSensor || bIsRightSensor)) ||
        (bIsBall && (aIsLeftSensor || aIsRightSensor))) {
      const ball = aIsBall ? goA : goB;
      if (ball) {
        ball.attracted = true;          // flag for attractor
        ball.setTint(0xff0000);         // visual debug: red tint
        // Increase air friction to add damping and reduce oscillation.
        ball.setFrictionAir(0.05); // Tune this value to taste
        console.log('Ball flagged for attraction:', ball.texture.key);
      }
    }
  });
});

this.matter.world.on('collisionend', (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    const goA = bodyA.gameObject;
    const goB = bodyB.gameObject;

    const aIsPuck = goA?.texture?.key === 'starPuck' || goA?.texture?.key === 'TrianglePuck';
    const bIsPuck = goB?.texture?.key === 'starPuck' || goB?.texture?.key === 'TrianglePuck';

    const aIsLeftSensor  = bodyA.label === 'goal_left';
    const bIsLeftSensor  = bodyB.label === 'goal_left';
    const aIsRightSensor = bodyA.label === 'goal_right';
    const bIsRightSensor = bodyB.label === 'goal_right';

    if ((aIsPuck && bIsLeftSensor) || (bIsPuck && aIsLeftSensor)) {
      this.leftOccupied = false;
    }
    if ((aIsPuck && bIsRightSensor) || (bIsPuck && aIsRightSensor)) {
      this.rightOccupied = false;
    }
  });
});

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

  update() {
    // Add debug overlay if desired
  // this.debugGraphics.clear();
// this.debugGraphics.lineStyle(2, 0xff0000);
// const exit = this.leftLauncher.getExitPoint();
// const pivot = this.leftLauncher.pivot.position;
// console.log('Pivot:', pivot.x, pivot.y, 'Exit:', exit.x, exit.y);
// this.debugGraphics.lineBetween(
 //  this.leftLauncher.pivot.position.x,
 //  this.leftLauncher.pivot.position.y,
 //  exit.x,
 //  exit.y
// );
// Prevent any updates if the game is not in the 'playing' state
    if (this.gameState !== 'playing') return;


    //Launcher Listeners
    const step = 0.03;
    if (this.keys.leftUp.isDown)   this.leftLauncher.setAngle(this.leftLauncher.getAngle() - step); 
    if (this.keys.leftDown.isDown) this.leftLauncher.setAngle(this.leftLauncher.getAngle() + step);
    if (this.keys.rightUp.isDown)  this.rightLauncher.setAngle(this.rightLauncher.getAngle() - step);
    if (this.keys.rightDown.isDown)this.rightLauncher.setAngle(this.rightLauncher.getAngle() + step);
  }

  
}
