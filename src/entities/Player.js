import Phaser from 'phaser';
import { GameConfig } from '../config.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    
    this.scene = scene;
    this.setScale(3); // Scale do original
    
    // Physics
    scene.physics.add.existing(this);
    this.body.setSize(8, 10); // Hitbox menor e mais precisa
    this.body.setOffset(2, 1); // Centralizar hitbox
    this.body.setCollideWorldBounds(true);
    
    // State
    this.playerIsMoving = false; // NOME CORRETO DO ORIGINAL
    this.playerIsFueling = false; // NOME CORRETO DO ORIGINAL
    this.fuelLevel = GameConfig.PLAYER_MAX_FUEL * 0.8;
    this.isCrashed = false;
    
    // Shooting
    this.shootCooldown = 0;
    this.shootDelay = 200; // Delay entre tiros em ms (reduzido de 150 para 200)
    
    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = {
      left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Animation
    this.play('player-neutral');
  }

  reset() {
    this.x = this.scene.cameras.main.width / 2;
    this.y = this.scene.cameras.main.height * 0.8;
    this.fuelLevel = GameConfig.PLAYER_MAX_FUEL * 0.8;
    this.playerIsMoving = false;
    this.playerIsFueling = false;
    this.isCrashed = false;
    this.setVisible(true);
    this.body.enable = false;
    this.play('player-neutral');
    
    const fuelPercent = Math.floor((this.fuelLevel / GameConfig.PLAYER_MAX_FUEL) * 100);
    this.scene.events.emit('fuelLevelChanged', fuelPercent);
  }

  startTurn() {
    this.playerIsMoving = true;
    this.body.enable = true;
    if (this.scene.sounds && this.scene.sounds.plane) {
      this.scene.sounds.plane.play();
    }
  }

  update(delta) {
    if (!this.playerIsMoving || this.isCrashed) return;
    
    const deltaSeconds = delta / 1000;
    
    // FIEL AO ORIGINAL: movement.x = turnSpeed * delta
    let movementX = 0;
    
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      movementX = -GameConfig.PLAYER_TURN_SPEED * deltaSeconds;
      this.play('player-left', true);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      movementX = GameConfig.PLAYER_TURN_SPEED * deltaSeconds;
      this.play('player-right', true);
    } else {
      this.play('player-neutral', true);
    }
    
    // FIEL AO ORIGINAL: MoveAndCollide (movimento direto)
    this.x += movementX;
    
    // Shooting - atira continuamente enquanto segura espaço
    if (this.shootCooldown > 0) {
      this.shootCooldown -= delta;
    }
    
    if (this.spaceKey.isDown && this.shootCooldown <= 0) {
      this.scene.createBullet(this.x, this.y);
      this.shootCooldown = this.shootDelay;
    }
    
    // Fuel management
    this.adjustFuelLevel(deltaSeconds);
  }

  adjustFuelLevel(delta) {
    if (this.playerIsFueling) {
      this.fuelLevel += GameConfig.PLAYER_FUEL_INCREASE_RATE * delta;
      if (this.fuelLevel >= GameConfig.PLAYER_MAX_FUEL) {
        this.fuelLevel = GameConfig.PLAYER_MAX_FUEL;
        this.stopFueling();
      }
    } else {
      this.fuelLevel -= GameConfig.PLAYER_FUEL_BURN_RATE * delta;
    }
    
    this.fuelLevel = Phaser.Math.Clamp(this.fuelLevel, 0, GameConfig.PLAYER_MAX_FUEL);
    
    const fuelPercent = Math.floor((this.fuelLevel / GameConfig.PLAYER_MAX_FUEL) * 100);
    this.scene.events.emit('fuelLevelChanged', fuelPercent);
    
    if (this.fuelLevel <= 0 && !this.isCrashed) {
      console.log('⛽ Fuel level is zero');
      this.crash();
    }
  }

  startFueling() {
    this.playerIsFueling = true;
    if (this.fuelLevel < GameConfig.PLAYER_MAX_FUEL) {
      if (this.scene.sounds && this.scene.sounds.fueling && !this.scene.sounds.fueling.isPlaying) {
        this.scene.sounds.fueling.play();
      }
    }
  }

  stopFueling() {
    this.playerIsFueling = false;
    if (this.scene.sounds && this.scene.sounds.fueling && this.scene.sounds.fueling.isPlaying) {
      this.scene.sounds.fueling.stop();
    }
  }

  crash() {
    if (this.isCrashed) return;
    
    this.isCrashed = true;
    this.playerIsMoving = false;
    this.playerIsFueling = false;
    this.body.enable = false;
    
    // Create explosion sprite
    const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
    explosion.setScale(2);
    explosion.play('explode');
    explosion.once('animationcomplete', () => {
      explosion.destroy();
    });
    
    this.setVisible(false);
    this.scene.events.emit('planeCrashed');
  }
}
