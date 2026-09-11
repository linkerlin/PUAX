import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Users, Zap } from 'lucide-react'

interface Dashboard {
  version?: string
  evolution?: { rank: string; total_sessions: number; successful_sessions: number; internalized: string[] }
  usage?: { totals?: { sessions?: number; tool_calls?: number; trigger_detections?: number }; top_roles?: Array<{ id: string; count: number }> }
  agent?: { name: string; trust: string; stats: { cycles: number; wins: number; losses: number } }
  arena?: { rival: string } | null
  note?: string
}

function Leaderboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://127.0.0.1:2333/v4/dashboard')
      .then(r => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then(setData)
      .catch(() => setError('本机 puax-mcp-server 未在 2333 端口运行。没有云端排行榜，也不捏造用户。'))
  }, [])

  const evo = data?.evolution
  const usage = data?.usage
  const agent = data?.agent

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1><Trophy /> 本机段位</h1>
        <p>v4 没有云端用户排行榜。分数只来自你这台机器上的 ~/.puax 与心跳结局。</p>
      </div>

      {error && (
        <div className="card">
          <p>{error}</p>
          <pre>{`npx puax-mcp-server --port 2333
# 然后打开 GET /v4/dashboard`}</pre>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <Users size={32} />
          <div className="stat-info">
            <div className="stat-value">{evo?.rank || '—'}</div>
            <div className="stat-label">进化段位</div>
          </div>
        </div>
        <div className="stat-card">
          <Zap size={32} />
          <div className="stat-info">
            <div className="stat-value">{usage?.totals?.trigger_detections ?? 0}</div>
            <div className="stat-label">本机触发</div>
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp size={32} />
          <div className="stat-info">
            <div className="stat-value">{agent?.stats?.cycles ?? evo?.total_sessions ?? 0}</div>
            <div className="stat-label">周期 / 会话</div>
          </div>
        </div>
        <div className="stat-card">
          <Trophy size={32} />
          <div className="stat-info">
            <div className="stat-value">{agent?.trust || 'T1'}</div>
            <div className="stat-label">Trust</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>处境</h3>
        <p>{data?.arena?.rival || '尚未 puax_set_arena。对手未立，戏服再多也只是赋。'}</p>
      </div>

      <div className="card">
        <h3>本机热门角色</h3>
        {usage?.top_roles?.length ? (
          <ol>
            {usage.top_roles.map(r => (
              <li key={r.id}><code>{r.id}</code> × {r.count}</li>
            ))}
          </ol>
        ) : (
          <p className="text-muted">还没有推荐记录。跑一次心跳就会出现。</p>
        )}
      </div>

      <div className="leaderboard-info">
        <h3>段位（本机 evolution.json）</h3>
        <p>见习 → 战士 → … → 首席PUA官。标准只上不下。已内化：{(evo?.internalized || []).join('、') || '无'}</p>
        {data?.note && <p className="text-muted">{data.note}</p>}
      </div>
    </div>
  )
}

export default Leaderboard
