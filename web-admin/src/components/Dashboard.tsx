import { useEffect, useState } from 'react'
import { fetchDashboard } from '../lib/api'

export default function Dashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError('无法连接 puax-mcp-server（默认 http://127.0.0.1:2333）。本页不展示假用户数。'))
  }, [])

  const roles = (data?.roles || {}) as { total?: number; shaman_count?: number }
  const evo = (data?.evolution || {}) as { rank?: string; total_sessions?: number }
  const product = (data?.product || {}) as { thesis?: string }
  const ttf = (data?.ttf || {}) as { samples?: number; median_ms?: number | null; first_turn_rate?: number | null }

  return (
    <div className="dashboard">
      <h2>v4 仪表盘</h2>
      {error && <p>{error}</p>}
      <p>{product.thesis || '处境、闸门、梦'}</p>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{String(data?.version || '—')}</div>
          <div className="stat-label">版本</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{roles.total ?? '—'}</div>
          <div className="stat-label">角色</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{roles.shaman_count ?? 8}</div>
          <div className="stat-label">萨满（全留）</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{evo.rank || '见习'}</div>
          <div className="stat-label">本机段位</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {ttf.median_ms != null ? `${ttf.median_ms}ms` : '—'}
          </div>
          <div className="stat-label">TTF 中位（{ttf.samples ?? 0} 样）</div>
        </div>
      </div>
      {ttf.first_turn_rate != null ? (
        <p className="text-muted">第一轮命中率 {(ttf.first_turn_rate * 100).toFixed(0)}%</p>
      ) : null}
      {data?.note ? <p className="text-muted">{String(data.note)}</p> : null}
    </div>
  )
}
