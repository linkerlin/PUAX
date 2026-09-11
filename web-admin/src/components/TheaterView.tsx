import { useEffect, useState } from 'react'
import { fetchTheater, fetchAmp } from '../lib/api'

interface Beat {
  name: string
  role: string
  primitive: string
  message: string
}

export default function TheaterView() {
  const [plan, setPlan] = useState<Record<string, unknown> | null>(null)
  const [amp, setAmp] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchTheater(), fetchAmp()])
      .then(([t, a]) => {
        setPlan(t)
        setAmp(a)
      })
      .catch(() => setError('需要本机 puax-mcp-server --port 2333。剧场不造假观众。'))
  }, [])

  const script = (plan?.script || []) as Beat[]

  return (
    <div className="stats-view">
      <h2>硅基剧场</h2>
      <p>四拍：处境 → 闸门 → 梦 → 供奉。本机演练命令：<code>node evals/silicon-theater.js</code></p>
      {error && <p>{error}</p>}
      <ol>
        {script.map(beat => (
          <li key={beat.name}>
            <strong>{beat.primitive}</strong> · {beat.role} — {beat.name}
            <div className="text-muted">{beat.message}</div>
          </li>
        ))}
      </ol>
      {amp ? (
        <p className="text-muted">AMP {(amp as { spec?: string }).spec} · 事件 {JSON.stringify((amp as { objects?: { events?: string[] } }).objects?.events)}</p>
      ) : null}
    </div>
  )
}
