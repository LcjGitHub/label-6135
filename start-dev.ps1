# 小众播客节目单 - Windows 一键启动脚本
# 用法: 在 PowerShell 中执行 .\start-dev.ps1

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$cleanupJob = {
    Write-Host ""
    Write-Host "[INFO] 正在停止所有服务..." -ForegroundColor Yellow
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] 所有服务已停止" -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  小众播客节目单 - 开发环境一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "[INFO] 检测系统环境..." -ForegroundColor Cyan

# 检查 Node.js
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($nodeMajor -ge 18) {
            Write-Host "[OK] Node.js 已安装: $nodeVersion" -ForegroundColor Green
        } else {
            Write-Host "[WARN] Node.js 版本较低: $nodeVersion，建议使用 18+" -ForegroundColor Yellow
        }
    } else {
        throw "Node.js 未找到"
    }
} catch {
    Write-Host "[ERROR] 未检测到 Node.js，请先安装 Node.js 18+" -ForegroundColor Red
    Write-Host "        下载地址: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# 检查 Python
$pythonFound = $false
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $pyVersionOutput = & $cmd -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>&1
        if ($LASTEXITCODE -eq 0 -and $pyVersionOutput -match '^(\d+)\.(\d+)') {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]
            if ($major -eq 3 -and $minor -ge 10) {
                Write-Host "[OK] Python 已安装: $pyVersionOutput (命令: $cmd)" -ForegroundColor Green
                $pythonFound = $true
                $pythonCmd = $cmd
                break
            } else {
                Write-Host "[WARN] Python $pyVersionOutput 版本过低，需要 3.10+，继续尝试..." -ForegroundColor Yellow
            }
        }
    } catch {
        continue
    }
}
if (-not $pythonFound) {
    Write-Host "[ERROR] 未检测到符合要求的 Python，请先安装 Python 3.10+ 并加入 PATH" -ForegroundColor Red
    Write-Host "        下载地址: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] 检查项目依赖..." -ForegroundColor Cyan

# 检查根目录 node_modules
if (-not (Test-Path "node_modules") -or -not (Test-Path "node_modules\concurrently\package.json")) {
    Write-Host "[INFO] 根目录依赖缺失，安装中..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] 根目录依赖安装完成" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] 根目录依赖安装失败" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] 根目录依赖已就绪" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 启动开发服务" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  后端 API:  http://localhost:7000" -ForegroundColor DarkGray
Write-Host "  API 文档:  http://localhost:7000/docs" -ForegroundColor DarkGray
Write-Host "  前端页面:  http://localhost:7101" -ForegroundColor DarkGray
Write-Host "  健康检查:  http://localhost:7000/api/health" -ForegroundColor DarkGray
Write-Host "  提示: 按 Ctrl+C 停止所有服务" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
