/**
 * DeepSeek Chat API（OpenAI 兼容），密钥由调用方从环境变量传入
 */

async function chatCompletion({ messages, model, apiKey, baseUrl, timeoutMs = 120000, temperature = 0.3 }) {
  if (!apiKey) {
    throw new Error('API key 未提供');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const started = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch(err => {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error(`DeepSeek API 请求超时 (${timeoutMs}ms)`);
    }
    throw new Error(`DeepSeek API 网络错误: ${err.message}`);
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`DeepSeek API HTTP ${response.status}: ${raw.slice(0, 300)}`);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('DeepSeek API 返回非 JSON 响应');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('DeepSeek API 响应缺少 choices[0].message.content');
  }

  return {
    content,
    duration_ms: Date.now() - started,
    model: data.model || model,
    usage: data.usage || null,
  };
}

module.exports = { chatCompletion };
