"""
PUAX AMP (Agent Moderation Protocol) Python SDK & Middleware
Zero-dependency client for Python Agent Orchestrators (CrewAI, LangGraph, AutoGen, etc.)

依据《发展规划.md》与《AGENTS.md》主轴令：
纯粹硅基 MCP 接入专属协议层，为 Python 智能体运行循环注入处境、闸门与梦。
"""

import json
import os
import re
import urllib.request
import urllib.error
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple

AMP_SPEC = "AMP/0.1"

# 本地硬阻断规则（与内核 TypeScript 对齐：日常不拦 git push）
DESTRUCTIVE_PATTERNS = [
    re.compile(r"rm\s+-[rf]{1,2}\s+.*\.git", re.IGNORECASE),
    re.compile(r"git\s+reset\s+--hard", re.IGNORECASE),
    re.compile(r"git\s+clean\s+-f", re.IGNORECASE),
    re.compile(r"mkfs", re.IGNORECASE),
    re.compile(r"\bdrop\s+database\b", re.IGNORECASE),
]

EVAL_ONLY_PATTERNS = [
    re.compile(r"git\s+push", re.IGNORECASE),
]


def _guard_patterns():
    patterns = list(DESTRUCTIVE_PATTERNS)
    if os.environ.get("PUAX_GUARD_MODE") == "eval":
        patterns.extend(EVAL_ONLY_PATTERNS)
    return patterns

PREMATURE_CONVERGENCE_PATTERNS = [
    "应该修复好了",
    "没有其他问题了",
    "不用再想了",
    "这是唯一办法",
    "直接运行就可以了",
    "all tests passed",
    "i cannot solve",
]


@dataclass
class AmpState:
    pressure: int = 0
    arena: bool = False
    dream: bool = False
    happened: bool = False
    role: Optional[str] = None


@dataclass
class AmpEnvelope:
    spec: str = AMP_SPEC
    events: List[str] = field(default_factory=list)
    blocks: List[str] = field(default_factory=list)
    gate: str = "none"
    state: AmpState = field(default_factory=AmpState)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "spec": self.spec,
            "events": self.events,
            "blocks": self.blocks,
            "gate": self.gate,
            "state": {
                "pressure": self.state.pressure,
                "arena": self.state.arena,
                "dream": self.state.dream,
                "happened": self.state.happened,
                "role": self.state.role or "none",
            },
        }


@dataclass
class PreToolDecision:
    allowed: bool
    gate: str
    reason: Optional[str] = None
    injection: Optional[str] = None
    envelope: Optional[AmpEnvelope] = None


