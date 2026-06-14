# 小众播客节目单

MVP 全栈应用：管理小众播客与推荐单集。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + MUI v6 + TanStack Query + dayjs + axios（端口 **7101**） |
| 后端 | FastAPI + SQLite `./backend/data/podcast.db`（端口 **7000**） |

## 目录结构

```
├── backend/              # FastAPI 后端
│   ├── routers/          # API 路由
│   ├── services/         # 业务逻辑
│   ├── data/             # SQLite 数据库
│   ├── main.py           # FastAPI 入口
│   └── pyproject.toml    # Python 依赖配置
├── frontend/             # React 前端
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── scripts/              # 工程化脚本 (Node.js)
│   ├── dev.js            # 一键启动 (检测+启动前后端)
│   ├── check-backend.js  # 后端环境检测
│   ├── check-frontend.js # 前端环境检测
│   ├── install-backend.js# 后端依赖安装
│   ├── start-backend.js  # 后端服务启动
│   ├── healthcheck.js    # 后端健康检查
│   └── ci-backend-healthcheck.js  # CI 后端健康测试
├── .github/
│   └── workflows/
│       └── ci.yml        # GitHub Actions CI 配置
├── start-dev.ps1         # Windows PowerShell 一键启动
├── start-dev.sh          # macOS/Linux Bash 一键启动
├── package.json          # 根目录 npm 脚本
└── README.md
```

## 环境要求

- **Python** 3.10+
- **Node.js** 18+（使用项目内 `npm`，无需全局 pnpm/yarn）

---

## 🚀 快速启动（推荐）

### 方式一：根目录一键启动（自动检测环境）

**Windows PowerShell：**
```powershell
# 首次使用可能需要: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.\start-dev.ps1
```

**macOS / Linux：**
```bash
chmod +x start-dev.sh   # 首次使用赋予执行权限
./start-dev.sh
```

**跨平台 npm（任意系统）：**
```bash
npm install          # 安装根目录辅助依赖 (concurrently)
npm run dev          # 自动检测环境 + 同时启动前后端
```

> `npm run dev` 会依次检测后端虚拟环境与前端依赖，若未就绪则自动安装，然后同时启动两端服务。

启动成功后访问：

| 服务 | 地址 |
|------|------|
| 前端页面 | <http://localhost:7101> |
| 后端 API | <http://localhost:7000> |
| API 文档 (Swagger) | <http://localhost:7000/docs> |
| 健康检查 | <http://localhost:7000/api/health> |

### 方式二：分别手动启动

#### 后端

```bash
npm run install:backend   # 创建虚拟环境 + 安装依赖 (只需首次)
npm run check:backend     # 检测后端环境
npm run dev:backend       # 启动后端 (端口 7000)
```

#### 前端

```bash
npm run install:frontend  # 安装依赖 (只需首次)
npm run check:frontend    # 检测前端环境
npm run dev:frontend      # 启动前端 (端口 7101)
```

---

## 📦 所有可用 npm 脚本

在项目**根目录**执行：

| 命令 | 说明 |
|------|------|
| `npm install` | 安装根目录辅助依赖 (concurrently, rimraf 等) |
| `npm run install:all` | 一键安装根目录 + 前端 + 后端全部依赖 |
| `npm run install:ci` | CI 专用：使用 npm ci 安装所有依赖 |
| `npm run install:frontend` | 仅安装前端依赖 |
| `npm run install:backend` | 仅安装后端依赖 (创建 venv + pip install) |
| `npm run dev` | **推荐**：检测环境 + 同时启动前后端 |
| `npm run dev:frontend` | 仅启动前端开发服务器 |
| `npm run dev:backend` | 仅启动后端服务 |
| `npm run preview` | 预览前端生产构建版本 |
| `npm run check:all` | 同时检测后端和前端环境 |
| `npm run check:backend` | 检测后端虚拟环境和依赖 |
| `npm run check:frontend` | 检测前端 node_modules |
| `npm run healthcheck` | 轮询检查后端 `/api/health` 端点 |
| `npm run typecheck` | 执行前端 TypeScript 类型检查 |
| `npm run build` | 构建前端生产版本 (frontend/dist) |
| `npm run clean` | 清理前后端所有依赖和构建产物 |
| `npm run clean:frontend` | 清理前端 node_modules 和 dist |
| `npm run clean:backend` | 清理后端虚拟环境 |
| `npm run reset` | 完全重置：清理 + 重新安装所有依赖 |
| `npm run ci:install` | CI 用：安装全部依赖 (npm ci 模式) |
| `npm run ci:backend-healthcheck` | CI 用：启动后端→健康检查→停止 |
| `npm run ci:frontend` | CI 用：前端类型检查 + 构建 |
| `npm run ci:all` | CI 用：一次性执行安装 + 后端健康检查 + 前端检查 |

---

## 🔧 持续集成 (GitHub Actions)

项目配置了 GitHub Actions CI 工作流，位于 `.github/workflows/ci.yml`。

### 触发条件

- **push**：推送到任意分支
- **pull_request**：任意分支的 PR

### CI 任务

| Job | 说明 |
|-----|------|
| `backend-check` | 设置 Python → 安装后端依赖 → 验证环境 → 启动后端 → 执行 `/api/health` 健康检查 → 停止后端 |
| `frontend-check` | 设置 Node.js → 安装前端依赖 → 验证环境 → TypeScript 类型检查 (`tsc --noEmit`) → Vite 生产构建 → 上传 `frontend/dist` 构建产物 (保留 7 天) |

### 查看 CI 结果

在 GitHub 仓库的 **Actions** 标签页可查看每次推送的 CI 执行日志和构建产物。

---

## ❓ 常见问题

| 现象 | 处理方式 |
|------|----------|
| `Could not read package.json` | 需在 `frontend/` 目录执行，或在根目录用 `npm run dev` |
| `Port 7101 is already in use` | 关闭占用端口的进程，或结束之前的 `npm run dev` |
| `'vite' 不是内部或外部命令` | 先执行 `npm run install:frontend` |
| 页面显示「加载失败」 | 检查后端是否启动：`npm run healthcheck` |
| PowerShell 禁止执行脚本 | 执行 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| CI 中后端健康检查失败 | 检查后端依赖是否完整，或延长 `ci-backend-healthcheck.js` 中的重试次数 |

---

## 功能范围（MVP）

- **播客列表页**：展示名称、平台、主题、评分、备注；支持增删改
- **播客详情页**：展示播客信息 + 嵌套单集列表；单集含标题、推荐语；支持增删改
- **统计页**：展示播客数量、单集数量等聚合数据

## 数据模型

**播客**：名、平台、主题、评分、备注

**单集**：标题、推荐语

## 刻意排除

登录 / JWT、Redis、Docker、MySQL / PostgreSQL
