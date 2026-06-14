const path = require('path');
const { spawnSync } = require('child_process');
const concurrently = require('concurrently');
const { checkVenvExists, checkDependencies, venvPython, BACKEND_DIR, isWindows } = require('./check-backend');
const { checkDependenciesInstalled, FRONTEND_DIR } = require('./check-frontend');
const { checkOnce } = require('./healthcheck');

const log = (msg) => console.log(`\x1b[36m[dev]\x1b[0m ${msg}`);
const warn = (msg) => console.warn(`\x1b[33m[dev][WARN]\x1b[0m ${msg}`);
const error = (msg) => console.error(`\x1b[31m[dev][ERROR]\x1b[0m ${msg}`);
const success = (msg) => console.log(`\x1b[32m[dev]\x1b[0m ${msg}`);

const ROOT = path.resolve(__dirname, '..');

async function checkEnv() {
  log('======== 检测开发环境 ========');
  let allOk = true;

  log('检测后端环境...');
  if (!checkVenvExists()) {
    warn('未检测到后端虚拟环境，将尝试自动创建并安装依赖...');
    const result = spawnSync('node', [path.join(__dirname, 'install-backend.js')], {
      stdio: 'inherit',
      shell: true,
    });
    allOk = result.status === 0;
  } else if (!checkDependencies()) {
    warn('后端依赖缺失，尝试重新安装...');
    const result = spawnSync('node', [path.join(__dirname, 'install-backend.js')], {
      stdio: 'inherit',
      shell: true,
    });
    allOk = result.status === 0;
  } else {
    success('✓ 后端环境就绪');
  }

  log('检测前端环境...');
  if (!checkDependenciesInstalled()) {
    warn('前端依赖缺失，尝试自动安装...');
    const result = spawnSync('npm', ['run', 'install:frontend'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
    });
    allOk = allOk && result.status === 0;
  } else {
    success('✓ 前端环境就绪');
  }

  return allOk;
}

async function waitForBackendHealthy() {
  log('等待后端服务就绪...');
  const MAX_RETRIES = 30;
  const RETRY_INTERVAL = 1000;

  for (let i = 1; i <= MAX_RETRIES; i++) {
    const result = await checkOnce();
    if (result.ok) {
      success(`✓ 后端服务已就绪 (第 ${i} 次检测)`);
      return true;
    }
    if (i < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
    }
  }
  warn('⚠ 后端健康检查超时，服务可能未完全启动');
  return false;
}

async function startServices() {
  log('======== 启动开发服务 ========');

  const py = venvPython();
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  const commands = [
    {
      command: `"${py}" main.py`,
      name: 'backend',
      prefixColor: 'magenta',
      cwd: BACKEND_DIR,
    },
    {
      command: `${npmCmd} run dev`,
      name: 'frontend',
      prefixColor: 'cyan',
      cwd: FRONTEND_DIR,
    },
  ];

  const { result } = concurrently(commands, {
    killOthers: ['failure', 'signal'],
    restartTries: 0,
    prefix: 'name',
    timestampFormat: 'HH:mm:ss',
  });

  waitForBackendHealthy().then((healthy) => {
    if (healthy) {
      success('====================================');
      success('  🚀 开发服务启动成功！');
      success('====================================');
      success('  后端 API:     http://localhost:7000');
      success('  API 文档:     http://localhost:7000/docs');
      success('  前端页面:     http://localhost:7101');
      success('  健康检查:     http://localhost:7000/api/health');
      success('====================================');
    }
  });

  try {
    await result;
    success('所有服务已正常停止');
    process.exit(0);
  } catch (err) {
    error(`服务异常退出: ${err.message || err}`);
    process.exit(1);
  }
}

async function main() {
  const envOk = await checkEnv();
  if (!envOk) {
    error('环境检测/安装失败，无法启动服务');
    process.exit(1);
  }
  await startServices();
}

if (require.main === module) {
  main();
}