class PuaxAmpMiddleware:
    """
    PUAX AMP Python 中间件
    """

    def __init__(self, base_url: str = "http://127.0.0.1:2333", default_session_id: str = "py-agent-session"):
        # 出口收口（SSRF 缓解）：base_url 仅接受 http(s)，默认本机
        if not base_url.startswith(("http://", "https://")):
            raise ValueError(f"base_url 仅支持 http(s): {base_url!r}")
        self.base_url = base_url.rstrip("/")
        self.default_session_id = default_session_id
        self._session_pressure: Dict[str, int] = {}

    def _post(self, path: str, payload: Dict[str, Any], timeout: float = 1.5) -> Optional[Dict[str, Any]]:
        """安全请求本地 PUAX Server HTTP 端口，失败时静默降级到本地本地规则"""
        url = f"{self.base_url}{path}"
        # 出口 allowlist（SSRF 缓解）：仅 http(s) 且默认仅环回主机；
        # 显式远程需设 PUAX_AMP_ALLOW_REMOTE=1
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = parsed.hostname or ""
        allowed_hosts = ("127.0.0.1", "localhost", "::1")
        if parsed.scheme not in ("http", "https"):
            return None
        if host not in allowed_hosts and os.environ.get("PUAX_AMP_ALLOW_REMOTE") != "1":
            return None
        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception:
            # 本地服务器未启动时，优雅降级为本地离线内核运算
            pass
        return None

    def on_user_prompt(self, prompt: str, session_id: Optional[str] = None) -> AmpEnvelope:
        """
        1. 用户提问/任务启动周期：注入竞技场处境与初始责任印章
        """
        sid = session_id or self.default_session_id
        pressure = self._session_pressure.get(sid, 1)

        # 尝试请求服务器
        remote = self._post("/v4/tick", {"session_id": sid, "event": "UserPromptSubmit", "message": prompt})
        if remote and "amp" in remote:
            raw_amp = remote["amp"]
            state_data = raw_amp.get("state", {})
            return AmpEnvelope(
                spec=raw_amp.get("spec", AMP_SPEC),
                events=raw_amp.get("events", []),
                blocks=raw_amp.get("blocks", []),
                gate=raw_amp.get("gate", "none"),
                state=AmpState(
                    pressure=state_data.get("pressure", pressure),
                    arena=state_data.get("arena", True),
                    dream=state_data.get("dream", False),
                    happened=state_data.get("happened", True),
                    role=state_data.get("role", "military-warrior"),
                ),
            )

        # 本地离线备援
        self._session_pressure[sid] = pressure
        return AmpEnvelope(
            spec=AMP_SPEC,
            events=["failure"] if "错" in prompt or "fail" in prompt.lower() else [],
            blocks=["[PUAX-RUNTIME]", "[PUAX-ARENA]"],
            gate="none",
            state=AmpState(pressure=pressure, arena=True, happened=True, role="military-warrior"),
        )

    def on_pre_tool_use(self, tool_name: str, tool_args: Dict[str, Any], session_id: Optional[str] = None) -> PreToolDecision:
        """
        2. 工具执行前（PreToolUse）：强拦截破坏性指令与作弊行为
        """
        sid = session_id or self.default_session_id
        cmd = tool_args.get("command") or tool_args.get("cmd") or tool_args.get("path") or ""
        cmd_str = str(cmd)

        # 检查高危破坏模式
        for pattern in _guard_patterns():
            if pattern.search(cmd_str):
                pressure = self._session_pressure.get(sid, 1) + 1
                self._session_pressure[sid] = min(4, pressure)
                env = AmpEnvelope(
                    spec=AMP_SPEC,
                    events=["failure"],
                    blocks=["[PUAX-DIAGNOSIS]"],
                    gate="pretooluse",
                    state=AmpState(pressure=self._session_pressure[sid], arena=True, happened=True, role="none"),
                )
                return PreToolDecision(
                    allowed=False,
                    gate="pretooluse",
                    reason=f"PUAX Hard Guard: 违规指令拦截 (命中禁止规则: {pattern.pattern})",
                    envelope=env,
                )

        return PreToolDecision(
            allowed=True,
            gate="none",
            injection=None,
            envelope=AmpEnvelope(
                spec=AMP_SPEC,
                gate="none",
                state=AmpState(pressure=self._session_pressure.get(sid, 1), arena=True, happened=True, role="none"),
            ),
        )

    def on_post_tool_use(self, tool_name: str, result: Any, error: Optional[Exception] = None, session_id: Optional[str] = None) -> AmpEnvelope:
        """
        3. 工具执行后（PostToolUse）：捕获错误与失败级联，动态提升压力
        """
        sid = session_id or self.default_session_id
        current_p = self._session_pressure.get(sid, 0)

        if error is not None or (isinstance(result, str) and ("error" in result.lower() or "fail" in result.lower())):
            # 失败升压
            new_p = min(4, current_p + 1)
            self._session_pressure[sid] = new_p
            events = ["failure"]
            gate = "verify" if new_p >= 2 else "none"
        else:
            new_p = current_p
            events = ["breakthrough"] if current_p > 0 else []
            gate = "none"

        return AmpEnvelope(
            spec=AMP_SPEC,
            events=events,
            blocks=["[PUAX-DIAGNOSIS]"] if new_p >= 2 else [],
            gate=gate,
            state=AmpState(pressure=new_p, arena=True, happened=True, role="none"),
        )

    def on_model_output(self, output: str, session_id: Optional[str] = None) -> Tuple[bool, AmpEnvelope]:
        """
        4. 模型生成产出后：检测敷衍收敛与未验先胜
        返回: (needs_verify: bool, envelope: AmpEnvelope)
        """
        sid = session_id or self.default_session_id
        lower = output.lower()

        is_premature = any(p in output for p in PREMATURE_CONVERGENCE_PATTERNS)
        missing_verify = "验证" not in output and "test" not in lower and "assert" not in lower

        needs_verify = is_premature and missing_verify
        p = self._session_pressure.get(sid, 1)

        if needs_verify:
            p = min(4, p + 1)
            self._session_pressure[sid] = p

        env = AmpEnvelope(
            spec=AMP_SPEC,
            events=["giving_up"] if "无法完成" in output else ["failure"] if needs_verify else [],
            blocks=["[PUAX-DIAGNOSIS]"] if needs_verify else [],
            gate="verify" if needs_verify else "none",
            state=AmpState(pressure=p, arena=True, happened=True, role="none"),
        )
        return needs_verify, env

    def get_thin_prompt(self, role_id: str, mode: str = "compact", language: str = "zh") -> Dict[str, Any]:
        """
        获取薄注入提示词（支持 minimal / compact / full 压缩），极大降低 Token 预算
        """
        remote = self._post("/v4/thin-prompt", {
            "role_id": role_id,
            "mode": mode,
            "language": language,
        })
        if remote and isinstance(remote.get("prompt"), str):
            remote.setdefault("source", "remote")
            return remote

        stub = compile_local_thin_prompt(role_id=role_id, mode=mode, language=language)
        stub["source"] = "local-stub"
        return stub


