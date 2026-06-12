# 小众播客节目单

MVP 全栈应用：管理小众播客与推荐单集。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + MUI v6 + TanStack Query + dayjs + axios（端口 **7101**） |
| 后端 | FastAPI + SQLite `./backend/data/podcast.db`（端口 **7000**） |

## 目录结构

```
├── backend/          # FastAPI 后端
├── frontend/         # React 前端
└── README.md
```

## 环境要求

- **Python** 3.10+
- **Node.js** 18+（使用项目内 `npm`，无需全局 pnpm/yarn）

## 启动方式

### 1. 后端（一条命令）

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -e .
python main.py
```

服务启动后访问：<http://localhost:7000/docs> 查看 API 文档。

首次启动会自动创建 SQLite 数据库并写入 **3 档播客、各 2 单集** 的种子数据。

### 2. 前端

**方式 A（推荐，在项目根目录）：**

```bash
npm install --prefix frontend
npm run dev
```

**方式 B（在 frontend 目录内）：**

```bash
cd frontend
npm install
npm run dev
```

浏览器打开：<http://localhost:7101>

> 请先确保后端已在 7000 端口运行，否则页面会提示「加载失败」。

## 常见问题

| 现象 | 处理方式 |
|------|----------|
| `Could not read package.json` | 需在 `frontend/` 目录执行，或在根目录用 `npm run dev` |
| `Port 7101 is already in use` | 关闭占用端口的进程，或结束之前的 `npm run dev` |
| `'vite' 不是内部或外部命令` | 先执行 `npm install`（或 `npm install --prefix frontend`） |
| 页面显示「加载失败」 | 先启动后端：`cd backend` → 激活 venv → `python main.py` |

## 功能范围（MVP）

- **播客列表页**：展示名称、平台、主题、评分、备注；支持增删改
- **播客详情页**：展示播客信息 + 嵌套单集列表；单集含标题、推荐语；支持增删改

## 数据模型

**播客**：名、平台、主题、评分、备注

**单集**：标题、推荐语

## 刻意排除

登录 / JWT、Redis、Docker、MySQL / PostgreSQL
