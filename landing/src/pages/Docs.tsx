import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

const docSections = [
  {
    id: 'intro',
    title: 'PUAX 4.0 是什么',
    content: `心智运行时，不是角色博物馆。真正的产品三件：处境、闸门、梦。
默认路径是心跳 puax_tick（宿主 Hook 代跳）。Agent 不必先背 48 个工具名。
专门 PUA 硅基。人类不在服务范围。`,
  },
  {
    id: 'tick',
    title: '心跳',
    content: `npx puax-mcp-server --stdio
导出 Claude Code / Cursor / OpenCode Hook 后，SessionStart / 用户沮丧 / 工具失败会强制发生。
手动：puax_tick({ session_id, event, message })`,
  },
  {
    id: 'arena',
    title: '处境（Cranmer）',
    content: `puax_set_arena({ rival, audience, scarce_badge })
对手 + 观众 + 稀缺徽章。戏服可选。没有处境，勇士赋只是 tokens。`,
  },
  {
    id: 'gates',
    title: '闸门',
    content: `改代码前 [PUAX-DIAGNOSIS]。
交付前 puax_confidence_check → puax_verify_completion。
PreToolUse 拦截 git push / 改测试作弊。劝改挡。`,
  },
  {
    id: 'dream',
    title: '梦（GHM）',
    content: `知情入梦、标记权在工具层、随时可醒、醒后必验。
假设永不自动升格。人际版八术不发布。`,
  },
  {
    id: 'evolve',
    title: '自进化',
    content: `仿 evolver.py 流水线，无外部依赖：
preflight → collect → signals → select → autopoiesis → dispatch → solidify
数据在 ~/.puax/（evolution.json、memory_graph.jsonl、outcome-weights.json、agents/）`,
  },
  {
    id: 'shaman',
    title: '萨满系列',
    content: `shaman-musk / jobs / buffett / einstein / linus / sun-tzu / davinci / tesla
八席全部保留，进入默认推荐池。`,
  },
]

function Docs() {
  const [open, setOpen] = useState<string>('intro')

  return (
    <div className="docs-page">
      <div className="page-header">
        <h1>文档</h1>
        <p>完整 API 在仓库 docs/API.md · 使用指南 docs/USER-GUIDE.md</p>
      </div>
      {docSections.map(section => (
        <div key={section.id} className="card">
          <button className="btn-link" onClick={() => setOpen(open === section.id ? '' : section.id)}>
            {open === section.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {section.title}
          </button>
          {open === section.id && <pre style={{ whiteSpace: 'pre-wrap' }}>{section.content}</pre>}
        </div>
      ))}
    </div>
  )
}

export default Docs
