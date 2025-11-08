#include <emscripten/emscripten.h>
#include <cmath>
#include <vector>

// Ball 구조체 정의
struct Ball {
    float x, y;        // 위치
    float vx, vy;      // 속도
    float radius;      // 반지름
    float mass;        // 질량
};

// 전역 변수
std::vector<Ball> balls;
float gravity = 0.5f;
float damping = 0.95f;  // 에너지 손실 계수
float canvasWidth = 800.0f;
float canvasHeight = 600.0f;

// 공 추가
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    int addBall(float x, float y, float vx, float vy, float radius) {
        Ball ball;
        ball.x = x;
        ball.y = y;
        ball.vx = vx;
        ball.vy = vy;
        ball.radius = radius;
        ball.mass = radius * radius * 3.14159f;  // 질량은 반지름의 제곱에 비례
        balls.push_back(ball);
        return balls.size() - 1;
    }

    // 캔버스 크기 설정
    EMSCRIPTEN_KEEPALIVE
    void setCanvasSize(float width, float height) {
        canvasWidth = width;
        canvasHeight = height;
    }

    // 중력 설정
    EMSCRIPTEN_KEEPALIVE
    void setGravity(float g) {
        gravity = g;
    }

    // 물리 업데이트
    EMSCRIPTEN_KEEPALIVE
    void updatePhysics() {
        for (auto& ball : balls) {
            // 중력 적용
            ball.vy += gravity;
            
            // 위치 업데이트
            ball.x += ball.vx;
            ball.y += ball.vy;
            
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
                
                // 바닥에 거의 정지한 경우
                if (fabs(ball.vy) < 0.5f) {
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
                    
                    // 상대 속도
                    float dvx = b2.vx - b1.vx;
                    float dvy = b2.vy - b1.vy;
                    float dvn = dvx * nx + dvy * ny;
                    
                    // 이미 멀어지고 있으면 무시
                    if (dvn < 0) continue;
                    
                    // 충돌 임펄스 계산
                    float impulse = 2.0f * dvn / totalMass;
                    
                    // 속도 업데이트
                    b1.vx += impulse * b2.mass * nx;
                    b1.vy += impulse * b2.mass * ny;
                    b2.vx -= impulse * b1.mass * nx;
                    b2.vy -= impulse * b1.mass * ny;
                }
            }
        }
    }

    // 공 개수 반환
    EMSCRIPTEN_KEEPALIVE
    int getBallCount() {
        return balls.size();
    }

    // 공 위치 가져오기
    EMSCRIPTEN_KEEPALIVE
    float getBallX(int index) {
        if (index >= 0 && index < balls.size()) {
            return balls[index].x;
        }
        return 0;
    }

    EMSCRIPTEN_KEEPALIVE
    float getBallY(int index) {
        if (index >= 0 && index < balls.size()) {
            return balls[index].y;
        }
        return 0;
    }

    EMSCRIPTEN_KEEPALIVE
    float getBallRadius(int index) {
        if (index >= 0 && index < balls.size()) {
            return balls[index].radius;
        }
        return 0;
    }

    // 모든 공 제거
    EMSCRIPTEN_KEEPALIVE
    void clearBalls() {
        balls.clear();
    }
}
