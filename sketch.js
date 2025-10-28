let questionTable;
let allQuestions = [];
let quizQuestions = []; // 儲存本次測驗的5個題目
const POOL_SIZE = 10; // 從 CSV 取前 10 題
const QUIZ_SIZE = 5;  // 隨機抽出 5 題進行測驗
let currentQuestionIndex = 0;
let score = 0;
let gameState = 'START'; // 遊戲狀態: START, QUESTION, FEEDBACK, RESULT

// 按鈕物件
let answerButtons = [];
let startButton, restartButton;

// 互動效果
let particles = [];
let stars = []; // 新增星星陣列
let feedbackMessage = '';
let feedbackColor;
let feedbackTimer = 0;

// 新增煙火相關變數
let fireworks = [];
let fireworksActive = false;
let fireworksTimer = 0;

function preload() {
  // 載入 CSV 檔案，指定 'csv' 格式且沒有標頭
  questionTable = loadTable('questions.csv', 'csv');
}

function setup() {
  createCanvas(800, 600);
  processData();
  setupButtons();
  setupParticles();
  setupStars(); // 新增星星
  startGame();
}

function draw() {
  // 使用漸層背景
  let c1 = color(10, 20, 60); // 深藍色
  let c2 = color(40, 40, 100); // 較亮的藍色
  
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
  
  drawStars();
  drawParticles();

  // 根據不同的遊戲狀態繪製不同畫面
  switch (gameState) {
    case 'START':
      drawStartScreen();
      break;
    case 'QUESTION':
      drawQuestionScreen();
      break;
    case 'FEEDBACK':
      drawFeedbackScreen();
      break;
    case 'RESULT':
      drawResultScreen();
      break;
  }
}

// ---------------------------------
// 遊戲流程函數
// ---------------------------------

// 1. 處理CSV資料
function processData() {
  // 遍歷 CSV 的每一行，僅取前 POOL_SIZE 筆
  for (let row of questionTable.getRows()) {
    if (allQuestions.length >= POOL_SIZE) break;
    allQuestions.push({
      question: row.getString(0),
      opA: row.getString(1),
      opB: row.getString(2),
      opC: row.getString(3),
      opD: row.getString(4),
      correct: row.getString(5) // 儲存 'A', 'B', 'C', or 'D'
    });
  }
}

// 2. 設定按鈕位置
function setupButtons() {
  // 開始按鈕
  startButton = { x: width / 2 - 100, y: height / 2 + 50, w: 200, h: 60, text: '開始測驗' };
  // 重新開始按鈕
  restartButton = { x: width / 2 - 100, y: height / 2 + 150, w: 200, h: 60, text: '重新開始' };

  // 四個答案按鈕
  let btnW = 350;
  let btnH = 80;
  let gap = 20;
  answerButtons.push({ x: 40, y: 250, w: btnW, h: btnH, option: 'A' });
  answerButtons.push({ x: 40 + btnW + gap, y: 250, w: btnW, h: btnH, option: 'B' });
  answerButtons.push({ x: 40, y: 250 + btnH + gap, w: btnW, h: btnH, option: 'C' });
  answerButtons.push({ x: 40 + btnW + gap, y: 250 + btnH + gap, w: btnW, h: btnH, option: 'D' });
}

// 3. 開始或重新開始遊戲
function startGame() {
  score = 0;
  currentQuestionIndex = 0;
  // 隨機排序所有問題，並取出前 QUIZ_SIZE 題
  quizQuestions = shuffle(allQuestions).slice(0, QUIZ_SIZE);
  gameState = 'START';

  // 每次開始遊戲時重置煙火狀態
  fireworks = [];
  fireworksActive = false;
  fireworksTimer = 0;
}

