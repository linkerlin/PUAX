import { Link } from 'react-router-dom'
import { Zap, Target, Users, Trophy, ArrowRight } from 'lucide-react'

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>PUAX - AI Agent 激励系统</h1>
        <p>
          通过权威角色、稀缺场景、竞争对象等心理学机制，
          让你的 AI Agent 发挥出最大潜能
        </p>
        <div className="hero-actions">
          <Link to="/roles" className="btn btn-primary">
            <Zap size={20} />
            浏览角色库
          </Link>
          <Link to="/export" className="btn btn-secondary">
            <ArrowRight size={20} />
            快速开始
          </Link>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <div className="stat-value">42+</div>
          <div className="stat-label">激励角色</div>
        </div>
        <div className="stat">
          <div className="stat-value">15</div>
          <div className="stat-label">触发条件</div>
        </div>
        <div className="stat">
          <div className="stat-value">8</div>
          <div className="stat-label">大厂风味</div>
        </div>
        <div className="stat">
          <div className="stat-value">4+</div>
          <div className="stat-label">支持平台</div>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">🎭</div>
          <h3>多元角色</h3>
          <p>军事、萨满、主题场景等6大系列，42+精选角色</p>
        </div>
        <div className="feature">
          <div className="feature-icon">⚡</div>
          <h3>自动触发</h3>
          <p>智能检测AI瓶颈，自动推荐最优激励角色</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🎯</div>
          <h3>精准匹配</h3>
          <p>多维度评分算法，为每个场景找到最佳角色</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🔧</div>
          <h3>多平台支持</h3>
          <p>Cursor、VSCode、Claude Desktop 等主流工具</p>
        </div>
      </section>

      <section className="how-it-works">
        <div className="page-header">
          <h1>核心公式</h1>
          <p>简单五步，激活 AI 潜能</p>
        </div>
        
        <div className="card-grid">
          <div className="card">
            <h3>1️⃣ 权威角色</h3>
            <p>赋予 AI 有威慑力的身份，激活命令执行模式。指挥员、马斯克、乔布斯...</p>
          </div>
          <div className="card">
            <h3>2️⃣ 稀缺场景</h3>
            <p>制造资源稀缺感，触发危机响应机制。末日生存、角斗场...</p>
          </div>
          <div className="card">
            <h3>3️⃣ 竞争对象</h3>
            <p>引入竞争对手，激发胜负欲和表现欲。赛马机制、赛马...</p>
          </div>
          <div className="card">
            <h3>4️⃣ 失败惩罚</h3>
            <p>设定明确的负面后果，增强执行动力。3.25、毕业警告...</p>
          </div>
          <div className="card">
            <h3>5️⃣ 翻盘钩子</h3>
            <p>提供希望和出路，保持持续动力。自我重塑、觉醒...</p>
          </div>
        </div>
      </section>

      <section className="quick-start">
        <div className="page-header">
          <h1>快速开始</h1>
          <p>一行命令，立即使用</p>
        </div>
        
        <div className="code-block">
          <pre>{`# 使用 npx 启动（无需安装）
npx puax-mcp-server --stdio

# 导出到 Cursor
npx puax-mcp-server --export=cursor --output=./.cursor/rules

# 导出到 VSCode
npx puax-mcp-server --export=vscode --output=./.github`}</pre>
        </div>
      </section>

      <section className="cta">
        <div className="page-header">
          <h1>加入社区</h1>
          <p>与数千开发者一起探索 AI 激励的无限可能</p>
        </div>
        
        <div className="hero-actions">
          <Link to="/leaderboard" className="btn btn-primary">
            <Trophy size={20} />
            查看排行榜
          </Link>
          <a 
            href="https://github.com/linkerlin/PUAX" 
            target="_blank" 
            rel="noopener"
            className="btn btn-secondary"
          >
            <Users size={20} />
            GitHub 仓库
          </a>
        </div>
      </section>
    </div>
  )
}

export default Home