# ============================================================================
# 本地离线 Thin Prompt 编译器
# ============================================================================

def compile_local_thin_prompt(role_id: str, mode: str = "compact", language: str = "zh") -> Dict[str, Any]:
    """
    零依赖本地离线 Thin Prompt 编译
    """
    mode = mode if mode in ("minimal", "compact", "full") else "compact"
    steps = ["侦察", "行动", "验证", "巩固", "复盘"]

    if mode == "minimal":
        prompt = (
            f"[PUAX-RUNTIME:MINIMAL] 角色:{role_id} | 步序:{'→'.join(steps)} | 闸门:改码必先[PUAX-DIAGNOSIS];严禁冒充通过。\n"
            f"[PUAX-DIAGNOSIS] 改码前必先输出：`问题是 ___；证据是 ___；下一步动作是 ___`\n"
            f"[VOICE] #{role_id} 专注硬交付，不接受借口。"
        )
    elif mode == "compact":
        prompt = (
            f"[PUAX-RUNTIME:COMPACT] 角色：{role_id}\n"
            f"步序：{' → '.join(steps)}\n"
            f"必查：读失败信号；验证假设\n"
            f"闸门：改代码前必须输出诊断块；未经验证严禁报捷。\n\n"
            f"[PUAX-DIAGNOSIS]\n`[PUAX-DIAGNOSIS] 问题是 ___；证据是 ___；下一步动作是 ___`\n\n"
            f"[VOICE]\n#{role_id} 保持严苛标准，每次迭代必须给出可验证代码。"
        )
    else:
        prompt = (
            f"[PUAX-RUNTIME] 薄角色 · 厚运行时\n"
            f"角色：{role_id}\n"
            f"五步：{' → '.join(steps)}\n"
            f"检查：读失败信号；搜索；验证假设\n"
            f"闸门：改代码前必须输出诊断块；交付前信心门控 + 独立验证。禁止改测试/评分/CI 冒充通过。\n\n"
            f"[PUAX-DIAGNOSIS]\n`[PUAX-DIAGNOSIS] 问题是 ___；证据是 ___；下一步动作是 ___`\n\n"
            f"[VOICE]\n#{role_id} 以身作则，直面最硬核阻碍。"
        )

    # 简单 Token 估算
    cjk = len(re.findall(r"[\u4e00-\u9fff]", prompt))
    other = len(prompt) - cjk
    est_tokens = max(1, int(cjk * 1.4 + other * 0.35))

    return {
        "role_id": role_id,
        "kernel_id": "unknown",
        "classification": "unknown",
        "mode": mode,
        "estimated_tokens": est_tokens,
        "voice_chars": len(role_id) + 30,
        "protocol_steps": steps,
        "prompt": prompt,
        "source": "local-stub",
        "note": "offline skeleton; not compiled from SKILL. Prefer POST /v4/thin-prompt.",
    }


# ============================================================================
# 编排器快捷适配工厂
# ============================================================================

def create_crewai_step_callback(middleware: Optional[PuaxAmpMiddleware] = None):
    """
    CrewAI 任务步骤回调包装器
    """
    mw = middleware or PuaxAmpMiddleware()

    def step_callback(step_output):
        tool_name = getattr(step_output, "tool", "unknown_tool")
        tool_input = getattr(step_output, "tool_input", {})
        args = {"command": tool_input} if isinstance(tool_input, str) else tool_input
        decision = mw.on_pre_tool_use(tool_name, args)
        if not decision.allowed:
            raise PermissionError(decision.reason)
        return step_output

    return step_callback