// 4. 檢查答案
function checkAnswer(selectedOption) {
  let correctOption = quizQuestions[currentQuestionIndex].correct;

  if (selectedOption === correctOption) {
    score++;
    feedbackMessage = '答對了！';
    feedbackColor = color(0, 200, 100, 220); // 綠色
  } else {
    feedbackMessage = `答錯了... 正確答案是 ${correctOption}`;
    feedbackColor = color(200, 50, 50, 220); // 紅色
  }
  
  gameState = 'FEEDBACK';
  feedbackTimer = 90; // 顯示回饋 1.5 秒 (60fps * 1.5)
}

// 5. 進入下一題
function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex >= quizQuestions.length) {
    gameState = 'RESULT';
    // 若全對，啟動煙火特效
    if (score === QUIZ_SIZE) {
      startFireworks();
    }
  } else {
    gameState = 'QUESTION';
  }
}

// 6. 取得回饋用語
function getFeedbackText() {
  // 自訂每個分數的回饋文字（0~5）
  if (score === 0) return '你是故意選錯的對吧';
  if (score === 1) return '沒事沒事，有對一題，這是好的開始';
  if (score === 2) return '再努力一點就能對一半的題目了';
  if (score === 3) return '沒事，人總有犯錯的時候';
  if (score === 4) return '哇，真的是差點一點，不要氣餒，再往上走一步就登頂了';
  // score === QUIZ_SIZE (5)
  return '哇你是天才吧，不管在哪裡都能使出全力';
}

// ---------------------------------
// 畫面繪製函數
// ---------------------------------

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  text('p5.js 題庫測驗', width / 2, height / 2 - 100);
  textSize(24);
  text(`從 ${allQuestions.length} 題中隨機抽取 ${QUIZ_SIZE} 題`, width / 2, height / 2 - 30);
  
  // 繪製開始按鈕
  drawButton(startButton);
}

function drawQuestionScreen() {
  if (quizQuestions.length === 0) return; // 防止資料還沒載入
  
  let q = quizQuestions[currentQuestionIndex];
  
  // 繪製問題
  textAlign(LEFT, TOP);
  fill(255);
  textSize(28);
  text(`第 ${currentQuestionIndex + 1} 題 / ${QUIZ_SIZE} 題`, 40, 40);
  text(q.question, 40, 100, width - 80, 150); // 自動換行
  
  // 更新並繪製答案按鈕
  answerButtons[0].text = 'A. ' + q.opA;
  answerButtons[1].text = 'B. ' + q.opB;
  answerButtons[2].text = 'C. ' + q.opC;
  answerButtons[3].text = 'D. ' + q.opD;
  
  for (let btn of answerButtons) {
    drawButton(btn);
  }
}

function drawFeedbackScreen() {
  // 顯示回饋文字 (綠色或紅色)
  fill(feedbackColor);
  rect(0, 0, width, height); // 蓋住全螢幕
  
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(60);
  text(feedbackMessage, width / 2, height / 2);
  
  // 計時
  feedbackTimer--;
  if (feedbackTimer <= 0) {
    nextQuestion();
  }
}

function drawResultScreen() {
  textAlign(CENTER, CENTER);
  fill(255);
  
  textSize(50);
  text('測驗結束！', width / 2, 150);
  
  textSize(36);
  text(`你的成績: ${score} / ${QUIZ_SIZE}`, width / 2, 250);
  
  textSize(24);
  fill(200, 200, 0); // 黃色
  text(getFeedbackText(), width / 2, 350);
  
  // 若全對且煙火中，繪製煙火
  if (fireworksActive) {
    updateAndDrawFireworks();
  }

  // 繪製重新開始按鈕
  drawButton(restartButton);
}

// ---------------------------------
// 互動與輔助函數
// ---------------------------------

