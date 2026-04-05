# River Shaw
**...em homenagem a Carol Raid!**
<img width="714" height="1152" alt="image" src="https://github.com/user-attachments/assets/7743374c-6964-412d-835a-92c1678dfdd1" />

Jogo clássico convertido para web game usando Phaser 3 + Vite + Vercel.

## 👤 Autor

**Ary Ribeiro**
- Email: aryribeiro@gmail.com
- GitHub: [@aryribeiro](https://github.com/aryribeiro)
- LinkedIn: [@aryribeiro](https://linkedin.com/in/aryribeiro)

## 📜 Créditos

Fork do projeto [River Runner](https://github.com/sornerol/river-runner) em C# (Godot) convertido para JavaScript/Web.

## 🚀 Tecnologias

- **Phaser 3** - Game engine 2D
- **Vite** - Build tool ultra-rápido
- **Vercel** - Deploy automático

## 📦 Instalação

```bash
npm install
```

## 🎮 Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🏗️ Build

```bash
npm run build
```

## 🌐 Deploy no Vercel

### Opção 1: Via CLI

```bash
npm install -g vercel
vercel
```

### Opção 2: Via GitHub

1. Faça push do código para GitHub
2. Conecte o repositório no Vercel Dashboard
3. Deploy automático!

### Opção 3: Via Vercel Dashboard

1. Acesse https://vercel.com
2. Clique em "Add New Project"
3. Importe este repositório
4. Deploy automático!

## 🎯 Controles

- **Setas / WASD** - Mover avião
- **SPACE** - Atirar (segure para tiro contínuo)
- **↑/↓ ou W/S** - Controlar velocidade do rio

## 🏆 Gameplay

- Destrua inimigos para ganhar pontos
- Reabasteça nos depósitos de combustível (amarelos)
- Evite colidir com inimigos
- Não deixe o combustível acabar!
- Ganhe vida extra a cada 20.000 pontos

## 🎮 Inimigos

- **Helicóptero** - 100 pontos
- **Jato** - 200 pontos
- **Navio Tanque** - 150 pontos

## 📊 Estrutura do Projeto

```
river-shaw/
├── public/
│   └── assets/
│       ├── sprites/    # Imagens do jogo
│       └── audio/      # Sons e música
├── src/
│   ├── scenes/         # Cenas do Phaser
│   │   ├── BootScene.js
│   │   ├── MainScene.js
│   │   ├── GameScene.js
│   │   └── HUDScene.js
│   ├── entities/       # Player, Enemy, FuelDepot
│   ├── systems/        # RiverGenerator
│   ├── config.js       # Configurações do jogo
│   └── main.js         # Entry point
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## 🔧 Configurações

Edite `src/config.js` para ajustar:
- Velocidades do rio e player
- Dificuldade e spawn rates
- Pontuações dos inimigos
- Consumo e capacidade de combustível

## 🎨 Assets

Todos os sprites e sons foram extraídos do projeto original River Runner.

## 📝 Licença

Baseado no projeto original [River Runner](https://github.com/sornerol/river-runner) por Sornerol.

---

**River Shaw** - Desenvolvido com ❤️ por Ary Ribeiro, em homenagem a Carol Shaw: https://www.vintagecomputing.com/index.php/archives/800/vcg-interview-carol-shaw-female-video-game-pioneer-2
