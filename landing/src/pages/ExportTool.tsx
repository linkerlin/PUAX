import { useState } from 'react'
import { Download, Check, Copy } from 'lucide-react'
import { roles, FLAVORS, PLATFORMS } from '../data/roles'

const OUTPUT: Record<string, string> = {
  cursor: './.cursor/rules',
  vscode: './.github',
  'claude-code': './.claude',
  opencode: './.opencode',
  windsurf: './.windsurf',
}

function ExportTool() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('claude-code')
  const shaman = roles.filter(r => r.category === 'shaman').map(r => r.id)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['military-warrior', ...shaman.slice(0, 2)])
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const generateCommand = () => {
    const output = OUTPUT[selectedPlatform] || './puax-export'
    return `npx puax-mcp-server --export=${selectedPlatform} --output=${output}`
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(generateCommand())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  return (
    <div className="export-page">
      <div className="page-header">
        <h1><Download /> 导出 / 安装</h1>
        <p>v4 优先原生 Hook：装上就会跳心跳。导出角色文件是兼容路径。</p>
      </div>

      <div className="export-section">
        <h2>平台（{PLATFORMS.length}）</h2>
        <div className="export-options">
          {PLATFORMS.map(option => (
            <div
              key={option.id}
              className={`export-option ${selectedPlatform === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlatform(option.id)}
            >
              <h3>{option.name}</h3>
              <p>{option.description}</p>
              <code>--export={option.id}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="export-section">
        <h2>
          角色备忘（{roles.length}，萨满全选推荐）
          <span className="selection-actions">
            <button className="btn-link" onClick={() => setSelectedRoles(roles.map(r => r.id))}>全选</button>
            <button className="btn-link" onClick={() => setSelectedRoles(shaman)}>只要萨满</button>
            <button className="btn-link" onClick={() => setSelectedRoles([])}>清空</button>
          </span>
        </h2>
        <div className="role-selector">
          {roles.map(role => (
            <label key={role.id} className={`role-checkbox ${selectedRoles.includes(role.id) ? 'checked' : ''}`}>
              <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => toggleRole(role.id)} />
              <span className="role-checkbox-label">{role.id}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="export-section">
        <h2>风味（{FLAVORS.length}）</h2>
        <div className="flavor-selector">
          {FLAVORS.map(flavor => (
            <label key={flavor} className={`flavor-checkbox ${selectedFlavors.includes(flavor) ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={selectedFlavors.includes(flavor)}
                onChange={() => setSelectedFlavors(prev => prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor])}
              />
              <span className="flavor-checkbox-label">{flavor}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="export-section">
        <h2>命令</h2>
        <div className="command-box">
          <code className="command">{generateCommand()}</code>
          <button className="btn btn-secondary btn-sm" onClick={copyCommand}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div className="export-section">
        <h2>MCP</h2>
        <div className="code-block">
          <pre>{`{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}`}</pre>
        </div>
      </div>
    </div>
  )
}

export default ExportTool
