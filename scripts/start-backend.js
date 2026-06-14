const path = require('path');
const { spawn } = require('child_process');
const { checkVenvExists, checkDependencies, venvPython, BACKEND_DIR } = require('./check-backend');

const log = (msg) => console.log(`[start-backend] ${msg}`);
const error = (msg) => console.error(`[start-backend][ERROR] ${msg}`);

function startBackend() {
  log('启动后端服务...');

  const py = venvPython();
  const child = spawn(`"${py}"`, ['main.py'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    error(`启动失败: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    log(`后端服务退出 (code=${code})`);
    process.exit(code ?? 0);
  });

  return child;
}

function main() {
  if (!checkVenvExists()) {
    error('未检测到虚拟环境，请先运行: npm run install:backend');
    process.exit(1);
  }
  if (!checkDependencies()) {
    error('后端依赖未安装，请先运行: npm run install:backend');
    process.exit(1);
  }

  startBackend();
}

if (require.main === module) {
  main();
}

module.exports = { startBackend };
