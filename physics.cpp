#include <emscripten/emscripten.h>
#include <cmath>
#include <vector>

// Ball 구조체 정의
struct Ball {
    float x, y;        // 위치 (미터)
    float vx, vy;      // 속도 (미터/초)
    float radius;      // 반지름 (미터)
    float mass;        // 질량 (kg)
};

// 물리 상수
const float PIXELS_PER_METER = 100.0f;  // 화면 스케일: 100 픽셀 = 1 미터
const float GRAVITY = 9.8f;              // 중력 가속도 (m/s²)
const float DT = 1.0f / 60.0f;           // 시간 간격 (초) - 60fps 기준

// 전역 변수
std::vector<Ball> balls;
float gravityX = 0.0f;          // X축 중력 (m/s²)
float gravityY = GRAVITY;       // Y축 중력 (m/s²)
float damping = 0.95f;          // 에너지 손실 계수
float canvasWidth = 8.0f;       // 캔버스 너비 (미터) - 800px = 8m
float canvasHeight = 6.0f;      // 캔버스 높이 (미터) - 600px = 6m

// 공 추가 (픽셀 좌표를 받아서 미터로 변환)
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int addBall(float x_px, float y_px, float vx_px, float vy_px, float radius_px) {
        Ball ball;
        // 픽셀 -> 미터 변환
        ball.x = x_px / PIXELS_PER_METER;
        ball.y = y_px / PIXELS_PER_METER;
        ball.vx = vx_px / PIXELS_PER_METER * 60.0f;  // 픽셀/프레임 -> 미터/초 변환 (60fps 가정)
        ball.vy = vy_px / PIXELS_PER_METER * 60.0f;
        ball.radius = radius_px / PIXELS_PER_METER;
        // 질량 = 밀도 * 부피, 공의 밀도를 1000 kg/m³로 가정 (물과 비슷)
        float volume = (4.0f / 3.0f) * 3.14159f * ball.radius * ball.radius * ball.radius;
        ball.mass = 1000.0f * volume;
        balls.push_back(ball);
        return balls.size() - 1;
    }

    // 캔버스 크기 설정 (픽셀 -> 미터 변환)
    EMSCRIPTEN_KEEPALIVE
    void setCanvasSize(float width_px, float height_px) {
        canvasWidth = width_px / PIXELS_PER_METER;
        canvasHeight = height_px / PIXELS_PER_METER;
    }

    // 중력 설정 (Y축만) - m/s² 단위
    EMSCRIPTEN_KEEPALIVE
    void setGravity(float g) {
        gravityY = g;  // 기본값: 9.8 m/s²
    }
    
    // 중력 벡터 설정 (X, Y축 모두) - m/s² 단위
    EMSCRIPTEN_KEEPALIVE
    void setGravityVector(float gx, float gy) {
        gravityX = gx;
        gravityY = gy;
    }

    // 물리 업데이트 (실제 물리 단위 사용)
    EMSCRIPTEN_KEEPALIVE
    void updatePhysics() {
        for (auto& ball : balls) {
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
            } else if (ball.x + ball.radius > canvasWidth) {
                ball.x = canvasWidth - ball.radius;
                ball.vx = -ball.vx * damping;
            }
            
            // 벽 충돌 체크 (상하)
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.vy = -ball.vy * damping;
            } else if (ball.y + ball.radius > canvasHeight) {
                ball.y = canvasHeight - ball.radius;
                ball.vy = -ball.vy * damping;
                
                // 바닥에 거의 정지한 경우 (속도 0.05 m/s 이하)
                if (fabs(ball.vy) < 0.05f) {
                    ball.vy = 0;
                }
            }
        }
        
        // 공끼리 충돌 체크
        for (size_t i = 0; i < balls.size(); i++) {
            for (size_t j = i + 1; j < balls.size(); j++) {
                Ball& b1 = balls[i];
                Ball& b2 = balls[j];
                
                float dx = b2.x - b1.x;
                float dy = b2.y - b1.y;
                float distance = sqrt(dx * dx + dy * dy);
                float minDist = b1.radius + b2.radius;
                
                // 충돌 발생
                if (distance < minDist) {
                    // 정규화된 충돌 벡터
                    float nx = dx / distance;
                    float ny = dy / distance;
                    
                    // 겹침 해소
                    float overlap = minDist - distance;
                    float totalMass = b1.mass + b2.mass;
                    b1.x -= nx * overlap * (b2.mass / totalMass);
                    b1.y -= ny * overlap * (b2.mass / totalMass);
                    b2.x += nx * overlap * (b1.mass / totalMass);
                    b2.y += ny * overlap * (b1.mass / totalMass);
                    
                    // 상대 속도 계산
                    float dvx = b2.vx - b1.vx;
                    float dvy = b2.vy - b1.vy;
                    float dvn = dvx * nx + dvy * ny;
                    
                    // 이미 멀어지고 있으면 무시
                    if (dvn > 0) continue;
                    
                    // 충돌 임펄스 계산 (올바른 물리 공식)
                    float restitution = 0.7f;  // 반발 계수 (0~1, 1은 완전 탄성 충돌)
                    float invMassSum = (1.0f / b1.mass) + (1.0f / b2.mass);
                    float impulse = -(1.0f + restitution) * dvn / invMassSum;
                    
                    // 속도 업데이트 (감쇠 적용)
                    float ballDamping = 0.9f;  // 공끼리 충돌 시 에너지 손실
                    b1.vx = (b1.vx - impulse * nx / b1.mass) * ballDamping;
                    b1.vy = (b1.vy - impulse * ny / b1.mass) * ballDamping;
                    b2.vx = (b2.vx + impulse * nx / b2.mass) * ballDamping;
                    b2.vy = (b2.vy + impulse * ny / b2.mass) * ballDamping;
                }
            }
        }
    }

    // 공 개수 반환
    EMSCRIPTEN_KEEPALIVE
    int getBallCount() {
        return balls.size();
    }

    // 공 위치 가져오기 (미터 -> 픽셀 변환)
    EMSCRIPTEN_KEEPALIVE
    float getBallX(int index) {
        if (index >= 0 && index < balls.size()) {
            return balls[index].x * PIXELS_PER_METER;
        }
        return 0;
    }

    EMSCRIPTEN_KEEPALIVE
    float getBallY(int index) {
        if (index >= 0 && index < balls.size()) {
            return balls[index].y * PIXELS_PER_METER;
        }
        return 0;
    }

    EMSCRIPTEN_KEEPALIVE
    float getBallRadius(int index) {
        if (index >= 0 && index < balls.size()) {
            return balls[index].radius * PIXELS_PER_METER;
        }
        return 0;
    }

    // 모든 공 제거
    EMSCRIPTEN_KEEPALIVE
    void clearBalls() {
        balls.clear();
    }
}
