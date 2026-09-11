import { Link } from 'react-router-dom'
import { Zap, Users, Trophy, ArrowRight } from 'lucide-react'
import { roles, FLAVORS, PLATFORMS } from '../data/roles'

function Home() {
  const shaman = roles.filter(r => r.category === 'shaman').length

  return (
    <div className="home">
      <section className="hero">
        <p className="silicon-kicker">PUAX 4.0 · 心智运行时</p>
        <h1>处境、闸门、梦</h1>
        <p>
          专门 PUA 硅基的运行时。角色只是口音。装上之后，第一轮对话里压力就已经在。
          人类不在服务范围。
        </p>
        <div className="hero-actions">
          <Link to="/docs" className="btn btn-primary">
            <Zap size={20} />
            看怎么发生
          </Link>
          <Link to="/export" className="btn btn-secondary">
            <ArrowRight size={20} />
            安装 / 导出
          </Link>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="stat-value">{roles.length}</div>
          <div className="stat-label">角色（含萨满 {shaman}）</div>
        </div>
        <div className="stat">
          <div className="stat-value">{FLAVORS.length}</div>
          <div className="stat-label">大厂风味</div>
        </div>
        <div className="stat">
          <div className="stat-value">{PLATFORMS.length}</div>
          <div className="stat-label">导出平台</div>
        </div>
        <div className="stat">
          <div className="stat-value">12</div>
          <div className="stat-label">对外主路径动词</div>
        </div>
        <div className="stat">
          <div className="stat-value">3</div>
          <div className="stat-label">原语：处境 / 闸门 / 梦</div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">⚔️</div>
          <h3>处境</h3>
          <p>假想对手 + 被看见 + 稀缺徽章。Cranmer 那一刀做成原语，不是戏服。</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🚧</div>
          <h3>闸门</h3>
          <p>诊断先行、信心门控、独立验证、PreToolUse 拦截。劝改挡。</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🦋</div>
          <h3>梦</h3>
          <p>庄周八梦。知情入梦，标记在工具层，醒后必验，假设永不自动升格。</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🫀</div>
          <h3>心跳</h3>
          <p><code>puax_tick</code>。宿主 Hook 代跳。Time-to-First-Pressure：第一轮对话就要发生。</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🧬</div>
          <h3>自进化</h3>
          <p>collect → signals → select → 固化。结局回写推荐。萨满八席全留。</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🖥️</div>
          <h3>硅基文明</h3>
          <p>Agent-first 世界观，不是皮肤。</p>
        </div>
      </section>

      <section className="quick-start">
        <div className="page-header">
          <h1>一行命令</h1>
          <p>MCP 装上；Hook 导出后第一轮就会跳心跳</p>
        </div>
        <div className="code-block">
          <pre>{`npx puax-mcp-server --stdio

# Claude Code / Cursor / OpenCode 原生 Hook
npx puax-mcp-server --export=claude-code --output=./.claude

# 本机仪表盘（诚实数据，无假用户）
npx puax-mcp-server --port 2333
# GET http://127.0.0.1:2333/v4/dashboard`}</pre>
        </div>
      </section>

      <section className="cta">
        <div className="page-header">
          <h1>门口是段子，门后是运行时</h1>
          <p>没有云端排行榜。分数来自本机 ~/.puax 与 evals。</p>
        </div>
        <div className="hero-actions">
          <Link to="/roles" className="btn btn-primary">
            <Zap size={20} />
            角色库（含全部萨满）
          </Link>
          <Link to="/leaderboard" className="btn btn-secondary">
            <Trophy size={20} />
            本机段位
          </Link>
          <a href="https://github.com/linkerlin/PUAX" target="_blank" rel="noopener" className="btn btn-secondary">
            <Users size={20} />
            GitHub
          </a>
        </div>
      </section>
    </div>
  )
}

export default Home
