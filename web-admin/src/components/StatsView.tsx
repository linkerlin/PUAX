import { useEffect, useState } from 'react'
import { fetchDashboard } from '../lib/api'

export default function StatsView() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError('无本机统计。启动 `npx puax-mcp-server --port 2333`。'))
  }, [])

  const usage = (data?.usage || {}) as {
    totals?: Record<string, number>
    top_roles?: Array<{ id: string; count: number }>
    top_triggers?: Array<{ id: string; count: number }>
  }
  const evo = (data?.evolution || {}) as Record<string, unknown>
  const agent = (data?.agent || {}) as { stats?: Record<string, number>; trust?: string }

  return (
    <div className="stats-view">
      <h2>本机统计</h2>
      {error && <p>{error}</p>}
      {!error && (
        <>
          <p>会话 {usage.totals?.sessions ?? 0} · 工具 {usage.totals?.tool_calls ?? 0} · 触发 {usage.totals?.trigger_detections ?? 0}</p>
          <p>进化段位 {String(evo.rank || '—')} · Trust {agent.trust || 'T1'} · 周期 {agent.stats?.cycles ?? 0}</p>
          <h3>热门角色</h3>
          <ul>
            {(usage.top_roles || []).map(r => (
              <li key={r.id}>{r.id} × {r.count}</li>
            ))}
          </ul>
          <h3>热门触发</h3>
          <ul>
            {(usage.top_triggers || []).map(r => (
              <li key={r.id}>{r.id} × {r.count}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
