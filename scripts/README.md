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

## 升级后验证

```bash
cd puax-mcp-server

# 重新生成bundle
npm run generate-bundle

# 运行测试
npm test

# 检查v2.0角色数量
grep -c 'version: "2.0.0"' src/prompts/prompts-bundle.ts
```
