// JavaScript 물리 엔진 (WASM 비교용)
const PIXELS_PER_METER = 100.0;
const GRAVITY = 9.8;
const DT = 1.0 / 60.0;

// Spatial Hash Grid 설정 (C++과 동일)
const GRID_COLS = 12;
const GRID_ROWS = 12;

class JsPhysics {
    constructor() {
        this.balls = [];
        this.gravityX = 0;
        this.gravityY = GRAVITY;
        this.damping = 0.95;
        this.canvasWidth = 8.0;
        this.canvasHeight = 6.0;
        
        // Spatial Hash Grid 초기화
        this.grid = [];
        for (let row = 0; row < GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                this.grid[row][col] = [];
            }
        }
    }

    setCanvasSize(width_px, height_px) {
        this.canvasWidth = width_px / PIXELS_PER_METER;
        this.canvasHeight = height_px / PIXELS_PER_METER;
    }

    setGravityVector(gx, gy) {
        this.gravityX = gx;
        this.gravityY = gy;
    }

    addBall(x_px, y_px, vx_px, vy_px, radius_px) {
        const ball = {
            x: x_px / PIXELS_PER_METER,
            y: y_px / PIXELS_PER_METER,
            vx: vx_px / PIXELS_PER_METER * 60.0,
            vy: vy_px / PIXELS_PER_METER * 60.0,
            radius: radius_px / PIXELS_PER_METER
        };
        const volume = (4.0 / 3.0) * Math.PI * ball.radius * ball.radius * ball.radius;
        ball.mass = 1000.0 * volume;
        this.balls.push(ball);
    }

    clearBalls() {
        this.balls = [];
    }

    // Grid에 공 배치 (C++의 buildGrid()와 동일)
    buildGrid() {
        // Grid 초기화
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                this.grid[row][col] = [];
            }
        }
        
        // 각 공을 해당 cell에 추가
        const cellWidth = this.canvasWidth / GRID_COLS;
        const cellHeight = this.canvasHeight / GRID_ROWS;
        
        for (let i = 0; i < this.balls.length; i++) {
            let col = Math.floor(this.balls[i].x / cellWidth);
            let row = Math.floor(this.balls[i].y / cellHeight);
            
            // 경계 처리
            col = Math.max(0, Math.min(GRID_COLS - 1, col));
            row = Math.max(0, Math.min(GRID_ROWS - 1, row));
            
            this.grid[row][col].push(i);
        }
    }

    // Cell 내부 충돌 검사
    checkCellCollisions(row, col) {
        const indices = this.grid[row][col];
        
        for (let i = 0; i < indices.length; i++) {
            for (let j = i + 1; j < indices.length; j++) {
                this.handleCollision(this.balls[indices[i]], this.balls[indices[j]]);
            }
        }
    }

    // 두 Cell 간 충돌 검사
    checkCellPairCollisions(row1, col1, row2, col2) {
        const indices1 = this.grid[row1][col1];
        const indices2 = this.grid[row2][col2];
        
        for (let idx1 of indices1) {
            for (let idx2 of indices2) {
                this.handleCollision(this.balls[idx1], this.balls[idx2]);
            }
        }
    }

    // Grid 기반 충돌 검사 (C++의 checkAllCollisions()와 동일)
    checkAllCollisions() {
        // 충돌 해결을 2번 반복하여 겹침을 더 확실하게 해소
        for (let iteration = 0; iteration < 2; iteration++) {
            for (let row = 0; row < GRID_ROWS; row++) {
                for (let col = 0; col < GRID_COLS; col++) {
                    // 1. 같은 cell 내부 충돌
                    this.checkCellCollisions(row, col);
                    
                    // 2. 인접 cell과의 충돌 (중복 방지를 위해 오른쪽/아래만 체크)
                    if (col + 1 < GRID_COLS) {
                        this.checkCellPairCollisions(row, col, row, col + 1);  // 오른쪽
                    }
                    if (row + 1 < GRID_ROWS) {
                        this.checkCellPairCollisions(row, col, row + 1, col);  // 아래
                    }
                    if (row + 1 < GRID_ROWS && col + 1 < GRID_COLS) {
                        this.checkCellPairCollisions(row, col, row + 1, col + 1);  // 우하단 대각선
                    }
                    if (row + 1 < GRID_ROWS && col - 1 >= 0) {
                        this.checkCellPairCollisions(row, col, row + 1, col - 1);  // 좌하단 대각선
                    }
                }
            }
            
            // 두 번째 반복에서는 grid를 다시 빌드 (위치가 변경되었으므로)
            if (iteration === 0) {
                this.buildGrid();
            }
        }
    }

    update() {
        // 1. 위치 및 속도 업데이트, 벽 충돌
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];

            // 중력 적용
            ball.vx += this.gravityX * DT;
            ball.vy += this.gravityY * DT;

            // 위치 업데이트
            ball.x += ball.vx * DT;
            ball.y += ball.vy * DT;

            // 벽 충돌 (좌우)
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.vx = -ball.vx * this.damping;
            } else if (ball.x + ball.radius > this.canvasWidth) {
                ball.x = this.canvasWidth - ball.radius;
                ball.vx = -ball.vx * this.damping;
            }

            // 벽 충돌 (상하)
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = -ball.vy * this.damping;
            } else if (ball.y + ball.radius > this.canvasHeight) {
                ball.y = this.canvasHeight - ball.radius;
                ball.vy = -ball.vy * this.damping;

                if (Math.abs(ball.vy) < 0.05) {
                    ball.vy = 0;
                }
            }
        }

        // 2. Spatial Hash Grid 기반 충돌 검사 (O(N) 복잡도)
        this.buildGrid();
        this.checkAllCollisions();
    }

    handleCollision(b1, b2) {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = b1.radius + b2.radius;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq) {
            let distance = Math.sqrt(distSq);
            
            // stuck 방지
            if (distance < 0.001) {
                const angle = Math.random() * Math.PI * 2;
                const offset = 0.01;
                b1.x += Math.cos(angle) * offset;
                b1.y += Math.sin(angle) * offset;
                b2.x -= Math.cos(angle) * offset;
                b2.y -= Math.sin(angle) * offset;
                distance = 0.001;
            }

            const nx = dx / distance;
            const ny = dy / distance;

            // 겹침 해소 - 더 강한 보정으로 완전 분리
            const overlap = minDist - distance;
            const totalMass = b1.mass + b2.mass;
            const separationFactor = 0.8;  // 0.5 -> 0.8로 증가

            const correction1 = overlap * (b2.mass / totalMass) * separationFactor;
            const correction2 = overlap * (b1.mass / totalMass) * separationFactor;

            b1.x -= nx * correction1;
            b1.y -= ny * correction1;
            b2.x += nx * correction2;
            b2.y += ny * correction2;

            // 상대 속도
            const dvx = b2.vx - b1.vx;
            const dvy = b2.vy - b1.vy;
            const dvn = dvx * nx + dvy * ny;

            if (dvn > 0) return;

            // 충돌 반응
            const restitution = 0.7;
            const invMassSum = (1.0 / b1.mass) + (1.0 / b2.mass);
            const impulse = -(1.0 + restitution) * dvn / invMassSum;

            // 속도 업데이트 (감쇠 감소로 더 자연스러운 움직임)
            const ballDamping = 0.95;  // 0.9 -> 0.95로 증가
            b1.vx = (b1.vx - impulse * nx / b1.mass) * ballDamping;
            b1.vy = (b1.vy - impulse * ny / b1.mass) * ballDamping;
            b2.vx = (b2.vx + impulse * nx / b2.mass) * ballDamping;
            b2.vy = (b2.vy + impulse * ny / b2.mass) * ballDamping;

            // 미세 진동 방지: 매우 작은 속도는 0으로 설정
            const minVelocity = 0.01;  // 0.01 m/s 이하는 무시
            if (Math.abs(b1.vx) < minVelocity) b1.vx = 0;
            if (Math.abs(b1.vy) < minVelocity) b1.vy = 0;
            if (Math.abs(b2.vx) < minVelocity) b2.vx = 0;
            if (Math.abs(b2.vy) < minVelocity) b2.vy = 0;
        }
    }
}

// 전역 인스턴스 생성
const jsPhysics = new JsPhysics();
