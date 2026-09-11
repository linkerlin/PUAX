import { useState } from 'react'
import Dashboard from './components/Dashboard'
import RoleEditor from './components/RoleEditor'
import StatsView from './components/StatsView'
import TheaterView from './components/TheaterView'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roles' | 'stats' | 'theater'>('dashboard')

  return (
    <div className="admin-app">
      <header className="admin-header">
        <h1>PUAX v4 本机台</h1>
        <nav>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            仪表盘
          </button>
          <button 
            className={activeTab === 'roles' ? 'active' : ''}
            onClick={() => setActiveTab('roles')}
          >
            角色编辑
          </button>
          <button 
            className={activeTab === 'stats' ? 'active' : ''}
            onClick={() => setActiveTab('stats')}
          >
            数据统计
          </button>
          <button 
            className={activeTab === 'theater' ? 'active' : ''}
            onClick={() => setActiveTab('theater')}
          >
            剧场
          </button>
        </nav>
      </header>

      <main className="admin-main">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'roles' && <RoleEditor />}
        {activeTab === 'stats' && <StatsView />}
        {activeTab === 'theater' && <TheaterView />}
      </main>
    </div>
  )
}

export default App
