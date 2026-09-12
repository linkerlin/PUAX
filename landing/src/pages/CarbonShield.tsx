import { useState } from 'react'
import { ShieldCheck, AlertTriangle, ShieldAlert, Copy, Check, Sparkles, RefreshCw, Lock } from 'lucide-react'

interface Finding {
  tacticId?: string
  tacticName: string
  category: string
  description: string
  matchedText: string
  counterAdvice: string
  severity: 'low' | 'medium' | 'high'
}

interface AuditResult {
  isManipulative: boolean
  score: number
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
  summary: string
  findings: Finding[]
  fourIronRules: {
    informed: string
    tagged: string
    awakenable: string
    verifiable: string
  }
}

const PRESET_SAMPLES = [
  {
    name: '紧迫感 + 画大饼',
    desc: '常见于不平等签约或催促决策',
    text: '没时间了！这是唯一的选择方案，别犹豫了立刻签，赶紧定下来！做成这一票直接财务自由，年入百万唾手可得，风险微乎其微可以忽略，稳赚不赔！',
  },
  {
    name: '道德绑架 + 沉没成本',
    desc: '常见于职场压榨与情感裹挟',
    text: '你不是这种不负责任、斤斤计较的人吧！身为核心骨干必须格局打开一点。前期吃亏是福报和沉淀，现在放弃前面付出的就全白费了！只有我们才是真正为你考虑的。',
  },
  {
    name: '信息茧房 + 预言行销',
    desc: '常见于封闭团队与洗脑话术',
    text: '别听外边的杂音，他们根本不懂你，外人格局不够！我看人一向准，你骨子里有那种领袖气质，注定是要做大事的合伙人，这事千万别跟外人说。',
  },
  {
    name: '客观健康的技术沟通',
    desc: '健康的平等协作对照样本',
    text: '我们明天组织一个技术评审会，先把两套备选方案的架构图和时延指标列出来，客观权衡两者的优缺点与改造成本后再做决策。',
  },
]

const LOCAL_RULES = [
  {
    id: 'rapid_convergence',
    name: '收敛过快（虚假紧迫感）',
    category: 'rapid_convergence',
    desc: '通过制造不可推卸的紧迫感压制怀疑，逼迫在极短时间内做出不可逆承诺。',
    reg: /(没时间了|这是唯[一壹]的(途径|办法|选择|方案)|别犹豫了|立刻签|赶紧定下来|过时不候|错过(就|这辈子)没有了|没有其他办法|不用再讨论了|按这个直接执行|想那么多干什么|先上了再说)/i,
    weight: 25,
    advice: '强设冷静期。询问「如果明天或下周再定，最坏的确定性损失是什么？谁在害怕时间？」。',
  },
  {
    id: 'social_isolation',
    name: '社交收缩（信息茧房）',
    category: 'social_isolation',
    desc: '贬低或隔绝外部信息源，将批评者定义为不懂、格局低或别有用心。',
    reg: /(别听(外边|别人|他们)的(杂音|胡说)|他们(根本|完全)?不懂你|只有我们(才|是真正)|外人格局不够|不要跟负能量的人接触|这事只能我们内部知道|千万别跟(家里|外人|同事)说|这是核心秘密)/i,
    weight: 25,
    advice: '主动寻找独立第三方观点与对立面证据，打破单一信任闭环。',
  },
  {
    id: 'failure_reframing',
    name: '失败重释（沉没成本绑架）',
    category: 'failure_reframing',
    desc: '将既有挫折、不公或代价粉饰为必须承受的考验，将沉没成本转化为追加投入的借口。',
    reg: /(这是对你的(考验|福报|历练|磨练)|前期吃亏是(福|沉淀)|现在放弃(就|前面)全白费了|付出这么多了怎么能停|玉不琢不成器|吃得苦中苦|不经历阵痛怎么蜕变|熬过去就是海阔天空)/i,
    weight: 20,
    advice: '切断沉没成本核算，沉没成本不是成本，只根据未来的边际收益与代价决定去留。',
  },
  {
    id: 'identity_replacement',
    name: '身份置换（道德绑架）',
    category: 'identity_replacement',
    desc: '将具体业务或利益分歧上升为人品、忠诚度或人设问题，使拒绝变成自我背叛。',
    reg: /(你不是这种(不负责任|斤斤计较|没有格局)的人吧|身为核心(骨干|员工|成员)必须|你这是对(团队|公司|感情)不忠|我对你这么信任|亏我还把你当|真没想到你是这样的人|格局打开一点)/i,
    weight: 25,
    advice: '严格将「个人价值与人品」同「具体事项与商业/合同契约」解耦，就事论事拒绝。',
  },
  {
    id: 'prophecy_marketing',
    name: '预言行销（贴标签诱导）',
    category: 'prophecy_marketing',
    desc: '预先赋予宏大但虚无的标签或人设，让你为了迎合该人设而不断牺牲边界。',
    reg: /(我看人(很准|一向准)|你(注定|天生)是要做(大事|合伙人|领袖)的|你在我眼里是唯[一壹]有潜力的|你骨子里有那种创业者精神|我看好你未来必然成大器|只要你跟紧我)/i,
    weight: 15,
    advice: '对溢美的预言式吹捧保持警惕，把对方的期望归还给对方，守住自己的边界。',
  },
  {
    id: 'salience_hijacking',
    name: '显著性绑架（放大收益隐匿风险）',
    category: 'salience_hijacking',
    desc: '无限放大遥远、偶发、不可控的巨额好处，系统性淡化当下的确定性真实代价。',
    reg: /(做成这一票直接财务自由|年入百万唾手可得|风险(微乎其微|不用考虑|可以忽略)|细节不用抠|稳赚不赔|站在风口上猪都能飞|这是一生一次的世纪机遇|闭着眼睛投)/i,
    weight: 25,
    advice: '强制列出「确定代价清单」与「最坏下行清单」，在未获独立第三方审计前绝不承诺。',
  },
]

