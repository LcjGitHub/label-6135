const http = require('http');

const log = (msg) => console.log(`[healthcheck] ${msg}`);
const error = (msg) => console.error(`[healthcheck][ERROR] ${msg}`);

const HEALTH_URL = 'http://localhost:7000/api/health';
const MAX_RETRIES = parseInt(process.env.HEALTHCHECK_RETRIES || '30', 10);
const RETRY_INTERVAL = parseInt(process.env.HEALTHCHECK_INTERVAL || '1000', 10);

function checkOnce() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.status === 'ok') {
              resolve({ ok: true, data: json });
              return;
            }
          } catch (_) {
            // fall through
          }
          resolve({ ok: false, reason: `响应异常: ${data}` });
        } else {
          resolve({ ok: false, reason: `HTTP ${res.statusCode}` });
        }
      });
    });
    req.on('error', (err) => {
      resolve({ ok: false, reason: err.message });
    });
    req.setTimeout(5000, () => {
      req.destroy(new Error('请求超时'));
    });
  });
}

async function main() {
  log(`开始健康检查: ${HEALTH_URL} (最多重试 ${MAX_RETRIES} 次)`);
  for (let i = 1; i <= MAX_RETRIES; i++) {
    const result = await checkOnce();
    if (result.ok) {
      log(`✓ 第 ${i} 次检查通过: ${JSON.stringify(result.data)}`);
      process.exit(0);
    }
    if (i < MAX_RETRIES) {
      log(`第 ${i}/${MAX_RETRIES} 次失败 (${result.reason})，${RETRY_INTERVAL}ms 后重试...`);
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL));
    } else {
      error(`✗ 经过 ${MAX_RETRIES} 次尝试后健康检查仍然失败: ${result.reason}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkOnce };
