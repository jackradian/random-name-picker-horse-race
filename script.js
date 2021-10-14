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
  update(elapsedTime, newVelocity) {
    if (elapsedTime) {
      this.elapsedTime += elapsedTime;
    }
    const timeInterval = elapsedTime ? elapsedTime / 1000 : 0.001;
    const acceleration = (newVelocity - this.speed) / timeInterval;
    let dx = ~~(
      this.speed * timeInterval +
      0.5 * acceleration * timeInterval * timeInterval
    );
    this.x += dx;
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

// Game
class Game {
  #gameStates;
  #currentState;
  #controlPanel;
  #newGameBtn;
  #startGameBtn;

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
    this.#shuffleHorseModelIndexArray();

    // Game states
    this.#gameStates = {
      loading: "loading",
      new: "new",
      playing: "playing",
      end: "end",
    };

    this.#currentState = this.#gameStates.loading;

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

    this.#controlPanel = document.getElementById("control_panel");
    this.#newGameBtn = document.getElementById("new_game");
    this.#startGameBtn = document.getElementById("start_game");

    this.#initEvents();

    Promise.all([horseSpriteLoad, raceCourseImageLoad, winTextImageLoad]).then(
      () => {
        this.#currentState = this.#gameStates.new;
        this.#init();
      }
    );
  }
  #init() {
    if (this.#currentState === this.#gameStates.loading) {
      return console.log("GAME LOADING");
    }

    this.#clear();
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
        const drawY = 60 * i + 2;
        const horseModelIndex = this.horseModelIndexArray[i % horseModelCount];
        this.players.push(new Player(entries[i], horseModelIndex, drawY));
        this.players[this.players.length - 1].draw();
      }
    } else {
      this.#clear();
    }
    this.#initDraw();
  }
  #initDraw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.#drawCourse();
    this.players.forEach((player) => {
      player.draw();
    });
  }
  #clear() {
    this.players = [];
    this.playerCount = 0;
    this.gameTimeLastFrame = 0;
    this.winners = [];
  }
  #newGame() {
    this.#stop();
    this.#currentState = this.#gameStates.new;
    this.#setControlPanel(this.#gameStates.new);
    this.#init();
  }
  #start() {
    this.#currentState = this.#gameStates.playing;
    this.#play();
  }
  #play(gameTime) {
    if (this.#checkWinner()) {
      return;
    }
    const elapsedTime = parseInt(gameTime - this.gameTimeLastFrame);
    this.gameTimeLastFrame = gameTime;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.#drawCourse();
    const velocityArray = this.#randomVelocity(this.playerCount);
    for (let i = 0; i < this.playerCount; i++) {
      this.players[i].update(elapsedTime, velocityArray[i]);
      this.players[i].draw();
    }
    this.gameId = requestAnimationFrame((t) => this.#play(t));
  }
  #stop() {
    cancelAnimationFrame(this.gameId);
  }
  #drawCourse() {
    for (let i = 0; i < this.playerCount; i++) {
      this.ctx.drawImage(this.raceCourseImage, 0, 60 * i);
    }
  }
  #checkWinner() {
    this.players.forEach((player) => {
      if (player.x + player.spriteWidth > this.goalX) {
        this.winners.push(player.playerName);
      }
    });
    if (this.winners.length > 0) {
      this.#stop();
      this.#currentState = this.#gameStates.end;
      this.#drawResult();
      return true;
    }
    return false;
  }
  #drawResult() {
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
  #shuffleHorseModelIndexArray() {
    this.horseModelIndexArray = shuffle(
      Array.from(Array(this.horseModelCount).keys())
    );
  }
  #randomVelocity(playerNum) {
    const arr = [];
    const min = 0;
    const max = 500;
    while (arr.length < playerNum) {
      arr.push(Math.floor(Math.random() * (max + 1 - min)) + min);
    }
    return arr;
  }
  #setControlPanel(state) {
    switch (state) {
      case this.#gameStates.new:
        this.#controlPanel
          .querySelectorAll("input, textarea, button")
          .forEach((el) => (el.disabled = false));
        this.#startGameBtn.classList.remove("hidden");
        this.#newGameBtn.disabled = true;
        this.#newGameBtn.classList.add("hidden");
        break;
      case this.#gameStates.playing:
        this.#controlPanel
          .querySelectorAll("input, textarea, button")
          .forEach((el) => (el.disabled = true));
        this.#startGameBtn.classList.add("hidden");
        this.#newGameBtn.disabled = false;
        this.#newGameBtn.classList.remove("hidden");
        break;
      default:
        console.log("default");
    }
  }
  #initEvents() {
    // Event
    this.#newGameBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.#newGame();
    });

    this.#startGameBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.#setControlPanel(this.#gameStates.playing);
      this.#start();
    });

    document.getElementById("entries").addEventListener("input", () => {
      this.#init();
    });

    document
      .getElementById("horse_model_shuffle")
      .addEventListener("click", (e) => {
        e.preventDefault();
        this.#shuffleHorseModelIndexArray();
        this.#init();
      });

    document
      .getElementById("shuffle_entries")
      .addEventListener("click", (e) => {
        e.preventDefault();
        const entriesInput = document.getElementById("entries");
        const entries = entriesInput.value.split(/\r?\n/).filter((n) => n);
        shuffle(entries);
        entriesInput.value = entries.join("\r\n");
        entriesInput.dispatchEvent(new Event("input"));
      });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.App = new Game();
});
