# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
