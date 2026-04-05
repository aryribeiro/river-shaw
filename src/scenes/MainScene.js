import Phaser from 'phaser';
import { GameConfig } from '../config.js';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.attractMode = true;
    
    // Title text
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    this.add.text(centerX, centerY - 100, 'RIVER SHAW', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY - 50, '...em homenagem a Carol Raid!', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY - 20, 'by Ary Ribeiro', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);
    
    const startText = this.add.text(centerX, centerY + 50, 'Press SPACE to start', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Blinking effect
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      ease: 'Linear',
      yoyo: true,
      repeat: -1
    });
    
    // Instructions
    this.add.text(centerX, centerY + 150, 'CONTROLS', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 180, 'Arrow Keys / WASD - Move', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 200, 'SPACE - Fire', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    this.add.text(centerX, centerY + 220, 'UP/DOWN - Speed', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Input
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Touch support
    this.input.on('pointerdown', () => {
      this.startGame();
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame();
    }
  }

  startGame() {
    this.scene.stop('MainScene');
    this.scene.start('GameScene');
  }
}
