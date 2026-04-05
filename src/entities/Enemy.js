import Phaser from 'phaser';
import { GameConfig } from '../config.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, type);
    
    this.scene = scene;
    this.enemyType = type;
    this.isDestroyed = false;
    this.isMoving = false; // IMPORTANTE: só move quando entra na tela
    this.directionFlipped = false;
    
    this.setScale(3);
    scene.physics.add.existing(this);
    
    // Configure based on type
    this.setupEnemyType();
    
    // Start animation
    this.play(this.animKey);
    
    console.log('🎯 Enemy criado:', type, 'em x:', x, 'y:', y);
  }

  setupEnemyType() {
    switch (this.enemyType) {
      case 'helicopter':
        this.isAquatic = false;
        this.minSpeed = GameConfig.HELICOPTER_MIN_SPEED;
        this.maxSpeed = GameConfig.HELICOPTER_MAX_SPEED;
        this.scoreValue = GameConfig.HELICOPTER_SCORE;
        this.animKey = 'helicopter-fly';
        this.body.setSize(10, 10); // Hitbox menor
        break;
        
      case 'jet':
        this.isAquatic = false;
        this.minSpeed = GameConfig.JET_MIN_SPEED;
        this.maxSpeed = GameConfig.JET_MAX_SPEED;
        this.scoreValue = GameConfig.JET_SCORE;
        this.animKey = 'jet-fly';
        this.body.setSize(10, 10); // Hitbox menor
        break;
        
      case 'tanker':
        this.isAquatic = true;
        this.minSpeed = GameConfig.TANKER_MIN_SPEED;
        this.maxSpeed = GameConfig.TANKER_MAX_SPEED;
        this.scoreValue = GameConfig.TANKER_SCORE;
        this.animKey = 'tanker-float';
        this.body.setSize(20, 10); // Hitbox menor
        break;
    }
    
    this.horizontalSpeed = Phaser.Math.Between(this.minSpeed, this.maxSpeed);
  }

  update(delta) {
    if (this.isDestroyed) return;
    
    // Sempre ativa quando está na tela
    if (!this.isMoving && this.y > -100) {
      this.isMoving = true;
    }
    
    if (!this.isMoving) return;
    
    // Movimento horizontal APENAS para inimigos aéreos (FIEL AO ORIGINAL)
    if (!this.isAquatic) {
      const deltaSeconds = delta / 1000;
      const movementX = (this.directionFlipped ? 1 : -1) * this.horizontalSpeed * deltaSeconds;
      this.x += movementX;
    }
    
    // Remove if off screen (posição global considerando container)
    const globalY = this.y + (this.parentContainer ? this.parentContainer.y : 0);
    const globalX = this.x + (this.parentContainer ? this.parentContainer.x : 0);
    
    if (globalY > this.scene.cameras.main.height + 50 ||
        globalX < -50 || globalX > this.scene.cameras.main.width + 50) {
      this.destroy();
    }
  }

  flipDirection() {
    this.setFlipX(!this.flipX);
    this.directionFlipped = !this.directionFlipped;
  }

  explode() {
    if (this.isDestroyed) return;
    
    this.isDestroyed = true;
    this.isMoving = false;
    this.setVelocity(0, 0);
    this.body.enable = false;
    
    // Play explosion sound
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
