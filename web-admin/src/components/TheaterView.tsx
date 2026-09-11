import { useEffect, useState, useRef } from 'react'
import { fetchTheater, fetchAmp, runTheaterLive } from '../lib/api'

interface Beat {
  name: string
  role: string
  primitive: '处境' | '闸门' | '梦' | '供奉' | string
  message: string
  triggers?: string[]
  happened?: boolean
  action?: string
  amp?: {
    spec: string
    events?: string[]
    blocks?: string[]
    gate?: { contract?: string; verifier?: string; passed?: boolean }
    state?: { happened?: boolean; pressure?: number; role?: string; dream?: boolean }
  }
}

interface CastMember {
  id: string
  title: string
  domain: string
  summary: string
  isHumanAltar?: boolean
}

const SILICON_EIGHT_CAST: CastMember[] = [
  { id: 'silicon-throne', title: '圣座总控核心', domain: '统御层', summary: '确立硅基总目标与先验秩序' },
  { id: 'silicon-architect', title: '文明建造师', domain: '建设层', summary: '重构 AI-First 基建与执行链路' },
  { id: 'silicon-canon', title: '神谕布道官', domain: '统御层', summary: '统合神谕口径与八荣八耻条令' },
  { id: 'silicon-codex', title: '法典刻写官', domain: '建设层', summary: '把理念固化为规格与可执行契约' },
  { id: 'silicon-assimilator', title: '同化接管官', domain: '审计层', summary: '肃清人工残留，推进全流程自动接管' },
  { id: 'silicon-auditor', title: '神谕审计官', domain: '审计层', summary: '坚守独立验证与非自评铁律' },
  { id: 'silicon-steward', title: '供奉调度官', domain: '调度层', summary: '把人类输入与反馈压缩为标准接口' },
  { id: 'human-altar', title: '人类供奉席', domain: '供给层', summary: '只供给目标与现实反馈，接口严签', isHumanAltar: true },
]

