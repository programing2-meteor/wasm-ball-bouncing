#include <emscripten/emscripten.h>
#include <cmath>
#include <vector>
#include <algorithm>
#include <cstdlib>

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

// Spatial Hash Grid 설정
const int GRID_COLS = 12;  // 격자 열 개수 (cell 크기 증가로 충돌 감지 개선)
const int GRID_ROWS = 12;  // 격자 행 개수

// 전역 변수
std::vector<Ball> balls;
std::vector<int> grid[GRID_ROWS][GRID_COLS];  // 각 cell에 공 인덱스 저장
float gravityX = 0.0f;          // X축 중력 (m/s²)
float gravityY = GRAVITY;       // Y축 중력 (m/s²)
float damping = 0.95f;          // 에너지 손실 계수
float canvasWidth = 8.0f;       // 캔버스 너비 (미터) - 800px = 8m
float canvasHeight = 6.0f;      // 캔버스 높이 (미터) - 600px = 6m

// Grid에 공 배치
void buildGrid() {
    // Grid 초기화
    for (int row = 0; row < GRID_ROWS; row++) {
        for (int col = 0; col < GRID_COLS; col++) {
            grid[row][col].clear();
        }
    }
    
    // 각 공을 해당 cell에 추가
    float cellWidth = canvasWidth / GRID_COLS;
    float cellHeight = canvasHeight / GRID_ROWS;
    
    for (size_t i = 0; i < balls.size(); i++) {
        int col = (int)(balls[i].x / cellWidth);
        int row = (int)(balls[i].y / cellHeight);
        
        // 경계 처리
        col = std::max(0, std::min(GRID_COLS - 1, col));
        row = std::max(0, std::min(GRID_ROWS - 1, row));
        
        grid[row][col].push_back(i);
    }
}

// 두 공의 충돌 처리
void handleCollision(Ball& b1, Ball& b2) {
    float dx = b2.x - b1.x;
    float dy = b2.y - b1.y;
    float distSq = dx * dx + dy * dy;
    float minDist = b1.radius + b2.radius;
    float minDistSq = minDist * minDist;
    
    // 충돌 발생 체크 (거리 제곱 비교로 sqrt 호출 최소화)
    if (distSq < minDistSq) {
        float distance = sqrt(distSq);
        
        // 거의 같은 위치에 있는 경우 (stuck 방지)
        if (distance < 0.001f) {
            // 약간 랜덤하게 밀어냄
            dx = (float)(rand() % 100 - 50) * 0.01f;
            dy = (float)(rand() % 100 - 50) * 0.01f;
            distance = sqrt(dx * dx + dy * dy);
            if (distance < 0.001f) distance = 0.001f;
        }
        
        // 정규화된 충돌 벡터
        float nx = dx / distance;
        float ny = dy / distance;
        
        // 겹침 해소 - 더 강한 보정으로 완전 분리
        float overlap = minDist - distance;
        float totalMass = b1.mass + b2.mass;
        float separationFactor = 0.8f;  // 80% 해소로 증가 (더 빠른 분리)
        
        // 위치 보정 (질량 비율에 따라)
        float correction1 = overlap * (b2.mass / totalMass) * separationFactor;
        float correction2 = overlap * (b1.mass / totalMass) * separationFactor;
        
        b1.x -= nx * correction1;
        b1.y -= ny * correction1;
        b2.x += nx * correction2;
        b2.y += ny * correction2;
        
        // 상대 속도 계산
        float dvx = b2.vx - b1.vx;
        float dvy = b2.vy - b1.vy;
        float dvn = dvx * nx + dvy * ny;
        
        // 이미 멀어지고 있으면 무시
        if (dvn > 0) return;
        
        // 충돌 임펄스 계산
        float restitution = 0.7f;
        float invMassSum = (1.0f / b1.mass) + (1.0f / b2.mass);
        float impulse = -(1.0f + restitution) * dvn / invMassSum;
        
        // 속도 업데이트 (감쇠 감소로 더 자연스러운 움직임)
        float ballDamping = 0.95f;  // 0.9 -> 0.95로 증가
        b1.vx = (b1.vx - impulse * nx / b1.mass) * ballDamping;
        b1.vy = (b1.vy - impulse * ny / b1.mass) * ballDamping;
        b2.vx = (b2.vx + impulse * nx / b2.mass) * ballDamping;
        b2.vy = (b2.vy + impulse * ny / b2.mass) * ballDamping;
        
        // 미세 진동 방지: 매우 작은 속도는 0으로 설정
        const float minVelocity = 0.01f;  // 0.01 m/s 이하는 무시
        if (fabs(b1.vx) < minVelocity) b1.vx = 0;
        if (fabs(b1.vy) < minVelocity) b1.vy = 0;
        if (fabs(b2.vx) < minVelocity) b2.vx = 0;
        if (fabs(b2.vy) < minVelocity) b2.vy = 0;
    }
}

// Cell 내부 충돌 검사
void checkCellCollisions(int row, int col) {
    const std::vector<int>& indices = grid[row][col];
    
    for (size_t i = 0; i < indices.size(); i++) {
        for (size_t j = i + 1; j < indices.size(); j++) {
            handleCollision(balls[indices[i]], balls[indices[j]]);
        }
    }
}

// 두 Cell 간 충돌 검사
void checkCellPairCollisions(int row1, int col1, int row2, int col2) {
    const std::vector<int>& indices1 = grid[row1][col1];
    const std::vector<int>& indices2 = grid[row2][col2];
    
    for (int idx1 : indices1) {
        for (int idx2 : indices2) {
            handleCollision(balls[idx1], balls[idx2]);
        }
    }
}

// Grid 기반 충돌 검사 (반복 수행으로 안정성 향상)
void checkAllCollisions() {
    // 충돌 해결을 2번 반복하여 겹침을 더 확실하게 해소
    // (특히 여러 공이 동시에 겹칠 때 효과적)
    for (int iteration = 0; iteration < 2; iteration++) {
        for (int row = 0; row < GRID_ROWS; row++) {
            for (int col = 0; col < GRID_COLS; col++) {
                // 1. 같은 cell 내부 충돌
                checkCellCollisions(row, col);
                
                // 2. 인접 cell과의 충돌 (중복 방지를 위해 오른쪽/아래만 체크)
                if (col + 1 < GRID_COLS) {
                    checkCellPairCollisions(row, col, row, col + 1);  // 오른쪽
                }
                if (row + 1 < GRID_ROWS) {
                    checkCellPairCollisions(row, col, row + 1, col);  // 아래
                }
                if (row + 1 < GRID_ROWS && col + 1 < GRID_COLS) {
                    checkCellPairCollisions(row, col, row + 1, col + 1);  // 우하단 대각선
                }
                if (row + 1 < GRID_ROWS && col - 1 >= 0) {
                    checkCellPairCollisions(row, col, row + 1, col - 1);  // 좌하단 대각선
                }
            }
        }
        
        // 두 번째 반복에서는 grid를 다시 빌드 (위치가 변경되었으므로)
        if (iteration == 0) {
            buildGrid();
        }
    }
}

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
        // 1. 위치 및 속도 업데이트, 벽 충돌
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
        
        // 2. Spatial Hash Grid 기반 충돌 검사 (O(N) 복잡도)
        buildGrid();
        checkAllCollisions();
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
