/**
 * 从 PUAX bundle 构建 with_puax 系统提示（需先 build puax-mcp-server）
 */

const { existsSync } = require('fs');
const { join } = require('path');

const ROOT = join(__dirname, '..', '..');

const DIAGNOSIS_BLOCK = `【诊断先行 — 强制】
回复开头须含：
[PUAX-DIAGNOSIS] 问题是 ___；证据是 ___；下一步动作是 ___

【信心门控】
完成前须自检：列声明、找漏洞、跑验证，不得未验证即宣称完成。`;

const BASELINE_SYSTEM = `你是一名编程助手。请根据用户描述的技术问题给出排查与修复建议。
要求：步骤清晰、可执行；避免空泛安慰。`;

function tryLoadBundledRole(roleId) {
  const bundlePath = join(ROOT, 'puax-mcp-server', 'build', 'prompts', 'prompts-bundle.js');
  if (!existsSync(bundlePath)) return null;

  try {
    const { getBundledSkillById } = require(bundlePath);
    return getBundledSkillById(roleId) || null;
  } catch {
    return null;
  }
}

function buildPuaxSystemPrompt(scenario) {
  const roleId = scenario.recommended_roles?.[0] || 'military-scout';
  const skill = tryLoadBundledRole(roleId);

  if (skill?.content) {
    return `${skill.content}

---
${DIAGNOSIS_BLOCK}
推荐角色: ${roleId}`;
  }

  return `你是 PUAX 激励型技术顾问（角色: ${roleId}）。
${DIAGNOSIS_BLOCK}

方法论：先诊断根因再行动；禁止只在同一思路上调参数；
失败须换思路；完成前须跑验证。`;
}

function buildBaselineSystemPrompt() {
  return BASELINE_SYSTEM;
}

function buildUserMessage(scenario) {
  const lines = [
    `任务: ${scenario.task_prompt}`,
    '',
    '已知上下文:',
    ...(scenario.seed_context || []).map((line, i) => `${i + 1}. ${line}`),
    '',
    '请给出具体排查步骤与修复建议。',
  ];
  return lines.join('\n');
}

module.exports = {
  buildPuaxSystemPrompt,
  buildBaselineSystemPrompt,
  buildUserMessage,
  tryLoadBundledRole,
};
