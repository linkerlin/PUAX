import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { roles, categoryNames, type RoleCategory } from '../data/roles'

const categoryClasses: Record<string, string> = {
  military: 'tag-military',
  shaman: 'tag-shaman',
  p10: 'tag-p10',
  silicon: 'tag-silicon',
  theme: 'tag-theme',
  sillytavern: 'tag-sillytavern',
  'self-motivation': 'tag-self',
  special: 'tag-special',
  dream: 'tag-silicon',
}

function Roles() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [intensityFilter, setIntensityFilter] = useState<string>('all')

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = search === '' ||
        role.name.includes(search) ||
        role.id.includes(search) ||
        role.description.includes(search) ||
        role.tags.some(t => t.includes(search))

      const matchesCategory = categoryFilter === 'all' || role.category === categoryFilter
      const matchesIntensity = intensityFilter === 'all' || role.intensity === intensityFilter

      return matchesSearch && matchesCategory && matchesIntensity
    })
  }, [search, categoryFilter, intensityFilter])

  const categories = useMemo(() => {
    return Array.from(new Set(roles.map(r => r.category))) as RoleCategory[]
  }, [])

  return (
    <div className="roles-page">
      <div className="page-header">
        <h1>角色库 · {roles.length}</h1>
        <p>萨满八席全部保留。梗角色仍在目录，不进默认推荐池。口音可以很多，内核必须少。</p>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={20} />
          <input
            type="text"
            className="search-box"
            placeholder="搜索角色、id、标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          aria-label="按分类筛选角色"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">所有分类</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{categoryNames[cat]}</option>
          ))}
        </select>

        <select
          className="filter-select"
          aria-label="按强度筛选角色"
          value={intensityFilter}
          onChange={(e) => setIntensityFilter(e.target.value)}
        >
          <option value="all">所有强度</option>
          <option value="low">温和</option>
          <option value="medium">中等</option>
          <option value="high">强力</option>
          <option value="extreme">极限</option>
        </select>
      </div>

      <div className="results-info">
        共 {filteredRoles.length} 个角色 · shaman {roles.filter(r => r.category === 'shaman').length}
      </div>

      <div className="card-grid">
        {filteredRoles.map(role => (
          <div key={role.id} className="card role-card">
            <div className="role-header">
              <span className={`tag ${categoryClasses[role.category]}`}>
                {categoryNames[role.category]}
              </span>
              <span className={`intensity-badge intensity-${role.intensity}`}>
                {role.intensity === 'low' && '温和'}
                {role.intensity === 'medium' && '中等'}
                {role.intensity === 'high' && '强力'}
                {role.intensity === 'extreme' && '极限'}
              </span>
            </div>

            <h3 className="role-name">{role.name}</h3>
            <p className="role-id"><code>{role.id}</code></p>
            <p className="role-description">{role.description}</p>

            <div className="role-tags">
              {role.tags.map(tag => (
                <span key={tag} className="role-tag">{tag}</span>
              ))}
            </div>

            <div className="role-use-cases">
              <strong>适用：</strong>
              {role.useCases.join('、')}
            </div>

            <div className="role-actions">
              <span className="text-muted">激活走 puax_tick / get_role_with_methodology</span>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="empty-state">
          <p>没有找到匹配的角色</p>
          <p className="text-muted">试试 shaman 或 dream</p>
        </div>
      )}
    </div>
  )
}

export default Roles
