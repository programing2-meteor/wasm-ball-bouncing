// p5.js 스케치
const canvasWidth = 800;
const canvasHeight = 600;
let gravityEnabled = true;
let colors = [];

function setup() {
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
    
    // 물리 업데이트 (현재 시간을 초 단위로 전달)
    Module._updatePhysics(millis() / 1000.0);
    
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
    
    // FPS 표시
    fill(0);
    textAlign(LEFT, TOP);
    textSize(14);
    text(`FPS: ${Math.round(frameRate())}`, 10, 10);
    text(`공 개수: ${ballCount}`, 10, 30);
    text(`중력: ${gravityEnabled ? 'ON' : 'OFF'}`, 10, 50);
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
    const vx = random(-10, 10);  // 픽셀/초 단위로 조정
    const vy = random(-25, 25);  // 픽셀/초 단위로 조정
    
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
        Module._setGravity(gravityEnabled ? 500.0 : 0);  // 픽셀/초^2 단위로 조정
    }
}

// 키보드 단축키
function keyPressed() {
    if (key === ' ') {
        addRandomBall();
    } else if (key === 'c' || key === 'C') {
        clearAllBalls();
    } else if (key === 'g' || key === 'G') {
        toggleGravity();
    }
}
