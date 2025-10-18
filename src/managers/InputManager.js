// src/managers/InputManager.js
import { MainMenuScene } from '/src/scenes/MainMenuScene.js';
import { createStarPuck, createTrianglePuck } from '/factories/puckFactory.js';


export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.playerCount = 2;
    this.humanPlayerSide = 'left';
  }

  init(settings) {
    this.playerCount = settings.playerCount;
    this.humanPlayerSide = settings.humanPlayerSide;

    this.keys = this.scene.input.keyboard.addKeys({
      leftUp: 'W', leftDown: 'S',
      rightUp: 'UP', rightDown: 'DOWN',
      fireLeft: 'SPACE', fireRight: 'ENTER',
      reloadLeft: 'E', reloadRight: 'L',
      restart: 'R'
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.scene.input.keyboard.on('keydown-SPACE', () => {
      this.handleFire('left');
    });

    this.scene.input.keyboard.on('keydown-ENTER', () => {
      this.handleFire('right');
    });

    this.scene.input.keyboard.on('keydown-E', () => {
      this.handleReload('left');
    });

    this.scene.input.keyboard.on('keydown-L', () => {
      this.handleReload('right');
    });

    this.scene.input.keyboard.on('keydown-R', () => {
      this.handleRestart();
    });
}

  handleFire(side) {
    this.scene.gameStateManager.fireLauncher(side);
  }

  handleReload(side) {
    this.scene.gameStateManager.reloadLauncher(side);
  }

  handleRestart() {
    // THE FIX: Use the correct variable 'this.scene.gameStateManager.gameState'
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
    const step = 0.03;

    if (this.playerCount === 1) {
        if (this.humanPlayerSide === 'left') {
            if (this.keys.leftUp.isDown) this.scene.leftLauncher.setAngle(this.scene.leftLauncher.getAngle() - step);
            if (this.keys.leftDown.isDown) this.scene.leftLauncher.setAngle(this.scene.leftLauncher.getAngle() + step);
        } else {
            if (this.keys.rightUp.isDown) this.scene.rightLauncher.setAngle(this.scene.rightLauncher.getAngle() - step);
            if (this.keys.rightDown.isDown) this.scene.rightLauncher.setAngle(this.scene.rightLauncher.getAngle() + step);
        }
    } else if (this.playerCount === 2) {
        if (this.keys.leftUp.isDown) this.scene.leftLauncher.setAngle(this.scene.leftLauncher.getAngle() - step);
        if (this.keys.leftDown.isDown) this.scene.leftLauncher.setAngle(this.scene.leftLauncher.getAngle() + step);
        if (this.keys.rightUp.isDown) this.scene.rightLauncher.setAngle(this.scene.rightLauncher.getAngle() - step);
        if (this.keys.rightDown.isDown) this.scene.rightLauncher.setAngle(this.scene.rightLauncher.getAngle() + step);
    }
  }
}

