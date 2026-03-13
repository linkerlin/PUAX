# Changelog

All notable changes to the PUAX project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-13

### 🎉 重大里程碑

PUAX 2.0 正式发布！这是一个完整的重写版本，引入自动触发系统、智能角色推荐和结构化方法论。

### ✨ 新增功能

#### 核心系统
- **自动触发检测系统** - 14种触发条件自动识别
  - `consecutive_failures` - 连续失败检测
  - `giving_up_language` - 放弃语言识别
  - `user_frustration` - 用户挫折感知
  - `blame_environment` - 归咎环境检测
  - `parameter_tweaking` - 参数调整识别
  - `surface_fix` - 表面修复检测
  - `no_verification` - 未验证检测
  - `passive_wait` - 被动等待检测
  - `tool_underuse` - 工具使用不足检测
  - `low_quality` - 低质量输出检测
  - `no_search` - 未搜索检测
  - `need_more_context` - 需要更多上下文
  - `suggest_manual` - 建议人工介入
  - `excuse_patterns` - 借口模式识别

- **智能角色推荐系统** - 多维度评分算法
  - 触发条件匹配 (35%)
  - 任务类型匹配 (25%)
  - 失败模式匹配 (25%)
  - 历史使用记录 (10%)
  - 用户偏好 (5%)
  - 渐进式压力升级机制

- **方法论引擎** - 结构化调试流程
  - 五步法框架
  - 七项检查清单
  - 大厂风味叠加系统
  - 执行计划生成

#### MCP工具
- `detect_trigger` - 检测对话中的触发条件
- `recommend_role` - 基于触发条件推荐角色
- `get_role_with_methodology` - 获取角色完整信息
- `activate_with_context` - 一键检测并激活角色

#### 角色升级 (v2.0)
- **40个角色升级到v2.0** (95.2%)
  - 军事类：9个角色
  - 萨满类：8个角色
  - 主题类：7个角色
  - SillyTavern：5个角色
  - 自激励类：6个角色
  - 特殊类：5个角色

#### 风味系统
- 8种大厂风味
  - alibaba - 阿里味
  - huawei - 华为味
  - bytedance - 字节味
  - tencent - 腾讯味
  - meituan - 美团味
  - netflix - Netflix味
  - musk - 马斯克味
  - jobs - 乔布斯味

#### 数据分析
- 角色使用分析系统
  - 使用统计
  - 性能指标
  - 趋势分析
  - 报告生成

#### 反馈系统
- 用户反馈收集
  - 角色评分
  - 触发器准确性反馈
  - 功能请求管理

### 📝 文档

- 完整的API文档
- 用户操作指南
- 社区贡献指南
- 角色市场展示
- 项目进度追踪
- 7份工作总结

### 🧪 测试

- 58+个测试用例
- 核心模块测试覆盖
  - Trigger Detector: 12个用例
  - Role Recommender: 18个用例
  - Methodology Engine: 15个用例
  - Integration: 13个用例

### 🔧 工具脚本

- `upgrade-role-v2.js` - 角色批量升级
- `validate-role.js` - 角色验证
- `generate-bundle.js` - Bundle生成
- `promote-v2-to-main.js` - v2.0迁移
- `start-puax.sh` - 一键启动

### ⚡ 性能

- 触发检测: ~50ms
- 角色推荐: ~60ms
- 完整流程: ~200ms

---

## [1.0.0] - 2026-03-01

### 🎉 初始版本

- 基础角色系统
- 42个v1.0角色
- 简单的方法论框架
- 手动角色切换

---

## 版本对比

| 特性 | v1.0 | v2.0 |
|------|------|------|
| 自动触发 | ❌ | ✅ |
| 智能推荐 | ❌ | ✅ |
| 五步法 | 基础 | 完整 |
| 检查清单 | ❌ | ✅ |
| 风味系统 | ❌ | ✅ |
| MCP工具 | ❌ | 4个 |
| 数据分析 | ❌ | ✅ |
| 反馈系统 | ❌ | ✅ |
| 文档完整度 | 30% | 100% |
| 测试覆盖率 | 20% | 80% |

---

## 升级指南

### 从 v1.0 升级到 v2.0

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
cd puax-mcp-server
npm install

# 3. 生成v2.0 Bundle
npm run generate-bundle

# 4. 启动服务器
npm start
```

### 角色迁移

- v1.0角色继续兼容
- v2.0角色自动优先加载
- 可运行迁移脚本升级旧角色

---

## 未来计划

### v2.1.0 (计划中)
- [ ] Web仪表盘
- [ ] 实时数据可视化
- [ ] 更多角色模板

### v2.2.0 (计划中)
- [ ] AI驱动优化
- [ ] 机器学习触发检测
- [ ] 个性化推荐

### v3.0.0 (远期)
- [ ] 多语言完整支持
- [ ] 社区论坛
- [ ] 角色市场

---

## 贡献者

感谢所有为PUAX做出贡献的人！

---

[2.0.0]: https://github.com/your-org/puax/releases/tag/v2.0.0
[1.0.0]: https://github.com/your-org/puax/releases/tag/v1.0.0
