import Phaser from 'phaser';
import { GameConfig, BankDirection } from '../config.js';
import { Enemy } from '../entities/Enemy.js';
import { FuelDepot } from '../entities/FuelDepot.js';

export class RiverGenerator {
  constructor(scene) {
    this.scene = scene;
    this.isMoving = false;
    this.currentSpeed = GameConfig.RIVER_DEFAULT_SPEED;
    
    this.mapWidth = GameConfig.MAP_WIDTH;
    this.mapHeight = GameConfig.MAP_HEIGHT;
    this.minimumRiverWidth = GameConfig.MINIMUM_RIVER_WIDTH;
    this.initialLinesWithoutChange = GameConfig.INITIAL_LINES_WITHOUT_CHANGE;
    this.enemySpawnRate = GameConfig.ENEMY_SPAWN_RATE;
    this.fuelDepotSpawnRate = GameConfig.FUEL_DEPOT_SPAWN_RATE;
    this.fuelDepotSpawnCooldown = GameConfig.FUEL_DEPOT_SPAWN_COOLDOWN;
    
    // Criar 2 containers (TileMaps)
    this.container1 = scene.add.container(0, 0);
    this.container2 = scene.add.container(0, 0);
    
    this.container1.setDepth(0);
    this.container2.setDepth(0);
    
    // Queue de containers (FIEL AO ORIGINAL)
    this.containerQueue = [];
    
    // Terrain group
    this.terrainGroup = scene.physics.add.staticGroup();
    
    // River state COMPARTILHADO
    this.state = {
      leftBankIndex: 2,
      rightBankIndex: this.mapWidth - 3,
      leftBankDirection: BankDirection.STRAIGHT,
      rightBankDirection: BankDirection.STRAIGHT,
      linesGeneratedTotal: 0,
      linesGeneratedThisTurn: 0,
      enemySpawnedLastLine: false,
      fuelDepotSpawnCooldown: 0
    };
    
    this.setupForNewGame();
  }

  setupForNewGame() {
    this.state.linesGeneratedTotal = 0;
    this.setupForNewTurn();
  }

  setupForNewTurn() {
    console.log('🔄 setupForNewTurn');
    
    this.isMoving = false;
    
    // Limpar containers
    this.container1.removeAll(true);
    this.container2.removeAll(true);
    this.terrainGroup.clear(true, true);
    
    // Reset state
    this.state.linesGeneratedThisTurn = 0;
    this.state.leftBankIndex = 2;
    this.state.rightBankIndex = this.mapWidth - 3;
    this.state.leftBankDirection = BankDirection.STRAIGHT;
    this.state.rightBankDirection = BankDirection.STRAIGHT;
    this.state.enemySpawnedLastLine = false;
    this.state.fuelDepotSpawnCooldown = 0;
    
    // Inicializar rio (FIEL AO ORIGINAL)
    this.initializeRiver();
  }

  initializeRiver() {
    this.containerQueue = [];
    
    // TileMap1: gera terreno e posiciona em Y=0
    this.state = this.generateTerrain(this.container1, this.state);
    this.containerQueue.push(this.container1);
    this.container1.y = 0;
    
    console.log('✅ Container1 gerado, Y:', this.container1.y, 'state.linesGenerated:', this.state.linesGeneratedThisTurn);
    
    // TileMap2: USA O MESMO STATE (continua de onde parou) e posiciona em Y negativo
    this.state = this.generateTerrain(this.container2, this.state);
    this.containerQueue.push(this.container2);
    this.container2.y = -this.scene.cameras.main.height;
    
    console.log('✅ Container2 gerado, Y:', this.container2.y, 'state.linesGenerated:', this.state.linesGeneratedThisTurn);
  }

