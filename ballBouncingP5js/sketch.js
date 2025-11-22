// p5.js 스케치 (순수 JavaScript 물리 엔진)
const canvasWidth = 800;
const canvasHeight = 600;
let gravityEnabled = true;
let colors = [];
let currentGravityX = 0;
let currentGravityY = 9.8;  // 실제 중력 가속도 (m/s²)

// 물리 상수
const PIXELS_PER_METER = 100.0;  // 화면 스케일: 100 픽셀 = 1 미터
const GRAVITY = 9.8;              // 중력 가속도 (m/s²)
const DT = 1.0 / 60.0;            // 시간 간격 (초) - 60fps 기준

let balls = [];
let gravityX = 0.0;               // X축 중력 (m/s²)
let gravityY = GRAVITY;           // Y축 중력 (m/s²)
let damping = 0.95;
let canvasWidthM = 8.0;           // 캔버스 너비 (미터) - 800px = 8m
let canvasHeightM = 6.0;          // 캔버스 높이 (미터) - 600px = 6m

class Ball {
    constructor(x_px, y_px, vx_px, vy_px, radius_px) {
        // 픽셀 -> 미터 변환
        this.x = x_px / PIXELS_PER_METER;
        this.y = y_px / PIXELS_PER_METER;
        this.vx = vx_px / PIXELS_PER_METER * 60.0;  // 픽셀/프레임 -> 미터/초
        this.vy = vy_px / PIXELS_PER_METER * 60.0;
        this.radius = radius_px / PIXELS_PER_METER;
        
        // 질량 = 밀도 * 부피, 공의 밀도를 1000 kg/m³로 가정 (물과 비슷)
        const volume = (4.0 / 3.0) * 3.14159 * this.radius * this.radius * this.radius;
        this.mass = 1000.0 * volume;
    }
    
    // 렌더링용 픽셀 좌표 반환
    getPxX() { return this.x * PIXELS_PER_METER; }
    getPxY() { return this.y * PIXELS_PER_METER; }
    getPxR() { return this.radius * PIXELS_PER_METER; }
}

function setup() {
    frameRate(60);  // 60fps로 안정적인 물리 계산
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');
    
    // 초기 공 몇 개 추가
    setTimeout(() => {
        addRandomBall();
        addRandomBall();
        addRandomBall();
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
    
    // 물리 업데이트
    updatePhysics();
    
    // 공 그리기
    const ballCount = balls.length;
    
    for (let i = 0; i < ballCount; i++) {
        const ball = balls[i];
        const x = ball.getPxX();
        const y = ball.getPxY();
        const r = ball.getPxR();
        
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

function updatePhysics() {
    // 개별 공 업데이트
    for (const ball of balls) {
        // 중력 가속도 적용 (a = g, v = v + a*dt)
        ball.vx += gravityX * DT;
        ball.vy += gravityY * DT;
        
        // 위치 업데이트 (x = x + v*dt)
        ball.x += ball.vx * DT;
        ball.y += ball.vy * DT;
        
        // 벽 충돌 체크 (좌우)
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx * damping;
        } else if (ball.x + ball.radius > canvasWidthM) {
            ball.x = canvasWidthM - ball.radius;
            ball.vx = -ball.vx * damping;
        }
        
        // 벽 충돌 체크 (상하)
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy * damping;
        } else if (ball.y + ball.radius > canvasHeightM) {
            ball.y = canvasHeightM - ball.radius;
            ball.vy = -ball.vy * damping;
            
            // 바닥에 거의 정지한 경우 (속도 0.05 m/s 이하)
            if (Math.abs(ball.vy) < 0.05) {
                ball.vy = 0;
            }
        }
    }
    
    // 공끼리 충돌 체크
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.radius + b2.radius;
            
            // 충돌 발생
            if (distance < minDist) {
                // 정규화된 충돌 벡터
                const nx = dx / distance;
                const ny = dy / distance;
                
                // 겹침 해소
                const overlap = minDist - distance;
                const totalMass = b1.mass + b2.mass;
                b1.x -= nx * overlap * (b2.mass / totalMass);
                b1.y -= ny * overlap * (b2.mass / totalMass);
                b2.x += nx * overlap * (b1.mass / totalMass);
                b2.y += ny * overlap * (b1.mass / totalMass);
                
                // 상대 속도 계산
                const dvx = b2.vx - b1.vx;
                const dvy = b2.vy - b1.vy;
                const dvn = dvx * nx + dvy * ny;
                
                // 이미 멀어지고 있으면 무시
                if (dvn > 0) continue;
                
                // 충돌 임펄스 계산 (올바른 물리 공식)
                const restitution = 0.7;  // 반발 계수 (0~1, 1은 완전 탄성 충돌)
                const invMassSum = (1.0 / b1.mass) + (1.0 / b2.mass);
                const impulse = -(1.0 + restitution) * dvn / invMassSum;
                
                // 속도 업데이트 (감쇠 적용)
                const ballDamping = 0.9;  // 공끼리 충돌 시 에너지 손실
                b1.vx = (b1.vx - impulse * nx / b1.mass) * ballDamping;
                b1.vy = (b1.vy - impulse * ny / b1.mass) * ballDamping;
                b2.vx = (b2.vx + impulse * nx / b2.mass) * ballDamping;
                b2.vy = (b2.vy + impulse * ny / b2.mass) * ballDamping;
            }
        }
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
    
    balls.push(new Ball(x, y, vx, vy, radius));
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
    balls = [];
    colors = [];
}

function toggleGravity() {
    gravityEnabled = !gravityEnabled;
    gravityY = gravityEnabled ? 9.8 : 0;
}

// 공 개수 반환 함수 (comparison.html에서 사용)
function getBallCount() {
    return balls.length;
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
        currentGravityX = 0;
        currentGravityY = -9.8;  // 실제 중력 가속도 (m/s²)
        gravityX = currentGravityX;
        gravityY = currentGravityY;
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (keyCode === DOWN_ARROW) {
        // 아래쪽 방향키: 중력을 아래로 (기본)
        currentGravityX = 0;
        currentGravityY = 9.8;  // 실제 중력 가속도 (m/s²)
        gravityX = currentGravityX;
        gravityY = currentGravityY;
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (keyCode === LEFT_ARROW) {
        // 왼쪽 방향키: 중력을 왼쪽으로
        currentGravityX = -9.8;  // 실제 중력 가속도 (m/s²)
        currentGravityY = 0;
        gravityX = currentGravityX;
        gravityY = currentGravityY;
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (keyCode === RIGHT_ARROW) {
        // 오른쪽 방향키: 중력을 오른쪽으로
        currentGravityX = 9.8;  // 실제 중력 가속도 (m/s²)
        currentGravityY = 0;
        gravityX = currentGravityX;
        gravityY = currentGravityY;
        return false;  // 방향키 기본 동작(스크롤) 방지
    } else if (key === 'r' || key === 'R') {
        // R키: 중력 리셋 (아래로)
        currentGravityX = 0;
        currentGravityY = 9.8;  // 실제 중력 가속도 (m/s²)
        gravityX = currentGravityX;
        gravityY = currentGravityY;
    }
}
