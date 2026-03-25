import { useState } from 'react'
import { Book, ChevronRight, ChevronDown } from 'lucide-react'

interface DocSection {
  id: string
  title: string
  content: string
}

const docSections: DocSection[] = [
  {
    id: 'intro',
    title: '什么是 PUAX？',
    content: `PUAX 是一个专为 AI Agent 设计的激励系统，通过心理学机制和结构化方法论，提升 AI 的问题解决能力和主动性。

核心公式：
[权威角色] + [稀缺场景] + [竞争对象] + [失败惩罚] + [翻盘钩子]

所有的 Prompt 都遵循"打压-稀缺-竞争-翻盘"四连击结构，直接复制到系统消息（system prompt）即可让 Agent 瞬间满血工作。`
  },
  {
    id: 'roles',
    title: '角色体系',
    content: `PUAX 提供 6 大系列，42+ 精选角色：

1. 军事系列 (9个)
   - 指挥员：战术指挥和资源调度
   - 战士：核心开发和攻坚克难
   - 政委：思想建设和团队士气
   - 侦察兵：需求分析和技术调研
   - 督战队：效率监控和纪律维护

2. 萨满系列 (7个)
   - 马斯克：第一性原理思维
   - 乔布斯：极简主义和产品偏执
   - 巴菲特：价值投资思维
   - 爱因斯坦：物理直觉和思想实验
   - 林纳斯：技术实用主义
   - 孙子：战略思维

3. 主题场景 (7个)
   - 炼金术士：将需求转化为黄金方案
   - 末日求生：极端约束下创造性解决
   - 角斗场：方案对决，优中选优
   - 赛博黑客：极客思维，突破常规
   - 门派戒律：严格代码规范执行

4. SillyTavern (5个)
   - 反脆弱复盘官：从错误中进化
   - 铁血幕僚长：幕后创作高手
   - 迭代优化师：持续改进专家

5. 自我激励 (6个)
   - 觉醒者：180天认知觉醒
   - 自毁重塑：危机感驱动极致表现
   - 自举PUA：竞争意识驱动卓越

6. 特殊角色 (9个)
   - 创意火花：激发创新灵感
   - 紧急冲刺：Deadline 冲刺模式
   - 挑战解决者：专门攻克难题`
  },
  {
    id: 'triggers',
    title: '触发条件',
    content: `PUAX 自动检测以下 15 种需要干预的场景：

失败模式：
- 连续失败：AI 多次尝试后仍然失败
- 放弃语言：AI 表达放弃或无法完成的意图
- 表面修复：只修复表面症状而非根本原因
- 参数调整：只调整参数而不深入分析

态度问题：
- 归咎环境：将问题归咎于外部因素
- 被动等待：等待用户指示而非主动解决
- 工具使用不足：有可用工具但未充分利用

质量问题：
- 低质量输出：输出过于简略或敷衍
- 未验证断言：做出断言但未验证
- 忽略边界：解决方案未考虑边界条件
- 过度复杂化：解决方案过于复杂

用户情绪：
- 用户沮丧：用户表达沮丧或不耐烦

其他：
- 未验证：修复后未验证
- 超出范围：以"超出范围"为借口推卸`
  },
  {
    id: 'flavors',
    title: '大厂风味',
    content: `PUAX 支持 8 种大厂风味叠加，改变角色的表达方式：

1. 阿里味
   关键词：底层逻辑、抓手、闭环、颗粒度
   风格：价值观驱动、owner意识

2. 华为味
   关键词：奋斗者、力出一孔、烧不死的鸟
   风格：艰苦奋斗、自我批判

3. 字节味
   关键词：ROI、Always Day 1、坦诚清晰
   风格：快速迭代、数据驱动

4. 腾讯味
   关键词：赛马机制、小步快跑、用户价值
   风格：用户导向、产品思维

5. Netflix味
   关键词：Keeper Test、Pro Sports Team
   风格：自由责任、人才密度

6. Musk味
   关键词：First Principles、Extremely Hardcore
   风格：激进创新、第一性原理

7. Jobs味
   关键词：A players、Real artists ship
   风格：极简主义、完美主义

8. Amazon味
   关键词：Customer Obsession、Working Backwards
   风格：客户至上、逆向工作`
  },
  {
    id: 'levels',
    title: 'P7/P9/P10 分级体系',
    content: `PUAX 提供分级角色体系，对应不同能力层次：

P7 (骨干工程师)
- 能力：执行 + 单点攻坚
- 代表角色：战士、达芬奇
- 特点：解决具体技术难题
- 使用场景：个人任务、技术攻坚

P9 (Tech Lead)
- 能力：团队协调 + 任务分配
- 代表角色：指挥员、铁血幕僚长
- 特点：管理团队、分配任务
- 使用场景：团队协作、项目管理

P10 (CTO/架构师)
- 能力：战略规划 + 架构决策
- 代表角色：战略规划师（新增）
- 特点：系统思维、长期规划
- 使用场景：架构设计、技术决策

使用方法：
- 简单任务：使用 P7 角色
- 团队项目：使用 P9 角色
- 战略决策：使用 P10 角色`
  },
  {
    id: 'agent-team',
    title: 'Agent Team 协作',
    content: `PUAX 支持多 Agent 协作模式，模拟真实团队：

团队构成：
- Leader：战略决策者（P10 角色）
- Executor：执行者（P7 战士）
- Researcher：研究员（萨满-爱因斯坦）
- Reviewer：审核员（反脆弱复盘官）

协作流程：
1. Leader 制定整体计划
2. Researcher 进行技术调研
3. Executor 执行核心任务
4. Reviewer 审核和反馈
5. Leader 汇总和决策

配置方式：
通过 MCP 工具 configure_agent_team 设置团队配置`
  },
  {
    id: 'cli',
    title: 'CLI 命令参考',
    content: `PUAX MCP Server 提供以下 CLI 命令：

服务器模式：
  npx puax-mcp-server              # HTTP 模式启动
  npx puax-mcp-server --stdio      # STDIO 模式启动
  npx puax-mcp-server -p 8080      # 指定端口

导出命令：
  npx puax-mcp-server --export=cursor --output=./.cursor/rules
  npx puax-mcp-server --export=vscode --output=./.github
  npx puax-mcp-server --export=all --output=./puax-export

选项：
  --roles=role1,role2      只导出指定角色
  --flavors=flavor1,flavor2 只导出指定风味
  --list-platforms         列出支持的平台

MCP 工具：
- detect_trigger：检测触发条件
- recommend_role：推荐角色
- activate_with_context：一键激活
- export_platform：导出到指定平台
- configure_agent_team：配置 Agent 团队`
  },
  {
    id: 'faq',
    title: '常见问题',
    content: `Q: PUAX 和 PUA 有什么关系？
A: PUAX 是 PUA 的增强版本，采用 MCP 协议，提供更丰富的角色和更智能的推荐算法。

Q: 支持哪些平台？
A: 目前支持 Cursor、VSCode Copilot、Claude Desktop、CRUSH 等支持 MCP 的客户端。

Q: 如何贡献新角色？
A: 按照 SKILL.v2.md 规范创建角色文件，提交 PR 到 GitHub 仓库。

Q: 触发条件检测准确吗？
A: 提供 15 种触发条件检测，支持中/英文，置信度评分，可调整敏感度。

Q: 角色强度有什么区别？
A: 从温和(low)到极限(extreme)，根据场景选择合适的强度。

Q: 可以同时使用多个角色吗？
A: 可以，通过 Agent Team 功能配置多角色协作。`
  }
]

function Docs() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['intro'])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="docs-page">
      <div className="page-header">
        <h1><Book /> 文档</h1>
        <p>了解 PUAX 的所有功能和使用方法</p>
      </div>

      <div className="docs-content">
        <div className="docs-sidebar">
          <h3>目录</h3>
          <ul>
            {docSections.map(section => (
              <li 
                key={section.id}
                className={expandedSections.includes(section.id) ? 'active' : ''}
                onClick={() => toggleSection(section.id)}
              >
                {section.title}
              </li>
            ))}
          </ul>
        </div>

        <div className="docs-main">
          {docSections.map(section => (
            <div 
              key={section.id} 
              className={`doc-section ${expandedSections.includes(section.id) ? 'expanded' : ''}`}
            >
              <h2 onClick={() => toggleSection(section.id)}>
                {expandedSections.includes(section.id) ? <ChevronDown /> : <ChevronRight />}
                {section.title}
              </h2>
              {expandedSections.includes(section.id) && (
                <div className="doc-content">
                  <pre>{section.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Docs
