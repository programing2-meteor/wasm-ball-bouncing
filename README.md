# 🎱 WASM Ball Bouncing Physics Engine

WebAssembly와 p5.js를 활용한 실시간 공 튀기기 물리 시뮬레이션입니다.

## ✨ 주요 기능

- **C++ 물리 엔진**: 고성능 물리 계산을 위해 C++로 작성되고 WASM으로 컴파일
- **p5.js 시각화**: 부드러운 애니메이션과 아름다운 시각 효과
- **실시간 상호작용**: 마우스 클릭으로 공 추가
- **물리 시뮬레이션**:
  - 중력 효과
  - 벽면 충돌
  - 공 간 충돌 (탄성 충돌)
  - 에너지 감쇠 (damping)

## 📁 프로젝트 구조

```
wasm-ball-bouncing/
├── physics.cpp          # C++ 물리 엔진 소스 코드
├── index.html           # 메인 HTML 파일
├── sketch.js            # p5.js 스케치 (시각화)
├── build.bat            # Windows 빌드 스크립트
├── build.sh             # Linux/Mac 빌드 스크립트
├── p5.min.js            # p5.js 라이브러리
├── physics.js           # 컴파일된 WASM 래퍼 (빌드 후 생성)
└── physics.wasm         # 컴파일된 WASM 바이너리 (빌드 후 생성)
```

## 🚀 시작하기

### 1. 사전 요구사항

- **Emscripten SDK**: C++를 WASM으로 컴파일하기 위해 필요
- **로컬 웹 서버**: WASM 파일을 로드하기 위해 필요 (Python 또는 Node.js)

### 2. Emscripten 설치

```bash
# emsdk 다운로드
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 최신 버전 설치 및 활성화
emsdk install latest
emsdk activate latest

# Windows
emsdk_env.bat

# Linux/Mac
source ./emsdk_env.sh
```

### 3. 프로젝트 빌드

#### Windows (PowerShell):
```powershell
.\build.ps1
```

#### Windows (CMD):
```bash
build.bat
```

#### Linux/Mac:
```bash
chmod +x build.sh
./build.sh
```

**참고**: PowerShell에서 `.bat` 파일은 인코딩 문제가 있을 수 있으니 `.ps1` 사용을 권장합니다.

빌드가 성공하면 `physics.js`와 `physics.wasm` 파일이 생성됩니다.

### 4. 로컬 서버 실행

#### Python 사용:
```bash
python -m http.server 8000
```

#### Node.js 사용:
```bash
npx http-server -p 8000
```

### 5. 브라우저에서 실행

브라우저를 열고 `http://localhost:8000` 접속

## 🎮 사용법

### 마우스 조작
- **클릭**: 클릭한 위치에 새로운 공 추가

### 버튼
- **공 추가**: 랜덤한 위치에 공 하나 추가
- **공 5개 추가**: 랜덤한 위치에 공 5개 순차적으로 추가
- **모두 지우기**: 모든 공 제거
- **중력 ON/OFF**: 중력 효과 토글

### 키보드 단축키
- **스페이스바**: 랜덤 위치에 공 추가
- **C**: 모든 공 제거
- **G**: 중력 ON/OFF

## 🔧 기술 스택

- **C++**: 물리 엔진 계산 로직
- **WebAssembly**: 고성능 웹 실행
- **Emscripten**: C++를 WASM으로 컴파일
- **p5.js**: 캔버스 기반 그래픽 및 애니메이션
- **HTML5/CSS3**: 사용자 인터페이스

## 📊 물리 엔진 상세

### 구현된 물리 법칙

1. **중력**: 모든 공에 일정한 하향 가속도 적용
2. **속도 업데이트**: 위치를 속도에 따라 업데이트
3. **벽면 충돌**: 
   - 경계를 넘어가면 위치 보정
   - 속도 반전 및 감쇠 적용
4. **공 간 충돌**:
   - 충돌 감지 (거리 계산)
   - 겹침 해소 (질량 비율에 따라)
   - 탄성 충돌 임펄스 계산
   - 속도 업데이트

### C++ API

```cpp
// 공 추가
int addBall(float x, float y, float vx, float vy, float radius)

// 캔버스 크기 설정
void setCanvasSize(float width, float height)

// 중력 설정
void setGravity(float g)

// 물리 시뮬레이션 업데이트
void updatePhysics()

// 공 개수 조회
int getBallCount()

// 공 정보 조회
float getBallX(int index)
float getBallY(int index)
float getBallRadius(int index)

// 모든 공 제거
void clearBalls()
```

## 🎨 커스터마이징

### 물리 파라미터 수정

`physics.cpp` 파일에서 다음 값들을 조정할 수 있습니다:

```cpp
float gravity = 0.5f;      // 중력 강도
float damping = 0.95f;     // 에너지 감쇠 (0~1, 1에 가까울수록 탄성적)
```

### 시각 효과 수정

`sketch.js` 파일에서 색상, 크기, 애니메이션 효과를 수정할 수 있습니다.

## 🐛 문제 해결

### WASM 모듈이 로드되지 않을 때
- 로컬 서버를 통해 실행하고 있는지 확인 (file:// 프로토콜로는 작동하지 않음)
- 브라우저 콘솔에서 오류 메시지 확인

### 빌드 오류
- Emscripten이 올바르게 설치되고 활성화되었는지 확인
- `emcc --version` 명령어로 설치 확인

### 성능 이슈
- 공의 개수를 줄여보세요
- `physics.cpp`의 최적화 레벨을 조정 (`-O3` → `-O2`)

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 🙏 크레딧

- **p5.js**: https://p5js.org/
- **Emscripten**: https://emscripten.org/
- **WebAssembly**: https://webassembly.org/

---

만든 날짜: 2025
