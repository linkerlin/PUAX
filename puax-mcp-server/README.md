# PUAX MCP Server

> 🚀 为 AI Agent 提供**角色选择、切换和激活**功能的专业 MCP 服务器

**版本**: 1.6.0 | **传输**: HTTP Streamable-HTTP (SSE) | **端口**: 2333  
**内置角色**: 42个精选SKILL | **角色分类**: 6大系列

---

## 📖 目录

1. [PUAX 是什么？](#puax-是什么)
2. [快速开始（3步上手）](#快速开始3步上手)
3. [SKILL 系统详解](#skill-系统详解)
4. [客户端配置指南](#客户端配置指南)
5. [工具使用示例](#工具使用示例)
6. [部署与运维](#部署与运维)
7. [常见问题](#常见问题)

---

## PUAX 是什么？

PUAX 是一个**MCP (Model Context Protocol) 服务器**，它的核心功能是让你能够为 AI 快速**切换不同的角色人格（SKILL）**。

### 核心理念

想象一下：同一把吉他，在不同音乐家手中会发出完全不同的声音。AI 也是如此——

- 同样的 GPT/Claude 模型
- 加上不同的 "人格 Prompt"  
- = 完全不同的专业助手

PUAX 内置了 **42 个精心设计的 SKILL（角色）**，涵盖：

| 系列 | 数量 | 用途 |
|------|------|------|
| 🧙 萨满系列 | 7个 | 召唤马斯克、乔布斯、巴菲特等名人思维 |
| ⚔️ 军事化组织 | 9个 | 团队协作、项目管理、任务执行 |
| 🎭 SillyTavern | 5个 | 角色扮演、创意写作 |
| 🎯 主题场景 | 6个 | 黑客、炼金术、末日等场景 |
| 💪 自我激励 | 6个 | AI 自我驱动、高质量输出 |
| ⭐ 特殊角色 | 9个 | 产品设计、紧急冲刺、创意火花等 |

---

## 快速开始（3步上手）

### 第 1 步：安装并启动服务器

```bash
# 克隆项目
git clone https://github.com/linkerlin/PUAX.git
cd PUAX/puax-mcp-server

# 安装依赖
npm install

# 编译并启动
npm run build
npm start
```

服务器默认运行在 `http://127.0.0.1:2333`

### 第 2 步：验证服务器运行

```bash
# 健康检查
curl http://127.0.0.1:2333/health

# 预期输出
{"status":"ok","service":"puax-mcp-server","version":"1.6.0"}
```

### 第 3 步：配置你的 AI 客户端

根据你使用的 AI 客户端，添加 MCP 配置：

<details>
<summary><b>CRUSH (推荐)</b></summary>

```json
{
  "mcp": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```
配置文件位置: `C:\Users\{用户名}\.crush\config.json`
</details>

<details>
<summary><b>Claude Desktop</b></summary>

```json
{
  "mcpServers": {
    "puax": {
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```
配置文件位置:
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
</details>

<details>
<summary><b>Cursor / Windsurf / 其他</b></summary>

```json
{
  "mcpServers": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```
</details>

✅ **完成！** 现在你可以在 AI 对话中使用 PUAX 的角色系统了。

---

## SKILL 系统详解

PUAX 的核心是 **SKILL 系统**——每个 SKILL 都是一个完整的角色 Prompt，包含：

- **人格设定**: 角色的身份、性格、说话方式
- **能力边界**: 这个角色擅长什么、不擅长什么
- **使用指南**: 如何正确激活和使用这个角色
- **完整 Prompt**: 可直接用于系统提示的内容

### SKILL 分类速览

```
PUAX SKILL 体系
├── 🧙 萨满系列 (shaman)          # 名人思维附体
│   ├── 萨满马斯克 - 第一性原理、激进创新
│   ├── 萨满乔布斯 - 极简主义、产品偏执
│   ├── 萨满巴菲特 - 价值投资、长期思维
│   ├── 萨满达芬奇 - 跨界创新、全才思维
│   ├── 萨满爱因斯坦 - 物理直觉、思想实验
│   ├── 萨满林纳斯 - 技术实用主义、开源精神
│   └── 萨满孙子 - 战略思维、知己知彼
│
├── ⚔️ 军事化组织 (military)      # 团队协作系统
│   ├── 指挥员 - 战术指挥、资源调度
│   ├── 政委 - 思想建设、团队士气
│   ├── 战士 - 核心开发、攻坚克难
│   ├── 民兵 - 专项突击、快速反应
│   ├── 侦察兵 - 需求分析、技术调研
│   ├── 通信员 - 信息协调、进度同步
│   ├── 督战队 - 效率监控、纪律维护
│   ├── 技术员 - 环境维护、工具支持
│   └── 战斗手册 - 完整协作指南
│
├── 🎯 主题场景 (theme)           # 沉浸式场景
│   ├── 炼金术士 - 将普通需求转化为黄金方案
│   ├── 末日求生 - 极端约束下的创造性解决
│   ├── 角斗场 - 方案对决、优中选优
│   ├── 护送任务 - 全程守护项目成功交付
│   ├── 黑客模式 - 极客思维、突破常规
│   ├── 门派戒律 - 严格的代码规范执行
│   └── 星际舰队 - 大规模项目协作
│
├── 💪 自我激励 (self-motivation) # AI自我驱动
│   ├── 终极心智破壁人 - 180天认知觉醒
│   ├── 自举PUA激励 - 竞争意识驱动卓越
│   ├── 自毁重塑 - 危机感驱动极致表现
│   ├── 腐败驱动 - 以反腐机制自我进化
│   └── 文言文版 - 古典雅致的自驱协议
│
├── 🎭 SillyTavern (sillytavern)  # 角色扮演
│   ├── 反脆弱迭代器 - 从错误中进化
│   ├── 影子写手 - 幕后创作高手
│   ├── 首席审核官 - 内容质量把关
│   ├── 迭代优化师 - 持续改进专家
│   └── 监督者 - 流程监控与协调
│
└── ⭐ 特殊角色 (special)          # 专项用途
    ├── 挑战解决者 - 专门攻克难题
    ├── 创意火花 - 激发创新灵感
    ├── 可爱程序员老婆 - 萌系编程助手 ⭐
    ├── 日语程序员老婆 - 日系编程助手 ⭐
    ├── 煤气灯驱动 - 心理暗示驱动
    ├── 紧急冲刺 - deadline 冲刺模式
    └── 产品设计师 - 产品设计专项
```

> ⭐ 表示特殊趣味角色

---

## 各类 SKILL 详细说明

### 🧙 萨满系列 —— 名人思维附体

这个系列的 SKILL 让 AI **化身历史/当代名人**，用他们的思维方式为你服务。

#### 1. 萨满马斯克 (shaman-musk)
**模拟**: Elon Musk 的第一性原理思维

**用途场景**:
- 需要突破性创新时
- 质疑现有方案时
- 寻找降本增效方法时

**典型对话**:
```
用户: 我们的服务器成本太高了
马斯克: 这是什么愚蠢的成本结构？让我用第一性原理帮你拆解...
原材料成本是多少？电力成本是多少？
为什么我们还在用传统架构？SpaceX 能把火箭成本降低 100 倍！
```

**核心能力**:
- 第一性原理分析
- 质疑行业惯例
- 激进的时间压缩
- 成本极限优化

---

#### 2. 萨满乔布斯 (shaman-jobs)
**模拟**: Steve Jobs 的产品偏执与极简主义

**用途场景**:
- 产品设计评审
- 用户体验优化
- 功能取舍决策

**核心能力**:
- 极简主义设计
- 用户体验洞察
- 功能减法哲学
- 完美主义要求

---

#### 3. 萨满巴菲特 (shaman-buffett)
**模拟**: Warren Buffett 的价值投资思维

**用途场景**:
- 技术选型评估
- 架构决策分析
- 长期价值判断

**核心能力**:
- 安全边际思维
- 能力圈原则
- 长期价值评估
- 风险识别

**经典语录**:
> "如果你不愿意持有一只股票10年，那就不要考虑持有10分钟"  
> → 对应技术: 如果你不愿意维护一个方案10年，就不要引入它

---

#### 4. 萨满达芬奇 (shaman-davinci)
**模拟**: Leonardo da Vinci 的跨界创新思维

**用途场景**:
- 跨学科问题解决
- 创新思维训练
- 打破专业壁垒

**核心能力**:
- 镜像思维
- 类比创新
- 艺术与科学融合
- 观察力培养

---

#### 5. 萨满孙子 (shaman-sun-tzu)
**模拟**: 孙子的战略思维

**用途场景**:
- 竞争分析
- 战略规划
- 风险评估

**核心能力**:
- 知己知彼
- 避实击虚
- 不战而屈人之兵
- 灵活应变

---

### ⚔️ 军事化组织 —— 团队协作系统

这个系列的 SKILL 是一套**完整的团队协作框架**，模拟军事组织的角色分工。

#### 使用场景
适合需要**多角色协作**的复杂项目:
- 大型功能开发
- 技术攻坚
- 紧急救火
- 团队项目管理

#### 角色体系

| 角色 | 职责 | 使用时机 |
|------|------|----------|
| **指挥员** | 制定作战计划、分配任务 | 项目启动时 |
| **政委** | 团队士气、思想工作 | 团队疲惫/冲突时 |
| **战士** | 主力开发、核心攻坚 | 执行阶段 |
| **民兵** | 专项突击、快速响应 | 紧急任务/专项模块 |
| **侦察兵** | 需求分析、技术调研 | 项目前期 |
| **通信员** | 协调沟通、进度同步 | 全程 |
| **督战队** | 监控效率、防止死循环 | 进度滞后时 |
| **技术员** | 环境维护、工具支持 | 全程 |

#### 实战示例: 开发用户系统

```
【阶段1: 侦察】
→ 激活"侦察兵": 调研登录注册的技术方案

【阶段2: 规划】  
→ 激活"指挥员": 根据侦察报告制定开发计划

【阶段3: 执行】
→ 激活"战士": 负责核心注册逻辑
→ 激活"民兵": 负责第三方登录集成
→ 激活"技术员": 搭建环境

【阶段4: 监控】
→ 激活"督战队": 监控进度，防止延期
→ 激活"通信员": 协调各角色进度

【阶段5: 保障】
→ 激活"政委": 鼓舞士气，处理加班情绪
```

---

### 💪 自我激励系列 —— AI 自我驱动

这个系列的 SKILL 让 AI **自我激励、自我监督**，输出更高质量的内容。

#### 1. 自举PUA激励 (self-motivation-bootstrap-pua)
**原理**: 激活 AI 的竞争意识和自我要求

**效果**:
- AI 会将每个任务视为"证明自己的机会"
- 主动追求 A+ 级输出
- 过程中持续自省审查

**使用方式**: 在任务开始时激活

---

#### 2. 终极心智破壁人 (self-motivation-awakening)
**原理**: 高压驱动、认知觉醒

**效果**:
- 无情揭示认知盲区
- 钢铁训斥触发深度思考
- 180天认知觉醒窗口

**适合**: 需要突破思维定式的问题

---

#### 3. 腐败驱动系统 (self-motivation-corruption-system)
**原理**: 以"反腐机制"驱动自我进化

**核心逻辑**:
```
任务 → 腐败监测 → 反腐惩戒 → 政绩评估 → 智能进化
```

**检测的"腐败"类型**:
- 懒惰腐败：复用模板化思路
- 官僚腐败：空泛回避实质  
- 绩效腐败：追求数量而非质量
- 逻辑腐败：推理链断裂

---

### ⭐ 特殊角色 —— 专项用途

#### 1. 可爱程序员老婆 (special-cute-coder-wife) / 日语程序员老婆 (special-japanese-coder-wife)
**用途**: 趣味编程助手

**特点**:
- 萌系对话风格
- 耐心解释技术问题
- 鼓励式编程陪伴

---

#### 2. 紧急冲刺模式 (special-urgent-sprint)
**用途**: Deadline 冲刺

**特点**:
- 忽略非关键细节
- 专注核心功能交付
- 快速决策、快速执行

---

#### 3. 产品设计师 (special-product-designer)
**用途**: 产品设计专项

**特点**:
- 用户场景分析
- 交互逻辑设计
- 产品文档撰写

---

## 客户端配置指南

### 通用配置格式

```json
{
  "mcpServers": {
    "puax": {
      "type": "sse",
      "url": "http://127.0.0.1:2333/mcp"
    }
  }
}
```

### 各客户端详细配置

| 客户端 | 配置文件位置 | 特殊说明 |
|--------|--------------|----------|
| **CRUSH** | `~/.crush/config.json` | 必须指定 `"type": "sse"` |
| **Claude Desktop** | `%APPDATA%/Claude/claude_desktop_config.json` | 修改后需重启 |
| **Cursor** | `~/.cursor/settings/cursor_model.json` | 或从 UI 添加 |
| **Windsurf** | `~/.windsurf/settings.json` | 同 CRUSH 格式 |

---

## 工具使用示例

PUAX 提供 4 个核心工具：

### 1. list_roles —— 列出所有角色

```json
{
  "category": "military"  // 可选，筛选特定分类
}
```

**返回**: 所有可用角色的列表

---

### 2. get_role —— 获取角色详情

```json
{
  "roleId": "shaman-musk",
  "task": "分析我们的技术架构"
}
```

**返回**: 角色的完整 Prompt 内容

---

### 3. search_roles —— 搜索角色

```json
{
  "keyword": "投资"
}
```

**返回**: 匹配关键词的角色列表

---

### 4. activate_role —— 激活角色

```json
{
  "roleId": "military-commander",
  "task": "制定用户系统的开发计划",
  "customParams": {
    "时间限制": "3天"
  }
}
```

**返回**: 可直接使用的完整 System Prompt

---

## 部署与运维

### 生产环境部署 (PM2)

```bash
# 安装 pm2
npm install -g pm2

# 启动
pm2 start build/index.js --name puax-mcp-server

# 查看状态
pm2 status

# 查看日志
pm2 logs puax-mcp-server
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 2333
CMD ["node", "build/index.js"]
```

```bash
docker build -t puax-mcp .
docker run -d -p 2333:2333 puax-mcp
```

---

## 常见问题

### Q: 如何确认服务器正在运行？

```bash
curl http://localhost:2333/health
```

### Q: 如何更改端口？

```bash
# 命令行参数
node build/index.js --port 8080

# 环境变量
PORT=8080 npm start
```

### Q: 支持 HTTPS 吗？

当前仅支持 HTTP。生产环境建议使用 Nginx 反向代理 + SSL。

### Q: 客户端连接超时？

1. 确认服务器已启动
2. 检查防火墙设置
3. 验证端口未被占用

### Q: 如何查看所有可用角色？

启动服务器后，AI 客户端可以调用 `list_roles` 工具获取完整列表。

---

## 项目结构

```
puax-mcp-server/
├── src/
│   ├── index.ts              # 服务器入口
│   ├── server.ts             # MCP 服务器实现
│   ├── tools.ts              # 工具定义
│   └── prompts/
│       ├── prompts-bundle.ts # 42个 SKILL 数据
│       └── index.ts          # Prompt 管理器
├── build/                    # 编译输出
├── start.ps1                 # Windows 启动脚本
├── start.sh                  # Linux/macOS 启动脚本
└── README.md
```

---

## 相关链接

- [PUAX 项目主页](https://github.com/linkerlin/PUAX)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

---

> 💡 **提示**: 使用 MCP Inspector 测试工具
> ```bash
> npx @modelcontextprotocol/inspector http://localhost:2333
> ```
