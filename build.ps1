# WASM Ball Bouncing Physics Engine Build Script (PowerShell)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WASM Ball Bouncing Physics Engine Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Emscripten 확인
Write-Host "Emscripten 확인 중..." -ForegroundColor Yellow
$emccPath = Get-Command emcc -ErrorAction SilentlyContinue
if (-not $emccPath) {
    Write-Host "[ERROR] Emscripten을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "Emscripten 설치 방법:" -ForegroundColor Yellow
    Write-Host "1. https://emscripten.org/docs/getting_started/downloads.html 방문"
    Write-Host "2. emsdk 다운로드 및 설치"
    Write-Host "3. 다음 명령어 실행:"
    Write-Host "   emsdk install latest"
    Write-Host "   emsdk activate latest"
    Write-Host "   emsdk_env.bat"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Emscripten 발견: $($emccPath.Source)" -ForegroundColor Green
Write-Host ""

# 컴파일
Write-Host "[1/3] C++ 코드를 WASM으로 컴파일 중..." -ForegroundColor Yellow
$arguments = @(
    "physics.cpp",
    "-o", "physics.js",
    "-s", "WASM=1",
    "-s", "EXPORTED_RUNTIME_METHODS=[`"ccall`",`"cwrap`"]",
    "-s", "ALLOW_MEMORY_GROWTH=1",
    "-s", "MODULARIZE=0",
    "-O3"
)

try {
    & emcc @arguments
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 컴파일 성공!" -ForegroundColor Green
        Write-Host ""
        
        # 생성된 파일 확인
        Write-Host "[2/3] 빌드 완료!" -ForegroundColor Green
        Write-Host ""
        Write-Host "생성된 파일:" -ForegroundColor Yellow
        if (Test-Path "physics.js") {
            $jsSize = (Get-Item "physics.js").Length
            Write-Host "  ✓ physics.js ($([math]::Round($jsSize/1KB, 2)) KB)" -ForegroundColor Green
        }
        if (Test-Path "physics.wasm") {
            $wasmSize = (Get-Item "physics.wasm").Length
            Write-Host "  ✓ physics.wasm ($([math]::Round($wasmSize/1KB, 2)) KB)" -ForegroundColor Green
        }
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "빌드 완료!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "[3/3] 로컬 서버를 시작하려면:" -ForegroundColor Yellow
        Write-Host "  python -m http.server 8000" -ForegroundColor White
        Write-Host "  또는" -ForegroundColor White
        Write-Host "  npx http-server -p 8000" -ForegroundColor White
        Write-Host ""
        Write-Host "브라우저에서 http://localhost:8000 을 열어주세요." -ForegroundColor Yellow
        Write-Host ""
    } else {
        throw "컴파일 실패 (Exit code: $LASTEXITCODE)"
    }
} catch {
    Write-Host "[ERROR] 컴파일 실패!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"
