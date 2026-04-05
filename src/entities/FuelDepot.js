import Phaser from 'phaser';
import { GameConfig } from '../config.js';

export class FuelDepot extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'depot');
    
    this.scene = scene;
    this.isDestroyed = false;
    this.scoreValue = GameConfig.FUEL_DEPOT_SCORE;
    
    this.setScale(3); // Maior para ser mais visível
    scene.physics.add.existing(this);
    this.body.setSize(14, 14);
    
    // Adicionar brilho para destacar
    this.setTint(0xffff00);
  }

  update(delta) {
    if (this.isDestroyed) return;
    
    // Remove if off screen
    if (this.y > this.scene.cameras.main.height + 50) {
      this.destroy();
    }
  }

  explode() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.body.enable = false;
    
    // Play explosion
    if (this.scene.sounds && this.scene.sounds.explosion) {
      this.scene.sounds.explosion.play();
    }
    
    // Create explosion sprite
    const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
    explosion.setScale(2);
    explosion.play('explode');
    explosion.once('animationcomplete', () => {
      explosion.destroy();
    });
    
    this.destroy();
  }
}
