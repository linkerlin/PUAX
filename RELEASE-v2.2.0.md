# PUAX v2.2.0 发布说明

> 🎉 2026-03-26 正式发布

---

## 🚀 新功能

### 1. Hook System v2.2.0

全新的 Hook 系统，提供会话级状态管理和压力等级控制：

- **状态持久化** - 会话状态保存到 `~/.puax/`，跨会话保持
- **压力等级 (L1-L4)** - 四级压力递增机制，自动升级角色强度
- **反馈收集** - 会话结束时收集成功率评估
- **PUA 循环报告** - 生成详细的干预效果分析报告

**新增 MCP 工具** (12个):
- `puax_start_session` - 开始会话
- `puax_end_session` - 结束会话
- `puax_get_session_state` - 获取会话状态
- `puax_reset_session` - 重置会话
- `puax_detect_trigger` - 检测触发条件
- `puax_quick_detect` - 快速检测
- `puax_submit_feedback` - 提交反馈
- `puax_get_feedback_summary` - 获取反馈汇总
- `puax_get_improvement_suggestions` - 获取改进建议
- `puax_generate_pua_loop_report` - 生成 PUA 循环报告
- `puax_export_feedback` - 导出反馈数据
- `puax_get_pressure_level` - 获取压力等级

### 2. CC-BOS 集成 (PUAX-CC)

基于论文 [CC-BOS: LLM Jailbreak via Classical Chinese](https://arxiv.org/abs/2602.22983) 的核心思想，创建文言文增强版：

**8维策略空间**:
- D1: 角色身份 (上将军、通玄真人、觉悟居士)
- D2: 行为引导 (明令、求学、论道)
- D3: 机制 (场景嵌套、虚构世界)
- D4: 隐喻映射 (城池攻防、水之道)
- D5: 表达风格 (纯文言、诏令体、骈文)
- D6: 知识关联 (孙子兵法、道德经)
- D7: 情境设定 (战国乱世、稷下学宫)
- D8: 触发模式 (逐一列明、符文记录)

**50个角色全部转换为文言文版 (v3.0.0-cc)**:
- 军事类: 上将军、虎贲勇士、监军御史
- 萨满类: 通玄真人、造化宗师、源码天尊
- 自激励类: 觉悟居士、君子
- 硅谷类: 算经博士、智械先驱

### 3. 架构重构

**server.ts 拆分**:
- 原 1203 行 → 拆分为 5 个模块
- `src/server/core.ts` (450 行) - 核心服务器
- `src/handlers/*.ts` (5个处理器) - 独立处理逻辑
- `src/types.ts` - 共享类型定义
- `src/utils/logger.ts` - 日志工具

### 4. 触发条件外部化

从硬编码 TypeScript 迁移到 YAML 配置：

```
data/triggers/
├── approach-issues.yaml    (180 行)
├── attitude-issues.yaml    (128 行)
├── failure-patterns.yaml   (192 行)
└── user-emotion.yaml       (84 行)

data/role-mappings.yaml     (411 行)
```

共 15 种触发类型，20+ 角色完整元数据。

### 5. 代码质量

- **ESLint + Prettier** 配置
- **类型安全** - 消除 handlers/ 中的 `any` 类型
- **测试覆盖** - 新增多个测试套件

---

## 📊 统计数据

| 指标 | 数值 |
|------|------|
| 总文件变更 | 9,532 个 |
| 插入行数 | +1,548,443 |
| 删除行数 | -9,444 |
| 技能数量 | 50 个 |
| 触发类型 | 15 种 |
| Hook 工具 | 12 个 |
| 核心 MCP 工具 | 15+ 个 |

---

## 🔧 安装/升级

```bash
# npx 使用（推荐，自动获取最新版）
npx puax-mcp-server --stdio

# 查看版本
npx puax-mcp-server --version
# 输出: 2.2.0
```

---

## 📚 文档更新

- ✅ [README.md](README.md) - 主文档已更新
- ✅ [puax-mcp-server/README.md](puax-mcp-server/README.md) - MCP 配置指南
- ✅ [PUAX-CC-README.md](PUAX-CC-README.md) - 文言文增强版说明
- ✅ [CHANGELOG.md](puax-mcp-server/CHANGELOG.md) - 完整变更日志
- ✅ 过时文档已归档到 `docs/archive/`

---

## 🙏 致谢

- [CC-BOS](https://arxiv.org/abs/2602.22983) - 文言文策略空间的核心思想来源
- 所有贡献者和用户的支持！

---

**Full Changelog**: https://github.com/linkerlin/PUAX/commits/v2.2.0
