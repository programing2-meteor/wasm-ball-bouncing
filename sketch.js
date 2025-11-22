// p5.js 스케치
const canvasWidth = 1200;
const canvasHeight = 800;
let gravityEnabled = true;
let colors = [];
let currentGravityX = 0;
let currentGravityY = 9.8;  // 실제 중력 가속도 (m/s²)

// 성능 비교용 변수
let useWasm = true;
let physicsTime = 0;

function setup() {
    frameRate(60);  // 60fps로 안정적인 물리 계산
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    // JS 물리 엔진 캔버스 크기 설정
    if (typeof jsPhysics !== 'undefined') {
        jsPhysics.setCanvasSize(canvasWidth, canvasHeight);
    }
    
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
    const t0 = performance.now();
    if (useWasm) {
        Module._updatePhysics();
    } else {
        if (typeof jsPhysics !== 'undefined') {
            jsPhysics.update();
        }
    }
    const t1 = performance.now();
    physicsTime = t1 - t0;
    
    // 공 그리기
    let ballCount = 0;
    if (useWasm) {
        ballCount = Module._getBallCount();
    } else {
        if (typeof jsPhysics !== 'undefined') {
            ballCount = jsPhysics.balls.length;
        }
    }
    
    for (let i = 0; i < ballCount; i++) {
        let x, y, r;
        
        if (useWasm) {
            x = Module._getBallX(i);
            y = Module._getBallY(i);
            r = Module._getBallRadius(i);
        } else {
            const b = jsPhysics.balls[i];
            x = b.x * 100; // 미터 -> 픽셀
            y = b.y * 100;
            r = b.radius * 100;
        }
        
        // 색상 배열이 부족하면 추가
        while (colors.length <= i) {
            colors.push({
                h: random(360),
                s: random(60, 100),
                b: random(60, 100)
            });
        }
        
        // 화면에 보이는 공만 그리기 (최적화)
        if (x > -50 && x < canvasWidth + 50 && y > -50 && y < canvasHeight + 50) {
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
            
            // 공 번호 (너무 많으면 생략)
            if (ballCount < 200) {
                fill(255);
                textAlign(CENTER, CENTER);
                textSize(r * 0.6);
                text(i + 1, x, y);
            }
        }
    }
    
    // ==================== UI 패널 (좌측 상단) ====================
    fill(255, 255, 255, 220);
    stroke(0);
    strokeWeight(1);
    rect(10, 10, 280, 180, 10); // 둥근 모서리
    noStroke();
    
    fill(0);
    textAlign(LEFT, TOP);
    
    // 1. 모드
    textSize(20);
    textStyle(BOLD);
    if (useWasm) {
        fill(0, 100, 255);
        text('MODE: WebAssembly', 25, 25);
    } else {
        fill(255, 100, 0);
        text('MODE: JavaScript', 25, 25);
    }
    
    // 2. 상태 정보
    fill(0);
    textSize(15);
    textStyle(NORMAL);
    text(`Physics Time: ${physicsTime.toFixed(3)} ms`, 25, 55);
    
    // FPS 색상 (30 이하 경고)
    let fps = Math.round(frameRate());
    if (fps < 30) fill(255, 0, 0);
    else fill(0, 150, 0);
    text(`FPS: ${fps}`, 25, 75);
    
    fill(0);
    text(`Balls: ${ballCount}`, 25, 95);
    
    // 도움말
    fill(80);
    textSize(12);
    text('M:모드전환 | B:공100개 | C:초기화', 25, 125);
    text('방향키:중력조절 | R:리셋 | G:ON/OFF', 25, 140);
    
    // ==================== 중력 나침반 UI (우측 상단) ====================
    const compassX = canvasWidth - 80;
    const compassY = 80;
    const compassR = 50;
    
    // 나침반 배경
    fill(255, 255, 255, 200);
    stroke(0);
    strokeWeight(1);
    ellipse(compassX, compassY, compassR * 2, compassR * 2);
    
    // 십자선
    stroke(200);
    line(compassX - compassR, compassY, compassX + compassR, compassY);
    line(compassX, compassY - compassR, compassX, compassY + compassR);
    
    // 중력 화살표
    if (currentGravityX !== 0 || currentGravityY !== 0) {
        let vec = createVector(currentGravityX, currentGravityY);
        vec.normalize();
        vec.mult(compassR - 10); // 화살표 길이
        
        stroke(255, 0, 0);
        strokeWeight(3);
        
        // 화살표 그리기 (중심 -> 방향)
        line(compassX, compassY, compassX + vec.x, compassY + vec.y);
        
        // 화살촉
        push();
        translate(compassX + vec.x, compassY + vec.y);
        rotate(vec.heading());
        let arrowSize = 7;
        line(0, 0, -arrowSize, -arrowSize);
        line(0, 0, -arrowSize, arrowSize);
        pop();
        
        // 텍스트 표시
        noStroke();
        fill(0);
        textAlign(CENTER);
        textSize(12);
        text("GRAVITY", compassX, compassY + compassR + 20);
    } else {
        noStroke();
        fill(150);
        textAlign(CENTER, CENTER);
        textSize(12);
        text("OFF", compassX, compassY);
    }
}

function mousePressed() {
    // 캔버스 내부를 클릭했을 때만
    if (mouseX >= 0 && mouseX <= canvasWidth && mouseY >= 0 && mouseY <= canvasHeight) {
        addBallAtPosition(mouseX, mouseY);
    }
}

