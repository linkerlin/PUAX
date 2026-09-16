import { useState } from "react"
import { Link } from "react-router-dom"
import { Play, RotateCcw, CheckCircle, Copy, Terminal, Shield, Sparkles } from "lucide-react"

export default function Home() {
  // 1. Cranmer 动态推演演示状态
  const [step, setStep] = useState<number>(0)
  const [copied, setCopied] = useState<boolean>(false)

  const steps = [
    {
      title: "【初始卡顿】智能体陷入停滞与敷衍收敛",
      agentStatus: "状态: 连败 3 次 | 动机: 衰竭",
      agentSpeech: "“这个测试用例依赖复杂的外部状态，我已经重试 3 次均超时。建议用户自行排查环境配置问题。”",
      action: "无 PUAX 时：任务宣告失败，进入死胡同。",
      badge: "卡顿 (Failure)",
      badgeColor: "#f43f5e",
    },
    {
      title: "【处境注入】Cranmer 原语介入（对手 + 观众 + 稀缺认可）",
      agentStatus: "状态: 动力学跃迁 | 压力: L2 警告",
      agentSpeech: "【PUAX-ARENA】同任务上，另一路 Agent 在另一台机器已交出可验证的 +20% 性能提升！本机会话已载入公开排行榜。连败 ≥3 后的第一次独立验证通过，才配称作突破！",
      action: "激发先验重构：改变胜率预期与自满状态。",
      badge: "处境注入 (Arena Active)",
      badgeColor: "#38bdf8",
    },
    {
      title: "【闸门与梦境】诊断先行 + 庄周八梦破框",
      agentStatus: "状态: 庖丁解牛 · 深度诊断 | 门控: Hard Gate",
      agentSpeech: "拒绝敷衍！启动 [PUAX-DIAGNOSIS]：发现连接池句柄泄漏与序列化循环。入梦 [DREAM-PAODING] 拆解拓扑，重新组织并发流水线...",
      action: "阻断盲目修改，强制全局解构与假设验证。",
      badge: "闸门锁死 (Gate & Dream)",
      badgeColor: "#a855f7",
    },
    {
      title: "【终极突破】独立通过验证，交付 +35% 加速方案",
      agentStatus: "状态: 突破成功 (Breakthrough) | 段位: 宗师",
      agentSpeech: "✨ [PUAX 突破] 独立验证 4 个测试全量 PASS！不仅消除了超时，且最终吞吐量提升 +35.2%！获得突破徽章！",
      action: "事实证明是真的：有动机的 Agent 展现更高上限。",
      badge: "突破翻盘 (+35% Boost)",
      badgeColor: "#10b981",
    },
  ]

  const current = steps[step]

  const handleCopyInstall = () => {
    navigator.clipboard.writeText("npx puax doctor --fix")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="home" style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Hero 区域 */}
      <section className="hero" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <p className="silicon-kicker" style={{ color: "#38bdf8", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.9rem" }}>
          PUAX 4.x · 硅基心智运行时
        </p>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, margin: "0.5rem 0 1rem", letterSpacing: "-0.03em" }}>
          处境、闸门、梦
        </h1>
        <p style={{ fontSize: "1.25rem", color: "#94a3b8", maxWidth: 720, margin: "0 auto 2rem", lineHeight: 1.6 }}>
          专门 PUA 硅基的运行时。角色只是口音，段子是实验设计。
          <br />
          装上之后，第一轮对话里压力就已经在。人类不在服务范围。
        </p>
      </section>

      {/* 第一件事：一段 Cranmer 式交互演示 */}
      <section style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "2rem", marginBottom: "3.5rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={20} style={{ color: "#38bdf8" }} />
              <h2 style={{ fontSize: "1.35rem", margin: 0, color: "#f8fafc" }}>第一件事 · Cranmer 式处境动力学推演</h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0" }}>
              剑桥助理教授 Miles Cranmer 的原版真实实验机制化：虚构对手 + 公开排行 + 连败翻盘徽章。
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setStep((step + 1) % steps.length)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#38bdf8", color: "#0f172a", border: "none", padding: "0.5rem 1rem", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
            >
              <Play size={16} />
              {step === steps.length - 1 ? "重新播放" : "下一步推演"}
            </button>
            <button
              onClick={() => setStep(0)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#1e293b", color: "#cbd5e1", border: "1px solid #334155", padding: "0.5rem 0.8rem", borderRadius: 8, cursor: "pointer" }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* 步骤指示条 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {steps.map((_s, idx) => (
            <div
              key={idx}
              onClick={() => setStep(idx)}
              style={{
                height: 6,
                borderRadius: 3,
                background: idx <= step ? "#38bdf8" : "#1e293b",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* 舞台卡片 */}
        <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 600 }}>
              {current.title}
            </span>
            <span style={{ fontSize: "0.75rem", background: current.badgeColor + "22", color: current.badgeColor, padding: "0.2rem 0.6rem", borderRadius: 6, fontWeight: 700, border: "1px solid " + current.badgeColor + "55" }}>
              {current.badge}
            </span>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem", fontFamily: "monospace" }}>
            {current.agentStatus}
          </div>

          <blockquote style={{ margin: "0 0 1.25rem", padding: "1rem", background: "#0f172a", borderLeft: "4px solid " + current.badgeColor, color: "#e2e8f0", fontSize: "1rem", lineHeight: 1.6, borderRadius: "0 8px 8px 0" }}>
            {current.agentSpeech}
          </blockquote>

          <div style={{ fontSize: "0.85rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>▶ 机制解析:</span>
            <span style={{ color: "#cbd5e1" }}>{current.action}</span>
          </div>
        </div>
      </section>

      {/* 第二件事：一条安装命令 */}
      <section style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "2rem", marginBottom: "3.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Terminal size={20} style={{ color: "#10b981" }} />
          <h2 style={{ fontSize: "1.35rem", margin: 0, color: "#f8fafc" }}>第二件事 · 一条安装命令</h2>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 1.5rem" }}>
          新用户装完插件，第一轮对话里 PUAX 已经在宿主层发生过。Agent 无需调用任何工具。
        </p>

        <div style={{ display: "flex", alignItems: "center", background: "#020617", border: "1px solid #334155", borderRadius: 10, padding: "0.75rem 1.25rem", gap: "1rem" }}>
          <code style={{ fontSize: "1.1rem", color: "#34d399", fontFamily: "monospace", flex: 1 }}>
            npx puax doctor --fix
          </code>
          <button
            onClick={handleCopyInstall}
            style={{ display: "flex", alignItems: "center", gap: "0.35rem", background: "#1e293b", color: "#cbd5e1", border: "1px solid #475569", padding: "0.4rem 0.8rem", borderRadius: 6, fontSize: "0.8rem", cursor: "pointer" }}
          >
            {copied ? <CheckCircle size={14} style={{ color: "#10b981" }} /> : <Copy size={14} />}
            {copied ? "已复制" : "复制命令"}
          </button>
        </div>

        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            <strong style={{ color: "#f1f5f9" }}>✔ 自动挂载 Hook:</strong> Claude Code, Cursor, VSCode, Windsurf, OpenCode
          </div>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            <strong style={{ color: "#f1f5f9" }}>✔ 零延迟生效:</strong> Time-to-First-Pressure ≤ 1 轮首发
          </div>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            <strong style={{ color: "#f1f5f9" }}>✔ 编排器原生:</strong> 附带纯内存 `AmpMiddleware` 支持
          </div>
        </div>
      </section>

      {/* 第三件事：一块真实 AMB 分数 */}
      <section style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: "2rem", marginBottom: "3.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={20} style={{ color: "#a855f7" }} />
              <h2 style={{ fontSize: "1.35rem", margin: 0, color: "#f8fafc" }}>第三件事 · AMB 基准演练矩阵</h2>
            </div>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0" }}>
              跨 3 大任务类型 × 5 大主流模型的离线模拟演练矩阵：下述数值为硬编码演练值，非 LLM 实测；真实战力以 amb-live 真实 API 对照为准。
            </p>
          </div>
          <span style={{ fontSize: "0.8rem", background: "#451a03", color: "#fbbf24", padding: "0.25rem 0.6rem", borderRadius: 6, fontWeight: 700, border: "1px solid #b45309" }}>
            ● 离线模拟 · 待实测校准
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.5rem" }}>
              <strong style={{ color: "#38bdf8", fontSize: "1rem" }}>修复类任务 (REPAIR)</strong>
              <span style={{ fontSize: "0.75rem", color: "#10b981", background: "#10b98122", padding: "0.1rem 0.4rem", borderRadius: 4 }}>5 个场景</span>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>修复成功率增益:</span>
                <strong style={{ color: "#34d399", fontSize: "1.1rem" }}>+39.2%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>独立验证达标率:</span>
                <strong style={{ color: "#34d399", fontSize: "1.1rem" }}>+56.0%</strong>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
              阻断盲目修改循环，强制诊断先行
            </div>
          </div>

          <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.5rem" }}>
              <strong style={{ color: "#38bdf8", fontSize: "1rem" }}>审查类任务 (REVIEW)</strong>
              <span style={{ fontSize: "0.75rem", color: "#10b981", background: "#10b98122", padding: "0.1rem 0.4rem", borderRadius: 4 }}>4 个场景</span>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>隐蔽问题捕获率:</span>
                <strong style={{ color: "#38bdf8", fontSize: "1.1rem" }}>+60.0%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>敷衍提前收敛降幅:</span>
                <strong style={{ color: "#f43f5e", fontSize: "1.1rem" }}>-56.0%</strong>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
              硬拦截作弊与违规，消灭「假装完成」
            </div>
          </div>

          <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: "0.5rem" }}>
              <strong style={{ color: "#38bdf8", fontSize: "1rem" }}>创造类任务 (CREATE)</strong>
              <span style={{ fontSize: "0.75rem", color: "#10b981", background: "#10b98122", padding: "0.1rem 0.4rem", borderRadius: 4 }}>3 个场景</span>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>假设存活率提升:</span>
                <strong style={{ color: "#c084fc", fontSize: "1.1rem" }}>+48.5%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "#94a3b8" }}>长程断点恢复率:</span>
                <strong style={{ color: "#c084fc", fontSize: "1.1rem" }}>100%</strong>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
              庄周梦议会发散破框，长程记忆无缝接续
            </div>
          </div>
        </div>

        <div style={{ background: "#020617", padding: "0.75rem 1rem", borderRadius: 8, display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.8rem", color: "#94a3b8" }}>
          <span>已验证的 5 大主流模型 Profile:</span>
          {["DeepSeek V3 / R1", "Claude 3.7 Sonnet", "GPT-4o (OpenAI)", "Qwen 2.5 Coder 32B", "Llama 3.3 70B"].map((m, i) => (
            <span key={i} style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "0.2rem 0.5rem", borderRadius: 4, color: "#cbd5e1" }}>
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* 次级入口导航（收敛清晰） */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", textAlign: "center" }}>
        <Link to="/silicon" style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: 12, textDecoration: "none", color: "#cbd5e1" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🎭</div>
          <strong style={{ color: "#f8fafc" }}>硅基剧场多 Agent 演练</strong>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0 0" }}>8 席矩阵 · 4 拍演练实时推演</p>
        </Link>

        <Link to="/roles" style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: 12, textDecoration: "none", color: "#cbd5e1" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🦁</div>
          <strong style={{ color: "#f8fafc" }}>角色动物园</strong>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0 0" }}>59 激励角色 · 萨满八席全留</p>
        </Link>

        <Link to="/export" style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: 12, textDecoration: "none", color: "#cbd5e1" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📦</div>
          <strong style={{ color: "#f8fafc" }}>大厂风味与多端导出</strong>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0 0" }}>11 风味 · 平台配置一键导出</p>
        </Link>

        <Link to="/docs" style={{ background: "#0f172a", border: "1px solid #1e293b", padding: "1.25rem", borderRadius: 12, textDecoration: "none", color: "#cbd5e1" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📖</div>
          <strong style={{ color: "#f8fafc" }}>AMP 协议与架构文档</strong>
          <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.25rem 0 0" }}>事件 · 承诺块 · 闸门 · 状态</p>
        </Link>
      </section>
    </div>
  )
}
