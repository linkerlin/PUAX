import { useEffect, useState } from 'react'
import { fetchRoles } from '../lib/api'

interface RoleRow {
  id: string
  name: string
  description: string
  category: string
  classification: string
  shaman: boolean
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
            </>
          ) : (
            <p>选择一个角色。共 {roles.length} 个。</p>
          )}
        </div>
      </div>
    </div>
  )
}