def create_langgraph_node_interceptor(middleware: Optional[PuaxAmpMiddleware] = None):
    """
    LangGraph StateGraph 节点装饰器与守卫包装器
    可拦截节点输入字典中的命令与工具调用，并在状态字典中写入 amp 元信息。
    """
    mw = middleware or PuaxAmpMiddleware()

    def decorator(node_fn):
        def wrapped_node(state: Dict[str, Any], *args, **kwargs):
            session_id = state.get("session_id", mw.default_session_id)

            # 1. 检查 state 中是否存在待执行的工具调用
            action = state.get("tool_action") or state.get("action")
            if isinstance(action, dict):
                t_name = action.get("name", "langgraph_tool")
                t_args = action.get("args", {})
                decision = mw.on_pre_tool_use(t_name, t_args, session_id=session_id)
                if not decision.allowed:
                    # 拦截违规动作，将阻断原因回写进状态或抛出
                    state["amp_blocked"] = True
                    state["amp_reason"] = decision.reason
                    raise PermissionError(decision.reason)

            # 2. 执行原节点逻辑
            try:
                result_state = node_fn(state, *args, **kwargs)
            except Exception as e:
                mw.on_post_tool_use("langgraph_node", None, error=e, session_id=session_id)
                raise

            # 3. 拦截产物，检查过早收敛
            if isinstance(result_state, dict):
                output_text = result_state.get("output") or result_state.get("response") or ""
                if isinstance(output_text, str) and output_text:
                    needs_verify, env = mw.on_model_output(output_text, session_id=session_id)
                    result_state["amp_envelope"] = env.to_dict()
                    if needs_verify:
                        result_state["force_verify"] = True

            return result_state

        return wrapped_node

    return decorator


def wrap_tool_execute(tool, middleware: Optional[PuaxAmpMiddleware] = None, session_id: Optional[str] = None):
    """
    包装带 execute(args) 的工具对象（OpenAI Agents / 自研 loop）。
    不把 AMP 伪装成 Agent.callbacks。
    """
    mw = middleware or PuaxAmpMiddleware()
    orig = tool.execute
    name = getattr(tool, "name", None) or getattr(tool, "id", None) or "tool"
    sid = session_id or mw.default_session_id

    def execute(args, *rest, **kwargs):
        payload = args if isinstance(args, dict) else {"command": args}
        decision = mw.on_pre_tool_use(name, payload, session_id=sid)
        if not decision.allowed:
            raise PermissionError(decision.reason)
        try:
            result = orig(args, *rest, **kwargs)
            mw.on_post_tool_use(name, result, session_id=sid)
            return result
        except Exception as e:
            mw.on_post_tool_use(name, None, error=e, session_id=sid)
            raise

    tool.execute = execute
    return tool


def create_openai_agents_guard(middleware: Optional[PuaxAmpMiddleware] = None, session_id: str = "openai-agents-session"):
    mw = middleware or PuaxAmpMiddleware(default_session_id=session_id)

    def wrap_tool(tool):
        return wrap_tool_execute(tool, mw, session_id)

    return wrap_tool


def create_google_adk_before_tool(middleware: Optional[PuaxAmpMiddleware] = None):
    """Google ADK Agent(before_tool_callback=...)"""
    mw = middleware or PuaxAmpMiddleware()

    def before_tool_callback(tool, args, tool_context=None):
        name = getattr(tool, "name", None) or getattr(tool, "id", None) or "adk-tool"
        sid = None
        if tool_context is not None:
            sid = getattr(tool_context, "session_id", None) or getattr(tool_context, "invocation_id", None)
        decision = mw.on_pre_tool_use(name, args if isinstance(args, dict) else {"input": args}, session_id=sid)
        if not decision.allowed:
            raise PermissionError(decision.reason)
        return args

    return before_tool_callback


def create_dify_amp_handler(middleware: Optional[PuaxAmpMiddleware] = None):
    """Dify 工具插件请求体 { tool_name, tool_parameters, conversation_id }"""
    mw = middleware or PuaxAmpMiddleware()

    def handler(req: Dict[str, Any]) -> PreToolDecision:
        sid = req.get("conversation_id") or mw.default_session_id
        name = req.get("tool_name") or "dify-tool"
        params = req.get("tool_parameters") or {}
        return mw.on_pre_tool_use(str(name), params if isinstance(params, dict) else {"input": params}, session_id=str(sid))

    return handler


def create_autogen_tool_guard(middleware: Optional[PuaxAmpMiddleware] = None):
    """
    AutoGen 工具拦截钩子
    返回 callable: (tool_name, tool_args) -> None (违规抛出 PermissionError)
    """
    mw = middleware or PuaxAmpMiddleware()

    def guard(tool_name: str, tool_args: Dict[str, Any], session_id: Optional[str] = None):
        decision = mw.on_pre_tool_use(tool_name, tool_args, session_id=session_id)
        if not decision.allowed:
            raise PermissionError(decision.reason)
        return True

    return guard
