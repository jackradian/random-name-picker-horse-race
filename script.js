function shuffle(array) {
  var m = array.length,
    t,
    i;
  while (m) {
    i = Math.floor(Math.random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Player
class Player {
  constructor(name, horseModelIndex = 0, startY = 0) {
    this.playerName = name;
    this.horseModelIndex = horseModelIndex;
    this.x = 0;
    this.y = startY;
    this.radius = 50;
    this.angle = 0;
    this.frameX = 0;
    this.frameY = 0;
    this.frame = 0;
    this.spriteWidth = 64;
    this.spriteHeight = 52;
    this.elapsedTime = 0;
    this.speed = 80; // px/1000ms
    this.speedElapsedTime = 0;
    // Horse sprite
    this.horseSprite = window.App.horseSprite;
  }
  update(elapsedTime) {
    if (elapsedTime) {
      this.elapsedTime += elapsedTime;
      this.speedElapsedTime += elapsedTime;
    }
    this.speedElapsedTime += randomSpeed();
    if (this.speedElapsedTime < 0) {
      this.speedElapsedTime = 0;
    }
    const dx = ~~((this.speedElapsedTime * this.speed) / 1000);
    this.x += dx;
    this.speedElapsedTime = this.speedElapsedTime % ~~(1000 / this.speed);
    if (this.elapsedTime > 50) {
      this.frame++;
      this.elapsedTime -= 50;
    }
    this.frameX = this.frame % 4;
  }
  draw() {
    window.App.ctx.drawImage(
      this.horseSprite,
      this.frameX * this.spriteWidth,
      this.spriteHeight * this.horseModelIndex,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.spriteWidth,
      this.spriteHeight
    );
    const fontSize = 16;
    const playerNameTextSet = [
      this.playerName,
      this.x + this.spriteWidth + 2,
      this.y + this.spriteHeight / 2 + fontSize / 2,
    ];
    window.App.ctx.font = `${fontSize}px Noto Serif JP, serif`;
    window.App.ctx.shadowColor = "black";
    window.App.ctx.shadowBlur = 5;
    window.App.ctx.lineWidth = 3;
    window.App.ctx.strokeText(...playerNameTextSet);
    window.App.ctx.shadowBlur = 0;
    window.App.ctx.fillStyle = "white";
    window.App.ctx.fillText(...playerNameTextSet);
  }
}

function getRandomRgb() {
  var num = Math.round(0xffffff * Math.random());
  var r = num >> 16;
  var g = (num >> 8) & 255;
  var b = num & 255;
  return "rgb(" + r + ", " + g + ", " + b + ")";
}

function randomSpeed() {
  const min = -50;
  const max = 30;
  return Math.floor(Math.random() * (max + 1 - min)) + min;
}

// Game
class Game {
  constructor() {
    // Horse sprite
    this.horseSprite = new Image();
    const horseSpriteLoad = new Promise((resolve, reject) => {
      this.horseSprite.onload = () => resolve();
      this.horseSprite.onerror = reject;
      this.horseSprite.src = "./img/all-horse-sprite.png";
    });
    // Course sprite
    this.raceCourseImage = new Image();
    const raceCourseImageLoad = new Promise((resolve, reject) => {
      this.raceCourseImage.onload = () => resolve();
      this.raceCourseImage.onerror = reject;
      this.raceCourseImage.src = "./img/race-course.png";
    });
    // Win text sprite
    this.winTextImage = new Image();
    const winTextImageLoad = new Promise((resolve, reject) => {
      this.winTextImage.onload = () => resolve();
      this.winTextImage.onerror = reject;
      this.winTextImage.src = "./img/win.png";
    });

    this.horseModelCount = 31;
    // Random horse sprite index
    this.shuffleHorseModelIndexArray();

    this.gameState = "loading";

    Promise.all([horseSpriteLoad, raceCourseImageLoad, winTextImageLoad]).then(
      () => {
        this.gameState = "new";
        this.init();
      }
    );

    this.players = [];
    this.playerCount = 0;
    this.gameTimeLastFrame = 0;

    this.goalX = 743;
    this.winners = [];

    // Canvas setup
    this.canvas = document.getElementById("canvas1");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = 800;
    this.canvas.height = 500;

    this.initEvents();
  }
  init() {
    if (this.gameState === "loading") {
      return console.log("GAME LOADING");
    }

    this.clear();
    const entries = document
      .getElementById("entries")
      .value.split(/\r?\n/)
      .filter((n) => n);
    if (entries.length > 0) {
      this.playerCount = entries.length;
      const minHeight = 5 * 60;
      this.ctx.canvas.height = this.playerCount * 60;
      if (this.ctx.canvas.height < minHeight) {
        this.ctx.canvas.height = minHeight;
      }
      const horseModelCount = this.horseModelCount;
      for (let i = 0; i < this.playerCount; i++) {
        const drawY = 60 * i;
        const horseModelIndex = this.horseModelIndexArray[i % horseModelCount];
        this.players.push(new Player(entries[i], horseModelIndex, drawY));
        this.players[this.players.length - 1].draw();
      }
    } else {
      this.clear();
    }
    this.initDraw();
  }
  initDraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCourse();
    this.players.forEach((player) => {
      player.draw();
    });
  }
  clear() {
    this.players = [];
    this.playerCount = 0;
    this.gameTimeLastFrame = 0;
    this.winners = [];
  }
  start() {
    this.gameState = "playing";
    this.play();
  }
  play(gameTime) {
    if (this.checkWinner()) {
      return;
    }
    const elapsedTime = parseInt(gameTime - this.gameTimeLastFrame);
    this.gameTimeLastFrame = gameTime;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCourse();
    this.players.forEach((player) => {
      player.update(elapsedTime);
      player.draw();
    });
    this.gameId = requestAnimationFrame((t) => this.play(t));
  }
  stop() {
    cancelAnimationFrame(this.gameId);
  }
  drawCourse() {
    for (let i = 0; i < this.playerCount; i++) {
      this.ctx.drawImage(this.raceCourseImage, 0, 60 * i);
    }
  }
  checkWinner() {
    this.players.forEach((player) => {
      if (player.x + player.spriteWidth > this.goalX) {
        this.winners.push(player.playerName);
      }
    });
    if (this.winners.length > 0) {
      this.stop();
      this.gameState = "end";
      this.drawResult();
      return true;
    }
    return false;
  }
  drawResult() {
    this.ctx.fillStyle = "rgba(0,0,0,0.2)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const startDrawPosY = 50;
    const drawWidth = this.winTextImage.width * 0.6;
    const drawHeight = this.winTextImage.height * 0.6;
    this.ctx.drawImage(
      this.winTextImage,
      this.canvas.width / 2 - drawWidth / 2,
      startDrawPosY,
      drawWidth,
      drawHeight
    );
    const fontSize = 80;
    const playerNameTextSet = [
      this.winners[0],
      this.canvas.width / 2,
      startDrawPosY + drawHeight + 10 + fontSize,
    ];
    this.ctx.textAlign = "center";
    this.ctx.font = `${fontSize}px Noto Serif JP, serif`;
    this.ctx.shadowColor = "black";
    this.ctx.shadowBlur = 15;
    this.ctx.lineWidth = 5;
    this.ctx.strokeText(...playerNameTextSet);
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = "white";
    this.ctx.fillText(...playerNameTextSet);
    this.ctx.textAlign = "start";
  }
  shuffleHorseModelIndexArray() {
    this.horseModelIndexArray = shuffle(
      Array.from(Array(this.horseModelCount).keys())
    );
  }
  disableAllInput() {
    document.getElementById("start_game").disabled = true;
    document.getElementById("horse_model_shuffle").disabled = true;
    document.getElementById("entries").disabled = true;
  }
  enableAllInput() {
    document.getElementById("start_game").disabled = false;
    document.getElementById("horse_model_shuffle").disabled = false;
    document.getElementById("entries").disabled = false;
  }
  initEvents() {
    // Event
    document.getElementById("start_game").addEventListener("click", (e) => {
      e.preventDefault();
      this.disableAllInput();
      this.start();
    });

    document.getElementById("entries").addEventListener("input", () => {
      this.init();
    });

    document
      .getElementById("horse_model_shuffle")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.shuffleHorseModelIndexArray();
        this.init();
      });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.App = new Game();
});