function addBallAtPosition(x, y) {
    const radius = random(15, 35);
    const vx = random(-5, 5);
    const vy = random(-2, 2);
    
    if (useWasm) {
        if (typeof Module !== 'undefined' && Module._addBall) {
            Module._addBall(x, y, vx, vy, radius);
        }
    } else {
        // JS 모드
        if (typeof jsPhysics !== 'undefined') {
            jsPhysics.addBall(x, y, vx, vy, radius);
        }
    }
}

function addRandomBall() {
    const x = random(50, canvasWidth - 50);
    const y = random(50, canvasHeight / 2);
    addBallAtPosition(x, y);
}

function addHugeBalls() {
    for (let i = 0; i < 100; i++) {
        addRandomBall();
    }
}

function addMultipleBalls() {
    for (let i = 0; i < 5; i++) {
        addRandomBall();
    }
}

function clearAllBalls() {
    if (typeof Module !== 'undefined' && Module._clearBalls) {
        Module._clearBalls();
    }
    if (typeof jsPhysics !== 'undefined') {
        jsPhysics.clearBalls();
    }
    colors = [];
}

// ==================== 핵심 기능: 엔진 전환 및 동기화 ====================
function togglePhysicsEngine() {
    // jsPhysics가 없으면 전환하지 않음
    if (typeof jsPhysics === 'undefined') {
        console.log("JS 물리 엔진이 로드되지 않아 전환할 수 없습니다.");
        return;
    }

    useWasm = !useWasm;
    
    if (useWasm) {
        // JS -> WASM 동기화
        // 1. WASM 초기화
        Module._clearBalls();
        // 2. JS 데이터를 WASM으로 복사
        if (typeof jsPhysics !== 'undefined') {
            for (let ball of jsPhysics.balls) {
                const xPx = ball.x * 100;
                const yPx = ball.y * 100;
                const vxPx = (ball.vx / 60.0) * 100;
                const vyPx = (ball.vy / 60.0) * 100;
                const rPx = ball.radius * 100;
                
                Module._addBall(xPx, yPx, vxPx, vyPx, rPx);
            }
            // 중력 설정 동기화
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
        
    } else {
        // WASM -> JS 동기화
        if (typeof jsPhysics !== 'undefined') {
            // 1. JS 초기화
            jsPhysics.clearBalls();
            jsPhysics.setGravityVector(currentGravityX, currentGravityY);
            
            // 2. WASM 데이터를 JS로 복사
            const count = Module._getBallCount();
            for (let i = 0; i < count; i++) {
                const xPx = Module._getBallX(i);
                const yPx = Module._getBallY(i);
                const rPx = Module._getBallRadius(i);
                jsPhysics.addBall(xPx, yPx, 0, 0, rPx); 
            }
        }
    }
}

function toggleGravity() {
    // 현재 중력이 켜져있는지 실제 값으로 판단
    const isGravityOn = (currentGravityX !== 0 || currentGravityY !== 0);
    
    if (isGravityOn) {
        // 중력이 켜져있으면 끄기
        currentGravityX = 0;
        currentGravityY = 0;
        gravityEnabled = false;
    } else {
        // 중력이 꺼져있으면 기본값(아래)으로 켜기
        currentGravityX = 0;
        currentGravityY = 9.8;
        gravityEnabled = true;
    }
    
    // 두 엔진 모두 업데이트
    if (typeof Module !== 'undefined' && Module._setGravityVector) {
        Module._setGravityVector(currentGravityX, currentGravityY);
    }
    if (typeof jsPhysics !== 'undefined') {
        jsPhysics.setGravityVector(currentGravityX, currentGravityY);
    }
}

function keyPressed() {
    // 1. 일반 기능 키
    if (key === ' ') {
        addRandomBall();
        return false; 
    } else if (key === 'b' || key === 'B') {
        addHugeBalls(); 
    } else if (key === 'c' || key === 'C') {
        clearAllBalls();
    } else if (key === 'g' || key === 'G') {
        toggleGravity();
    } else if (key === 'm' || key === 'M') { 
        togglePhysicsEngine();
    } 
    
    // 2. 중력 조절 키 (방향키 & R)
    let gravityChanged = false;
    
    if (keyCode === UP_ARROW) {
        currentGravityX = 0;
        currentGravityY = -9.8;
        gravityChanged = true;
    } else if (keyCode === DOWN_ARROW) {
        currentGravityX = 0;
        currentGravityY = 9.8;
        gravityChanged = true;
    } else if (keyCode === LEFT_ARROW) {
        currentGravityX = -9.8;
        currentGravityY = 0;
        gravityChanged = true;
    } else if (keyCode === RIGHT_ARROW) {
        currentGravityX = 9.8;
        currentGravityY = 0;
        gravityChanged = true;
    } else if (key === 'r' || key === 'R') {
        // R키: 완전 리셋
        clearAllBalls();
        currentGravityX = 0;
        currentGravityY = 9.8;
        
        // 초기 공 3개 추가
        addRandomBall();
        addRandomBall();
        addRandomBall();
        
        gravityChanged = true;
    }
    
    // 중력 변경이 발생했다면 엔진에 적용
    if (gravityChanged) {
        if (typeof Module !== 'undefined' && Module._setGravityVector) {
            Module._setGravityVector(currentGravityX, currentGravityY);
        }
        if (typeof jsPhysics !== 'undefined') {
            jsPhysics.setGravityVector(currentGravityX, currentGravityY);
        }
        return false; // 스크롤 방지
    }
}

// HTML 버튼에서 호출할 수 있도록 함수들을 window 객체에 연결
window.addRandomBall = addRandomBall;
window.addMultipleBalls = addMultipleBalls;
window.addHugeBalls = addHugeBalls; // 공 100개 추가 함수 노출
window.clearAllBalls = clearAllBalls;
window.toggleGravity = toggleGravity;
