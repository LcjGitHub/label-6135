const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(ROOT, 'backend');
const VENV_DIR = path.join(BACKEND_DIR, '.venv');

const log = (msg) => console.log(`[install-backend] ${msg}`);
const error = (msg) => console.error(`[install-backend][ERROR] ${msg}`);

const isWindows = process.platform === 'win32';

function findPython() {
  const candidates = ['python3', 'python', 'py'];
  for (const cmd of candidates) {
    try {
      const result = spawnSync(cmd, ['--version'], { encoding: 'utf-8', shell: true });
      if (result.status === 0) {
        log(`检测到 Python: ${cmd} (${result.stdout.trim() || result.stderr.trim()})`);
        return cmd;
      }
    } catch (_) {
      // continue
    }
  }
  return null;
}

function venvPython() {
  if (isWindows) {
    return path.join(VENV_DIR, 'Scripts', 'python.exe');
  }
  return path.join(VENV_DIR, 'bin', 'python');
}

function ensureVenv(pythonCmd) {
  if (fs.existsSync(venvPython())) {
    log('✓ 虚拟环境已存在，跳过创建');
    return true;
  }
  log(`创建虚拟环境: ${VENV_DIR}`);
  const result = spawnSync(pythonCmd, ['-m', 'venv', '.venv'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    error('创建虚拟环境失败');
    return false;
  }
  log('✓ 虚拟环境创建成功');
  return true;
}

function upgradePip() {
  log('升级 pip...');
  const result = spawnSync(`"${venvPython()}"`, ['-m', 'pip', 'install', '--upgrade', 'pip'], {
    stdio: 'inherit',
    shell: true,
  });
  return result.status === 0;
}

function installDependencies() {
  log('安装后端依赖 (pip install -e .)...');
  const result = spawnSync(`"${venvPython()}"`, ['-m', 'pip', 'install', '-e', '.'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    error('后端依赖安装失败');
    return false;
  }
  log('✓ 后端依赖安装成功');
  return true;
}

function main() {
  log('开始配置后端环境...');

  const pythonCmd = findPython();
  if (!pythonCmd) {
    error('未检测到 Python，请先安装 Python 3.10+ 并加入 PATH');
    process.exit(1);
  }

  // 检查 Python 版本 >= 3.10
  const versionOutput = spawnSync(pythonCmd, ['-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'], {
    encoding: 'utf-8',
    shell: true,
  }).stdout.trim();
  const [major, minor] = versionOutput.split('.').map(Number);
  if (major < 3 || (major === 3 && minor < 10)) {
    error(`Python 版本过低: ${versionOutput}，需要 3.10+`);
    process.exit(1);
  }
  log(`✓ Python 版本 ${versionOutput} 满足要求`);

  if (!ensureVenv(pythonCmd)) {
    process.exit(1);
  }

  upgradePip();

  if (!installDependencies()) {
    process.exit(1);
  }

  log('后端环境配置完成 ✓');
}

if (require.main === module) {
  main();
}
