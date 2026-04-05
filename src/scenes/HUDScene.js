import Phaser from 'phaser';
import { GameConfig } from '../config.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  create() {
    const width = this.cameras.main.width;
    
    // Background panel
    const panel = this.add.rectangle(0, 0, width, 60, 0x000000, 0.7);
    panel.setOrigin(0, 0);
    
    // Score
    this.add.text(10, 10, 'SCORE', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    });
    
    this.scoreText = this.add.text(10, 25, '0', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    });
    
    // Lives
    this.add.text(width - 80, 10, 'LIVES', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    });
    
    this.livesText = this.add.text(width - 80, 25, 'x3', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    });
    
    // Fuel gauge
    this.add.text(width / 2 - 50, 10, 'FUEL', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff'
    });
    
    this.fuelBar = this.add.rectangle(width / 2 - 50, 35, 100, 15, 0x00ff00);
    this.fuelBar.setOrigin(0, 0.5);
    
    this.fuelBarBorder = this.add.rectangle(width / 2 - 50, 35, 100, 15);
    this.fuelBarBorder.setStrokeStyle(2, 0xffffff);
    this.fuelBarBorder.setOrigin(0, 0.5);
    
    // Message text
    this.messageText = this.add.text(width / 2, this.cameras.main.height / 2, '', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    });
    this.messageText.setOrigin(0.5);
    this.messageText.setVisible(false);
    
    // Fuel warning
    this.fuelWarningActive = false;
    this.fuelWarningTimer = null;
  }

  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText(score.toString());
    }
  }

  updateLives(lives) {
    if (this.livesText) {
      this.livesText.setText('x' + lives);
    }
  }

  updateFuelLevel(fuelPercent) {
    if (!this.fuelBar) return;
    
    const oldPercent = this.fuelBar.width;
    this.fuelBar.width = fuelPercent;
    
    // Color gradient based on fuel level
    if (fuelPercent > 50) {
      this.fuelBar.setFillStyle(0x00ff00); // Green
    } else if (fuelPercent > 25) {
      this.fuelBar.setFillStyle(0xffff00); // Yellow
    } else {
      this.fuelBar.setFillStyle(0xff0000); // Red
    }
    
    // Start/stop fuel warning
    if (oldPercent > GameConfig.FUEL_WARNING_THRESHOLD && fuelPercent <= GameConfig.FUEL_WARNING_THRESHOLD) {
      this.startFuelWarning();
    }
    
    if (oldPercent <= GameConfig.FUEL_WARNING_THRESHOLD && fuelPercent > GameConfig.FUEL_WARNING_THRESHOLD) {
      this.stopFuelWarning();
    }
  }

  showMessage(text) {
    if (!this.messageText) return;
    
    this.messageText.setText(text);
    this.messageText.setVisible(true);
    
    // Fade in animation
    this.messageText.setAlpha(0);
    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  clearMessage() {
    if (!this.messageText) return;
    
    this.tweens.add({
      targets: this.messageText,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.messageText.setVisible(false);
      }
    });
  }

  startFuelWarning() {
    if (this.fuelWarningActive) return;
    
    this.fuelWarningActive = true;
    this.fuelBarBorder.setStrokeStyle(2, 0xff0000);
    
    const fuelWarningSfx = this.sound.add('fuelWarning');
    fuelWarningSfx.play();
    
    this.fuelWarningTimer = this.time.addEvent({
      delay: GameConfig.FUEL_WARNING_INTERVAL,
      callback: () => {
        if (this.fuelWarningActive) {
          fuelWarningSfx.play();
        }
      },
      loop: true
    });
  }

  stopFuelWarning() {
    this.fuelWarningActive = false;
    this.fuelBarBorder.setStrokeStyle(2, 0xffffff);
    
    if (this.fuelWarningTimer) {
      this.fuelWarningTimer.remove();
      this.fuelWarningTimer = null;
    }
  }
}
