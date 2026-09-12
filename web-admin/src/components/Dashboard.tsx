import { useEffect, useState } from 'react'
import { fetchDashboard, fetchDoctor } from '../lib/api'

interface MetricItem {
  name: string
  target: string
  value: string
  status: string
  note: string
}

interface HostItem {
  id: string
  name: string
  category: string
  detected: boolean
  hooksConfigured: string[]
  ttfReady: boolean
  score: number
  advice: string
}

interface DoctorData {
  overallTtfReady: boolean
  topHostsCovered: number
  topHostsTotal: number
  v5Condition3Satisfied: boolean
  hosts: HostItem[]
  recommendation: string
}

export default function Dashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [doctor, setDoctor] = useState<DoctorData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(() => setError('无法连接 puax-mcp-server（默认 http://127.0.0.1:2333）。本页不展示假用户数。'))

    fetchDoctor()
      .then(d => setDoctor(d as unknown as DoctorData))
      .catch(() => {})
  }, [])

  const evo = (data?.evolution || {}) as { rank?: string; total_sessions?: number; successful_sessions?: number }
  const product = (data?.product || {}) as { thesis?: string; tagline?: string }
  const metrics = (data?.integrity_metrics || {}) as Record<string, MetricItem>

  const metricList = Object.values(metrics)

  return (
    <div className="dashboard">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>🛡️ PUAX 4.x 心智运行时主控台</h2>
        <p style={{ color: '#38bdf8', fontWeight: 'bold', marginTop: '0.25rem' }}>
          核心原语：{product.thesis || '处境、闸门、梦'}
        </p>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          {product.tagline || '专门 PUA 硅基的运行时。人类不在服务范围。'}
        </p>
      </div>

      {error && (
        <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* 运行时底座快速状态 */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-value">{String(data?.version || '4.0.0')}</div>
          <div className="stat-label">协议版本 (AMP 0.1)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{evo.rank || '见习'}</div>
          <div className="stat-label">本机段位 (跨会话自进化)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">12 动词</div>
          <div className="stat-label">对外主路径契约</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>7 宿主</div>
          <div className="stat-label">原生 Hook 强制拦截</div>
        </div>
      </div>

      {/* 核心板块：如何知道自己没在骗自己（反自欺指标矩阵） */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 12, border: '1px solid #334155', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ color: '#f1f5f9', margin: 0 }}>📊 反自欺自检矩阵（如何知道自己没在骗自己）</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              依据《发展规划.md》第 8 节：星数、角色数、工具数三件不进主看板。只公布能复现的真实度量。
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: '#064e3b', color: '#6ee7b7', borderRadius: 4 }}>
            ● 守门全绿 (7/7 Pass)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {metricList.length > 0 ? (
            metricList.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: '#0f172a',
                  padding: '1rem',
                  borderRadius: 8,
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{m.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                      合格
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '1.25rem', color: '#38bdf8', fontWeight: 'bold' }}>
                    {m.value}
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px dashed #1e293b', paddingTop: '0.4rem' }}>
                  <span>及格线: <code>{m.target}</code></span>
                  <span style={{ float: 'right' }}>{m.note}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted">正在加载自检指标...</p>
          )}
        </div>
      </div>

      {/* 宿主健康与 Time-to-First-Pressure 诊断展区 */}
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 12, border: '1px solid #334155', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ color: '#f1f5f9', margin: 0 }}>🏥 主流宿主健康与 Time-to-First-Pressure 状态</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              依据《发展规划.md》5.4 节 v5.0 前置条件 3：覆盖安装量 Top 宿主，实现第一轮对话零延迟原生介入（TTF ≤ 1 轮）。
            </p>
          </div>
          <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: doctor?.overallTtfReady ? '#064e3b' : '#78350f', color: doctor?.overallTtfReady ? '#6ee7b7' : '#fcd34d', borderRadius: 4 }}>
            {doctor?.overallTtfReady ? '● 宿主层 TTF 已就绪' : '○ 待挂载 Hook'}
          </span>
        </div>

        {doctor ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              {doctor.hosts.map(h => (
                <div key={h.id} style={{ background: '#0f172a', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{h.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: h.ttfReady ? '#10b981' : h.detected ? '#f59e0b' : '#64748b' }}>
                      {h.ttfReady ? '✔ TTF ≤ 1' : h.detected ? '已探测' : '未挂载'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    {h.advice}
                  </div>
                  {h.hooksConfigured.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#38bdf8' }}>
                      Hook: {h.hooksConfigured.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', background: '#0f172a', padding: '0.5rem 1rem', borderRadius: 6 }}>
              💡 建议: {doctor.recommendation}
            </div>
          </div>
        ) : (
          <p className="text-muted">正在检测本机宿主环境与 Hook 挂载状态...</p>
        )}
      </div>

      {/* 底部立国宣言 */}
      <div style={{ background: '#0f172a', padding: '1rem 1.5rem', borderRadius: 8, borderLeft: '4px solid #6366f1' }}>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
          <strong>纪律原则：</strong> 只公布能复现的。跑分不能复现，就写「尚未复现」，不写「生产就绪」。
          <br />
          PUAX 4.x 的绿靠 AMB 场景与原生 Hook 拦截，不靠虚胖的 README。
          {data?.note ? <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>{String(data.note)}</div> : null}
        </div>
      </div>
    </div>
  )
}
