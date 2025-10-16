// src/scenes/PlayScene.js
import { createStarPuck, createTrianglePuck } from '/factories/puckFactory.js';
import { createArena } from '/factories/arenaFactory.js';
import { createLauncher, } from '/factories/launcherFactory.js';
import { createAttractor } from '/factories/attractorFactory.js';
import { createRepulsor } from '/factories/repulsorFactory.js';

export class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
        this.gameState = 'playing'; // The game starts in a 'playing' state.
    this.scoreLeftText = null;
    this.scoreRightText = null;
    // --- Ball Inventory & Ammunition ---
    this.totalBallCount = 40;
    // --- Timing & Tweakables ---
    this.countdownInterval = 1000; // ms between countdown numbers
    this.blitzPuckReturnDelay = 500; // ms for puck to return in Blitz mode
    this.winScore = 3; // Score needed to win
    this.gameOverUI = null; // Group for game over screen elements
    this.countdownText = null;
  }

  init() {
    // This method is called every time the scene starts or restarts.
    // All game state variables should be reset here.
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.launcherLeftAmmo = 20;
    this.launcherRightAmmo = 20;
    this.gameMode = 'Classic'; // Can be 'Classic', 'Blitz', or 'Debug'
    this.gameState = 'countdown'; // Can be 'countdown', 'playing', 'paused', 'gameOver'
    this.scoredPucks = 0;
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
    // --- Scene Cleanup ---
    // This is no longer needed here, as it's handled before the scene restarts.
    // if (this.gameOverUI) {
    //   this.gameOverUI.destroy(true);
    //   this.gameOverUI = null;
    // }
    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }

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

    // --- Ammunition Displays ---
    this.ammoLeftText = this.add.text(16, 50, `Ammo: ${this.launcherLeftAmmo}`, { fontSize: '24px', fill: '#FFF' });
    this.ammoRightText = this.add.text(this.cameras.main.width - 200, 50, `Ammo: ${this.launcherRightAmmo}`, { fontSize: '24px', fill: '#FFF' });
    
    // --- CAMERA AUTO-FIT + STATIC POSITIONING ---
