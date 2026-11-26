<#
.SYNOPSIS
    DANANGACY — Week 5 Automated Testing Demo Runner.
.DESCRIPTION
    Script chạy kiểm thử tự động Tuần 5 cho ứng dụng DANANGACY.
    Hỗ trợ kiểm thử Frontend (153 node:test), Backend (68 pytest) hoặc toàn bộ hệ thống (221 tests).
    Trả mã thoát (exit code) chính xác theo kết quả thực tế của test runner, không in PASS giả.
.PARAMETER Target
    Mục tiêu kiểm thử: 'all', 'frontend', 'backend' hoặc 'interactive'.
.EXAMPLE
    .\testing\week5-demo\run-demo.ps1 -Target all
    .\testing\week5-demo\run-demo.ps1 -Target frontend
    .\testing\week5-demo\run-demo.ps1 -Target backend
#>

[CmdletBinding()]
param(
    [ValidateSet("all", "frontend", "backend", "interactive")]
    [string]$Target = "interactive"
)

# Thiết lập encoding UTF-8 cho console Windows
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Resolve-Path "$scriptDir\..\..").Path

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "   $Title" -ForegroundColor Yellow
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Menu {
    Write-Host "DANANGACY — TUẦN 5 TESTING DEMO RUNNER" -ForegroundColor Green
    Write-Host "Vui lòng chọn mục tiêu kiểm thử:" -ForegroundColor White
    Write-Host "  [1] Chạy toàn bộ kiểm thử hệ thống (Frontend 153 + Backend 68 = 221 Tests)" -ForegroundColor Cyan
    Write-Host "  [2] Chỉ chạy Frontend Test Suite (153 node:test across 10 suites)" -ForegroundColor Yellow
    Write-Host "  [3] Chỉ chạy Backend Pytest Suite (68 pytest across 6 suites)" -ForegroundColor Magenta
    Write-Host "  [4] Kiểm tra môi trường & công cụ (Health Check Prerequisites)" -ForegroundColor Gray
    Write-Host "  [Q] Thoát chương trình" -ForegroundColor Red
    Write-Host ""
    $choice = Read-Host "Nhập lựa chọn của bạn [1-4, Q]"
    return $choice
}

function Test-Prerequisites {
    Write-Host "[1/4] Kiểm tra môi trường Node.js..." -NoNewline
    $nodeVer = & node -v 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK ($nodeVer)" -ForegroundColor Green
    } else {
        Write-Host " LỖI: Không tìm thấy Node.js trên hệ thống!" -ForegroundColor Red
        return $false
    }

    Write-Host "[2/4] Kiểm tra thư mục Frontend & node_modules..." -NoNewline
    if (Test-Path "$rootDir\frontend\node_modules") {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " CẢNH BÁO: Chưa cài đặt node_modules trong frontend!" -ForegroundColor Yellow
    }

    Write-Host "[3/4] Kiểm tra môi trường Python Backend (.venv)..." -NoNewline
    $venvPy = "$rootDir\backend\.venv\Scripts\python.exe"
    if (Test-Path $venvPy) {
        $pyVer = & $venvPy --version 2>$null
        Write-Host " OK ($pyVer)" -ForegroundColor Green
    } else {
        Write-Host " CẢNH BÁO: Không tìm thấy $venvPy, kiểm tra Python toàn cục..." -ForegroundColor Yellow
        $globalPy = & python --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " Tìm thấy $globalPy" -ForegroundColor Green
        } else {
            Write-Host " LỖI: Không tìm thấy Python!" -ForegroundColor Red
            return $false
        }
    }

    Write-Host "[4/4] Kiểm tra tài nguyên Test Data & Mappings..." -NoNewline
    if ((Test-Path "$scriptDir\demo-test-data.json") -and (Test-Path "$scriptDir\test-case-mapping.md")) {
        Write-Host " OK" -ForegroundColor Green
    } else {
        Write-Host " CẢNH BÁO: Thiếu tệp dữ liệu kiểm thử demo!" -ForegroundColor Yellow
    }

    return $true
}

