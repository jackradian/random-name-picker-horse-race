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
    this.color = getRandomRgb();
    // Horse sprite
    this.horseSprite = new Image();
    this.horseSprite.src = "all-horse-sprite.png";
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
    window.App.ctx.fillStyle = "black";
    window.App.ctx.font = "16px Noto Serif JP, serif";
    window.App.ctx.fillText(
      this.playerName,
      this.x + this.spriteWidth + 2,
      this.y + this.spriteHeight / 2
    );
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
    this.horseModelCount = 31;

    // Course sprite
    this.raceCourseImage = new Image();
    this.raceCourseImage.src = "race-course.png";

    this.gameState = "new";
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
  }
  init() {
    const entries = document
      .getElementById("entries")
      .value.split(/\r?\n/)
      .filter((n) => n);
    if (entries.length > 0) {
      this.playerCount = entries.length;
      const horseModelIndexArray = shuffle(
        Array.from(Array(this.horseModelCount).keys())
      );
      console.log(horseModelIndexArray);
      this.ctx.canvas.height = this.playerCount * 60;
      for (let i = 0; i < this.playerCount; i++) {
        const drawY = 60 * i;
        const horseModelIndex =
          horseModelIndexArray[i % horseModelIndexArray.length];
        console.log(horseModelIndex);
        this.players.push(new Player(entries[i], horseModelIndex, drawY));
        this.players[this.players.length - 1].draw();
      }
    }
  }
  clear() {
    this.players = [];
    this.playerCount = 0;
    this.gameTimeLastFrame = 0;
    this.winners = [];
  }
  start() {
    this.clear();
    this.init();
    this.gameState = "playing";
    this.play();
  }
  play(gameTime) {
    const elapsedTime = parseInt(gameTime - this.gameTimeLastFrame);
    this.gameTimeLastFrame = gameTime;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCourse();
    this.players.forEach((player) => {
      player.update(elapsedTime);
      player.draw();
    });
    if (this.checkWinner()) {
      return;
    }
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
      alert(this.winners.join(", "));
      return true;
    }
    return false;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.App = new Game();

  // Event
  document.getElementById("start_game").addEventListener("click", function (e) {
    e.preventDefault();
    this.disabled = true;
    window.App.start();
  });
});
