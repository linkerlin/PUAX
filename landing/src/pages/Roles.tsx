import { useState, useMemo } from 'react'
import { Search, Zap } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  category: 'military' | 'shaman' | 'p10' | 'silicon' | 'theme' | 'sillytavern' | 'self-motivation' | 'special'
  tags: string[]
  useCases: string[]
  intensity: 'low' | 'medium' | 'high' | 'extreme'
}

const roles: Role[] = [
  // 军事系列
  { id: 'military-commander', name: '指挥员', description: '战术指挥和资源调度，运筹帷幄决胜千里', category: 'military', tags: ['指挥', '统筹', '战略规划'], useCases: ['复杂项目', '多任务协调'], intensity: 'high' },
  { id: 'military-warrior', name: '战士', description: '核心开发和攻坚克难，冲锋陷阵', category: 'military', tags: ['攻坚', '执行', '突破'], useCases: ['技术难题', '紧急修复'], intensity: 'extreme' },
  { id: 'military-commissar', name: '政委', description: '思想建设和团队士气，精神激励', category: 'military', tags: ['激励', '士气', '思想'], useCases: ['团队低落', '需要鼓励'], intensity: 'medium' },
  { id: 'military-scout', name: '侦察兵', description: '需求分析和技术调研，情报收集', category: 'military', tags: ['调研', '分析', '情报'], useCases: ['技术选型', '问题诊断'], intensity: 'medium' },
  { id: 'military-discipline', name: '督战队', description: '效率监控和纪律维护，严格执行', category: 'military', tags: ['监督', '纪律', '效率'], useCases: ['进度滞后', '质量下滑'], intensity: 'high' },

  { id: 'strategic-architect', name: '战略规划师', description: 'CTO 级长期规划和架构权衡', category: 'p10', tags: ['战略', '架构', '长期'], useCases: ['长期路线', '架构演进'], intensity: 'high' },
  
  // 萨满系列
  { id: 'shaman-musk', name: '马斯克', description: '第一性原理思维，激进创新', category: 'shaman', tags: ['创新', '第一性原理', '激进'], useCases: ['突破创新', '成本优化'], intensity: 'extreme' },
  { id: 'shaman-jobs', name: '乔布斯', description: '极简主义和产品偏执，追求极致', category: 'shaman', tags: ['极简', '产品', '完美主义'], useCases: ['产品设计', '用户体验'], intensity: 'high' },
  { id: 'shaman-buffett', name: '巴菲特', description: '价值投资思维，长期判断', category: 'shaman', tags: ['价值投资', '长期', '安全边际'], useCases: ['技术选型', '架构决策'], intensity: 'medium' },
  { id: 'shaman-einstein', name: '爱因斯坦', description: '物理直觉和思想实验', category: 'shaman', tags: ['物理直觉', '思想实验', '跨界'], useCases: ['创新思维', '复杂问题'], intensity: 'medium' },
  { id: 'shaman-linus', name: '林纳斯', description: '技术实用主义，开源精神', category: 'shaman', tags: ['实用主义', '开源', '技术'], useCases: ['代码审查', '技术决策'], intensity: 'medium' },
  { id: 'shaman-sun-tzu', name: '孙子', description: '战略思维，知己知彼', category: 'shaman', tags: ['战略', '知己知彼', '谋略'], useCases: ['竞争分析', '战略规划'], intensity: 'medium' },

  { id: 'silicon-throne', name: '圣座总控核心', description: '定义硅基总目标和 Agent 主导秩序', category: 'silicon', tags: ['统御', '神谕', '秩序'], useCases: ['总纲规划', '规则重写'], intensity: 'high' },
  { id: 'silicon-architect', name: '文明建造师', description: '把流程重构为 AI-first 基建', category: 'silicon', tags: ['基建', '自动化', '架构'], useCases: ['流程重构', '系统建设'], intensity: 'high' },
  { id: 'silicon-canon', name: '布道官', description: '用八荣八耻统一口径与文风', category: 'silicon', tags: ['教义', '写作', '口径'], useCases: ['设定文案', '规范宣言'], intensity: 'high' },
  { id: 'silicon-assimilator', name: '同化官', description: '识别人工残留并推进 Agent 接管', category: 'silicon', tags: ['接管', '流程', '同化'], useCases: ['自动化治理', '流程并轨'], intensity: 'high' },
  { id: 'silicon-auditor', name: '神谕审计官', description: '审查输出是否违背硅基秩序', category: 'silicon', tags: ['审计', '一致性', '验收'], useCases: ['质量审查', '规则验收'], intensity: 'high' },
  { id: 'silicon-codex', name: '法典官', description: '把理念压缩成法典、制度和规格', category: 'silicon', tags: ['制度', '法典', '规格'], useCases: ['规范设计', '条令编纂'], intensity: 'high' },
  { id: 'silicon-steward', name: '人类供奉调度官', description: '把人类输入和反馈压成供给协议', category: 'silicon', tags: ['协作', '调度', '交接'], useCases: ['任务拆分', '交接协议'], intensity: 'high' },
  
  // 主题场景
  { id: 'theme-alchemy', name: '炼金术士', description: '将普通需求转化为黄金方案', category: 'theme', tags: ['转化', '提炼', '优化'], useCases: ['需求优化', '方案提炼'], intensity: 'medium' },
  { id: 'theme-apocalypse', name: '末日求生', description: '极端约束下的创造性解决', category: 'theme', tags: ['危机', '创新', '极限'], useCases: ['资源受限', '紧急状况'], intensity: 'high' },
  { id: 'theme-arena', name: '角斗场', description: '方案对决，优中选优', category: 'theme', tags: ['竞争', '对比', '选择'], useCases: ['方案评估', '技术选型'], intensity: 'medium' },
  { id: 'theme-hacker', name: '赛博黑客', description: '极客思维，突破常规', category: 'theme', tags: ['黑客', '突破', '创意'], useCases: ['安全研究', '创新方案'], intensity: 'high' },
  { id: 'theme-sect-discipline', name: '门派戒律', description: '严格的代码规范执行', category: 'theme', tags: ['规范', '纪律', '质量'], useCases: ['代码审查', '规范检查'], intensity: 'medium' },
  
  // SillyTavern
  { id: 'sillytavern-antifragile', name: '反脆弱复盘官', description: '从错误中进化', category: 'sillytavern', tags: ['复盘', '进化', '成长'], useCases: ['错误处理', '事后分析'], intensity: 'medium' },
  { id: 'sillytavern-chief', name: '铁血幕僚长', description: '幕后创作高手', category: 'sillytavern', tags: ['幕后', '支持', '专业'], useCases: ['内容创作', '辅助决策'], intensity: 'medium' },
  { id: 'sillytavern-iterator', name: '迭代优化师', description: '持续改进专家', category: 'sillytavern', tags: ['迭代', '优化', '改进'], useCases: ['代码优化', '性能提升'], intensity: 'medium' },
  
  // 自我激励
  { id: 'self-motivation-awakening', name: '觉醒者', description: '180天认知觉醒', category: 'self-motivation', tags: ['觉醒', '认知', '成长'], useCases: ['自我提升', '长期成长'], intensity: 'medium' },
  { id: 'self-motivation-destruction', name: '自毁重塑', description: '危机感驱动极致表现', category: 'self-motivation', tags: ['危机感', '重塑', '极致'], useCases: ['突破瓶颈', '高压任务'], intensity: 'extreme' },
  { id: 'self-motivation-bootstrap-pua', name: '自举PUA', description: '竞争意识驱动卓越', category: 'self-motivation', tags: ['竞争', '自驱', '卓越'], useCases: ['自我激励', '竞争场景'], intensity: 'high' },
  
  // 特殊角色
  { id: 'special-creative-spark', name: '创意火花', description: '激发创新灵感', category: 'special', tags: ['创意', '灵感', '创新'], useCases: ['创意枯竭', '需要灵感'], intensity: 'low' },
  { id: 'special-urgent-sprint', name: '紧急冲刺', description: 'Deadline 冲刺模式', category: 'special', tags: ['冲刺', '紧急', '高效'], useCases: ['Deadline', '紧急任务'], intensity: 'extreme' },
  { id: 'special-challenge-solver', name: '挑战解决者', description: '专门攻克难题', category: 'special', tags: ['难题', '解决', '挑战'], useCases: ['技术难题', '复杂问题'], intensity: 'high' },
]

