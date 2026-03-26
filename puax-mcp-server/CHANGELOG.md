# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-03-25

### Added
- ✨ **平台导出工具** - 一键导出角色到各大编辑器
  - Cursor 适配器 (`.cursor/rules/*.mdc`)
  - VSCode Copilot 适配器 (`.github/copilot-instructions.md`)
  - Kiro 适配器 (`.kiro/steering/*.md`)
  - CodeBuddy 适配器 (`.codebuddy/skills/*/SKILL.md`)
  - Windsurf 适配器 (`.windsurf/rules/*.md`)
  - CLI 命令: `npx puax-mcp-server --export=<platform> --output=<path>`
- 🎯 **P7/P9/P10 分级角色体系**
  - P7 骨干工程师 - 执行 + 单点攻坚
  - P9 Tech Lead - 团队协调 + 任务分配
  - P10 首席架构师 - 战略规划 + 架构决策
  - 新增 `strategic-architect` (战略规划师) 角色
- 🤖 **Agent Team 协作模式**
  - 4种团队模板：冲刺团队、架构团队、创新团队、危机团队
  - 任务分配和进度跟踪
  - 协作剧本生成
- 🧭 **方法论智能路由**
  - 8种大厂方法论自动匹配
  - 任务类型 → 方法论映射
  - 失败模式 → 切换链
- 📊 **反馈收集系统**
  - 角色评分和统计
  - 触发器准确性分析
  - 本地数据存储 (`~/.puax/feedback/`)
- 🔍 **增强触发检测** - 新增5种触发条件
  - 工具使用不足
  - 低质量输出
  - 未验证断言
  - 忽略边界情况
  - 过度复杂化
- 🌐 **Landing Page** - 完整的项目展示网站
  - 首页、角色库、排行榜、导出工具、文档
- 🎛️ **Web 管理后台** - 可视化管理系统
  - 仪表盘、角色编辑器、统计视图

### Changed
- 🔧 重构项目结构，platform-adapters 移到 src 目录
- 📝 完善中文文档
- ✅ 新增 20+ 单元测试，总计 100+ 测试用例

## [2.0.0] - 2026-03-14

### Added
- ✨ **全新 2.0 版本发布** - 重大更新
- 🚀 优化 STDIO 传输模式，更稳定可靠
- 📝 完善文档和配置指南

## [1.6.0] - 2026-03-14

### Added
- ✨ **新增 STDIO 传输模式支持** - 现在支持 HTTP/SSE 和 STDIO 两种模式
  - 使用 `--stdio` 或 `--transport=stdio` 参数启动 STDIO 模式
  - STDIO 模式适用于 Claude Desktop 等本地 MCP 客户端
  - 环境变量 `TRANSPORT` 或 `PUAX_TRANSPORT` 也可设置传输模式
- 📝 更新 README.md 添加 STDIO 模式详细配置说明
- 🧪 新增 STDIO 模式测试用例
- 📦 添加 `test:stdio` 脚本到 package.json
- 🔧 添加 `publishConfig` 配置到 package.json

### Changed
- 🔀 重构 `server.ts` 支持多种传输模式
- 📝 更新帮助信息，包含 STDIO 相关选项
- 📦 更新 `files` 字段包含 CHANGELOG.md

## [1.5.0] - 2026-03-13

### Added
- ✨ 新增自动触发工具集
  - `detect_trigger` - 检测对话中需要激励的触发条件
  - `recommend_role` - 根据上下文推荐合适的角色
  - `get_role_with_methodology` - 获取带方法论的角色
  - `activate_with_context` - 根据上下文自动激活角色
- 🎯 新增 42 个 SKILL（角色）内置支持
- 🏗️ 新增角色分类系统（萨满、军事化、主题场景等 6 大系列）
- 📚 新增 prompts 资源支持

### Changed
- 🔧 迁移到 HTTP Streamable-HTTP 传输（SSE 兼容）
- 📦 升级 MCP SDK 到 v1.25.1+

## [1.0.0] - 2026-03-10

### Added
- 🎉 初始版本发布
- 🚀 基础 MCP 服务器功能
- 🛠️ 核心工具：list_roles, get_role, search_roles, activate_role
- 📡 HTTP 传输模式支持
