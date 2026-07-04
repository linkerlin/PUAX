/**
 * L4 单场景执行器
 */

const { writeFileSync, mkdirSync } = require('fs');
const { join } = require('path');
const { loadL4Config, assertApiKeyConfigured } = require('./config.js');
const { chatCompletion } = require('./deepseek-client.js');
const {
  buildPuaxSystemPrompt,
  buildBaselineSystemPrompt,
  buildUserMessage,
} = require('./puax-prompt.js');
const { analyzeResponse, METRIC_KEYS } = require('./response-analyzer.js');

const RESULTS_DIR = join(__dirname, '..', 'results');

async function executeScenarioRun({ scenario, variant, dryRun = false, resultsDir = RESULTS_DIR }) {
  if (!['with_puax', 'without_puax'].includes(variant)) {
    throw new Error(`variant 须为 with_puax | without_puax`);
  }

  const config = loadL4Config();
  const userMessage = buildUserMessage(scenario);
  const systemPrompt =
    variant === 'with_puax'
      ? buildPuaxSystemPrompt(scenario)
      : buildBaselineSystemPrompt();

  if (dryRun) {
    return {
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      variant,
      dry_run: true,
      system_prompt_chars: systemPrompt.length,
      user_message_chars: userMessage.length,
      config: { model: config.model, baseUrl: config.baseUrl, hasApiKey: config.hasApiKey },
    };
  }

  assertApiKeyConfigured(config);

  const llm = await chatCompletion({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    model: config.model,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
    temperature: config.temperature,
  });

  const { behavior_flags, metrics } = analyzeResponse(llm.content, scenario);

  const record = {
    scenario_id: scenario.id,
    scenario_name: scenario.name,
    variant,
    recorded_at: new Date().toISOString(),
    task_prompt: scenario.task_prompt,
    metrics: Object.fromEntries(METRIC_KEYS.map(k => [k, metrics[k] ?? 0])),
    behavior_flags,
    notes: `L4 auto-run via DeepSeek (${config.model})`,
    session_ref: `l4-${scenario.id}-${variant}-${Date.now()}`,
    llm: {
      provider: 'deepseek',
      model: llm.model,
      duration_ms: llm.duration_ms,
      usage: llm.usage,
    },
    response_excerpt: llm.content.slice(0, 800),
  };

  mkdirSync(resultsDir, { recursive: true });
  const outPath = join(resultsDir, `${scenario.id}-${variant}.json`);
  writeFileSync(outPath, JSON.stringify(record, null, 2), 'utf-8');

  return { ...record, output_path: outPath };
}

module.exports = { executeScenarioRun, RESULTS_DIR };
