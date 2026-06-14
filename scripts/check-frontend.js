const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT, 'frontend');
const NODE_MODULES = path.join(FRONTEND_DIR, 'node_modules');
const PACKAGE_LOCK = path.join(FRONTEND_DIR, 'package-lock.json');

const log = (msg) => console.log(`[check-frontend] ${msg}`);
const warn = (msg) => console.warn(`[check-frontend][WARN] ${msg}`);

function checkDependenciesInstalled() {
  return fs.existsSync(NODE_MODULES) && fs.existsSync(path.join(NODE_MODULES, 'vite'));
}

function checkPackageLock() {
  return fs.existsSync(PACKAGE_LOCK);
}

function main() {
  log('检测前端环境...');

  if (!checkPackageLock()) {
    warn('未检测到 package-lock.json，建议先运行: npm run install:frontend');
  }

  if (!checkDependenciesInstalled()) {
    warn('前端依赖未安装，请先运行: npm run install:frontend');
    return false;
  }
  log('✓ 前端依赖已就绪');

  log('前端环境检测通过');
  return true;
}

if (require.main === module) {
  const ok = main();
  process.exit(ok ? 0 : 1);
}

module.exports = { checkDependenciesInstalled, FRONTEND_DIR };
