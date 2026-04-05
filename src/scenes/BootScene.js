import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff'
    });
    loadingText.setOrigin(0.5, 0.5);
    
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load sprites
    this.load.image('bullet', '/assets/sprites/bullet.png');
    this.load.image('depot', '/assets/sprites/depot.png');
    
    // Load spritesheets
    this.load.spritesheet('player', '/assets/sprites/plane.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('explosion', '/assets/sprites/explosion.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('helicopter', '/assets/sprites/helicopter.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('jet', '/assets/sprites/jet.png', {
      frameWidth: 16,
      frameHeight: 16
    });
    
    this.load.spritesheet('tanker', '/assets/sprites/tanker.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    // Load audio
    this.load.audio('explosion', '/assets/audio/explosion.wav');
    this.load.audio('extraLife', '/assets/audio/extraLife.wav');
    this.load.audio('fire', '/assets/audio/fire.wav');
    this.load.audio('fueling', '/assets/audio/fueling.wav');
    this.load.audio('fuelWarning', '/assets/audio/fuelWarning.wav');
    this.load.audio('plane', '/assets/audio/plane.wav');
  }

  create() {
    console.log('✅ BootScene: Assets carregados');
    
    // Log sprite info
    console.log('Sprites carregados:');
    console.log('- player frames:', this.textures.get('player').frameTotal);
    console.log('- explosion frames:', this.textures.get('explosion').frameTotal);
    console.log('- helicopter frames:', this.textures.get('helicopter').frameTotal);
    console.log('- jet frames:', this.textures.get('jet').frameTotal);
    console.log('- tanker frames:', this.textures.get('tanker').frameTotal);
    
    // Create animations
    this.createAnimations();
    
    console.log('✅ Animações criadas');
    
    // Start main scene
    this.scene.start('MainScene');
  }

  createAnimations() {
    // Player animations
    this.anims.create({
      key: 'player-left',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1
    });
    
    this.anims.create({
      key: 'player-neutral',
      frames: [{ key: 'player', frame: 1 }],
      frameRate: 1
    });
    
    this.anims.create({
      key: 'player-right',
      frames: [{ key: 'player', frame: 2 }],
      frameRate: 1
    });
    
    // Explosion animation - usar apenas frames que existem
    const explosionFrames = this.textures.get('explosion').frameTotal;
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: Math.min(3, explosionFrames - 1) }),
      frameRate: 10,
      repeat: 0
    });
    
    // Helicopter - usar apenas frame 0 para evitar erros
    this.anims.create({
      key: 'helicopter-fly',
      frames: [{ key: 'helicopter', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    
    // Jet - usar apenas frame 0 para evitar erros
    this.anims.create({
      key: 'jet-fly',
      frames: [{ key: 'jet', frame: 0 }],
      frameRate: 1,
      repeat: -1
    });
    
    // Tanker
    this.anims.create({
      key: 'tanker-float',
      frames: [{ key: 'tanker', frame: 0 }],
      frameRate: 1
    });
  }
}
