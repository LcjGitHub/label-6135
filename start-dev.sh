#!/usr/bin/env bash
# 小众播客节目单 - macOS/Linux 一键启动脚本
# 用法: 在终端执行 ./start-dev.sh 或 bash start-dev.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

cleanup() {
    echo ""
    echo -e "${YELLOW}[INFO] 正在停止所有服务...${NC}"
    pkill -P $$ 2>/dev/null || true
    wait 2>/dev/null || true
    echo -e "${GREEN}[OK] 所有服务已停止${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  小众播客节目单 - 开发环境一键启动${NC}"
echo -e "${CYAN}========================================${NC}"

echo -e "${CYAN}[INFO] 检测系统环境...${NC}"

# 检查 Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1 | cut -dv -f2)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        echo -e "${GREEN}[OK] Node.js 已安装: $NODE_VER${NC}"
    else
        echo -e "${YELLOW}[WARN] Node.js 版本较低: $NODE_VER，建议使用 18+${NC}"
    fi
else
    echo -e "${RED}[ERROR] 未检测到 Node.js，请先安装 Node.js 18+${NC}"
    echo -e "${RED}        下载地址: https://nodejs.org/${NC}"
    exit 1
fi

# 检查 Python
PY_CMD=""
PY_VER=""
for cmd in python3 python; do
    if command -v $cmd >/dev/null 2>&1; then
        PY_VER=$($cmd -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>&1)
        PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
        PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
        if [ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -ge 10 ]; then
            echo -e "${GREEN}[OK] Python 已安装: $PY_VER (命令: $cmd)${NC}"
            PY_CMD=$cmd
            break
        else
            echo -e "${YELLOW}[WARN] Python $PY_VER 版本过低，需要 3.10+，继续尝试...${NC}"
        fi
    fi
done
if [ -z "$PY_CMD" ]; then
    echo -e "${RED}[ERROR] 未检测到符合要求的 Python，请先安装 Python 3.10+${NC}"
    echo -e "${RED}        下载地址: https://www.python.org/downloads/${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}[INFO] 检查项目依赖...${NC}"

# 检查根目录 node_modules
if [ ! -d "node_modules" ] || [ ! -f "node_modules/concurrently/package.json" ]; then
    echo -e "${YELLOW}[INFO] 根目录依赖缺失，安装中...${NC}"
    npm install
    echo -e "${GREEN}[OK] 根目录依赖安装完成${NC}"
else
    echo -e "${GREEN}[OK] 根目录依赖已就绪${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  🚀 启动开发服务${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "  ${GREEN}后端 API:${NC}  http://localhost:7000"
echo -e "  ${GREEN}API 文档:${NC}  http://localhost:7000/docs"
echo -e "  ${GREEN}前端页面:${NC}  http://localhost:7101"
echo -e "  ${GREEN}健康检查:${NC}  http://localhost:7000/api/health"
echo -e "  ${YELLOW}提示:${NC} 按 Ctrl+C 停止所有服务"
echo -e "${CYAN}========================================${NC}"
echo ""

npm run dev
