import { useState } from 'react'
import { Download, Check, Copy, Terminal, Code, FileCode } from 'lucide-react'

interface ExportOption {
  id: string
  name: string
  icon: string
  description: string
  fileType: string
  configPath: string
}

const exportOptions: ExportOption[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '🎯',
    description: '生成 .cursor/rules/*.mdc 文件',
    fileType: '.mdc',
    configPath: '~/.cursor/rules/'
  },
  {
    id: 'vscode',
    name: 'VSCode Copilot',
    icon: '📝',
    description: '生成 .github/copilot-instructions.md',
    fileType: '.md',
    configPath: '~/.github/'
  }
]

const roles = [
  'military-commander', 'military-warrior', 'military-commissar', 'military-scout', 'military-discipline',
  'shaman-musk', 'shaman-jobs', 'shaman-buffett', 'shaman-einstein', 'shaman-linus', 'shaman-sun-tzu',
  'theme-alchemy', 'theme-apocalypse', 'theme-arena', 'theme-hacker', 'theme-sect-discipline',
  'sillytavern-antifragile', 'sillytavern-chief', 'sillytavern-iterator',
  'self-motivation-awakening', 'self-motivation-destruction', 'self-motivation-bootstrap-pua',
  'special-creative-spark', 'special-urgent-sprint', 'special-challenge-solver'
]

const flavors = ['alibaba', 'huawei', 'bytedance', 'tencent', 'netflix', 'musk', 'jobs', 'amazon']

function ExportTool() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('cursor')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['military-warrior', 'shaman-musk'])
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const generateCommand = () => {
    const platform = selectedPlatform
    const output = platform === 'cursor' ? './.cursor/rules' : './.github'
    const rolesFlag = selectedRoles.length > 0 ? ` --roles=${selectedRoles.join(',')}` : ''
    const flavorsFlag = selectedFlavors.length > 0 ? ` --flavors=${selectedFlavors.join(',')}` : ''
    
    return `npx puax-mcp-server --export=${platform} --output=${output}${rolesFlag}${flavorsFlag}`
  }

  const copyCommand = () => {
    navigator.clipboard.writeText(generateCommand())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    )
  }

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => 
      prev.includes(flavor) 
        ? prev.filter(f => f !== flavor)
        : [...prev, flavor]
    )
  }

  const selectAllRoles = () => setSelectedRoles(roles)
  const clearRoles = () => setSelectedRoles([])

  return (
    <div className="export-page">
      <div className="page-header">
        <h1><Download /> 导出工具</h1>
        <p>一键导出 PUAX 角色到你的开发环境</p>
      </div>

      <div className="export-section">
        <h2>选择平台</h2>
        <div className="export-options">
          {exportOptions.map(option => (
            <div
              key={option.id}
              className={`export-option ${selectedPlatform === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlatform(option.id)}
            >
              <div className="export-option-icon">{option.icon}</div>
              <h3>{option.name}</h3>
              <p>{option.description}</p>
              <code>{option.configPath}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="export-section">
        <h2>
          选择角色
          <span className="selection-actions">
            <button className="btn-link" onClick={selectAllRoles}>全选</button>
            <button className="btn-link" onClick={clearRoles}>清空</button>
          </span>
        </h2>
        <div className="role-selector">
          {roles.map(role => (
            <label key={role} className={`role-checkbox ${selectedRoles.includes(role) ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              <span className="role-checkbox-label">{role}</span>
            </label>
          ))}
        </div>
        <p className="selection-count">已选择 {selectedRoles.length} 个角色</p>
      </div>

      <div className="export-section">
        <h2>选择风味（可选）</h2>
        <div className="flavor-selector">
          {flavors.map(flavor => (
            <label key={flavor} className={`flavor-checkbox ${selectedFlavors.includes(flavor) ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={selectedFlavors.includes(flavor)}
                onChange={() => toggleFlavor(flavor)}
              />
              <span className="flavor-checkbox-label">{flavor}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="export-section">
        <h2>生成命令</h2>
        <div className="command-box">
          <code className="command">{generateCommand()}</code>
          <button className="btn btn-secondary btn-sm" onClick={copyCommand}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div className="export-section">
        <h2>手动配置指南</h2>
        
        {selectedPlatform === 'cursor' && (
          <div className="guide">
            <h3>Cursor 配置步骤</h3>
            <ol>
              <li>确保已安装 Cursor 编辑器</li>
              <li>在项目根目录创建 <code>.cursor/rules/</code> 文件夹</li>
              <li>运行上方生成的命令导出角色</li>
              <li>导出的 <code>.mdc</code> 文件会自动生效</li>
              <li>在 Cursor 中打开项目，AI 会自动识别规则</li>
            </ol>
            <div className="code-block">
              <pre>{`# 或者手动复制到项目目录
cp -r ./puax-export/cursor/* ./.cursor/rules/`}</pre>
            </div>
          </div>
        )}
        
        {selectedPlatform === 'vscode' && (
          <div className="guide">
            <h3>VSCode Copilot 配置步骤</h3>
            <ol>
              <li>确保已安装 VSCode 和 GitHub Copilot 扩展</li>
              <li>在项目根目录创建 <code>.github/</code> 文件夹</li>
              <li>运行上方生成的命令导出角色</li>
              <li>在 VSCode 设置中启用 instructions 文件</li>
            </ol>
            <div className="code-block">
              <pre>{`# VSCode 设置 (settings.json)
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.includeApplyingInstructions": true
}`}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="export-section">
        <h2>MCP 配置</h2>
        <p>如果你想使用 MCP 服务器模式，添加以下配置：</p>
        
        <div className="code-block">
          <pre>{`// Cursor MCP 配置 (~/.cursor/mcp_config.json)
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}

// Claude Desktop 配置
{
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