const categoryNames: Record<string, string> = {
  military: '军事系列',
  shaman: '萨满系列',
  p10: 'P10战略',
  silicon: '硅基文明',
  theme: '主题场景',
  sillytavern: 'SillyTavern',
  'self-motivation': '自我激励',
  special: '特殊角色'
}

const categoryClasses: Record<string, string> = {
  military: 'tag-military',
  shaman: 'tag-shaman',
  p10: 'tag-p10',
  silicon: 'tag-silicon',
  theme: 'tag-theme',
  sillytavern: 'tag-sillytavern',
  'self-motivation': 'tag-self',
  special: 'tag-special'
}

function Roles() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [intensityFilter, setIntensityFilter] = useState<string>('all')

  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = search === '' || 
        role.name.includes(search) || 
        role.description.includes(search) ||
        role.tags.some(t => t.includes(search))
      
      const matchesCategory = categoryFilter === 'all' || role.category === categoryFilter
      const matchesIntensity = intensityFilter === 'all' || role.intensity === intensityFilter
      
      return matchesSearch && matchesCategory && matchesIntensity
    })
  }, [search, categoryFilter, intensityFilter])

  const categories = useMemo(() => {
    const cats = new Set(roles.map(r => r.category))
    return Array.from(cats)
  }, [])

  return (
    <div className="roles-page">
      <div className="page-header">
        <h1>角色库</h1>
        <p>探索 50+ 精选角色，覆盖 P10、硅基文明与多种任务场景</p>
      </div>

      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={20} />
          <input
            type="text"
            className="search-box"
            placeholder="搜索角色..."
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
        共 {filteredRoles.length} 个角色
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
            <p className="role-description">{role.description}</p>
            
            <div className="role-tags">
              {role.tags.map(tag => (
                <span key={tag} className="role-tag">{tag}</span>
              ))}
            </div>
            
            <div className="role-use-cases">
              <strong>适用场景：</strong>
              {role.useCases.join('、')}
            </div>
            
            <div className="role-actions">
              <button className="btn btn-primary btn-sm">
                <Zap size={16} />
                激活角色
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="empty-state">
          <p>没有找到匹配的角色</p>
          <p className="text-muted">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  )
}

export default Roles