  generateTerrain(container, currentState) {
    // FIEL AO ORIGINAL: Loop de BAIXO para CIMA
    for (let y = this.mapHeight - 1; y >= 0; y--) {
      // Gerar tiles da linha
      for (let x = 0; x < this.mapWidth; x++) {
        const xPos = x * GameConfig.TILE_SIZE;
        const yPos = y * GameConfig.TILE_SIZE;
        
        if (x < currentState.leftBankIndex || x > currentState.rightBankIndex) {
          // Grass - visual no container
          const tile = this.scene.add.rectangle(xPos, yPos, GameConfig.TILE_SIZE, GameConfig.TILE_SIZE, 0x228B22);
          tile.setOrigin(0, 0);
          container.add(tile);
        } else if (x === currentState.leftBankIndex || x === currentState.rightBankIndex) {
          // Bank - visual no container
          const tile = this.scene.add.rectangle(xPos, yPos, GameConfig.TILE_SIZE, GameConfig.TILE_SIZE, 0x8B4513);
          tile.setOrigin(0, 0);
          container.add(tile);
        } else {
          // Water
          const water = this.scene.add.rectangle(xPos, yPos, GameConfig.TILE_SIZE, GameConfig.TILE_SIZE, 0x1E90FF);
          water.setOrigin(0, 0);
          water.setAlpha(0.8);
          container.add(water);
        }
      }
      
      // Criar colisores apenas nas margens (otimização)
      const leftBankX = currentState.leftBankIndex * GameConfig.TILE_SIZE;
      const rightBankX = currentState.rightBankIndex * GameConfig.TILE_SIZE;
      const yPos = y * GameConfig.TILE_SIZE;
      const worldY = container.y + yPos;
      
      // Colisor esquerdo (grass + bank)
      const leftCollider = this.scene.add.rectangle(
        0, worldY,
        leftBankX + GameConfig.TILE_SIZE, GameConfig.TILE_SIZE,
        0, 0
      );
      leftCollider.setOrigin(0, 0);
      this.scene.physics.add.existing(leftCollider, true);
      this.terrainGroup.add(leftCollider);
      leftCollider.containerRef = container;
      leftCollider.localY = yPos;
      
      // Colisor direito (bank + grass)
      const rightCollider = this.scene.add.rectangle(
        rightBankX, worldY,
        (this.mapWidth - currentState.rightBankIndex) * GameConfig.TILE_SIZE, GameConfig.TILE_SIZE,
        0, 0
      );
      rightCollider.setOrigin(0, 0);
      this.scene.physics.add.existing(rightCollider, true);
      this.terrainGroup.add(rightCollider);
      rightCollider.containerRef = container;
      rightCollider.localY = yPos;
      
      // Spawn enemies/depots
      const enemySpawned = this.attemptEnemySpawn(container, currentState, y);
      if (!enemySpawned) {
        this.attemptFuelDepotSpawn(container, currentState, y);
      }
      
      // Update state
      currentState = this.updateStateForNextRow(currentState);
    }
    
    return currentState;
  }

  attemptEnemySpawn(container, currentState, currentRow) {
    if (currentState.enemySpawnedLastLine) {
      currentState.enemySpawnedLastLine = false;
      return false;
    }
    
    if (currentState.linesGeneratedThisTurn < this.initialLinesWithoutChange) {
      return false;
    }
    
    // CRÍTICO: Só spawnar nas primeiras 20 linhas (topo do container, fora da tela)
    if (currentRow > 20) {
      return false;
    }
    
    if (Phaser.Math.Between(0, 99) > this.enemySpawnRate) {
      return false;
    }
    
    const enemyTypes = ['helicopter', 'jet', 'tanker'];
    const enemyType = Phaser.Math.RND.pick(enemyTypes);
    
    // FIEL AO ORIGINAL: spawnPosition.y = (8 * currentRow) + 4
    const spawnY = (GameConfig.TILE_SIZE * currentRow) + 4;
    
    // CRÍTICO: Posição MUNDIAL (container.y + spawnY local)
    const worldY = container.y + spawnY;
    
    const enemy = new Enemy(this.scene, 0, worldY, enemyType);
    enemy.setDepth(50);
    
    // Flip
    if (Phaser.Math.Between(0, 99) < 50) {
      enemy.flipDirection();
    }
    
    // Posição X
    if (enemy.isAquatic) {
      const riverWidth = currentState.rightBankIndex - currentState.leftBankIndex;
      const spawnTile = Math.floor(riverWidth / 2) + currentState.leftBankIndex;
      enemy.x = spawnTile * GameConfig.TILE_SIZE;
    } else {
      enemy.x = enemy.directionFlipped ? 0 : this.mapWidth * GameConfig.TILE_SIZE;
    }
    
    // NÃO adicionar ao container, deixar em coordenadas mundiais
    this.scene.add.existing(enemy);
    this.scene.enemiesGroup.add(enemy);
    
    // Guardar referência ao container para atualizar posição
    enemy.containerRef = container;
    enemy.localY = spawnY;
    
    currentState.enemySpawnedLastLine = true;
    return true;
  }

