const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Thiết lập kích thước canvas
canvas.width = 288;
canvas.height = 512;

// Tải tài nguyên từ assets
const bgImg = new Image();
bgImg.src = "assets/sprites/background-day.png";

const groundImg = new Image();
groundImg.src = "assets/sprites/base.png";

const pipeImg = new Image();
pipeImg.src = "assets/sprites/pipe-green.png";

// Tải sprite chim với hiệu ứng đập cánh
const birdFrames = [new Image(), new Image(), new Image()];
birdFrames[0].src = "assets/sprites/yellowbird-upflap.png";
birdFrames[1].src = "assets/sprites/yellowbird-midflap.png";
birdFrames[2].src = "assets/sprites/yellowbird-downflap.png";

// Tải âm thanh
const jumpSound = new Audio("assets/audio/wing.wav");
const hitSound = new Audio("assets/audio/hit.wav");
const pointSound = new Audio("assets/audio/point.wav");

// Các biến game
let bird = {
  x: 50,
  y: 150,
  width: 34,
  height: 24,
  gravity: 0.6,
  lift: -10,
  velocity: 0,
  frame: 0,
};

let pipes = [];
const pipeWidth = 52;
const pipeHeight = 320; // Chiều cao thực tế của pipe.png
const pipeGap = 120; // Khoảng cách giữa ống trên và dưới
const pipeDistance = 150; // Khoảng cách tối thiểu giữa các cặp ống
let frameCount = 0;
let score = 0;
let gameState = "menu";
let groundX = 0;
const RESET_TIME_SEC = 1; // Thời gian reset sau khi game over
let countdown = 0; // Thời gian đếm ngược (frame)

// Thêm ống mới
function spawnPipe() {
  if (
    pipes.length === 0 ||
    pipes[pipes.length - 1].x < canvas.width - pipeDistance
  ) {
    let topHeight =
      Math.floor(Math.random() * (canvas.height - pipeGap - 200)) + 100;
    pipes.push({
      x: canvas.width,
      topHeight: topHeight,
      passed: false,
    });
  }
}

// Vẽ nền
function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
}

// Vẽ đất
function drawGround() {
  groundX -= 2;
  if (groundX <= -48) groundX = 0;
  ctx.drawImage(groundImg, groundX, canvas.height - 112);
  ctx.drawImage(groundImg, groundX + 336, canvas.height - 112);
}

// Vẽ chim với animation
function drawBird() {
  const birdFrame = birdFrames[Math.floor(bird.frame) % 3];
  ctx.drawImage(birdFrame, bird.x, bird.y);
  if (gameState === "playing") bird.frame += 0.1;
}

// Vẽ ống
function drawPipes() {
  pipes.forEach((pipe) => {
    // Ống trên (lật ngược)
    ctx.save();
    ctx.translate(pipe.x, pipe.topHeight); // Dịch chuyển đến điểm bắt đầu của ống trên
    ctx.scale(1, -1); // Lật ngược
    ctx.drawImage(pipeImg, 0, 0, pipeWidth, pipeHeight); // Vẽ từ gốc (0, 0) của hệ tọa độ mới
    ctx.restore();

    // Ống dưới
    ctx.drawImage(
      pipeImg,
      pipe.x,
      pipe.topHeight + pipeGap,
      pipeWidth,
      pipeHeight
    );
  });
}

// Vẽ điểm số
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`${score}`, canvas.width / 2, 50);
}

// Vẽ menu
function drawMenu() {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("Flappy Bird", canvas.width / 2 - 70, canvas.height / 2 - 50);
  ctx.font = "20px Arial";
  ctx.fillText(
    "Press Space or Tap to Start",
    canvas.width / 2 - 110,
    canvas.height / 2
  );
}

// Vẽ màn hình game over
function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("Game Over", canvas.width / 2 - 70, canvas.height / 2 - 50);
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width / 2 - 40, canvas.height / 2);

  if (countdown > 0) {
    countdown--; // Giảm đếm ngược mỗi frame
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(
      `Restart in ${Math.ceil(countdown / 60)}s`,
      canvas.width / 2 - 50,
      canvas.height / 2 + 100
    );
  } else {
    ctx.fillText(
      "Press Space or Tap to Restart",
      canvas.width / 2 - 130,
      canvas.height / 2 + 50
    );
  }
}

// Cập nhật chim
function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height - 112 || bird.y < 0) {
    hitSound.play();
    gameState = "gameOver";
    countdown = 60 * RESET_TIME_SEC; // 60 frame = 1 giây (giả sử 60 FPS)
  }
}

// Cập nhật ống
function updatePipes() {
  if (frameCount % 90 === 0) {
    spawnPipe();
  }

  pipes.forEach((pipe) => {
    pipe.x -= 2;

    // Kiểm tra va chạm
    if (
      bird.x + bird.width > pipe.x &&
      bird.x < pipe.x + pipeWidth &&
      (bird.y < pipe.topHeight ||
        bird.y + bird.height > pipe.topHeight + pipeGap)
    ) {
      hitSound.play();
      gameState = "gameOver";
      countdown = 60 * RESET_TIME_SEC; // 60 frame = 1 giây (giả sử 60 FPS)
    }

    // Tăng điểm
    if (!pipe.passed && bird.x > pipe.x + pipeWidth) {
      pipe.passed = true;
      score++;
      pointSound.play();
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + pipeWidth > 0);
}

// Xử lý nhảy và chuyển trạng thái
function jump() {
  if (gameState === "menu") {
    gameState = "playing";
    jumpSound.play();
    bird.velocity = bird.lift;
  } else if (gameState === "playing") {
    jumpSound.play();
    bird.velocity = bird.lift;
  } else if (gameState === "gameOver" && countdown === 0) {
    // Chỉ cho phép reset khi đếm ngược xong
    bird.y = 150;
    bird.velocity = 0;
    bird.frame = 0;
    pipes = [];
    score = 0;
    gameState = "menu";
  }
}

// Sự kiện đầu vào
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("touchstart", jump);

// Vòng lặp game
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPipes();
  drawBird();
  drawGround();

  if (gameState === "playing") {
    updateBird();
    updatePipes();
    drawScore();
    frameCount++;
  } else if (gameState === "menu") {
    drawMenu();
  } else if (gameState === "gameOver") {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