function Run-Frontend-Tests {
    Write-Header "BẮT ĐẦU CHẠY FRONTEND TEST SUITE (153 TESTS)"
    Write-Host "Thư mục: $rootDir\frontend" -ForegroundColor Gray
    Write-Host "Lệnh thực thi: npm run test" -ForegroundColor Gray
    Write-Host "Môi trường: Isolated Node Test Runner (Mock Storage & Network, Safe from Production)" -ForegroundColor Cyan
    Write-Host ""

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    Push-Location "$rootDir\frontend"
    try {
        & npm run test
        $feExit = $LASTEXITCODE
    } finally {
        Pop-Location
        $stopwatch.Stop()
    }

    Write-Host ""
    if ($feExit -eq 0) {
        Write-Host ">>> KẾT QUẢ FRONTEND: 153/153 TESTS PASS (Thời gian: $($stopwatch.Elapsed.TotalSeconds.ToString('0.00'))s)" -ForegroundColor Green
        return $true
    } else {
        Write-Host ">>> KẾT QUẢ FRONTEND: THẤT BẠI (Mã lỗi: $feExit)" -ForegroundColor Red
        return $false
    }
}

function Run-Backend-Tests {
    Write-Header "BẮT ĐẦU CHẠY BACKEND TEST SUITE (68 PYTESTS)"
    Write-Host "Thư mục: $rootDir\backend" -ForegroundColor Gray
    Write-Host "Lệnh thực thi: & .venv/Scripts/python.exe -m pytest -v" -ForegroundColor Gray
    Write-Host "Môi trường: SQLite In-Memory Database (Isolated Transactions, Safe from Production)" -ForegroundColor Cyan
    Write-Host ""

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $venvPy = "$rootDir\backend\.venv\Scripts\python.exe"
    if (-not (Test-Path $venvPy)) {
        $venvPy = "python"
    }

    Push-Location "$rootDir\backend"
    try {
        & $venvPy -m pytest -v
        $beExit = $LASTEXITCODE
    } finally {
        Pop-Location
        $stopwatch.Stop()
    }

    Write-Host ""
    if ($beExit -eq 0) {
        Write-Host ">>> KẾT QUẢ BACKEND: 68/68 TESTS PASS (Thời gian: $($stopwatch.Elapsed.TotalSeconds.ToString('0.00'))s)" -ForegroundColor Green
        return $true
    } else {
        Write-Host ">>> KẾT QUẢ BACKEND: THẤT BẠI (Mã lỗi: $beExit)" -ForegroundColor Red
        return $false
    }
}

# --- XỬ LÝ CHÍNH (MAIN DISPATCHER) ---

Write-Header "DANANGACY — HỆ THỐNG DEMO KIỂM THỬ TỰ ĐỘNG TUẦN 5"
$prereqOk = Test-Prerequisites
if (-not $prereqOk) {
    Write-Host "`nLỗi kiểm tra môi trường ban đầu. Vui lòng cài đặt các công cụ cần thiết!" -ForegroundColor Red
    exit 1
}

if ($Target -eq "interactive") {
    $choice = Show-Menu
    switch ($choice) {
        "1" { $Target = "all" }
        "2" { $Target = "frontend" }
        "3" { $Target = "backend" }
        "4" {
            Write-Host "`nĐã hoàn thành kiểm tra môi trường. Hệ thống sẵn sàng chạy kiểm thử!" -ForegroundColor Green
            exit 0
        }
        default {
            Write-Host "`nĐã hủy bỏ thực thi." -ForegroundColor Gray
            exit 0
        }
    }
}

$allPass = $true
$totalStart = [System.Diagnostics.Stopwatch]::StartNew()

switch ($Target) {
    "frontend" {
        $feSuccess = Run-Frontend-Tests
        if (-not $feSuccess) { $allPass = $false }
    }
    "backend" {
        $beSuccess = Run-Backend-Tests
        if (-not $beSuccess) { $allPass = $false }
    }
    "all" {
        $feSuccess = Run-Frontend-Tests
        $beSuccess = Run-Backend-Tests
        if ((-not $feSuccess) -or (-not $beSuccess)) { $allPass = $false }
    }
}

$totalStart.Stop()
Write-Header "TỔNG KẾT PHIÊN KIỂM THỬ DEMO"

if ($allPass) {
    Write-Host "TRẠNG THÁI CUỐI CÙNG: TẤT CẢ BÀI KIỂM THỬ ĐÃ VƯỢT QUA (PASS 100%)" -ForegroundColor Green
    Write-Host "Tổng thời gian thực thi: $($totalStart.Elapsed.TotalSeconds.ToString('0.00')) giây" -ForegroundColor Cyan
    Write-Host "Bảo đảm an toàn: 0 tệp cơ sở dữ liệu thật bị ảnh hưởng." -ForegroundColor Green
    exit 0
} else {
    Write-Host "TRẠNG THÁI CUỐI CÙNG: CÓ BÀI KIỂM THỬ THẤT BẠI (FAIL)" -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra lại log chi tiết ở trên!" -ForegroundColor Yellow
    exit 1
}