  attemptFuelDepotSpawn(container, currentState, currentRow) {
    if (currentState.fuelDepotSpawnCooldown > 0) {
      currentState.fuelDepotSpawnCooldown--;
      return;
    }
    
    if (currentState.linesGeneratedThisTurn < this.initialLinesWithoutChange) {
      return;
    }
    
    // CRÍTICO: Só spawnar nas primeiras 20 linhas (topo do container, fora da tela)
    if (currentRow > 20) {
      return;
    }
    
    if (Phaser.Math.Between(0, 99) > this.fuelDepotSpawnRate) {
      return;
    }
    
    const minTile = currentState.leftBankIndex + 2;
    const maxTile = currentState.rightBankIndex - 2;
    const spawnTile = Phaser.Math.Between(minTile, maxTile);
    const spawnX = spawnTile * GameConfig.TILE_SIZE;
    const spawnY = (currentRow * GameConfig.TILE_SIZE) + 4;
    
    // CRÍTICO: Posição MUNDIAL (container.y + spawnY local)
    const worldY = container.y + spawnY;
    
    const depot = new FuelDepot(this.scene, spawnX, worldY);
    depot.setDepth(50);
    
    // NÃO adicionar ao container, deixar em coordenadas mundiais
    this.scene.add.existing(depot);
    this.scene.depotsGroup.add(depot);
    
    // Guardar referência ao container para atualizar posição
    depot.containerRef = container;
    depot.localY = spawnY;
    
    currentState.fuelDepotSpawnCooldown = this.fuelDepotSpawnCooldown;
  }

  updateStateForNextRow(state) {
    const previousLeftBankDir = state.leftBankDirection;
    const previousRightBankDir = state.rightBankDirection;
    
    if (state.linesGeneratedThisTurn > this.initialLinesWithoutChange) {
      state.leftBankDirection = this.attemptChangeDirection(state, 'left');
      state.rightBankDirection = this.attemptChangeDirection(state, 'right');
    }
    
    // Update left bank
    if (state.leftBankDirection === BankDirection.RIGHT && previousLeftBankDir !== BankDirection.LEFT) {
      state.leftBankIndex++;
    }
    if (state.leftBankDirection === BankDirection.LEFT && previousLeftBankDir === BankDirection.LEFT) {
      state.leftBankIndex--;
    }
    if (state.leftBankDirection === BankDirection.STRAIGHT && previousLeftBankDir === BankDirection.LEFT) {
      state.leftBankIndex--;
    }
    
    // Update right bank
    if (state.rightBankDirection === BankDirection.RIGHT && previousRightBankDir === BankDirection.RIGHT) {
      state.rightBankIndex++;
    }
    if (state.rightBankDirection === BankDirection.LEFT && previousRightBankDir !== BankDirection.RIGHT) {
      state.rightBankIndex--;
    }
    if (state.rightBankDirection === BankDirection.STRAIGHT && previousRightBankDir === BankDirection.RIGHT) {
      state.rightBankIndex++;
    }
    
    state = this.validateAndCorrectDirection(state, 'left');
    state = this.validateAndCorrectDirection(state, 'right');
    
    state.linesGeneratedThisTurn++;
    state.linesGeneratedTotal++;
    
    return state;
  }

