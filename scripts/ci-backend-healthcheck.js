const path = require('path');
const { spawn } = require('child_process');
const { checkVenvExists, checkDependencies, venvPython, BACKEND_DIR } = require('./check-backend');
const { checkOnce } = require('./healthcheck');

const log = (msg) => console.log(`[ci-backend-hc] ${msg}`);
const error = (msg) => console.error(`[ci-backend-hc][ERROR] ${msg}`);

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 1000;

async function main() {
  log('======== CI 后端健康检查 ========');

  if (!checkVenvExists()) {
    error('后端虚拟环境不存在');
    process.exit(1);
  }
  if (!checkDependencies()) {
    error('后端依赖未安装');
    process.exit(1);
  }
  log('✓ 后端环境就绪');

  log('启动后端服务 (临时)...');
  const py = venvPython();
  const backend = spawn(`"${py}"`, ['main.py'], {
    cwd: BACKEND_DIR,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  const logLines = [];
  backend.stdout.on('data', (d) => {
    const txt = d.toString();
    logLines.push(txt);
    process.stdout.write(`[backend] ${txt}`);
  });
  backend.stderr.on('data', (d) => {
    const txt = d.toString();
    logLines.push(txt);
    process.stderr.write(`[backend-err] ${txt}`);
  });

  let backendError = null;
  backend.on('error', (err) => {
    backendError = err;
  });

  // 等待后端就绪
  log(`等待后端服务启动 (最多 ${MAX_RETRIES * RETRY_INTERVAL / 1000}s)...`);
  let healthy = false;
  for (let i = 1; i <= MAX_RETRIES; i++) {
    if (backend.exitCode !== null) {
      backendError = backendError || new Error(`后端进程提前退出 (code=${backend.exitCode})`);
      break;
    }
    const result = await checkOnce();
    if (result.ok) {
      log(`✓ 第 ${i} 次检测: 后端服务健康`);
      healthy = true;
      break;
    }
    if (i < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
    }
  }

  // 停止后端
  log('停止后端服务...');
  const killed = new Promise((resolve) => {
    backend.on('exit', () => resolve());
    backend.kill('SIGTERM');
    setTimeout(() => {
      backend.kill('SIGKILL');
      setTimeout(resolve, 500);
    }, 5000);
  });
  await killed;

  if (backendError) {
    error(`后端错误: ${backendError.message}`);
    process.exit(1);
  }
  if (!healthy) {
    error('✗ 后端健康检查失败: 服务未在规定时间内就绪');
    process.exit(1);
  }

  log('======== CI 后端健康检查通过 ✓ ========');
}

if (require.main === module) {
  main();
}