// 繪製按鈕 (含 hover 效果)
function drawButton(btn) {
  let isHover = isMouseOver(btn);
  
  push(); // 保存繪圖狀態
  if (isHover) {
    fill(100, 180, 255); // hover 亮藍色
    stroke(255);
    strokeWeight(2);
    cursor(HAND); // 改變滑鼠游標
  } else {
    fill(50, 100, 200, 200); // 預設藍色
    noStroke();
  }
  rect(btn.x, btn.y, btn.w, btn.h, 10); // 圓角矩形
  
  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(btn.text, btn.x, btn.y, btn.w, btn.h); // 按鈕文字
  pop(); // 恢復繪圖狀態
}

// 檢查滑鼠是否在按鈕上
function isMouseOver(btn) {
  return (mouseX > btn.x && mouseX < btn.x + btn.w &&
          mouseY > btn.y && mouseY < btn.y + btn.h);
}

// 滑鼠點擊事件
function mousePressed() {
  // 重設游標
  cursor(ARROW);

  if (gameState === 'START') {
    if (isMouseOver(startButton)) {
      gameState = 'QUESTION';
    }
  } else if (gameState === 'QUESTION') {
    for (let btn of answerButtons) {
      if (isMouseOver(btn)) {
        checkAnswer(btn.option);
        break; // 點擊後就停止檢查
      }
    }
  } else if (gameState === 'RESULT') {
    if (isMouseOver(restartButton)) {
      startGame();
    }
  }
}

// ---------------------------------
// 互動視覺效果 (背景粒子)
// ---------------------------------

function setupParticles() {
  particles = [];
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.2, 0.2),
      vy: random(-0.2, 0.2),
      r: random(1, 3),
      alpha: random(30, 100)
    });
  }
}

function drawParticles() {
  for (let p of particles) {
    // 更新位置
    p.x += p.vx;
    p.y += p.vy;
    
    // 邊界環繞
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
    
    // 繪製
    noStroke();
    fill(200, 220, 255, p.alpha); // 淡藍色粒子
    ellipse(p.x, p.y, p.r);
  }
}

// 新增星星
function setupStars() {
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(0.1, 3),
      brightness: random(100, 255),
      twinkleSpeed: random(0.02, 0.05)
    });
  }
}

function drawStars() {
  for (let star of stars) {
    let brightness = star.brightness + sin(frameCount * star.twinkleSpeed) * 50;
    fill(255, brightness);
    noStroke();
    ellipse(star.x, star.y, star.size);
  }
}

// ----- 煙火特效函數 -----
function startFireworks() {
  fireworks = [];
  fireworksActive = true;
  fireworksTimer = 300; // 持續時間 (約 5 秒)
  // 初始幾個爆炸
  for (let i = 0; i < 6; i++) {
    createExplosion(random(100, width - 100), random(100, height - 200));
  }
}

function createExplosion(x, y) {
  let parts = [];
  let count = 60;
  for (let i = 0; i < count; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 6);
    parts.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(40, 90),
      maxLife: random(40, 90),
      col: color(random(150, 255), random(100, 255), random(50, 255))
    });
  }
  fireworks.push({ parts: parts });
}

function updateAndDrawFireworks() {
  // 先以 additive 混合讓煙火更亮
  push();
  blendMode(ADD);
  for (let i = fireworks.length - 1; i >= 0; i--) {
    let e = fireworks[i];
    for (let p of e.parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06; // 重力
      p.vx *= 0.995;
      p.vy *= 0.995;
      p.life--;
      noStroke();
      let alpha = map(p.life, 0, p.maxLife, 0, 255);
      fill(red(p.col), green(p.col), blue(p.col), alpha);
      ellipse(p.x, p.y, 3, 3);
    }
    // 若所有粒子死亡，移除此爆炸
    if (e.parts.every(p => p.life <= 0)) {
      fireworks.splice(i, 1);
    }
  }
  // 週期性產生新爆炸
  if (frameCount % 18 === 0) {
    createExplosion(random(120, width - 120), random(80, height - 220));
  }
  pop();

  // 計時器結束後關閉
  fireworksTimer--;
  if (fireworksTimer <= 0) {
    fireworksActive = false;
    fireworks = [];
  }
}
