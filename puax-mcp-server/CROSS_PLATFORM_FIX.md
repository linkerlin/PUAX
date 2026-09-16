# 跨平台路径兼容性修复

## 修复总结

### ✅ 修复的问题

1. **硬编码目录名检查** ❌ → ✅
   - 修复前: `if (path.basename(currentDir) === 'puax-mcp-server')`
   - 修复后: 多层级智能检测 + 环境变量支持

2. **未使用环境变量** ❌ → ✅
   - 修复前: 忽略 `PUAX_PROJECT_PATH`
   - 修复后: 作为最高优先级使用

3. **依赖 process.cwd()** ❌ → ✅
   - 修复前: 仅在当前工作目录和父目录查找
   - 修复后: 4 种检测方法 + 路径规范化

### 📁 修改的文件

- `src/prompts/index.ts` - 核心路径检测逻辑

### 🛠️ 实现细节

#### 智能路径检测（4 级回退）

```typescript
// Level 1: 环境变量（最高优先级）
const envPath = process.env.PUAX_PROJECT_PATH;
if (envPath && fs.existsSync(path.normalize(envPath))) {
  return envPath;
}

// Level 2: 相对于模块的路径（最可靠）
// 适用于所有操作系统和安装位置
const relativeToModule = path.resolve(__dirname, '../../..');
if (isValidProjectRoot(relativeToModule)) {
  return relativeToModule;
}

// Level 3: process.cwd() 层级检测
// 检查当前目录、父目录、祖父母目录
for (const dir of [cwd, parent, grandParent]) {
  if (isValidProjectRoot(dir)) return dir;
}

// Level 4: 默认值（带警告）
console.error('Warning: Could not find project root');
return currentDir;
```

#### 跨平台路径规范化

```typescript
// 自动处理不同操作系统的路径分隔符
this.projectRoot = path.normalize(this.projectRoot);

// 示例:
// Windows: "C:\\GitHub\\PUAX" → "C:\\GitHub\\PUAX"
// macOS:  "/home/user/PUAX" → "/home/user/PUAX"
// Linux:  "/usr/local/PUAX" → "/usr/local/PUAX"
```

#### 验证方法

```typescript
private isValidProjectRoot(dir: string): boolean {
  // 检查多个标识文件（跨平台）
  const gitPath = path.join(dir, '.git');
  const packageJsonPath = path.join(dir, 'package.json');
  const readmePath = path.join(dir, 'README.md');
  
  return hasGit || hasPackageJson || hasReadme;
}
```

### 🌍 操作系统兼容性

| 操作系统 | 路径格式 | 支持状态 | 测试 |
|---------|---------|---------|------|
| Windows | `C:\GitHub\PUAX` | ✅ | 已测试 |
| Windows (UNC) | `\\server\share\PUAX` | ✅ | 已测试 |
| macOS | `/Users/user/GitHub/PUAX` | ✅ | 兼容 |
| Linux | `/home/user/GitHub/PUAX` | ✅ | 兼容 |
| Docker | `/app/PUAX` | ✅ | 兼容 |

### 📝 使用方式

#### 方式 1: 环境变量（推荐）

```bash
# Windows (PowerShell)
$env:PUAX_PROJECT_PATH="C:\GitHub\PUAX"

# Windows (CMD)
set PUAX_PROJECT_PATH=C:\GitHub\PUAX

# macOS/Linux
export PUAX_PROJECT_PATH=/home/user/GitHub/PUAX

# Docker
docker run -e PUAX_PROJECT_PATH=/app/PUAX puax-mcp-server
```

#### 方式 2: 自动检测

```bash
# 在项目根目录运行
cd /path/to/PUAX/puax-mcp-server
npm run dev
```

#### 方式 3: 任意位置运行

```bash
# 在任意目录运行（自动检测项目根）
npm start
```

### 🔍 调试信息

启用详细日志输出：

```bash
# 查看路径检测过程
$env:DEBUG="puax*"
npm start

# 输出示例:
# [PromptManager] Using PUAX_PROJECT_PATH: /home/user/PUAX
# [PromptManager] Valid project root found: /home/user/PUAX
# [PromptManager] Initialized with project root: /home/user/PUAX
```

### ✅ 测试验证

运行完整测试套件：

```bash
npm test
```

所有路径测试自动通过 ✅

### 🔄 向后兼容性

- ✅ 完全向后兼容
- ✅ 不需要修改现有配置
- ✅ 自动检测旧路径结构
- ✅ 平滑迁移到新的路径系统
