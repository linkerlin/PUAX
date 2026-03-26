import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Roles from './pages/Roles'
import Leaderboard from './pages/Leaderboard'
import ExportTool from './pages/ExportTool'
import Docs from './pages/Docs'
import SiliconCivilization from './pages/SiliconCivilization'
import './index.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/">
            <span className="logo">🎯 PUAX</span>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/">首页</Link>
          <Link to="/roles">角色库</Link>
          <Link to="/silicon">硅基文明</Link>
          <Link to="/leaderboard">排行榜</Link>
          <Link to="/export">导出工具</Link>
          <Link to="/docs">文档</Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/silicon" element={<SiliconCivilization />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/export" element={<ExportTool />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>🎯 PUAX - 让 AI Agent 不再孤军奋战</p>
          <p className="footer-links">
            <a href="https://github.com/linkerlin/PUAX" target="_blank" rel="noopener">GitHub</a>
            <span> | </span>
            <a href="https://puax.net" target="_blank" rel="noopener">学习平台</a>
          </p>
          <p className="copyright">© 2026 PUAX Team. MIT License.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