if (this.arena?.bounds) {
    // Destructure the arena's outer boundaries for clarity.
    const { xOuterLeft, xOuterRight, yTop, yBot } = this.arena.bounds;

    // --- 1. Define Layout Constraints ---
    const topMarginPercentage = 0.20;
    const viewportHeight = this.scale.height;
    const viewportWidth = this.scale.width;
    const topMarginInPixels = viewportHeight * topMarginPercentage;

    // --- 2. Calculate Arena Dimensions & Available Space ---
    const availableHeight = viewportHeight - topMarginInPixels;
    const fullWidth = xOuterRight - xOuterLeft;
    const fullHeight = yBot - yTop;

    // --- 3. Calculate and Apply Zoom ---
    // Determine the correct zoom level to fit the arena within the available space
    // below the top margin, while maintaining the aspect ratio.
    const zoomX = viewportWidth / fullWidth;
    const zoomY = availableHeight / fullHeight;
    const zoom = Math.min(zoomX, zoomY);
    this.cameras.main.setZoom(zoom);

    // --- 4. Calculate New Center Point for Anchoring ---
    // To anchor the arena to the bottom with a top margin, we need to shift
    // the camera's center point upwards. This will push the rendered arena down.

    // The horizontal center is simply the center of the arena.
    const centerX = this.arena.center.cx;

    // The vertical center needs to be offset. We start with the arena's true center
    // and shift it UP by half the size of the top margin (in world units).
    const verticalOffset = (topMarginInPixels / 2) / zoom;
    const centerY = this.arena.center.cy - verticalOffset; // <-- THE FIX IS HERE (was +)

    // --- 5. Apply Centering ---
    // centerOn() will correctly position the camera based on our calculated
    // center point and the current zoom level.
    this.cameras.main.centerOn(centerX, centerY);

    // Camera is now static and correctly positioned. No follow or bounds needed.
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
      // Only allow firing when the game is in the 'playing' state and has ammo
      if (this.gameState !== 'playing') return;

      if (this.launcherLeftAmmo > 0) {
        this.leftLauncher.fireBall(this);
        this.launcherLeftAmmo--;
        this.ammoLeftText.setText(`Ammo: ${this.launcherLeftAmmo}`);
      }
    });

    // Right launcher fires on ENTER
    this.input.keyboard.on('keydown-ENTER', () => {
      // Only allow firing when the game is in the 'playing' state and has ammo
      if (this.gameState !== 'playing') return;

      if (this.launcherRightAmmo > 0) {
        this.rightLauncher.fireBall(this);
        this.launcherRightAmmo--;
        this.ammoRightText.setText(`Ammo: ${this.launcherRightAmmo}`);
      }
    });

    
    // --- Ball Return / Reload ---
    // Left player reloads with 'E'
    this.input.keyboard.on('keydown-E', () => {
      if (this.gameState !== 'playing') return;
      // Find an attracted ball specifically in the left trough using the correct API
      const attractedBallBody = this.matter.world.getAllBodies().find(body =>
        body.gameObject?.attractedTo === 'left'
      );

      if (attractedBallBody) {
        // Add one to ammo and update the text
        this.launcherLeftAmmo++;
        this.ammoLeftText.setText(`Ammo: ${this.launcherLeftAmmo}`);

        // Remove the ball from the world
        this.matter.world.remove(attractedBallBody); // Use the matter world removal method
        if (attractedBallBody.gameObject) {
            attractedBallBody.gameObject.destroy();
        }
      }
    });

    // Right player reloads with 'L' 
    this.input.keyboard.on('keydown-L', () => {
      if (this.gameState !== 'playing') return;
      // Find an attracted ball specifically in the right trough using the correct API
      const attractedBallBody = this.matter.world.getAllBodies().find(body =>
        body.gameObject?.attractedTo === 'right'
      );

      if (attractedBallBody) {
        // Add one to ammo and update the text
        this.launcherRightAmmo++;
        this.ammoRightText.setText(`Ammo: ${this.launcherRightAmmo}`);

        // Remove the ball from the world
        this.matter.world.remove(attractedBallBody); // Use the matter world removal method
        if (attractedBallBody.gameObject) {
            attractedBallBody.gameObject.destroy();
        }
      }
    });
    
    // Respawn key (R)
    this.input.keyboard.on('keydown-R', () => {
      const cx = this.scale.width / 2;
      const cy = this.scale.height / 2;
      
      if (this.gameState === 'gameOver') {
        // *** THIS IS THE FIX ***
        // Destroy the Game Over UI *before* restarting the scene.
        if (this.gameOverUI) {
          this.gameOverUI.destroy(true);
          this.gameOverUI = null;
        }
        
        // The init() method will handle resetting the state variables.
        this.scene.restart();

      } else if (this.gameState == 'playing') {
        // If playing, just respawn the pucks for testing
        this.destroyPuck(this.puck, 'star');
        this.destroyPuck(this.triPuck, 'triangle');
        this.puck = createStarPuck(this, cx, cy);
        this.triPuck = createTrianglePuck(this, cx + 300, cy);
        
      }//this.cameras.main.startFollow(this.puck.star, true, 0.15, 0.15);
    });
    //debug graphics
      this.debugGraphics = this.add.graphics();

    // --- COLLISION LISTENERS (Star + Triangle pucks + Balls) ---
    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        const goA = bodyA.gameObject;
        const goB = bodyB.gameObject;

        // Identify the puck, ball, and sensors
        const puck = (goA?.texture?.key === 'starPuck' || goA?.texture?.key === 'TrianglePuck') ? goA :
                     (goB?.texture?.key === 'starPuck' || goB?.texture?.key === 'TrianglePuck') ? goB : null;
        const ball = (goA?.texture?.key?.startsWith('ball')) ? goA :
                     (goB?.texture?.key?.startsWith('ball')) ? goB : null;

        const isLeftSensor = (bodyA.label === 'goal_left' || bodyB.label === 'goal_left');
        const isRightSensor = (bodyA.label === 'goal_right' || bodyB.label === 'goal_right');

        // --- Puck Scoring and Attraction Logic ---
          if (puck && !puck.attracted && (isLeftSensor || isRightSensor)) {
          puck.attracted = true;
          puck.setTint(0x00ff00);
          puck.setFrictionAir(0.05);

          if (isLeftSensor) {
            this.scoreLeft++;
            this.scoreLeftText.setText(`P1: ${this.scoreLeft}`);
          } else if (isRightSensor) {
            this.scoreRight++;
            this.scoreRightText.setText(`P2: ${this.scoreRight}`);
          }

          // --- Win Condition Check ---
          if (this.gameMode !== 'Debug') {
            if (this.scoreLeft >= this.winScore) {
              this.handleGameOver('P1');
            } else if (this.scoreRight >= this.winScore) {
              this.handleGameOver('P2');
            } else {
              // Only handle puck respawn if the game isn't over
              this.handlePuckScored(puck);
            }
          } else {
             // In debug mode, just handle the puck respawn without checking for a winner
            this.handlePuckScored(puck);
          }
        }

        // --- Ball Attraction Logic ---
        if (ball && !ball.attracted) {
          if (isLeftSensor) {
            ball.attracted = true;
            ball.attractedTo = 'left'; // Tag for the left trough
            ball.setTint(0xff0000);
            ball.setFrictionAir(0.05);
            console.log('Ball flagged for left trough:', ball.texture.key);
          } else if (isRightSensor) {
            ball.attracted = true;
            ball.attractedTo = 'right'; // Tag for the right trough
            ball.setTint(0xfe9900);
            ball.setFrictionAir(0.05);
            console.log('Ball flagged for right trough:', ball.texture.key);}
        }
      });
    });

    this.matter.world.on('collisionend', (event) => {
      // The 'occupied' flags were removed, so this listener is currently not needed for pucks.
      // It can be used for other logic later if required.
    });

    this.startRoundCountdown();
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


  startRoundCountdown() {
    this.gameState = 'countdown';

    // Create a countdown text object if it doesn't exist
    if (!this.countdownText) {
      this.countdownText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, '', {
        fontSize: '128px',
        fill: '#FFF',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.countdownText.setDepth(100); 
    }

    let count = 3;
    this.countdownText.setText(count.toString()).setVisible(true);

    // If a timer already exists, remove it before creating a new one.
  if (this.countdownTimer) {
    this.countdownTimer.remove();
  }

  // Assign the new timer event to a property on the scene
  this.countdownTimer = this.time.addEvent({
      delay: this.countdownInterval,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else if (count === 0) {
          this.countdownText.setText('Fire!');
        } else {
          // Countdown is finished
          this.countdownText.setVisible(false);
          this.gameState = 'playing';

          // --- THIS IS THE FIX ---
          // Use 'this.countdownTimer' to refer to the scene's timer property.
          if (this.countdownTimer) {
            this.countdownTimer.remove(); 
            this.countdownTimer = null; // Clear the reference
          }
        }
      },
      callbackScope: this,
      loop: true
    });
  }
  
    
 handlePuckScored(puckGameObject) {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    if (this.gameMode === 'Blitz') {
      const isStarPuck = puckGameObject.texture.key === 'starPuck';

      this.time.delayedCall(this.blitzPuckReturnDelay, () => {
        if (isStarPuck) {
          this.destroyPuck(this.puck, 'star'); // CORRECT: Uses this.puck
          this.puck = createStarPuck(this, cx, cy); // CORRECT: Assigns to this.puck
          //this.cameras.main.startFollow(this.puck.star, true, 0.15, 0.15);
        } else {
          this.destroyPuck(this.triPuck, 'triangle'); // CORRECT: Uses this.triPuck
          this.triPuck = createTrianglePuck(this, cx + 300, cy); // CORRECT: Assigns to this.triPuck
        }
      });

    } else if (this.gameMode === 'Classic' || this.gameMode === 'Debug') {
      this.scoredPucks++;
      if (this.scoredPucks >= 2) {
        this.gameState = 'paused';
        this.time.delayedCall(1000, () => {
          // Replicating the "R" key logic EXACTLY
          this.destroyPuck(this.puck, 'star');
          this.destroyPuck(this.triPuck, 'triangle');

          this.puck = createStarPuck(this, cx, cy);
          this.triPuck = createTrianglePuck(this, cx + 300, cy);

          //this.cameras.main.startFollow(this.puck.star, true, 0.15, 0.15);
          this.scoredPucks = 0;
          this.startRoundCountdown();
        });
      }
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

  handleGameOver(winner) {
    // Stop any active countdown timer to prevent state conflicts
  if (this.countdownTimer) {
    this.countdownTimer.remove();
    this.countdownTimer = null;
  }
    this.gameState = 'gameOver';
    //this.cameras.main.stopFollow();

    // Create a group to hold all game over UI elements
    this.gameOverUI = this.add.group();

    const winText = `${winner} Wins!`;
    const restartText = 'Press R to Restart';

    // Create a semi-transparent background
    const bg = this.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    bg.setScrollFactor(0);
    bg.setDepth(150);

    // Display "Player X Wins!" text
    const winTextObject = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, winText, {
      fontSize: '84px',
      fill: '#FFD700',
      fontFamily: '"Press Start 2P", Arial',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    // Display "Press R to Restart" text
    const restartTextObject = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, restartText, {
      fontSize: '32px',
      fill: '#FFFFFF',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
      
    // Add all UI elements to the group for easy cleanup
    this.gameOverUI.add(bg);
    this.gameOverUI.add(winTextObject);
    this.gameOverUI.add(restartTextObject);
  }

}