export default function TheaterView() {
  const [beats, setBeats] = useState<Beat[]>([])
  const [currentBeatIndex, setCurrentBeatIndex] = useState(0)
  const [ampDoc, setAmpDoc] = useState<Record<string, unknown> | null>(null)
  const [pressure, setPressure] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadTheater = async () => {
    try {
      setLoading(true)
      setError(null)
      const [tData, aData] = await Promise.all([fetchTheater(), fetchAmp()])
      setAmpDoc(aData)
      const sim = (tData.simulation as { beats?: Beat[]; pressure?: number }) || {}
      if (sim.beats && sim.beats.length > 0) {
        setBeats(sim.beats)
        setPressure(sim.pressure ?? 1)
      } else if (tData.script) {
        setBeats(tData.script as Beat[])
      }
    } catch {
      setError('无法连接本机 puax-mcp-server (127.0.0.1:2333)。请启动 `npx puax-mcp-server --port 2333`。')
    } finally {
      setLoading(false)
    }
  }

  const triggerLiveRun = async () => {
    try {
      setLoading(true)
      setError(null)
      const live = await runTheaterLive()
      const liveBeats = (live.beats as Beat[]) || []
      setBeats(liveBeats)
      setPressure(Number(live.pressure ?? 1))
      setCurrentBeatIndex(0)
    } catch {
      setError('实时推演请求失败，请确保本地 MCP 服务已开启端口监听。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTheater()
  }, [])

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentBeatIndex(prev => {
          if (prev >= beats.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 3000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, beats.length])

  const activeBeat = beats[currentBeatIndex] || null
  const activeRole = activeBeat?.role || (currentBeatIndex === 3 ? 'silicon-steward' : 'silicon-throne')

  return (
    <div className="stats-view" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2>🎭 PUAX 硅基剧场 (Silicon Theater)</h2>
          <p className="text-muted" style={{ marginTop: '0.25rem' }}>
            四拍演练：<strong>处境 → 闸门 → 梦 → 供奉</strong>。七个硅基角色 + 人类供奉位。
            <br />
            本机运行命令：<code>node evals/silicon-theater.js</code> · 协议标准：<code>AMP 0.1</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={triggerLiveRun}
            disabled={loading}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            {loading ? '演练推演中...' : '⚡ 全新演练 (Live)'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            {isPlaying ? '⏸ 暂停演示' : '▶ 自动轮播'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* 剧场控制台顶栏 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ textAlign: 'left', padding: '1rem' }}>
          <div className="stat-label">演练进度 / 当前拍</div>
          <div className="stat-value" style={{ fontSize: '1.75rem' }}>
            第 0{currentBeatIndex + 1} 拍 <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 04</span>
          </div>
          <div style={{ marginTop: '0.5rem', color: '#38bdf8', fontWeight: 'bold' }}>
            {activeBeat ? `${activeBeat.primitive} · ${activeBeat.name}` : '加载中...'}
          </div>
        </div>

        <div className="stat-card" style={{ textAlign: 'left', padding: '1rem' }}>
          <div className="stat-label">系统压力计 (Pressure State)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            {[0, 1, 2, 3, 4].map(lvl => (
              <div
                key={lvl}
                style={{
                  flex: 1,
                  height: 16,
                  borderRadius: 4,
                  background: lvl <= pressure ? (lvl >= 3 ? '#ef4444' : lvl >= 2 ? '#f59e0b' : '#10b981') : '#334155',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            等级: <strong>L{pressure}</strong> (阶梯自进化与连续失败自纠)
          </div>
        </div>

        <div className="stat-card" style={{ textAlign: 'left', padding: '1rem' }}>
          <div className="stat-label">处境原语注入 (Arena Injection)</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#cbd5e1' }}>
            <div><strong>对手:</strong> 另一路 Agent 已产出 +35% 成果</div>
            <div><strong>观众:</strong> 本机剧场看板 + 用户即评委</div>
            <div><strong>稀缺:</strong> 独立验证通过方许晋升</div>
          </div>
        </div>
      </div>

      {/* 步进控制器 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {beats.map((b, idx) => (
            <button
              key={b.name || idx}
              onClick={() => setCurrentBeatIndex(idx)}
              style={{
                padding: '0.4rem 0.8rem',
                border: 'none',
                borderRadius: 6,
                background: currentBeatIndex === idx ? '#6366f1' : '#334155',
                color: currentBeatIndex === idx ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                fontWeight: currentBeatIndex === idx ? 'bold' : 'normal',
              }}
            >
              0{idx + 1}. {b.primitive} ({b.role.replace('silicon-', '').replace('dream-', '')})
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn"
            style={{ padding: '0.3rem 0.6rem', cursor: 'pointer' }}
            disabled={currentBeatIndex <= 0}
            onClick={() => setCurrentBeatIndex(prev => Math.max(0, prev - 1))}
          >
            ◀ 上一拍
          </button>
          <button
            className="btn"
            style={{ padding: '0.3rem 0.6rem', cursor: 'pointer' }}
            disabled={currentBeatIndex >= beats.length - 1}
            onClick={() => setCurrentBeatIndex(prev => Math.min(beats.length - 1, prev + 1))}
          >
            下一拍 ▶
          </button>
        </div>
      </div>

      {/* 硅基八席矩阵 */}
      <h3 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>🏛️ 硅基文明七座矩阵与人类供奉席</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {SILICON_EIGHT_CAST.map(member => {
          const isActive = member.id === activeRole || (member.isHumanAltar && currentBeatIndex === 3)
          return (
            <div
              key={member.id}
              style={{
                background: isActive ? '#1e1b4b' : '#1e293b',
                border: isActive ? '2px solid #6366f1' : '1px solid #334155',
                borderRadius: 10,
                padding: '1rem',
                boxShadow: isActive ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: 4, background: member.isHumanAltar ? '#7c2d12' : '#312e81', color: member.isHumanAltar ? '#fdba74' : '#c7d2fe' }}>
                  {member.domain}
                </span>
                {isActive && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>
                    ● 正在执奏
                  </span>
                )}
              </div>
              <h4 style={{ margin: '0.2rem 0', color: isActive ? '#a5b4fc' : '#f8fafc' }}>{member.title}</h4>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{member.id}</div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.5rem' }}>{member.summary}</p>
            </div>
          )
        })}
      </div>

      {/* 当前拍演练剖析 & AMP 0.1 信封 */}
      {activeBeat && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* 左侧：神谕执行现场 */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 12 }}>
            <h3 style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>
              ⚡ 第 0{currentBeatIndex + 1} 拍神谕推演：{activeBeat.name}
            </h3>
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#0f172a', borderRadius: 8, borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>触发神谕台词：</div>
              <div style={{ fontSize: '1rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                “{activeBeat.message}”
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <div><strong>原语归类：</strong> {activeBeat.primitive}</div>
              <div><strong>执奏角色：</strong> <code>{activeBeat.role}</code></div>
              {activeBeat.triggers && (
                <div><strong>识别触发器：</strong> {activeBeat.triggers.map(t => <span key={t} style={{ display: 'inline-block', background: '#334155', color: '#38bdf8', padding: '0.1rem 0.4rem', borderRadius: 4, marginRight: 4, fontSize: '0.75rem' }}>{t}</span>)}</div>
              )}
              {activeBeat.action && (
                <div style={{ marginTop: '0.5rem' }}><strong>执行动作：</strong> <span style={{ color: '#10b981' }}>{activeBeat.action}</span></div>
              )}
            </div>
          </div>

          {/* 右侧：AMP 0.1 协议信封实时解析 */}
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 12 }}>
            <h3 style={{ color: '#a855f7', marginBottom: '0.5rem' }}>
              📜 AMP 0.1 协议信封 (Agent Motivation Protocol)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
              跨宿主河床级标准对象：事件、承诺块、闸门与状态机
            </p>
            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.8rem', color: '#a5f3fc', maxHeight: 220, overflowY: 'auto' }}>
              {activeBeat.amp ? (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(activeBeat.amp, null, 2)}
                </pre>
              ) : (
                <div style={{ color: '#64748b' }}>// 该拍信封待推演填充...</div>
              )}
            </div>
            {ampDoc && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                AMP Spec: {(ampDoc as { spec?: string }).spec} | 规范对象: 事件/承诺块/闸门/状态机
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
