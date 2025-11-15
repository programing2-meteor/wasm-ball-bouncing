@echo off
chcp 65001 >nul
echo ========================================
echo WASM Ball Bouncing Physics Engine Build
echo ========================================
echo.

REM Emscripten 환경 설정
set EMSDK_PATH=C:\Users\kazma\Desktop\schcool\soongsil\emsdk
if exist "%EMSDK_PATH%\emsdk_env.bat" (
    echo Emscripten 환경 설정 중...
    call "%EMSDK_PATH%\emsdk_env.bat" >nul 2>&1
    echo 완료!
    echo.
)

REM Emscripten이 설치되어 있는지 확인
where emcc >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Emscripten을 찾을 수 없습니다.
    echo.
    echo Emscripten 설치 방법:
    echo 1. https://emscripten.org/docs/getting_started/downloads.html 방문
    echo 2. emsdk 다운로드 및 설치
    echo 3. 다음 명령어 실행:
    echo    emsdk install latest
    echo    emsdk activate latest
    echo    emsdk_env.bat
    echo.
    pause
    exit /b 1
)

echo [1/3] C++ 코드를 WASM으로 컴파일 중...
echo (최적화 중이라 약 5-10초 소요됩니다...)
call emcc physics.cpp -o physics.js -s WASM=1 -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=0 -O3
set COMPILE_RESULT=%ERRORLEVEL%
echo 컴파일 종료 (결과 코드: %COMPILE_RESULT%)

if %COMPILE_RESULT% NEQ 0 (
    echo.
    echo [ERROR] 컴파일 실패!
    pause
    exit /b 1
)

echo.
echo [2/3] 빌드 완료!
echo.
echo 생성된 파일:
echo - physics.js
echo - physics.wasm
echo.

echo [3/3] 로컬 서버를 시작하려면 다음 명령어를 실행하세요:
echo.
echo   python -m http.server 8000
echo   또는
echo   npx http-server -p 8000
echo   또는 라이브 서버를 킨 후
echo   localhost:5500 접속해서 보기
echo.
echo 그 다음 브라우저에서 http://localhost:8000 or http://localhost:5500 을 열어주세요.
echo.

pause
