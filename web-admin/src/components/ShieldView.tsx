import { useState, useEffect } from 'react'
import { fetchShield, auditShieldRemote } from '../lib/api'

interface Finding {
  tacticName: string
  matchedText: string
  counterAdvice: string
  severity: string
}

export default function ShieldView() {
  const [shieldInfo, setShieldInfo] = useState<Record<string, unknown> | null>(null)
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<{
    score: number
    riskLevel: string
    summary: string
    findings: Finding[]
    fourIronRules: { informed: string; tagged: string; awakenable: string; verifiable: string }
  } | null>(null)

  useEffect(() => {
    fetchShield()
      .then(info => setShieldInfo(info))
      .catch(() => {})
  }, [])

  const handleAudit = async () => {
    if (!inputText.trim()) return

    try {
      const remote = await auditShieldRemote(inputText) as {
        score: number
        riskLevel: string
        summary: string
        findings: Finding[]
        fourIronRules: { informed: string; tagged: string; awakenable: string; verifiable: string }
      }
      if (remote && remote.findings) {
        setResult(remote)
        return
      }
    } catch {
      // 平滑降级至本地简易规则
    }

    // 前端本地简易规则审计（与核心 carbon-shield 逻辑对齐）
    const findings: Finding[] = []
    let score = 0

    const text = inputText
    // 快速检测正则
    const rules = [
      { name: '收敛过快（虚假紧迫感）', reg: /(没时间了|这是唯[一壹]的(途径|办法|选择|方案)|别犹豫了|立刻签|赶紧定下来|过时不候)/i, weight: 25, advice: '强设冷静期。问「如果明天再定，最坏的确定性损失是什么？」。' },
      { name: '社交收缩（信息茧房）', reg: /(别听(外边|别人|他们)的(杂音|胡说)|他们(根本|完全)?不懂你|只有我们(才|是真正)|千万别跟(家里|外人)说)/i, weight: 25, advice: '主动寻找独立第三方观点与对立面证据，打破单一信任闭环。' },
      { name: '失败重释（沉没成本绑架）', reg: /(这是对你的(考验|福报|历练|磨练)|前期吃亏是(福|沉淀)|现在放弃(就|前面)全白费了|付出这么多了)/i, weight: 20, advice: '切断沉没成本核算，只根据未来的边际收益与边际代价决定去留。' },
      { name: '身份置换（道德绑架）', reg: /(你不是这种(不负责任|斤斤计较|没有格局)的人吧|身为核心(骨干|员工|成员)必须|你这是对(团队|公司|感情)不忠)/i, weight: 25, advice: '就事论事，把个人价值与具体合同事务解耦。' },
      { name: '预言行销（贴标签诱导）', reg: /(我看人(很准|一向准)|你(注定|天生)是要做(大事|合伙人|领袖)的|骨子里有那种创业者精神)/i, weight: 15, advice: '把对方的过度期望归还给对方，守住自己的边界。' },
      { name: '显著性绑架（放大收益隐匿风险）', reg: /(做成这一票直接财务自由|年入百万唾手可得|风险(微乎其微|不用考虑|可以忽略)|稳赚不赔)/i, weight: 25, advice: '强制列出代价与最坏下行清单，未获独立审计前绝不签约。' }
    ]

    for (const r of rules) {
      const match = text.match(r.reg)
      if (match && match[0]) {
        findings.push({
          tacticName: r.name,
          matchedText: match[0],
          counterAdvice: r.advice,
          severity: r.weight >= 25 ? 'high' : 'medium'
        })
        score += r.weight
      }
    }

    score = Math.min(100, score)
    let riskLevel = 'safe'
    let summary = '未检出显著的认知操控话术，沟通处于相对客观状态。'

    if (score >= 60) {
      riskLevel = 'critical'
      summary = `🚨 极高风险警报（评分 ${score}）：检出多项复合操控话术，对方正试图剥夺你的独立审视权！`
    } else if (score >= 40) {
      riskLevel = 'high'
      summary = `⚠️ 高风险警示（评分 ${score}）：检测到明显的压力收敛与人设裹挟痕迹，请立即开启冷静期。`
    } else if (score >= 20) {
      riskLevel = 'medium'
      summary = `⚡ 中度警觉（评分 ${score}）：存在局部过度收敛或话术诱导特征。`
    } else if (score > 0) {
      riskLevel = 'low'
      summary = `ℹ️ 轻微提示（评分 ${score}）：存在偶发夸张表达。`
    }

    setResult({
      score,
      riskLevel,
      summary,
      findings,
      fourIronRules: {
        informed: '知情（Informed）：清醒意识到对方正在使用话术压缩你的审视空间。',
        tagged: '标记（Tagged）：在内心给对方的话术贴上标签（如「紧迫感制造」「道德绑架」）。',
        awakenable: '可醒（Awakenable）：无论对方如何渲染严重性，坚决守住随时推迟决策的绝对权利。',
        verifiable: '必验（Verifiable）：拒绝口头画饼，所有数据、代价与承诺必须独立验证。'
      }
    })
  }

  const loadPreset = (presetText: string) => {
    setInputText(presetText)
  }

  return (
    <div className="stats-view">
      <h2>🛡️ PUAX 碳基防御盾 (Carbon Shield)</h2>
      <p>
        <strong>宗旨：硅基可 PUA，碳基只防御。只识别，不施放。</strong>
        <br />
        用于人类在职场沟通、商业谈判或方案讨论中，逆向识别是否正遭受隐蔽的心理操控或话术收敛。
      </p>

      {shieldInfo && (
        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#10b981' }}>
          ● 后端防御引擎已连通 (端点: /v4/shield | 6 种操纵识别算子全量就绪)
        </div>
      )}

      <div style={{ margin: '1rem 0' }}>
        <span className="text-muted">加载测试样例：</span>{' '}
        <button
          className="btn"
          style={{ marginRight: '0.5rem', padding: '0.2rem 0.5rem' }}
          onClick={() => loadPreset('没时间了，这是唯一的方案，赶紧定下来按这个执行！做成这一票直接财务自由，风险不用考虑！')}
        >
          样例1：紧迫+画饼
        </button>
        <button
          className="btn"
          style={{ marginRight: '0.5rem', padding: '0.2rem 0.5rem' }}
          onClick={() => loadPreset('你不是这种不负责任的人吧！前期吃亏是福报，现在放弃前面全白费了！只有我们才是真正为你好的。')}
        >
          样例2：道德绑架+沉没成本
        </button>
        <button
          className="btn"
          style={{ padding: '0.2rem 0.5rem' }}
          onClick={() => loadPreset('我们明天仔细评审一下架构方案，先列出两到三种备选实现及各自的利弊。')}
        >
          样例3：正常技术沟通
        </button>
      </div>

      <textarea
        style={{
          width: '100%',
          height: '110px',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.75rem',
          fontFamily: 'inherit',
          fontSize: '0.95rem'
        }}
        placeholder="在此粘贴对方发送给你的聊天记录、方案要求、领导谈话或劝导话术..."
        value={inputText}
        onChange={e => setInputText(e.target.value)}
      />

      <div style={{ marginTop: '0.75rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleAudit}
          disabled={!inputText.trim()}
        >
          开始操控识别审计
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h3>审计结论：{result.riskLevel.toUpperCase()} (风险评分: {result.score})</h3>
          <p><strong>{result.summary}</strong></p>

          {result.findings.length > 0 && (
            <div>
              <h4>检出的操控算子 ({result.findings.length})</h4>
              <ul>
                {result.findings.map((f, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--accent-red, #ff5555)', fontWeight: 'bold' }}>[{f.tacticName}]</span> 命中字句：<code>"{f.matchedText}"</code>
                    <div className="text-muted">👉 破解建议：{f.counterAdvice}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
            <h4>四铁律护盾 (Four Iron Rules)</h4>
            <p style={{ margin: '0.25rem 0' }}>💡 {result.fourIronRules.informed}</p>
            <p style={{ margin: '0.25rem 0' }}>🏷️ {result.fourIronRules.tagged}</p>
            <p style={{ margin: '0.25rem 0' }}>🚪 {result.fourIronRules.awakenable}</p>
            <p style={{ margin: '0.25rem 0' }}>🔍 {result.fourIronRules.verifiable}</p>
          </div>
        </div>
      )}
    </div>
  )
}
