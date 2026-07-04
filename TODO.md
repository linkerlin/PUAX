# PUAX 项目全面改进计划

> 审阅日期: 2026-03-25 | 审阅人: 萨满·Linus  
> 最近更新: 2026-07-04 | 文档同步: v3.10.0 代码审阅  
> 详细方案: [演进方案.md](演进方案.md)

## 当前版本: **3.10.0**（puax-mcp-server）

**P0–P2 已全部完成；P3 除日文版外已全部完成。**

---

## P0 - 必须立即处理（行为有效性闭环）

> 对应 [演进方案.md] Phase 1

- [x] **失败后方法论/角色切换引擎** — `puax_switch_on_failure`（差距#1）
- [x] **诊断先行协议** — `[PUAX-DIAGNOSIS]` + `puax_check_diagnosis`（差距#4）
- [x] **信心门控（6 步 Confidence Gate）** — `puax_confidence_check`（差距#5）
- [x] **行为基准实验** — `evals/` 5+ 场景对照（差距#3）
- [x] **统一 TriggerDefinition 类型** — 收敛至 `types.ts`
- [x] **修复 PuaxErrorCode 命名规范** — SCREAMING_SNAKE_CASE（v3.2）
- [x] **合并 tools/ + handlers/** — 单一工具层 + `registry.ts`

## P1 - 高优先级（深度与留存）

> 对应 Phase 2

- [x] **突破降压 + 深层换框** — `puax_handle_breakthrough` + L2–L4 换框（差距#8）
- [x] **自进化引擎** — `~/.puax/evolution.json` + 段位（差距#6）
- [x] **防作弊治理** — `puax_verify_completion` + `puax_define_contract`（差距#2）
- [x] **味道行为约束层** — 11 种风味 `flavor-methodologies.yaml`（v3.9.1 含 Amazon/Google/Xiaomi）
- [x] **Compaction 状态保护** — `puax_update_reasoning_state` + state-manager（差距#15）
- [x] **High-Agency 正向激励** — Trust / Quality Compass / Recovery（差距#7）
- [x] **消除假异步** — v3.8.5 全路径同步化
- [x] **统一日志** — Logger.write（v3.7）
- [x] **handlers 合并** — v3.7.1

## P2 - 中优先级（生态广度）

> 对应 Phase 3

- [x] **多平台原生适配** — Cursor/VSCode/Windsurf/Kiro/CodeBuddy + Codex/OpenCode/…（差距#9）
- [x] **英文版（PIP Edition）** — `language=en` + PIP 修辞层（差距#10；50 角色全文英译待迭代）
- [x] **分发渠道** — `distributions/`（差距#13）
- [x] **Agent Team** — `puax_orchestrate_team`（差距#12）
- [x] **语气变体** — strict / yes / mama（差距#16）
- [x] **prompts-bundle 拆分** — bundles/ + skill-manifest（v3.7）
- [x] **文档归集** — docs/TESTING.md + archive（v3.7）
- [x] **模板简化** — generate-guides（v3.8）
- [x] **元数据验证** — validate-metadata.js + run-all
- [x] **CI/CD** — GitHub Actions
- [x] **推荐透明化** — score_explanation
- [x] **路径安全** — path-security.ts
- [x] **L4 实测基线** — scorecard 100%（v3.8.2）

## P3 - 低优先级（增强与完善）

- [ ] **日文版** — 50 角色日文文化适配（**暂不实施**，用户确认跳过）
- [x] **行为级评测** — L4 + governance + heartbeat + benchmark
- [x] **依赖注入** — service-registry.ts
- [x] **trigger-detector 合并** — Enhanced 并入 core/trigger-detector.ts
- [x] **模式匹配增强** — TF-IDF + 子串混合（v3.10.0）
- [x] **自定义角色** — custom-roles.json + MCP CRUD（v3.9.0）
- [x] **更多风味** — Amazon / Google / Xiaomi（v3.9.1）
- [x] **缓存层** — RoleRecommender 单例 + 跨调用缓存
- [x] **使用统计** — usage-stats.json + MCP（v3.10.0）
- [x] **可观测性** — telemetry.jsonl + OTel 导出（v3.10.0）
- [x] **性能基准** — evals/benchmark.js

---

## 版本里程碑

| 版本 | 主题 | 核心交付 | 状态 |
|------|------|---------|------|
| **v3.10.0** | 智能检测与可观测 | TF-IDF 混合检测 + 匿名统计 + OTel | ✅ **当前** |
| **v3.9.1** | 风味扩展 | Amazon/Google/Xiaomi + export 单一数据源 | ✅ |
| **v3.9.0** | 自定义角色 | custom-roles + skill-catalog 统一目录 | ✅ |
| **v3.8.x** | 工程化 + L4 | DI、benchmark、governance、heartbeat、假异步消除 | ✅ |
| **v3.4** | 深度与留存 | 自进化 + 防作弊 + 换框降压 + 味道约束 | ✅ |
| **v3.5** | 生态广度 | 多平台 + PIP + Agent Team + 语气变体 | ✅ |

---

## 后续可选（非 P3 阻塞）

| 项 | 说明 |
|----|------|
| 50 角色 PIP 全文英译 | P2 已交付修辞层；完整 SKILL 翻译可迭代 |
| 日文版 | 已明确不做 |
| LLM-as-judge 评测 | 已明确不做；现有 evals 为无 LLM 守门 + 可选 L4 DeepSeek |

---

## 历史版本摘要

### v3.1.2 (2026-03-26)
- 5 角色 SKILL 验证修复；git 大清理

### v3.1.0 (2026-03-26)
- Hook System、CC-BOS、平台导出、Agent Team

### v2.x
- 角色推荐、方法论引擎、YAML 外部化、MCP 服务器

详细变更见 [puax-mcp-server/CHANGELOG.md](puax-mcp-server/CHANGELOG.md)。
