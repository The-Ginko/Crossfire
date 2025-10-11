// src/scenes/PlayScene.js
import { createStarPuck, createTrianglePuck } from '/factories/puckFactory.js';
import { createArena } from '/factories/arenaFactory.js';
import { createLauncher, } from '/factories/launcherFactory.js';
import { createAttractor } from '/factories/attractorFactory.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.leftOccupied = false;
    this.rightOccupied = false;
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
    const troughWidth  = 10; // narrow strip down the centerline
    const effectiveRadius = 100; // tune to taste

    const leftAttractor = createAttractor(this, arena.bounds.xLeft + arena.goalDepth / 2, cy, troughWidth, troughHeight, effectiveRadius);
    const rightAttractor = createAttractor(this, arena.bounds.xRight - arena.goalDepth / 2, cy, troughWidth, troughHeight, effectiveRadius);

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
  exitOffset: 40   // pulls spawn point 10px back into the barrel
});
console.log('Left launcher created:', this.leftLauncher);

// Right launcher, pointing left (angle PI)
this.rightLauncher = createLauncher(this, 'right', arena.bounds, {
  initialAngle: Math.PI,
  ballTexture: 'ball0',
  exitOffset: 40   // pulls spawn point 10px back into the barrel
});
console.log('Right launcher created:', this.rightLauncher);

      this.keys = this.input.keyboard.addKeys({
     leftUp: 'W', leftDown: 'S',
      rightUp: 'UP', rightDown: 'DOWN'
   });
    // hard coded test launcher for debugging
    this.testLauncher = launcherFactory.createLauncher(this, 'test', arena.bounds, {
    initialAngle: 0,
    ballTexture: 'ball0',
    exitOffset: 40
    });
    this.testLauncher.sprite.setPosition(400, 300); // middle of screen


    // --- Input bindings ---
  // Left launcher fires on SPACE
  this.input.keyboard.on('keydown-SPACE', () => {
    this.leftLauncher.fireBall(this);
  });

  // Right launcher fires on ENTER
  this.input.keyboard.on('keydown-ENTER', () => {
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
        console.log('Left goal scored:', this.scoreLeft);
      }
    }

    if ((aIsPuck && bIsRightSensor) || (bIsPuck && aIsRightSensor)) {
      if (!this.rightOccupied) {
        this.rightOccupied = true;
        this.scoreRight++;
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



    //Launcher Listeners
    const step = 0.03;
    if (this.keys.leftUp.isDown)   this.leftLauncher.setAngle(this.leftLauncher.getAngle() - step); 
    if (this.keys.leftDown.isDown) this.leftLauncher.setAngle(this.leftLauncher.getAngle() + step);
    if (this.keys.rightUp.isDown)  this.rightLauncher.setAngle(this.rightLauncher.getAngle() - step);
    if (this.keys.rightDown.isDown)this.rightLauncher.setAngle(this.rightLauncher.getAngle() + step);
  }

  
}
