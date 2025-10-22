// src/managers/DebugMenuManager.js

export class DebugMenuManager {
  constructor(scene) {
    this.scene = scene;

    // UI elements
    this.debugMenu = null;
    this.aimingLineGraphics = null;
    this.leftAimerButton = null;
    this.rightAimerButton = null;

    // State flags
    this.isDebugVisible = false;
    this.isAimingLineLeftVisible = false;
    this.isAimingLineRightVisible = false;
  }

  init() {
    // This group will hold all the debug UI elements for easy toggling
    this.debugMenu = this.scene.add.group();

    // Create a semi-transparent background
    const bg = this.scene.add.graphics({ fillStyle: { color: 0x0a0a0a, alpha: 0.9 } });
    bg.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    bg.setScrollFactor(0).setDepth(250); // High depth to appear over everything
    this.debugMenu.add(bg);
    
    // --- UI Element Styles ---
    const titleStyle = { fontSize: '48px', fill: '#FFD700', fontFamily: '"Press Start 2P", Arial' };
    const buttonStyle = { fontSize: '24px', fill: '#FFFFFF', backgroundColor: '#333333', padding: { x: 8, y: 4 }};
    const interactiveButtonStyle = { ...buttonStyle, fill: '#00FF00' };

    // --- Menu Title ---
    const title = this.scene.add.text(this.scene.scale.width / 2, 80, '--- DEBUG MENU ---', titleStyle)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(251);
    this.debugMenu.add(title);
        
    // --- Aiming Line Toggles ---
    this.leftAimerButton = this.scene.add.text(this.scene.scale.width / 2, 180, 'Toggle Left Aimer [OFF]', interactiveButtonStyle)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(251)
        .setInteractive()
        .on('pointerdown', () => this.toggleAimingLine('left'));
    this.debugMenu.add(this.leftAimerButton);

    this.rightAimerButton = this.scene.add.text(this.scene.scale.width / 2, 240, 'Toggle Right Aimer [OFF]', interactiveButtonStyle)
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(251)
        .setInteractive()
        .on('pointerdown', () => this.toggleAimingLine('right'));
    this.debugMenu.add(this.rightAimerButton);

    // --- Create Graphics object for drawing ---
    // Low depth so it appears under pucks/balls but over the arena graphic
    this.aimingLineGraphics = this.scene.add.graphics().setDepth(50);

    // The menu starts hidden
    this.hide();
  }

  show() {
    this.debugMenu.setVisible(true);
    this.isDebugVisible = true;
  }

  hide() {
    this.debugMenu.setVisible(false);
    this.isDebugVisible = false;
  }

  toggleAimingLine(side) {
    if (side === 'left') {
      this.isAimingLineLeftVisible = !this.isAimingLineLeftVisible;
      const stateText = this.isAimingLineLeftVisible ? '[ON]' : '[OFF]';
      this.leftAimerButton.setText(`Toggle Left Aimer ${stateText}`);
    } else if (side === 'right') {
      this.isAimingLineRightVisible = !this.isAimingLineRightVisible;
      const stateText = this.isAimingLineRightVisible ? '[ON]' : '[OFF]';
      this.rightAimerButton.setText(`Toggle Right Aimer ${stateText}`);
    }
  }

  update() {
    // This is called every frame from PlayScene's update loop
    this.aimingLineGraphics.clear();

    if (this.isAimingLineLeftVisible) {
      const launcher = this.scene.leftLauncher;
      if (launcher) {
        const startX = launcher.pivot.position.x;
        const startY = launcher.pivot.position.y;
        const angle = launcher.getAngle();
        const length = 3000; // A long line to represent the trajectory
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;

        this.aimingLineGraphics.lineStyle(4, 0x0000ff, 0.5); // Blue, 50% transparent
        this.aimingLineGraphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
      }
    }

    if (this.isAimingLineRightVisible) {
      const launcher = this.scene.rightLauncher;
      if (launcher) {
        const startX = launcher.pivot.position.x;
        const startY = launcher.pivot.position.y;
        const angle = launcher.getAngle();
        const length = 3000;
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;
        
        this.aimingLineGraphics.lineStyle(4, 0xff0000, 0.5); // Red, 50% transparent
        this.aimingLineGraphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, endX, endY));
      }
    }
  }
}
