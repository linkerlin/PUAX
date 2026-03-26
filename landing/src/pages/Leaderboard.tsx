import { useState, useEffect } from 'react'
import { Trophy, Medal, TrendingUp, Users, Zap } from 'lucide-react'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  totalTriggers: number
  l3PlusCount: number
  favoriteRole: string
  streak: number
  lastActive: string
}

interface Stats {
  totalUsers: number
  totalTriggers: number
  activeToday: number
  topRole: string
}

// 模拟数据 - 实际应从 API 获取
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 'u1', displayName: 'L***n', totalTriggers: 342, l3PlusCount: 89, favoriteRole: 'military-warrior', streak: 45, lastActive: '2026-03-25' },
  { rank: 2, userId: 'u2', displayName: 'W***g', totalTriggers: 298, l3PlusCount: 76, favoriteRole: 'shaman-musk', streak: 32, lastActive: '2026-03-25' },
  { rank: 3, userId: 'u3', displayName: 'Z***o', totalTriggers: 256, l3PlusCount: 65, favoriteRole: 'military-commander', streak: 28, lastActive: '2026-03-24' },
  { rank: 4, userId: 'u4', displayName: 'C***n', totalTriggers: 198, l3PlusCount: 45, favoriteRole: 'shaman-jobs', streak: 21, lastActive: '2026-03-25' },
  { rank: 5, userId: 'u5', displayName: 'H***i', totalTriggers: 187, l3PlusCount: 42, favoriteRole: 'theme-hacker', streak: 19, lastActive: '2026-03-23' },
  { rank: 6, userId: 'u6', displayName: 'Y***g', totalTriggers: 165, l3PlusCount: 38, favoriteRole: 'military-warrior', streak: 15, lastActive: '2026-03-25' },
  { rank: 7, userId: 'u7', displayName: 'M***o', totalTriggers: 154, l3PlusCount: 35, favoriteRole: 'special-urgent-sprint', streak: 14, lastActive: '2026-03-22' },
  { rank: 8, userId: 'u8', displayName: 'X***n', totalTriggers: 143, l3PlusCount: 32, favoriteRole: 'shaman-einstein', streak: 12, lastActive: '2026-03-25' },
  { rank: 9, userId: 'u9', displayName: 'Q***i', totalTriggers: 132, l3PlusCount: 29, favoriteRole: 'sillytavern-antifragile', streak: 10, lastActive: '2026-03-24' },
  { rank: 10, userId: 'u10', displayName: 'D***o', totalTriggers: 121, l3PlusCount: 27, favoriteRole: 'military-scout', streak: 9, lastActive: '2026-03-25' },
]

const mockStats: Stats = {
  totalUsers: 1234,
  totalTriggers: 15678,
  activeToday: 89,
  topRole: 'military-warrior'
}

const roleNames: Record<string, string> = {
  'military-warrior': '战士',
  'military-commander': '指挥员',
  'shaman-musk': '马斯克',
  'shaman-jobs': '乔布斯',
  'shaman-einstein': '爱因斯坦',
  'theme-hacker': '赛博黑客',
  'special-urgent-sprint': '紧急冲刺',
  'sillytavern-antifragile': '反脆弱复盘官',
  'military-scout': '侦察兵'
}

function Leaderboard() {
  const [entries] = useState<LeaderboardEntry[]>(mockLeaderboard)
  const [stats] = useState<Stats>(mockStats)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all')

  // 实际项目中应从 API 获取
  useEffect(() => {
    // fetchLeaderboard(timeRange).then(data => setEntries(data))
  }, [timeRange])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="rank-icon rank-1" size={24} />
    if (rank === 2) return <Medal className="rank-icon rank-2" size={24} />
    if (rank === 3) return <Medal className="rank-icon rank-3" size={24} />
    return <span className="rank-number">{rank}</span>
  }

  const getLevel = (triggers: number, l3Count: number) => {
    if (triggers >= 200 && l3Count >= 40) return { name: 'P10', className: 'level-p10' }
    if (triggers >= 100 && l3Count >= 30) return { name: 'P9', className: 'level-p9' }
    if (triggers >= 50 && l3Count >= 20) return { name: 'P8', className: 'level-p8' }
    if (triggers >= 20 && l3Count >= 10) return { name: 'P7', className: 'level-p7' }
    if (triggers >= 5) return { name: 'P6', className: 'level-p6' }
    return { name: 'P5', className: 'level-p5' }
  }

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1><Trophy /> 排行榜</h1>
        <p>看看谁把 AI Agent 激励得最狠</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Users size={32} />
          <div className="stat-info">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">总用户数</div>
          </div>
        </div>
        <div className="stat-card">
          <Zap size={32} />
          <div className="stat-info">
            <div className="stat-value">{stats.totalTriggers}</div>
            <div className="stat-label">总触发次数</div>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={32} />
          <div className="stat-info">
            <div className="stat-value">{stats.activeToday}</div>
            <div className="stat-label">今日活跃</div>
          </div>
        </div>
        <div className="stat-card">
          <Trophy size={32} />
          <div className="stat-info">
            <div className="stat-value">{roleNames[stats.topRole] || stats.topRole}</div>
            <div className="stat-label">最受欢迎角色</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="time-filter">
          <button 
            className={`btn ${timeRange === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTimeRange('week')}
          >
            本周
          </button>
          <button 
            className={`btn ${timeRange === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTimeRange('month')}
          >
            本月
          </button>
          <button 
            className={`btn ${timeRange === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTimeRange('all')}
          >
            全部
          </button>
        </div>
      </div>

      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>用户</th>
              <th>段位</th>
              <th>总触发</th>
              <th>L3+ 次数</th>
              <th>最爱角色</th>
              <th>连续天数</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => {
              const level = getLevel(entry.totalTriggers, entry.l3PlusCount)
              return (
                <tr key={entry.userId} className={entry.rank <= 3 ? 'top-rank' : ''}>
                  <td className="rank-cell">{getRankIcon(entry.rank)}</td>
                  <td className="user-cell">
                    <span className="user-name">{entry.displayName}</span>
                  </td>
                  <td>
                    <span className={`level-badge ${level.className}`}>
                      {level.name}
                    </span>
                  </td>
                  <td className="numeric">{entry.totalTriggers}</td>
                  <td className="numeric">{entry.l3PlusCount}</td>
                  <td>{roleNames[entry.favoriteRole] || entry.favoriteRole}</td>
                  <td className="numeric">
                    {entry.streak > 0 && (
                      <span className="streak">
                        🔥 {entry.streak}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-info">
        <h3>段位体系</h3>
        <div className="level-legend">
          <div className="level-item">
            <span className="level-badge level-p10">P10</span>
            <span>PUA ≥200 + L3+ ≥40% + 连续≥30天</span>
          </div>
          <div className="level-item">
            <span className="level-badge level-p9">P9</span>
            <span>PUA ≥100 + L3+ ≥30% + 连续≥14天</span>
          </div>
          <div className="level-item">
            <span className="level-badge level-p8">P8</span>
            <span>PUA ≥50 + L3+ ≥20%</span>
          </div>
          <div className="level-item">
            <span className="level-badge level-p7">P7</span>
            <span>PUA ≥20 + L3+ ≥10%</span>
          </div>
          <div className="level-item">
            <span className="level-badge level-p6">P6</span>
            <span>PUA ≥5</span>
          </div>
          <div className="level-item">
            <span className="level-badge level-p5">P5</span>
            <span>PUA &lt; 5</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