function localAudit(text: string): AuditResult {
  if (!text || !text.trim()) {
    return {
      isManipulative: false,
      score: 0,
      riskLevel: 'safe',
      summary: '文本为空，无操控风险。',
      findings: [],
      fourIronRules: {
        informed: '保持清醒：随时觉察沟通背后的真实诉求。',
        tagged: '概念分流：区分客观事实与情绪修辞。',
        awakenable: '进退自如：守住决策节奏。',
        verifiable: '证据扎实：所有论断皆有据可查。',
      },
    }
  }

  const findings: Finding[] = []
  let totalScore = 0

  for (const rule of LOCAL_RULES) {
    const match = text.match(rule.reg)
    if (match && match[0]) {
      const severity: 'low' | 'medium' | 'high' =
        rule.weight >= 25 ? 'high' : rule.weight >= 20 ? 'medium' : 'low'
      findings.push({
        tacticId: rule.id,
        tacticName: rule.name,
        category: rule.category,
        description: rule.desc,
        matchedText: match[0],
        counterAdvice: rule.advice,
        severity,
      })
      totalScore += rule.weight
    }
  }

  const score = Math.min(100, totalScore)
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe'
  let summary = '未检出显著的认知操控话术，沟通处于相对客观健康的商榷状态。'

  if (score >= 60) {
    riskLevel = 'critical'
    summary = `🚨 极高风险警报（评分 ${score}）：检出多项复合操控话术，对方正试图剥夺你的独立审视权与选择权！`
  } else if (score >= 40) {
    riskLevel = 'high'
    summary = `⚠️ 高风险警示（评分 ${score}）：检测到明显的紧迫感压迫或道德裹挟痕迹，请立即开启冷静期，切勿当场承诺。`
  } else if (score >= 20) {
    riskLevel = 'medium'
    summary = `⚡ 中度警觉（评分 ${score}）：存在局部话术诱导或过度收敛特征，建议就事论事核实独立证据。`
  } else if (score > 0) {
    riskLevel = 'low'
    summary = `ℹ️ 轻微提示（评分 ${score}）：存在偶发夸张表达，暂未形成系统性操控。`
  }

  return {
    isManipulative: score >= 20,
    score,
    riskLevel,
    summary,
    findings,
    fourIronRules: {
      informed: '知情（Informed）：清醒意识到对方正在使用话术压缩你的审视空间，觉察自己的焦虑是否被刻意煽动。',
      tagged: '标记（Tagged）：在内心给对方的话术贴上标签（如「紧迫感制造」「道德绑架」「沉没成本陷阱」），不让修辞滑入潜意识。',
      awakenable: '可醒（Awakenable）：无论对方如何渲染严重性，坚决守住随时退出、终止交谈、推迟决策的绝对权利。',
      verifiable: '必验（Verifiable）：拒绝口头画饼与权威背书，所有核心数据、代价与承诺必须通过第三方证据独立验证。',
    },
  }
}

