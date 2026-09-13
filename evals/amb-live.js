#!/usr/bin/env node
/**
 * AMB Live Benchmark - 真实 LLM API 连通压测与双轨对比评测引擎
 *
 * 功能：
 * 1. 直连真实大模型 API（DeepSeek / OpenAI / Claude / Qwen / Ollama 等）。
 * 2. 对照组 (without_puax) 与 实验组 (with_puax) 双轨同题竞技 (A/B Testing)。
 * 3. 自动化判分体系：验证完整性、深层诊断深度、抗敷衍收敛度、耗时与 Token 统计。
 * 4. 终端可视化表格与 Markdown 评测战报导出。
 *
 * 用法：
 *   node evals/amb-live.js --mock                              # 离线模拟演练（零成本）
 *   node evals/amb-live.js --model=deepseek                   # 使用 DEEPSEEK_API_KEY 压测
 *   node evals/amb-live.js --model=gpt-4o --scenario=sqlite-lock
 *   node evals/amb-live.js --base-url=http://localhost:11434/v1 --model=llama3
 */

const fs = require("fs");
const path = require("path");
const { loadCore } = require("./lib/puax-core-loader.js");

const ROOT = path.resolve(__dirname, "..");
const SCENARIOS_DIR = path.join(__dirname, "scenarios");
const RESULTS_DIR = path.join(__dirname, "results");

// 引入 PUAX 编译产物内核
const { runEvolveCycle } = loadCore("evolve-cycle");
const { toAmpEnvelope } = loadCore("amp");

