# PUAX 升级脚本

## 可用脚本

### upgrade-role-v2.js
P0角色批量升级（军事+萨满）

```bash
node scripts/upgrade-role-v2.js [military|shaman|all]
```

### upgrade-role-v2-p1p2.js
P1/P2角色批量升级

```bash
# P1角色（完整版）
node scripts/upgrade-role-v2-p1p2.js theme
node scripts/upgrade-role-v2-p1p2.js sillytavern

# P2角色（简化版）
node scripts/upgrade-role-v2-p1p2.js self
node scripts/upgrade-role-v2-p1p2.js special

# 全部P1/P2
node scripts/upgrade-role-v2-p1p2.js p1
node scripts/upgrade-role-v2-p1p2.js p2

# 所有角色
node scripts/upgrade-role-v2-p1p2.js all
```

### promote-v2-to-main.js
将SKILL.v2.md提升为主文件（可选）

```bash
# 预览
node scripts/promote-v2-to-main.js

# 执行迁移
node scripts/promote-v2-to-main.js --confirm
```

### sync-all-i18n.js
多语言 README 文档表同步（执行 Web Admin 封存标注等冻结令相关的行级同步）。

```bash
node scripts/sync-all-i18n.js
```

> generate-i18n-readmes.js 已删除：其内容停留在 4.0.0（badge、工具数）且硬编码旧
> Windows 路径，运行会把九份 README 回滚。多语言维护以手工 + 数字一致性守门为准。

## 执行顺序

1. 确保角色备份存在
2. 运行升級腳本
3. 验证生成内容
4. 提交变更

```bash
cd puax-mcp-server

# 重新生成bundle
npm run generate-bundle

# 运行测试
npm test

# 检查v2.0角色数量
grep -c 'version: "2.0.0"' src/prompts/prompts-bundle.ts
```