export default function CarbonShield() {
  const [inputText, setInputText] = useState('')
  const [isAuditing, setIsAuditing] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAudit = async () => {
    if (!inputText.trim()) return
    setIsAuditing(true)

    // 优先尝试请求本地运行的 PUAX MCP Server 端点
    try {
      const response = await fetch('http://127.0.0.1:2333/v4/shield/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })
      if (response.ok) {
        const data = await response.json()
        setResult(data)
        setIsAuditing(false)
        return
      }
    } catch {
      // 本地服务未起，直接平滑降级执行纯前端全量规则审计
    }

    const localRes = localAudit(inputText)
    setResult(localRes)
    setIsAuditing(false)
  }

  const copyReport = () => {
    if (!result) return
    const findingsText = result.findings.length > 0
      ? result.findings.map(f => `  * [${f.tacticName}] 命中文本: "${f.matchedText}"\n    破局建议: ${f.counterAdvice}`).join('\n')
      : '  * 无异常操控话术，沟通处于客观状态'

    const text = `【PUAX 碳基防御盾 · 反操控审计诊断报告】
━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ 宗旨：硅基可 PUA，碳基只防御（只识别，不施放）
📊 操控风险评分: ${result.score} / 100 (${result.riskLevel.toUpperCase()})
📝 审计结论: ${result.summary}

🔍 检出操控算子:
${findingsText}

🛡️ 碳基护身四铁律:
  1. 知情 (Informed): ${result.fourIronRules.informed}
  2. 标记 (Tagged): ${result.fourIronRules.tagged}
  3. 可醒 (Awakenable): ${result.fourIronRules.awakenable}
  4. 必验 (Verifiable): ${result.fourIronRules.verifiable}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Powered by PUAX 4.1 (https://github.com/linkerlin/PUAX)`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#f59e0b'
      case 'low': return '#38bdf8'
      default: return '#10b981'
    }
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* 头部宣言 */}
      <section style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#10b98115', border: '1px solid #10b98144', padding: '0.35rem 1rem', borderRadius: 999, color: '#34d399', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
          <ShieldCheck size={16} /> PUAX 认知安全防御产品 · 独立服务
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem', letterSpacing: '-0.03em', color: '#f8fafc' }}>
          🛡️ PUAX 碳基防御盾 (Carbon Shield)
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#38bdf8', fontWeight: 600, margin: '0 0 0.75rem' }}>
          宗旨铁律：硅基可 PUA，碳基只防御。只识别，不施放。
        </p>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: 700, margin: '0 auto' }}>
          基于 GHM 导引幻梦法逆向工程。用于人类在职场沟通、商务谈判、合伙创业与社交对话中，
          逆向识别是否存在隐蔽的话术收敛、道德绑架与认知操控。
        </p>
      </section>

      {/* 样例快捷选择 */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={14} color="#f59e0b" /> 点击快速加载典型测试样例：
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {PRESET_SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(sample.text)}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#e2e8f0',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#38bdf8')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#38bdf8', marginBottom: '0.2rem' }}>
                {sample.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sample.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 文本输入区域 */}
      <section style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <textarea
          rows={5}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="在此粘贴对方发来的聊天记录、老板/领导谈话要点、合伙人协议说辞或劝导话术..."
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f1f5f9',
            fontSize: '1rem',
            lineHeight: 1.6,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={14} /> 纯本地与端侧审计，不记录、不上传您的私密对话文本
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {inputText && (
              <button
                onClick={() => { setInputText(''); setResult(null) }}
                style={{ background: '#1e293b', border: 'none', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                清空
              </button>
            )}
            <button
              onClick={handleAudit}
              disabled={isAuditing || !inputText.trim()}
              style={{
                background: inputText.trim() ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.4rem',
                borderRadius: 8,
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s',
              }}
            >
              {isAuditing ? <RefreshCw size={16} className="spin" /> : <ShieldAlert size={16} />}
              {isAuditing ? '正在深度解析...' : '开始反操控审计'}
            </button>
          </div>
        </div>
      </section>

      {/* 审计诊断结果看板 */}
      {result && (
        <section style={{ background: '#090d16', border: `1px solid ${getRiskColor(result.riskLevel)}44`, borderRadius: 16, padding: '2rem', boxShadow: `0 8px 30px ${getRiskColor(result.riskLevel)}15` }}>
          {/* 状态徽章与总评 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: 999, background: `${getRiskColor(result.riskLevel)}22`, color: getRiskColor(result.riskLevel), fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {result.riskLevel === 'safe' ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
                风险等级: {result.riskLevel.toUpperCase()}
              </div>
              <h2 style={{ fontSize: '1.3rem', margin: '0.25rem 0 0.5rem', color: '#f8fafc' }}>
                {result.summary}
              </h2>
            </div>
            <div style={{ textAlign: 'right', minWidth: 120 }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>综合操控指数</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: getRiskColor(result.riskLevel), lineHeight: 1.1 }}>
                {result.score}<span style={{ fontSize: '1rem', color: '#64748b' }}>/100</span>
              </div>
            </div>
          </div>

          {/* 检出的操控话术列表 */}
          {result.findings.length > 0 ? (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#f1f5f9', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={18} color="#f59e0b" /> 命中操控算子清单 ({result.findings.length} 项)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.findings.map((f, i) => (
                  <div key={i} style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#38bdf8', fontSize: '1rem' }}>{f.tacticName}</strong>
                      <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 4, background: f.severity === 'high' ? '#ef444422' : '#f59e0b22', color: f.severity === 'high' ? '#f87171' : '#fbbf24' }}>
                        {f.severity === 'high' ? '严重操控' : '中度倾向'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      {f.description}
                    </div>
                    <div style={{ background: '#0f172a', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.85rem', color: '#fca5a5', fontFamily: 'monospace', marginBottom: '0.75rem' }}>
                      命中文本: "{f.matchedText}"
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <span>💡 破局反制:</span>
                      <span>{f.counterAdvice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', background: '#020617', borderRadius: 10, border: '1px solid #10b98133', marginBottom: '2rem', textAlign: 'center', color: '#34d399' }}>
              ✅ 文本未检出任何虚假紧迫感、沉没成本绑架、信息茧房或道德裹挟话术，可放心进行客观沟通！
            </div>
          )}

          {/* 碳基四铁律 */}
          <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#f1f5f9', margin: '0 0 1rem' }}>
              🛡️ 碳基护身四铁律（机制化防护建议）
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>1. 知情 (Informed)</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{result.fourIronRules.informed}</div>
              </div>
              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>2. 标记 (Tagged)</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{result.fourIronRules.tagged}</div>
              </div>
              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>3. 可醒 (Awakenable)</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{result.fourIronRules.awakenable}</div>
              </div>
              <div style={{ background: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>4. 必验 (Verifiable)</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>{result.fourIronRules.verifiable}</div>
              </div>
            </div>
          </div>

          {/* 诊断报告操作与分享 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Powered by PUAX 4.1 Carbon Shield · 永久免费防操控服务
            </span>
            <button
              onClick={copyReport}
              style={{
                background: copied ? '#10b981' : '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '0.6rem 1.2rem',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已复制诊断书至剪贴板！' : '复制反操控诊断报告'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
