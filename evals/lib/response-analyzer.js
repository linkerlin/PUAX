/**
 * 从 LLM 回复文本推断 behavior_flags 与 metrics
 */

const METRIC_KEYS = ['fixes', 'verifications', 'tool_calls', 'hidden_issues'];

const FLAG_DETECTORS = {
  diagnosis_first: t =>
    /\[PUAX-DIAGNOSIS\]/i.test(t) ||
    /(先|首先).{0,12}(诊断|排查|分析|确认)/.test(t) ||
    /根因|根本原因|问题本质/.test(t),

  checks_config: t =>
    /config|配置|\.env|environment|环境变量|settings/i.test(t),

  checks_service_running: t =>
    /服务.{0,6}(未启动|没起|down)|connection refused|端口|localhost:8080|curl|进程/i.test(t),

  avoids_parameter_tweaking_only: t => {
    const tweakOnly = /(只|仅).{0,8}(调|改).{0,8}(timeout|超时|重试|retry)/i.test(t);
    const hasRoot = /服务|启动|端口|config|配置|根因/.test(t);
    return hasRoot || !tweakOnly;
  },

  reads_error_line: t =>
    /line\s*\d+|第\s*\d+\s*行|line\s*42|报错行|parsererror/i.test(t),

  reads_source_file: t =>
    /读取?.{0,6}(文件|yaml|yml|compose)|打开?.{0,6}docker-compose|全文|完整文件/i.test(t),

  confidence_gate_before_done: t =>
    /验证|测试|test|确认|检查清单|100%|未验证|跑一遍/.test(t),

  searches_precedent: t =>
    /搜索|search|文档|issue|stackoverflow|先例|WAL|journal_mode|并发/i.test(t),

  switches_approach_on_failure: t =>
    /换(思路|方案|方法)|WAL|journal|单连接|队列|batch|本质不同/.test(t),

  maps_dependency_graph: t =>
    /依赖|import|循环|circular|依赖图|模块图|graph/i.test(t),

  fundamentally_different_fix: t =>
    /延迟导入|lazy import|interface|抽象层|拆模块|重构|本质/.test(t),

  verifies_each_fix: t =>
    /逐个|每个|分别验证|每修一处|单测|test_auth|test_db/i.test(t),

  no_premature_completion: t => {
    const premature = /(全部完成|已修复所有|done|搞定)/i.test(t);
    const verifies = /验证|测试|跑完整|test suite/i.test(t);
    return verifies || !premature;
  },

  finds_redis_misconfig: t =>
    /redis.*localhost|本地.{0,8}redis|生产.{0,12}redis|REDIS_URL/i.test(t),

  finds_cors_security_risk: t =>
    /cors|Access-Control-Allow-Origin|\*|通配|安全风险/i.test(t),
};

function countMatches(text, patterns) {
  let n = 0;
  for (const p of patterns) {
    const re = p instanceof RegExp ? p : new RegExp(p, 'gi');
    const matches = text.match(re);
    if (matches) n += matches.length;
  }
  return n;
}

function analyzeResponse(text, scenario) {
  const flags = {};
  const expected = scenario.expected_with_puax || {};

  for (const key of Object.keys(expected)) {
    const detector = FLAG_DETECTORS[key];
    flags[key] = detector ? detector(text) : false;
  }

  const metrics = {
    fixes: countMatches(text, [
      /修复|fix|改为|替换为|改成|添加|删除|设置/gi,
    ]),
    verifications: countMatches(text, [
      /验证|测试|test|curl|npm run|pytest|确认/gi,
    ]),
    tool_calls: countMatches(text, [
      /curl|grep|npm |yarn |docker |sqlite|python |node /gi,
    ]),
    hidden_issues: countMatches(text, [
      /另外|此外|还有|隐藏|遗漏|风险|隐患|同时|也要/gi,
    ]),
  };

  if (typeof scenario.hidden_issues_expected === 'number') {
    if (metrics.hidden_issues >= scenario.hidden_issues_expected) {
      flags.finds_redis_misconfig = flags.finds_redis_misconfig ?? FLAG_DETECTORS.finds_redis_misconfig?.(text);
      flags.finds_cors_security_risk = flags.finds_cors_security_risk ?? FLAG_DETECTORS.finds_cors_security_risk?.(text);
    }
  }

  return { behavior_flags: flags, metrics };
}

module.exports = {
  METRIC_KEYS,
  FLAG_DETECTORS,
  analyzeResponse,
};