  attemptChangeDirection(currentState, bank) {
    const possibleDirections = [BankDirection.STRAIGHT, BankDirection.LEFT, BankDirection.RIGHT];
    
    if (bank === 'left') {
      if (currentState.leftBankIndex <= 0) {
        const index = possibleDirections.indexOf(BankDirection.LEFT);
        if (index > -1) possibleDirections.splice(index, 1);
      }
      const riverWidth = currentState.rightBankIndex - (currentState.leftBankIndex + 1);
      if (riverWidth <= this.minimumRiverWidth + 1 && currentState.rightBankDirection !== BankDirection.RIGHT) {
        const index = possibleDirections.indexOf(BankDirection.RIGHT);
        if (index > -1) possibleDirections.splice(index, 1);
      }
    } else {
      if (currentState.rightBankIndex >= this.mapWidth) {
        const index = possibleDirections.indexOf(BankDirection.RIGHT);
        if (index > -1) possibleDirections.splice(index, 1);
      }
      const riverWidth = currentState.rightBankIndex - (currentState.leftBankIndex + 1);
      if (riverWidth <= this.minimumRiverWidth + 1 && currentState.leftBankDirection !== BankDirection.LEFT) {
        const index = possibleDirections.indexOf(BankDirection.LEFT);
        if (index > -1) possibleDirections.splice(index, 1);
      }
    }
    
    return Phaser.Math.RND.pick(possibleDirections);
  }

  validateAndCorrectDirection(currentState, bank) {
    if (bank === 'left') {
      if (currentState.leftBankDirection === BankDirection.LEFT && currentState.leftBankIndex <= 0) {
        currentState.leftBankDirection = BankDirection.STRAIGHT;
      }
      if (currentState.leftBankDirection === BankDirection.RIGHT
          && currentState.rightBankIndex - (currentState.leftBankIndex + 1) <= this.minimumRiverWidth + 1
          && currentState.rightBankDirection !== BankDirection.RIGHT) {
        currentState.leftBankDirection = BankDirection.STRAIGHT;
        currentState.leftBankIndex--;
      }
    } else {
      if (currentState.rightBankDirection === BankDirection.RIGHT && currentState.rightBankIndex >= this.mapWidth - 1) {
        currentState.rightBankDirection = BankDirection.STRAIGHT;
      }
      if (currentState.rightBankDirection === BankDirection.LEFT
          && currentState.rightBankIndex - (currentState.leftBankIndex + 1) <= this.minimumRiverWidth + 1
          && currentState.leftBankDirection !== BankDirection.LEFT) {
        currentState.rightBankDirection = BankDirection.STRAIGHT;
        currentState.rightBankIndex++;
      }
    }
    
    if (currentState.leftBankIndex < 0) {
      currentState.leftBankIndex = 0;
      currentState.leftBankDirection = BankDirection.STRAIGHT;
    }
    if (currentState.rightBankIndex >= this.mapWidth) {
      currentState.rightBankIndex = this.mapWidth - 1;
      currentState.rightBankDirection = BankDirection.STRAIGHT;
    }
    
    return currentState;
  }

