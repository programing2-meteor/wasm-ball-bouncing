// JavaScript 물리 엔진 (WASM 비교용)
const PIXELS_PER_METER = 100.0;
const GRAVITY = 9.8;
const DT = 1.0 / 60.0;

class JsPhysics {
    constructor() {
        this.balls = [];
        this.gravityX = 0;
        this.gravityY = GRAVITY;
        this.damping = 0.95;
        this.canvasWidth = 8.0;
        this.canvasHeight = 6.0;
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

        // 2. 공끼리 충돌 (O(N²) - Spatial Grid 없음)
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const b1 = this.balls[i];
                const b2 = this.balls[j];

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

                    // 겹침 해소
                    const overlap = minDist - distance;
                    const totalMass = b1.mass + b2.mass;
                    const separationFactor = 0.5;

                    b1.x -= nx * overlap * (b2.mass / totalMass) * separationFactor;
                    b1.y -= ny * overlap * (b2.mass / totalMass) * separationFactor;
                    b2.x += nx * overlap * (b1.mass / totalMass) * separationFactor;
                    b2.y += ny * overlap * (b1.mass / totalMass) * separationFactor;

                    // 상대 속도
                    const dvx = b2.vx - b1.vx;
                    const dvy = b2.vy - b1.vy;
                    const dvn = dvx * nx + dvy * ny;

                    if (dvn > 0) continue;

                    // 충돌 반응
                    const restitution = 0.7;
                    const invMassSum = (1.0 / b1.mass) + (1.0 / b2.mass);
                    const impulse = -(1.0 + restitution) * dvn / invMassSum;

                    const ballDamping = 0.9;
                    b1.vx = (b1.vx - impulse * nx / b1.mass) * ballDamping;
                    b1.vy = (b1.vy - impulse * ny / b1.mass) * ballDamping;
                    b2.vx = (b2.vx + impulse * nx / b2.mass) * ballDamping;
                    b2.vy = (b2.vy + impulse * ny / b2.mass) * ballDamping;
                }
            }
        }
    }
}

// 전역 인스턴스 생성
const jsPhysics = new JsPhysics();
