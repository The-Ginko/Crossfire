// src/managers/UIManager.js

export class UIManager {
  constructor(scene) {
    this.scene = scene;

    // UI elements
    this.scoreLeftText = null;
    this.scoreRightText = null;
    this.ammoLeftText = null;
    this.ammoRightText = null;
    this.countdownText = null;
    this.gameOverUI = null;
    this.modeText = null;

    // Config
    this.countdownInterval = 1000;
  }

  createUI() {
    this.modeText = this.scene.add.text(this.scene.scale.width / 2, 30, `Mode: ${this.scene.gameMode} | Players: ${this.scene.playerCount}`, {
        fontSize: '24px',
        fill: '#FFF',
        fontFamily: '"Press Start 2P", Arial'
    }).setOrigin(0.5);

    const scoreTextStyle = {
        fontSize: '48px',
        fill: '#FFFFFF',
        fontFamily: '"Press Start 2P", Arial',
        stroke: '#000000',
        strokeThickness: 8
    };

    this.scoreLeftText = this.scene.add.text(50, 30, `P1: 0`, scoreTextStyle)
        .setOrigin(0, 0.5)
        .setScrollFactor(0);

    this.scoreRightText = this.scene.add.text(this.scene.scale.width - 50, 30, `P2: 0`, scoreTextStyle)
        .setOrigin(1, 0.5)
        .setScrollFactor(0);
    
    this.ammoLeftText = this.scene.add.text(16, 80, `Ammo: 20`, { fontSize: '24px', fill: '#FFF' });
    this.ammoRightText = this.scene.add.text(this.scene.cameras.main.width - 200, 80, `Ammo: 20`, { fontSize: '24px', fill: '#FFF' });
    
    // THE FIX: Restore these properties on the scene object itself for the AI
    this.scene.ammoLeftText = this.ammoLeftText;
    this.scene.ammoRightText = this.ammoRightText;
  }

  updateScores(scoreLeft, scoreRight) {
    this.scoreLeftText.setText(`P1: ${scoreLeft}`);
    this.scoreRightText.setText(`P2: ${scoreRight}`);
  }

  updateAmmo(ammoLeft, ammoRight) {
    this.ammoLeftText.setText(`Ammo: ${ammoLeft}`);
    this.ammoRightText.setText(`Ammo: ${ammoRight}`);
  }
  
  startRoundCountdown() {
    if (!this.countdownText) {
      this.countdownText = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY, '', {
        fontSize: '128px',
        fill: '#FFF',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(100);
    }

    let count = 3;
    this.countdownText.setText(count.toString()).setVisible(true);

    if (this.countdownTimer) {
      this.countdownTimer.remove();
    }

    this.countdownTimer = this.scene.time.addEvent({
      delay: this.countdownInterval,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else if (count === 0) {
          this.countdownText.setText('Fire!');
        } else {
          this.countdownText.setVisible(false);
          this.scene.gameStateManager.setGameState('playing'); // Use the manager
          if (this.countdownTimer) {
            this.countdownTimer.remove();
            this.countdownTimer = null;
          }
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  handleGameOver(winner) {
    this.scene.gameStateManager.setGameState('gameOver'); // Use the manager
    if (this.countdownTimer) {
      this.countdownTimer.remove();
      this.countdownTimer = null;
    }

    this.gameOverUI = this.scene.add.group();

    const bg = this.scene.add.graphics({ fillStyle: { color: 0x000000, alpha: 0.7 } });
    bg.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    bg.setScrollFactor(0).setDepth(150);

    const winTextObject = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY - 50, `${winner} Wins!`, {
      fontSize: '84px',
      fill: '#FFD700',
      fontFamily: '"Press Start 2P", Arial',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    const restartTextObject = this.scene.add.text(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY + 50, 'Press R to Restart', {
      fontSize: '32px',
      fill: '#FFFFFF',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.gameOverUI.add(bg);
    this.gameOverUI.add(winTextObject);
    this.gameOverUI.add(restartTextObject);
  }
}

