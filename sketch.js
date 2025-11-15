// p5.js 스케치
const canvasWidth = 800;
const canvasHeight = 600;
let gravityEnabled = true;
let colors = [];
let currentGravityX = 0;
let currentGravityY = 0.5;

function setup() {
    frameRate(60);  // 60fps로 안정적인 물리 계산
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    // 초기 공 몇 개 추가
    setTimeout(() => {
        if (typeof Module !== 'undefined' && Module._addBall) {
            addRandomBall();
            addRandomBall();
            addRandomBall();
        }
    }, 500);
}

function draw() {
    // 배경
    background(240, 248, 255);
    
    // 그리드 그리기
    stroke(220);
    strokeWeight(1);
    for (let i = 0; i < canvasWidth; i += 50) {
        line(i, 0, i, canvasHeight);
    }
    for (let i = 0; i < canvasHeight; i += 50) {
        line(0, i, canvasWidth, i);
    }
    
    // WASM 모듈이 로드되었는지 확인
    if (typeof Module === 'undefined' || !Module._updatePhysics) {
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(20);
        text('WASM 모듈 로딩 중...', canvasWidth / 2, canvasHeight / 2);
        return;
    }
    
    // 물리 업데이트
    Module._updatePhysics();
    
    // 공 그리기
    const ballCount = Module._getBallCount();
    
    for (let i = 0; i < ballCount; i++) {
        const x = Module._getBallX(i);
        const y = Module._getBallY(i);
        const r = Module._getBallRadius(i);
        
        // 색상 배열이 부족하면 추가
        while (colors.length <= i) {
            colors.push({
                h: random(360),
                s: random(60, 100),
                b: random(60, 100)
            });
        }
        
        // 그라디언트 효과를 위한 원 그리기
        noStroke();
        
        // 그림자
        fill(0, 0, 0, 30);
        ellipse(x + 3, y + 3, r * 2, r * 2);
        
        // 메인 공
        colorMode(HSB);
        fill(colors[i].h, colors[i].s, colors[i].b);
        ellipse(x, y, r * 2, r * 2);
        
        // 하이라이트
        fill(colors[i].h, colors[i].s - 30, colors[i].b + 20, 0.6);
        ellipse(x - r * 0.3, y - r * 0.3, r * 0.6, r * 0.6);
        
        colorMode(RGB);
        
        // 공 번호 표시
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(r * 0.6);
        text(i + 1, x, y);
    }
    
    // FPS 및 정보 표시
    fill(0);
    textAlign(LEFT, TOP);
    textSize(14);
    text(`FPS: ${Math.round(frameRate())}`, 10, 10);
    text(`공 개수: ${ballCount}`, 10, 30);
    
    // 중력 방향 표시
    let gravityDir = '↓ 아래';  // 기본
    if (currentGravityX < 0) gravityDir = '← 왼쪽';
    else if (currentGravityX > 0) gravityDir = '→ 오른쪽';
    else if (currentGravityY < 0) gravityDir = '↑ 위';
    else if (currentGravityY > 0) gravityDir = '↓ 아래';
    else gravityDir = '⏸ 없음';
    
    text(`중력 방향: ${gravityDir}`, 10, 50);
    text('방향키로 중력 조절 | R: 리셋', 10, 70);
}

function mousePressed() {
    // 캔버스 내부를 클릭했을 때만
    if (mouseX >= 0 && mouseX <= canvasWidth && mouseY >= 0 && mouseY <= canvasHeight) {
        addBallAtPosition(mouseX, mouseY);
    }
}

function addBallAtPosition(x, y) {
    if (typeof Module === 'undefined' || !Module._addBall) {
        console.log('WASM 모듈이 아직 로드되지 않았습니다.');
        return;
    }
    
    const radius = random(15, 35);
    const vx = random(-5, 5);
    const vy = random(-2, 2);
    
    Module._addBall(x, y, vx, vy, radius);
}

function addRandomBall() {
    const x = random(50, canvasWidth - 50);
    const y = random(50, canvasHeight / 2);
    addBallAtPosition(x, y);
}

function addMultipleBalls() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => addRandomBall(), i * 100);
    }
}

function clearAllBalls() {
    if (typeof Module !== 'undefined' && Module._clearBalls) {
        Module._clearBalls();
        colors = [];
    }
}

function toggleGravity() {
    if (typeof Module !== 'undefined' && Module._setGravity) {
        gravityEnabled = !gravityEnabled;
        Module._setGravity(gravityEnabled ? 0.5 : 0);
    }
}

// 키보드 단축키
function keyPressed() {
    if (key === ' ') {
        addRandomBall();
        return false;  // 스페이스바 스크롤 방지
    } else if (key === 'c' || key === 'C') {
        clearAllBalls();
    } else if (key === 'g' || key === 'G') {
        toggleGravity();
    } else if (keyCode === UP_ARROW) {
        // 위쪽 방향키: 중력을 위로
        if (typeof Module !== 'undefined' && Module._setGravityVector) {
            currentGravityX = 0;
            currentGravityY = -0.5;
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (keyCode === DOWN_ARROW) {
        // 아래쪽 방향키: 중력을 아래로 (기본)
        if (typeof Module !== 'undefined' && Module._setGravityVector) {
            currentGravityX = 0;
            currentGravityY = 0.5;
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (keyCode === LEFT_ARROW) {
        // 왼쪽 방향키: 중력을 왼쪽으로
        if (typeof Module !== 'undefined' && Module._setGravityVector) {
            currentGravityX = -0.5;
            currentGravityY = 0;
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (keyCode === RIGHT_ARROW) {
        // 오른쪽 방향키: 중력을 오른쪽으로
        if (typeof Module !== 'undefined' && Module._setGravityVector) {
            currentGravityX = 0.5;
            currentGravityY = 0;
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (key === 'r' || key === 'R') {
        // R키: 중력 리셋 (아래로)
        if (typeof Module !== 'undefined' && Module._setGravityVector) {
            currentGravityX = 0;
            currentGravityY = 0.5;
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
    }
}
