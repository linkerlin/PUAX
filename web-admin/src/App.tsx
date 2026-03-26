import { useState } from 'react'
import Dashboard from './components/Dashboard'
import RoleEditor from './components/RoleEditor'
import StatsView from './components/StatsView'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'roles' | 'stats'>('dashboard')

  return (
    <div className="admin-app">
      <header className="admin-header">
        <h1>🎯 PUAX 管理后台</h1>
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
        </nav>
      </header>

      <main className="admin-main">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'roles' && <RoleEditor />}
        {activeTab === 'stats' && <StatsView />}
      </main>
    </div>
  )
}

export default App
