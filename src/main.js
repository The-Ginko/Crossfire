import { MainMenuScene } from './scenes/MainMenuScene.js'; // Import the new scene
import { PlayScene } from './scenes/PlayScene.js';

const config = {
  type: Phaser.AUTO,
  title: 'Crossfire Demo',
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  scene: [MainMenuScene, PlayScene], // Add MainMenuScene before PlayScene
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 },
      debug: {
        showBody: true,
        showStaticBody: true
      }
    }
  }
};

new Phaser.Game(config);