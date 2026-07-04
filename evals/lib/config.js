/**
 * L4 评测配置 — 密钥仅来自环境变量，禁止写入代码/文档
 */

const DEFAULT_BASE_URL = 'https://api.deepseek.com';

function readEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value;
}

function loadL4Config() {
  const apiKey = readEnv('DEEPSEEK_API_KEY', '');
  const model = readEnv('DEEPSEEK_MODEL', '');
  const baseUrl = readEnv('DEEPSEEK_BASE_URL', DEFAULT_BASE_URL);

  return {
    apiKey,
    model,
    baseUrl,
    hasApiKey: Boolean(apiKey),
    hasModel: Boolean(model),
    timeoutMs: Number(readEnv('L4_TIMEOUT_MS', '120000')),
    temperature: Number(readEnv('L4_TEMPERATURE', '0.3')),
  };
}

function assertApiKeyConfigured(config) {
  if (!config.hasApiKey) {
    throw new Error(
      '未配置 DEEPSEEK_API_KEY。请设置环境变量后重试（勿将密钥写入代码或提交到仓库）。'
    );
  }
  if (!config.hasModel) {
    throw new Error(
      '未配置 DEEPSEEK_MODEL。请设置环境变量（如 deepseek-v4-pro），勿使用已下架的 deepseek-chat。'
    );
  }
}

module.exports = {
  DEFAULT_BASE_URL,
  loadL4Config,
  assertApiKeyConfigured,
};
