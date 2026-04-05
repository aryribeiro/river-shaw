import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MainScene } from './scenes/MainScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene } from './scenes/HUDScene.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#000064',
  pixelArt: true,
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
      fps: 60
    }
  },
  scene: [BootScene, MainScene, GameScene, HUDScene]
};

const game = new Phaser.Game(config);
