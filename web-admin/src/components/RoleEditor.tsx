import { useEffect, useState } from 'react'
import { fetchRoles } from '../lib/api'

interface RoleRow {
  id: string
  name: string
  description: string
  category: string
  classification: string
  shaman: boolean
  amb_benchmark?: {
    scenario: string
    delta: string
    status: string
    metric: string
  } | null
}

export default function RoleEditor() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [selected, setSelected] = useState<RoleRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchRoles()
      .then(list => setRoles(list as unknown as RoleRow[]))
      .catch(() => setError('角色目录需要运行中的 MCP HTTP 服务。'))
  }, [])

  const shown = roles.filter(r =>
    !filter || r.id.includes(filter) || r.category.includes(filter) || r.name.includes(filter)
  )

  return (
    <div className="role-editor">
      <h2>角色目录（只读）</h2>
      <p>v4 不在浏览器里改 SKILL.md。此处对照运行时目录。萨满全部保留。</p>
      {error && <p>{error}</p>}
      <input
        placeholder="过滤 id / 分类"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
      />
      <div className="editor-layout">
        <div className="role-list">
          {shown.map(role => (
            <div
              key={role.id}
              className={`role-item ${selected?.id === role.id ? 'selected' : ''}`}
              onClick={() => setSelected(role)}
            >
              <strong>{role.shaman ? `✦ ${role.id}` : role.id}</strong>
              <span>{role.category} · {role.classification}</span>
            </div>
          ))}
        </div>
        <div className="role-detail">
          {selected ? (
            <>
              <h3>{selected.name}</h3>
              <p><code>{selected.id}</code></p>
              <p>{selected.description}</p>
              <p>分类 {selected.classification}{selected.shaman ? ' · 萨满内核' : ''}</p>
              {selected.amb_benchmark ? (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#0f172a', borderRadius: 8, border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    📊 AMB v0 制品基准表现 (带分制品)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    <div><strong>基准场景：</strong> <code>{selected.amb_benchmark.scenario}</code></div>
                    <div><strong>相对基线提升：</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selected.amb_benchmark.delta}</span></div>
                    <div><strong>评测指标：</strong> {selected.amb_benchmark.metric} ({selected.amb_benchmark.status === 'verified' ? '✅ 已验证' : '⏳ 待复核'})</div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  ⚪ 暂无独立 AMB 分数（非主打制品或实验性角色）
                </div>
              )}
            </>
          ) : (
            <p>选择一个角色。共 {roles.length} 个。</p>
          )}
        </div>
      </div>
    </div>
  )
}