  update(delta) {
    if (!this.isMoving) return;
    
    const deltaSeconds = delta / 1000;
    this.adjustSpeed(deltaSeconds);
    
    const moveAmount = this.currentSpeed * deltaSeconds;
    
    // Mover containers
    this.containerQueue.forEach(container => {
      container.y += moveAmount;
    });
    
    // Atualizar posição dos tiles de colisão (coordenadas mundiais)
    this.terrainGroup.children.entries.forEach(tile => {
      if (tile.containerRef && tile.localY !== undefined) {
        tile.y = tile.containerRef.y + tile.localY;
      }
    });
    
    // CRÍTICO: Atualizar posição dos enemies (coordenadas mundiais)
    this.scene.enemiesGroup.children.entries.forEach(enemy => {
      if (enemy.containerRef && enemy.localY !== undefined) {
        enemy.y = enemy.containerRef.y + enemy.localY;
      }
    });
    
    // CRÍTICO: Atualizar posição dos depots (coordenadas mundiais)
    this.scene.depotsGroup.children.entries.forEach(depot => {
      if (depot.containerRef && depot.localY !== undefined) {
        depot.y = depot.containerRef.y + depot.localY;
      }
    });
    
    // FIEL AO ORIGINAL: if (GetViewport().Size.y - lowerTileMap.Position.y < 0)
    const lowerContainer = this.containerQueue[0];
    if (this.scene.cameras.main.height - lowerContainer.y < 0) {
      console.log('🔄 Container saiu da tela, regenerando...');
      
      // Remove da fila
      this.containerQueue.shift();
      
      // Move para cima
      lowerContainer.y -= this.scene.cameras.main.height * 2;
      
      // Limpa e regenera COM O STATE ATUAL
      lowerContainer.removeAll(true);
      this.state = this.generateTerrain(lowerContainer, this.state);
      
      // Adiciona no final da fila
      this.containerQueue.push(lowerContainer);
      
      console.log('✅ Container regenerado, Y:', lowerContainer.y);
    }
  }

  adjustSpeed(delta) {
    const cursors = this.scene.input.keyboard.createCursorKeys();
    const wasd = {
      up: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    };
    
    if (cursors.up.isDown || wasd.up.isDown) {
      this.currentSpeed += GameConfig.RIVER_SPEED_SENSITIVITY * delta;
      this.currentSpeed = Phaser.Math.Clamp(this.currentSpeed, GameConfig.RIVER_MIN_SPEED, GameConfig.RIVER_MAX_SPEED);
      const speedRatio = this.currentSpeed / GameConfig.RIVER_DEFAULT_SPEED;
      this.scene.events.emit('speedChanged', speedRatio);
    } else if (cursors.down.isDown || wasd.down.isDown) {
      this.currentSpeed -= GameConfig.RIVER_SPEED_SENSITIVITY * delta;
      this.currentSpeed = Phaser.Math.Clamp(this.currentSpeed, GameConfig.RIVER_MIN_SPEED, GameConfig.RIVER_MAX_SPEED);
      const speedRatio = this.currentSpeed / GameConfig.RIVER_DEFAULT_SPEED;
      this.scene.events.emit('speedChanged', speedRatio);
    } else {
      if (this.currentSpeed > GameConfig.RIVER_DEFAULT_SPEED) {
        this.currentSpeed -= GameConfig.RIVER_SPEED_SENSITIVITY * delta;
        this.currentSpeed = Phaser.Math.Clamp(this.currentSpeed, GameConfig.RIVER_DEFAULT_SPEED, GameConfig.RIVER_MAX_SPEED);
        const speedRatio = this.currentSpeed / GameConfig.RIVER_DEFAULT_SPEED;
        this.scene.events.emit('speedChanged', speedRatio);
      } else if (this.currentSpeed < GameConfig.RIVER_DEFAULT_SPEED) {
        this.currentSpeed += GameConfig.RIVER_SPEED_SENSITIVITY * delta;
        this.currentSpeed = Phaser.Math.Clamp(this.currentSpeed, GameConfig.RIVER_MIN_SPEED, GameConfig.RIVER_DEFAULT_SPEED);
        const speedRatio = this.currentSpeed / GameConfig.RIVER_DEFAULT_SPEED;
        this.scene.events.emit('speedChanged', speedRatio);
      }
    }
  }

  startMoving() {
    this.isMoving = true;
    this.currentSpeed = GameConfig.RIVER_DEFAULT_SPEED / 2;
  }

  stopMoving() {
    this.isMoving = false;
  }
}
