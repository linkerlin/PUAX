import { useState } from 'react'

interface Stats {
  totalRoles: number
  totalTriggers: number
  activeUsers: number
  topRole: string
}

export default function Dashboard() {
  const [stats] = useState<Stats>({
    totalRoles: 43,
    totalTriggers: 15678,
    activeUsers: 1234,
    topRole: '战士'
  })

  return (
    <div className="dashboard">
      <h2>系统概览</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalRoles}</div>
          <div className="stat-label">总角色数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalTriggers}</div>
          <div className="stat-label">总触发次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeUsers}</div>
          <div className="stat-label">活跃用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.topRole}</div>
          <div className="stat-label">最受欢迎角色</div>
        </div>
      </div>
    </div>
  )
}
