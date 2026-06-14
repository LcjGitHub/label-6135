const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const VENV_DIR = path.join(BACKEND_DIR, '.venv');

const log = (msg) => console.log(`[check-backend] ${msg}`);
const warn = (msg) => console.warn(`[check-backend][WARN] ${msg}`);

const isWindows = process.platform === 'win32';

function venvPython() {
  if (isWindows) {
    return path.join(VENV_DIR, 'Scripts', 'python.exe');
  }
  return path.join(VENV_DIR, 'bin', 'python');
}

function checkVenvExists() {
  const pyPath = venvPython();
  return fs.existsSync(VENV_DIR) && fs.existsSync(pyPath);
}

function checkDependencies() {
  try {
    const py = venvPython();
    execSync(`"${py}" -c "import fastapi, uvicorn, sqlalchemy, pydantic"`, {
      stdio: 'ignore',
      timeout: 10000,
    });
    return true;
  } catch (_) {
    return false;
  }
}

function main() {
  log('检测后端环境...');

  if (!checkVenvExists()) {
    warn('未检测到虚拟环境 (backend/.venv)，请先运行: npm run install:backend');
    return false;
  }
  log('✓ 虚拟环境已就绪');

  if (!checkDependencies()) {
    warn('后端依赖未安装，请先运行: npm run install:backend');
    return false;
  }
  log('✓ 后端依赖已就绪');

  log('后端环境检测通过');
  return true;
}

if (require.main === module) {
  const ok = main();
  process.exit(ok ? 0 : 1);
}

module.exports = { checkVenvExists, checkDependencies, venvPython, isWindows, BACKEND_DIR };