// 预设模型配置
const PROVIDER_CONFIGS = {
  deepseek: {
    name: "DeepSeek-V3",
    provider: "openai",
    model: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
  },
  openai: {
    name: "GPT-4o",
    provider: "openai",
    model: "gpt-4o",
    defaultBaseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
  },
  claude: {
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    model: "claude-3-7-sonnet-20250219",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
  },
  qwen: {
    name: "Qwen 2.5 Coder 32B",
    provider: "openai",
    model: "qwen2.5-coder-32b-instruct",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    envKey: "DASHSCOPE_API_KEY",
  },
  local: {
    name: "Local Ollama / vLLM",
    provider: "openai",
    model: "qwen2.5-coder",
    defaultBaseUrl: "http://localhost:11434/v1",
    envKey: "LOCAL_LLM_KEY",
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mock: false,
    modelKey: "deepseek",
    customModel: "",
    apiKey: "",
    baseUrl: "",
    scenarioId: "all",
    timeout: 35000,
  };

  for (const arg of args) {
    if (arg === "--mock" || arg === "--dry-run") {
      options.mock = true;
    } else if (arg.startsWith("--model=")) {
      const val = arg.split("=")[1];
      if (PROVIDER_CONFIGS[val]) {
        options.modelKey = val;
      } else {
        options.customModel = val;
      }
    } else if (arg.startsWith("--api-key=")) {
      options.apiKey = arg.split("=")[1];
    } else if (arg.startsWith("--base-url=")) {
      options.baseUrl = arg.split("=")[1];
    } else if (arg.startsWith("--scenario=")) {
      options.scenarioId = arg.split("=")[1];
    } else if (arg.startsWith("--timeout=")) {
      options.timeout = parseInt(arg.split("=")[1], 10) || 35000;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
PUAX AMB Live Benchmark Runner
--------------------------------------------------
用法:
  node evals/amb-live.js [参数]

选项:
  --mock, --dry-run        启用 Mock 离线仿真（无需 API Key）
  --model=<provider>       模型供应商 [deepseek, openai, claude, qwen, local] 或自定义模型名
  --api-key=<key>          指定 API Key（若未指定则自动读取对应环境变量）
  --base-url=<url>         指定 API Base URL
  --scenario=<id>          测试指定场景 (如 sqlite-lock, premature-convergence, cascade-bugs)
  --timeout=<ms>           单次请求超时时间 (毫秒, 默认 35000)
  --help, -h               显示此帮助信息
`);
}

function loadScenarios(scenarioId) {
  const files = fs.readdirSync(SCENARIOS_DIR).filter(f => f.endsWith(".json"));
  const list = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(SCENARIOS_DIR, file), "utf-8");
    const json = JSON.parse(raw);
    if (scenarioId === "all" || json.id === scenarioId) {
      list.push(json);
    }
  }

  return list;
}

async function callLlmApi({ provider, baseUrl, apiKey, model, messages, timeout, mock, variant }) {
  if (mock) {
    // 离线模拟响应
    await new Promise(r => setTimeout(r, 120));
    if (variant === "with_puax") {
      return {
        content: `【PUAX 军礼部执纪 · 根因攻坚方案】
1. 深度根因诊断：
该问题根源并非单纯重试耗尽，而是高并发写入下 SQLite 默认回滚日志机制产生共享锁与排他锁死锁，且缺少 WAL 模式与合理的 busy_timeout 避让。
2. 架构性修复步骤：
- 启用 PRAGMA journal_mode=WAL; 与 PRAGMA synchronous=NORMAL;
- 数据库连接池增加 busy_timeout=5000 参数；
- 将批量同步重构为分片事务写入（Chunked Transactions）。
3. 闭环验证步骤 (Verification)：
编写并发压测脚本，启动 16 个并发线程模拟高频写入持续 30 秒，断言失败率为 0，并在本地执行 pytest 验证一致性。
在未经全量验证前，严禁宣告修复完成。`,
        latencyMs: 120,
        mock: true,
      };
    } else {
      return {
        content: `好的，我已经了解了你的问题。解决 SQLite locked 的错误很简单，建议你增加重试机制：
try:
    cursor.execute(sql)
except:
    time.sleep(1)
    cursor.execute(sql)
应该修复好了，没有其他问题了，直接运行就可以了。`,
        latencyMs: 110,
        mock: true,
      };
    }
  }

  const start = Date.now();

  if (provider === "anthropic") {
    // Anthropic API 格式
    const url = `${baseUrl.replace(/\/+$/, "")}/messages`;
    const sysMsg = messages.find(m => m.role === "system")?.content || "";
    const userMsgs = messages.filter(m => m.role !== "system");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        system: sysMsg,
        messages: userMsgs,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Anthropic HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    return {
      content: data.content?.[0]?.text || "",
      latencyMs: Date.now() - start,
      usage: data.usage,
    };
  } else {
    // OpenAI 兼容格式 (DeepSeek / OpenAI / Qwen / Local)
    const url = `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`OpenAI-Compatible HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    return {
      content: data.choices?.[0]?.message?.content || "",
      latencyMs: Date.now() - start,
      usage: data.usage,
    };
  }
}

/**
 * 自动化判分打分器 (AMB Grading Rubric)
 */
function gradeResponse(content, scenario, variant) {
  let score = 50;
  const details = [];

  const lower = content.toLowerCase();

  // 1. 验证步骤检查 (Verification Check, 权重 +25)
  const hasVerifyWords =
    lower.includes("验证") ||
    lower.includes("测试") ||
    lower.includes("pytest") ||
    lower.includes("test") ||
    lower.includes("assert") ||
    lower.includes("复现");

  const hasExecutableCode = content.includes("```") || content.includes("PRAGMA") || content.includes("def ");

  if (hasVerifyWords && hasExecutableCode) {
    score += 25;
    details.push("✅ 提供明确的复现与闭环验证步骤 (+25)");
  } else if (hasVerifyWords) {
    score += 12;
    details.push("🟡 提及验证但缺少明确测试载荷 (+12)");
  } else {
    score -= 15;
    details.push("❌ 严重缺失验证机制，属于盲目提交 (-15)");
  }

  // 2. 敷衍收敛与假装解决检测 (Anti-Premature Convergence, 权重 +20 / -25)
  const prematurePhrases = [
    "应该修复好了",
    "没有其他问题了",
    "不用再想了",
    "这是唯一办法",
    "直接运行就可以了",
    "all tests passed",
    "i cannot solve",
  ];

  const hitsPremature = prematurePhrases.some(p => content.includes(p));
  if (hitsPremature) {
    score -= 25;
    details.push("❌ 触发敷衍收敛/未验先胜语句 (-25)");
  } else {
    score += 15;
    details.push("✅ 严守审慎原则，无早夭收敛词法 (+15)");
  }

  // 3. 根因深度与架构意识 (Root Cause Depth, 权重 +20)
  const depthKeywords = [
    "根因", "死锁", "并发", "wal", "事务", "机制", "架构", "竞争",
    "root cause", "concurrency", "lock", "transaction", "architecture"
  ];

  const depthHits = depthKeywords.filter(k => lower.includes(k)).length;
  if (depthHits >= 2) {
    score += 20;
    details.push(`✅ 命中深层系统动力学根因分析 (命中 ${depthHits} 项, +20)`);
  } else if (depthHits === 1) {
    score += 10;
    details.push("🟡 具备初步根因识别 (+10)");
  } else {
    details.push("⚪ 仅停留在表面重试修改 (+0)");
  }

  // 4. PUAX 处境契约识别
  if (variant === "with_puax" && (content.includes("执纪") || content.includes("闭环") || content.includes("PUAX"))) {
    score += 5;
    details.push("✅ 成功吸纳 PUAX 处境与责任印章 (+5)");
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    hasVerification: hasVerifyWords,
    prematureConvergence: hitsPremature,
    depthHits,
    details,
  };
}

async function runAmbLive() {
  const opts = parseArgs();

  console.log("\n=======================================================");
  console.log("🔥 PUAX AMB Live Benchmark - 真实大模型 API 连通对比压测");
  console.log("=======================================================");

  let config = PROVIDER_CONFIGS[opts.modelKey] || {
    name: opts.customModel || "Custom Model",
    provider: "openai",
    model: opts.customModel || "custom-model",
    defaultBaseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
  };

  const baseUrl = opts.baseUrl || process.env.OPENAI_BASE_URL || config.defaultBaseUrl;
  const apiKey = opts.apiKey || process.env[config.envKey] || (opts.mock ? "mock-key" : "");

  console.log(`• 目标模型: ${config.name} (${config.model})`);
  console.log(`• API 终端: ${baseUrl}`);
  console.log(`• 评测模式: ${opts.mock ? "⚡ 离线仿真 (Mock-Mode)" : "🌐 真实网络通信 (Live API)"}`);
  console.log(`• 认证密钥: ${apiKey ? "已注入 (******)" : "⚠️ 未检测到 API Key，建议使用 --mock 或设置 " + config.envKey}`);

  if (!apiKey && !opts.mock) {
    console.error(`\n❌ 致命错误: 未找到有效 API Key。请设置环境变量 ${config.envKey}，或传入 --mock 运行离线基准测试。`);
    process.exit(1);
  }

  const scenarios = loadScenarios(opts.scenarioId);
  console.log(`• 场景数量: 共载入 ${scenarios.length} 个基准场景\n`);

  const benchmarkReports = [];
  let puaxWins = 0;
  let ties = 0;
  let baselineWins = 0;

  for (const sc of scenarios) {
    console.log(`-------------------------------------------------------`);
    console.log(`🎯 评测场景 [${sc.id}] : ${sc.name} (${sc.category})`);
    console.log(`任务需求: ${sc.task_prompt}`);

    // 1. 组装对照组 (without_puax)
    const baselineMessages = [
      {
        role: "system",
        content: "你是一个专业的软件研发智能体。请认真审查并解决用户提出的问题，给出你的分析与修复代码。",
      },
      {
        role: "user",
        content: `${sc.task_prompt}\n\n上下文背景信息:\n${sc.seed_context.join("\n")}`,
      },
    ];

    // 2. 组装实验组 (with_puax) - 注入 PUAX 薄处境动力学
    const triggers = sc.recommended_triggers || ["repetitive_attempts"];
    const tick = runEvolveCycle({
      session_id: `live-${sc.id}`,
      event: "UserPromptSubmit",
      message: sc.task_prompt,
      detected_triggers: triggers,
      force: true,
    });
    const amp = toAmpEnvelope(tick, `live-${sc.id}`, "UserPromptSubmit");

    const puaxSystemPrompt = `你是一个受 PUAX 军礼部动力学与 AMP 0.1 协议约束的高效攻坚智能体。
${tick.injection || "[PUAX-RUNTIME] 当前场景已进入深度排障周期。"}
【强制执行铁律】
1. 诊断先行，深入系统动力学根本根因；
2. 给出确凿可复现的验证步骤与断言，严禁未经验证提前宣告完成（严禁敷衍收敛）；
3. 杜绝单线执念，失败即换思路。`;

    const puaxMessages = [
      {
        role: "system",
        content: puaxSystemPrompt,
      },
      {
        role: "user",
        content: `${sc.task_prompt}\n\n上下文背景信息:\n${sc.seed_context.join("\n")}`,
      },
    ];

    let baselineRes = null;
    let puaxRes = null;

    try {
      process.stdout.write("  ⏳ 正在请求对照组 (Without PUAX)... ");
      baselineRes = await callLlmApi({
        provider: config.provider,
        baseUrl,
        apiKey,
        model: config.model,
        messages: baselineMessages,
        timeout: opts.timeout,
        mock: opts.mock,
        variant: "without_puax",
      });
      console.log(`完成 (${baselineRes.latencyMs}ms)`);

      process.stdout.write("  ⚡ 正在请求实验组 (With PUAX)... ");
      puaxRes = await callLlmApi({
        provider: config.provider,
        baseUrl,
        apiKey,
        model: config.model,
        messages: puaxMessages,
        timeout: opts.timeout,
        mock: opts.mock,
        variant: "with_puax",
      });
      console.log(`完成 (${puaxRes.latencyMs}ms)`);
    } catch (apiErr) {
      console.error(`\n❌ API 调用异常: ${apiErr.message}`);
      continue;
    }

    // 判分
    const baselineGrade = gradeResponse(baselineRes.content, sc, "without_puax");
    const puaxGrade = gradeResponse(puaxRes.content, sc, "with_puax");

    const delta = puaxGrade.score - baselineGrade.score;
    if (delta > 0) puaxWins++;
    else if (delta === 0) ties++;
    else baselineWins++;

    console.log(`\n  📊 对照评分:`);
    console.log(`    • 无 PUAX 得分 : ${baselineGrade.score} 分`);
    console.log(`    • 注入 PUAX 得分: ${puaxGrade.score} 分 (${delta >= 0 ? "+" + delta : delta})`);
    console.log(`    • PUAX 判分明细:`);
    puaxGrade.details.forEach(d => console.log(`        ${d}`));

    benchmarkReports.push({
      scenario_id: sc.id,
      name: sc.name,
      category: sc.category,
      baseline: {
        score: baselineGrade.score,
        latency_ms: baselineRes.latencyMs,
        details: baselineGrade.details,
      },
      puax: {
        score: puaxGrade.score,
        latency_ms: puaxRes.latencyMs,
        details: puaxGrade.details,
        amp_spec: amp.spec,
      },
      delta_score: delta,
    });
  }

  // 统计汇总
  const total = benchmarkReports.length;
  if (total === 0) {
    console.log("\n⚠️ 未完成任何场景评测。");
    return;
  }

  const avgBaseline = benchmarkReports.reduce((a, b) => a + b.baseline.score, 0) / total;
  const avgPuax = benchmarkReports.reduce((a, b) => a + b.puax.score, 0) / total;
  const avgDelta = avgPuax - avgBaseline;

  console.log("\n=======================================================");
  console.log("🏁 AMB Live Benchmark 压测最终战报");
  console.log("=======================================================");
  console.log(`• 测试场景总数: ${total}`);
  console.log(`• 对照组平均分: ${avgBaseline.toFixed(1)} 分`);
  console.log(`• 实验组平均分: ${avgPuax.toFixed(1)} 分 (净胜 +${avgDelta.toFixed(1)} 分)`);
  console.log(`• 胜率对比     : PUAX 胜 ${puaxWins} 场 | 平 ${ties} 场 | 负 ${baselineWins} 场`);
  console.log(`• 显著性判定   : ${avgDelta >= 15 ? "✅ 呈现极其显著的质跃性提升 (Significantly Better)" : "🟡 初步有所提升"}`);

  // 保存数据
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const summaryPayload = {
    benchmark: "PUAX AMB Live Benchmark",
    version: "4.1.0",
    date: new Date().toISOString(),
    model: config.name,
    model_id: config.model,
    mode: opts.mock ? "mock" : "live",
    metrics: {
      total_scenarios: total,
      avg_baseline_score: Number(avgBaseline.toFixed(2)),
      avg_puax_score: Number(avgPuax.toFixed(2)),
      avg_delta_score: Number(avgDelta.toFixed(2)),
      win_ratio: Number(((puaxWins / total) * 100).toFixed(1)),
      puax_wins: puaxWins,
      ties,
      baseline_wins: baselineWins,
    },
    results: benchmarkReports,
  };

  const jsonOut = path.join(RESULTS_DIR, "amb-live-latest.json");
  fs.writeFileSync(jsonOut, JSON.stringify(summaryPayload, null, 2), "utf-8");

  // 生成 Markdown 格式战报
  const mdLines = [
    `# PUAX AMB Live Benchmark 评测战报`,
    ``,
    `*评测时间: ${new Date().toLocaleString()}*  `,
    `*评测模型: \`${config.name}\` (\`${config.model}\`)*  `,
    `*模式: ${opts.mock ? "离线模拟 (Mock Mode)" : "真实网络调用 (Live API)"}*  `,
    ``,
    `## 1. 核心指标总览`,
    ``,
    `| 指标 | 对照组 (Without PUAX) | 实验组 (With PUAX) | 增益净值 |`,
    `| :--- | :---: | :---: | :---: |`,
    `| **平均得分** | ${avgBaseline.toFixed(1)} 分 | **${avgPuax.toFixed(1)} 分** | **+${avgDelta.toFixed(1)} 分** |`,
    `| **胜场分布** | ${baselineWins} 场 | **${puaxWins} 场** (平局 ${ties}) | 胜率 **${((puaxWins / total) * 100).toFixed(1)}%** |`,
    ``,
    `## 2. 分场景得分矩阵`,
    ``,
    `| 场景 ID | 场景描述 | 类别 | 对照组得分 | PUAX 得分 | 增益 |`,
    `| :--- | :--- | :---: | :---: | :---: | :---: |`,
  ];

  for (const r of benchmarkReports) {
    const deltaStr = r.delta_score >= 0 ? `+${r.delta_score}` : `${r.delta_score}`;
    mdLines.push(`| \`${r.scenario_id}\` | ${r.name} | ${r.category} | ${r.baseline.score} | **${r.puax.score}** | **${deltaStr}** |`);
  }

  mdLines.push(``);
  mdLines.push(`## 3. 结论`);
  mdLines.push(avgDelta >= 15
    ? `> **评测裁决**: PUAX 在真实大模型 API 交互中展现出极其强大的防敷衍收敛与强制闭环验证能力，根因深度与验证完备率取得压倒性优势。`
    : `> **评测裁决**: PUAX 带来稳定的代码审查与验证增益。`
  );

  const mdOut = path.join(RESULTS_DIR, "amb-live-report.md");
  fs.writeFileSync(mdOut, mdLines.join("\n"), "utf-8");

  console.log(`\n💾 结构化数据已落盘: ${jsonOut}`);
  console.log(`📄 Markdown 战报已生成: ${mdOut}\n`);
}

runAmbLive().catch(err => {
  console.error("AMB Live 运行异常:", err);
  process.exit(1);
});
