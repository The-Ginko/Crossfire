// src/managers/InputManager.js
export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.playerCount = 2;
    this.humanPlayerSide = 'left';

    // Player 1 settings
    this.p1_inputType = 'keyboard';
    this.p1_controlScheme = 'acceleration';
    // Player 2 settings
    this.p2_controlScheme = 'acceleration';

    // Acceleration properties
    this.leftRotationSpeed = 0;
    this.rightRotationSpeed = 0;
    this.rotationAcceleration = 0.0005;
    this.maxRotationSpeed = 0.025;
    this.rotationDamping = .9;

    // Fine Aim properties
    this.fastStep = 0.02;
    this.slowStep = 0.005;
  }

  init(settings) {
    this.playerCount = settings.playerCount;
    this.humanPlayerSide = settings.humanPlayerSide;

    // Retrieve settings from the global registry
    this.p1_inputType = this.scene.game.registry.get('p1_inputType');
    this.p1_controlScheme = this.scene.game.registry.get('p1_controlScheme');
    this.p2_controlScheme = this.scene.game.registry.get('p2_controlScheme');

    this.keys = this.scene.input.keyboard.addKeys({
      leftUp: 'W', leftDown: 'S', rightUp: 'UP', rightDown: 'DOWN',
      fireLeft: 'SPACE', fireRight: 'ENTER', reloadLeft: 'E', reloadRight: 'L',
      restart: 'R', pause: 'P',
      p1_fineAim: 'SHIFT', p2_fineAim: 'NUMPAD_ZERO' // Example: P2 uses Numpad 0
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Player 1 Listeners
    if (this.p1_inputType === 'keyboard') {
      if (this.playerCount === 2 || this.humanPlayerSide === 'left') {
        this.scene.input.keyboard.on('keydown-SPACE', () => this.handleFire('left'));
        this.scene.input.keyboard.on('keydown-E', () => this.handleReload('left'));
      } else { // 1P on right side
        this.scene.input.keyboard.on('keydown-ENTER', () => this.handleFire('right'));
        this.scene.input.keyboard.on('keydown-L', () => this.handleReload('right'));
      }
    } else if (this.p1_inputType === 'mouse' && this.playerCount === 1) {
      this.scene.input.on('pointerdown', (pointer) => {
        if (pointer.leftButtonDown()) this.handleFire(this.humanPlayerSide);
        else if (pointer.rightButtonDown()) this.handleReload(this.humanPlayerSide);
      });
    }

    // Player 2 Listeners (always keyboard)
    if (this.playerCount === 2) {
        this.scene.input.keyboard.on('keydown-ENTER', () => this.handleFire('right'));
        this.scene.input.keyboard.on('keydown-L', () => this.handleReload('right'));
    }
    
    // Global Listeners
    this.scene.input.keyboard.on('keydown-R', () => this.handleRestart());
    this.scene.input.keyboard.on('keydown-P', () => this.scene.gameStateManager.togglePause());
  }

  handleFire(side) {
    // --- THIS IS THE NEW LOGIC ---
    // Check if this shot is from the human player
    const isHumanShot = (this.playerCount === 1 && side === this.humanPlayerSide) ||
                          (this.playerCount === 2); // In 2P, both are human

    // We pass this info to the GameStateManager
    const fired = this.scene.gameStateManager.fireLauncher(side, isHumanShot);
    // --- END NEW LOGIC ---
  }

  handleReload(side) { this.scene.gameStateManager.reloadLauncher(side); }

  handleRestart() {
    const currentGameState = this.scene.gameStateManager.gameState;
    if (currentGameState === 'gameOver') {
      if (this.scene.uiManager.gameOverUI) {
        this.scene.uiManager.gameOverUI.destroy(true);
        this.scene.uiManager.gameOverUI = null;
      }
      this.scene.scene.restart();
    } else if (currentGameState === 'playing') {
      this.scene.respawnPucks();
    }
  }

  update() {
    if (this.scene.gameStateManager.isPaused) return;

    // --- Player 1 Controls ---
    if (this.playerCount === 1) {
        if (this.p1_inputType === 'mouse') {
            this._updateMouseControls();
        } else { // Keyboard
            const launcher = this.humanPlayerSide === 'left' ? 'left' : 'right';
            if (this.p1_controlScheme === 'acceleration') this._updateAcceleration(launcher);
            else this._updateFineAim(launcher, 1);
        }
    }

    // --- 2 Player Keyboard Controls ---
    if (this.playerCount === 2) {
        if (this.p1_controlScheme === 'acceleration') this._updateAcceleration('left');
        else this._updateFineAim('left', 1);

        if (this.p2_controlScheme === 'acceleration') this._updateAcceleration('right');
        else this._updateFineAim('right', 2);
    }
  }
  
  _updateMouseControls() {
    const pointer = this.scene.input.activePointer;
    const launcher = (this.humanPlayerSide === 'left') ? this.scene.leftLauncher : this.scene.rightLauncher;
    if (!launcher) return;
    const targetAngle = Phaser.Math.Angle.Between(launcher.pivot.position.x, launcher.pivot.position.y, pointer.worldX, pointer.worldY);
    launcher.setAngle(targetAngle);
  }

  _updateAcceleration(side) {
    const launcher = side === 'left' ? this.scene.leftLauncher : this.scene.rightLauncher;
    const upKey = side === 'left' ? this.keys.leftUp : this.keys.rightUp;
    const downKey = side === 'left' ? this.keys.leftDown : this.keys.rightDown;
    let speed = side === 'left' ? this.leftRotationSpeed : this.rightRotationSpeed;

    if (upKey.isDown) speed -= this.rotationAcceleration;
    else if (downKey.isDown) speed += this.rotationAcceleration;
    else speed *= this.rotationDamping;

    speed = Phaser.Math.Clamp(speed, -this.maxRotationSpeed, this.maxRotationSpeed);
    if (Math.abs(speed) > 0.0001) launcher.setAngle(launcher.getAngle() + speed);

    if (side === 'left') this.leftRotationSpeed = speed;
    else this.rightRotationSpeed = speed;
  }

  _updateFineAim(side, playerNum) {
    const launcher = side === 'left' ? this.scene.leftLauncher : this.scene.rightLauncher;
    const upKey = side === 'left' ? this.keys.leftUp : this.keys.rightUp;
    const downKey = side === 'left' ? this.keys.leftDown : this.keys.rightDown;
    const fineAimKey = playerNum === 1 ? this.keys.p1_fineAim : this.keys.p2_fineAim;

    const currentStep = fineAimKey.isDown ? this.slowStep : this.fastStep;

    if (upKey.isDown) launcher.setAngle(launcher.getAngle() - currentStep);
    if (downKey.isDown) launcher.setAngle(launcher.getAngle() + currentStep);
  }
}