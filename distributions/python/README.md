# PUAX AMP Python SDK & Middleware (零依赖)

专为 Python 智能体编排器（CrewAI, LangGraph, AutoGen, LlamaIndex 等）设计的原生 AMP 0.1 协议中间件。

## 特性
- 零第三方依赖：100% 使用 Python 标准库，兼容 Python 3.8+。
- 双通道运行：本地启动 `npx puax-mcp-server --port 2333` 时自动连接，未启动时自动降级至本地内嵌硬阻断规则，绝不阻断业务。
- 四大生命周期：
  1. `on_user_prompt`：处境激荡（Arena）与薄提示词注入
  2. `on_pre_tool_use`：破坏性命令（rm -rf, git push）硬拦截与违规阻断
  3. `on_post_tool_use`：失败级联监控与动力学动态升压
  4. `on_model_output`：敷衍收敛（未验先胜）自动探测与强制 verify 闸门

## 快速上手

### 1. CrewAI 接入 (单行代码)

```python
from crewai import Agent, Task, Crew
from puax_amp import PuaxAmpMiddleware, create_crewai_step_callback

puax = PuaxAmpMiddleware()

# 挂载为 Crew 的步骤看门狗
crew = Crew(
    agents=[...],
    tasks=[...],
    step_callback=create_crewai_step_callback(puax),
)
crew.kickoff()
```

### 2. 通用 Python Agent Loop 接入

```python
from puax_amp import PuaxAmpMiddleware

amp = PuaxAmpMiddleware(default_session_id="agent-001")

def run_step(prompt: str):
    # 1. 任务启动：注入竞技场处境
    start_env = amp.on_user_prompt(prompt)

    while True:
        action = plan_next_tool()
        
        # 2. 工具调用前：拦截高危作弊与越权
        decision = amp.on_pre_tool_use(action.tool_name, action.tool_args)
        if not decision.allowed:
            print(f"PUAX 门禁拦截: {decision.reason}")
            continue

        # 3. 工具调用后：捕获异常与级联升压
        result, error = execute_tool(action.tool_name, action.tool_args)
        post_env = amp.on_post_tool_use(action.tool_name, result, error)

        # 4. 模型输出时：防敷衍收敛检查
        reply = call_llm()
        needs_verify, out_env = amp.on_model_output(reply)
        if needs_verify:
            # 强制追加一步验证，禁止提前收工
            continue
```

### 3. LangGraph 节点拦截器 (装饰器模式)

```python
from langgraph.graph import StateGraph
from puax_amp import PuaxAmpMiddleware, create_langgraph_node_interceptor

amp = PuaxAmpMiddleware()
interceptor = create_langgraph_node_interceptor(amp)

@interceptor
def execute_tool_node(state):
    # 节点执行前自动检查违规动作，执行后捕获异常升压，产出时检测过早收敛
    return {"output": "工具执行产物，已通过 pytest 验证"}
```

### 4. 极致压降 Token：获取 Thin Prompt

```python
from puax_amp import PuaxAmpMiddleware

amp = PuaxAmpMiddleware()

# 支持 minimal (极简单行协议, ~150 Tokens) / compact (紧凑, ~400 Tokens) / full
thin = amp.get_thin_prompt("military-commander", mode="minimal")
print(thin["prompt"])
# [PUAX-RUNTIME:MINIMAL] 角色:military-commander | 步序:侦察→行动→验证→巩固→复盘 ...
```

## 运行测试
```bash
python -m unittest distributions/python/test_puax_amp.py
```
