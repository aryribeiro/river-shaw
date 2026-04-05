import Phaser from 'phaser';
import { GameConfig } from '../config.js';
import { Player } from '../entities/Player.js';
import { RiverGenerator } from '../systems/RiverGenerator.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Game state
    this.score = 0;
    this.lives = GameConfig.INITIAL_LIVES;
    this.lastFreeLifeScore = 0;
    this.gameOver = false;
    this.paused = false;
    this.currentFuelingDepot = null;
    
    // Groups - criar ANTES do river generator
    this.enemiesGroup = this.physics.add.group();
    this.bulletsGroup = this.physics.add.group();
    this.depotsGroup = this.physics.add.group();
    
    // HUD Scene - iniciar ANTES de usar
    this.scene.launch('HUDScene');
    this.hudScene = this.scene.get('HUDScene');
    
    // Aguardar HUD estar pronto
    this.time.delayedCall(100, () => {
      this.initializeGame();
    });
  }

  initializeGame() {
    
    // River generator
    this.riverGenerator = new RiverGenerator(this);
    
    // Player - CRIAR DEPOIS do rio para ficar por cima
    this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height * 0.8);
    this.add.existing(this.player);
    this.player.setDepth(100); // IMPORTANTE: Player acima de tudo
    
    // Audio
    this.sounds = {
      explosion: this.sound.add('explosion'),
      extraLife: this.sound.add('extraLife'),
      fire: this.sound.add('fire'),
      fueling: this.sound.add('fueling', { loop: true }),
      fuelWarning: this.sound.add('fuelWarning'),
      plane: this.sound.add('plane', { loop: true })
    };
    
    // Collisions
    this.setupCollisions();
    
    // Events
    this.events.on('shootableHit', this.onShootableHit, this);
    this.events.on('planeCrashed', this.onPlaneCrashed, this);
    this.events.on('fuelLevelChanged', this.onFuelLevelChanged, this);
    this.events.on('speedChanged', this.onSpeedChanged, this);
    
    // Start game
    this.startNewGame();
  }

  setupCollisions() {
    // Player vs enemies
    this.physics.add.overlap(
      this.player,
      this.enemiesGroup,
      this.onPlayerHitEnemy,
      null,
      this
    );
    
    // Bullets vs enemies (verificar manualmente pois bullets são sprites simples)
    // Será verificado no update
    
    // Player vs depots
    this.physics.add.overlap(
      this.player,
      this.depotsGroup,
      this.onPlayerOverlapDepot,
      null,
      this
    );
  }

  startNewGame() {
    this.score = 0;
    this.lives = GameConfig.INITIAL_LIVES;
    this.lastFreeLifeScore = 0;
    this.gameOver = false;
    
    this.hudScene.updateScore(this.score);
    this.hudScene.updateLives(this.lives);
    
    // IMPORTANTE: Para o rio antes de resetar
    this.riverGenerator.stopMoving();
    
    this.startNewTurn();
  }

  startNewTurn() {
    this.paused = false;
    
    // IMPORTANTE: Limpar TODOS os inimigos (FIEL AO ORIGINAL)
    console.log('🧽 Limpando inimigos antigos...');
    this.enemiesGroup.clear(true, true);
    this.bulletsGroup.clear(true, true);
    this.depotsGroup.clear(true, true);
    
    // Reset river (IMPORTANTE: setupForNewTurn limpa e regenera)
    this.riverGenerator.setupForNewTurn();
    
    // Reset player
    this.player.reset();
    
    // Show ready message
    this.hudScene.showMessage('Ready!');
    
    // IMPORTANTE: Rio só começa a mover DEPOIS do timer
    this.time.delayedCall(GameConfig.GET_READY_DURATION, () => {
      this.hudScene.clearMessage();
      this.riverGenerator.startMoving();
      this.player.startTurn();
      console.log('▶️ Jogo iniciado!');
    });
  }

  update(time, delta) {
    if (!this.riverGenerator || this.paused || this.gameOver) return;
    
    this.riverGenerator.update(delta);
    
    if (this.player) {
      this.player.update(delta);
      this.checkFuelingStatus();
    }
    
    // Update bullets (IMPORTANTE: bullets têm update manual)
    if (this.bulletsGroup) {
      const bullets = this.bulletsGroup.children.entries.slice(); // Cópia para evitar problemas
      bullets.forEach(bullet => {
        if (bullet.active && bullet.update) {
          bullet.update(time, delta);
          this.checkBulletCollisions(bullet);
        }
      });
    }
    
    // Update enemies
    if (this.enemiesGroup) {
      const enemies = this.enemiesGroup.children.entries.slice();
      enemies.forEach(enemy => {
        if (enemy.active && enemy.update) {
          enemy.update(delta);
        }
      });
    }
    
    // Update depots
    if (this.depotsGroup) {
      const depots = this.depotsGroup.children.entries.slice();
      depots.forEach(depot => {
        if (depot.active && depot.update) {
          depot.update(delta);
        }
      });
    }
  }

  checkBulletCollisions(bullet) {
    if (!bullet.active) return;
    
    // Check vs enemies
    const enemies = this.enemiesGroup.children.entries;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.active && !enemy.isDestroyed) {
        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        if (distance < 20) {
          bullet.destroy();
          enemy.explode();
          this.events.emit('shootableHit', enemy.scoreValue);
          return;
        }
      }
    }
    
    // Balas atravessam tudo - sem colisão com terreno ou depots
  }

  onShootableHit(points) {
    this.score += points;
    
    // Check for extra life
    if (this.score - this.lastFreeLifeScore >= GameConfig.FREE_LIFE_SCORE_INTERVAL) {
      this.lives++;
      this.lastFreeLifeScore += GameConfig.FREE_LIFE_SCORE_INTERVAL;
      this.sounds.extraLife.play();
      this.hudScene.updateLives(this.lives);
    }
    
    this.hudScene.updateScore(this.score);
  }

  onPlaneCrashed() {
    this.paused = true;
    this.lives--;
    
    if (this.sounds.plane && this.sounds.plane.isPlaying) {
      this.sounds.plane.stop();
    }
    if (this.sounds.fueling && this.sounds.fueling.isPlaying) {
      this.sounds.fueling.stop();
    }
    if (this.sounds.explosion) {
      this.sounds.explosion.play();
    }
    
    this.hudScene.updateLives(this.lives);
    this.hudScene.stopFuelWarning();
    this.riverGenerator.stopMoving();
    
    if (this.lives < 1) {
      this.gameOver = true;
      this.hudScene.showMessage('Game Over');
      
      this.time.delayedCall(GameConfig.PAUSE_AFTER_CRASH_DURATION, () => {
        this.scene.stop('HUDScene');
        this.scene.start('MainScene');
      });
    } else {
      this.hudScene.showMessage('Crash!\nPress SPACE...');
      
      this.time.delayedCall(GameConfig.PAUSE_AFTER_CRASH_DURATION, () => {
        this.input.keyboard.once('keydown-SPACE', () => {
          this.startNewTurn();
        });
      });
    }
  }

  onFuelLevelChanged(fuelPercent) {
    this.hudScene.updateFuelLevel(fuelPercent);
  }

  onSpeedChanged(speedRatio) {
    if (this.sounds.plane && this.sounds.plane.isPlaying) {
      this.sounds.plane.setRate(speedRatio);
    }
  }

  onPlayerHitTerrain(player, terrain) {
    console.log('💥 Player colidiu com terreno!');
    if (!this.paused) {
      this.player.crash();
    }
  }

  onPlayerHitEnemy(player, enemy) {
    if (!this.paused) {
      enemy.destroy();
      this.player.crash();
    }
  }

  onBulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.explode();
    this.events.emit('shootableHit', enemy.scoreValue);
  }

  onBulletHitTerrain(bullet, terrain) {
    bullet.destroy();
  }

  onBulletHitDepot(bullet, depot) {
    bullet.destroy();
    depot.explode();
    this.events.emit('shootableHit', depot.scoreValue);
  }

  onPlayerOverlapDepot(player, depot) {
    if (!depot.isDestroyed && depot.body && depot.body.enable) {
      if (this.currentFuelingDepot !== depot) {
        this.currentFuelingDepot = depot;
        this.player.startFueling();
      }
    }
  }

  checkFuelingStatus() {
    if (!this.currentFuelingDepot) return;
    
    // Verificar se ainda está sobreposto
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.currentFuelingDepot.x, this.currentFuelingDepot.y
    );
    
    // Se saiu do depot (distância > 30) ou depot foi destruído
    if (distance > 30 || !this.currentFuelingDepot.active || this.currentFuelingDepot.isDestroyed) {
      this.player.stopFueling();
      this.currentFuelingDepot = null;
    }
  }

  createBullet(x, y) {
    // FIEL AO ORIGINAL: Bullet é KinematicBody2D, não sprite com velocity
    const bullet = this.add.sprite(x, y - 24, 'bullet');
    bullet.setScale(3); // Scale do original
    bullet.setDepth(50);
    
    // Adicionar ao grupo
    this.bulletsGroup.add(bullet);
    
    // Movimento manual (FIEL AO ORIGINAL: movement.y = -defaultSpeed * delta)
    bullet.speed = GameConfig.BULLET_SPEED;
    bullet.update = (time, delta) => {
      const deltaSeconds = delta / 1000;
      bullet.y -= bullet.speed * deltaSeconds;
      
      // Remove se sair da tela
      if (bullet.y < -50) {
        bullet.destroy();
      }
    };
    
    if (this.sounds && this.sounds.fire) {
      this.sounds.fire.play();
    }
    
    console.log('🔫 Bullet criado em x:', x, 'y:', y, 'speed:', bullet.speed);
    
    return bullet;
  }
}
