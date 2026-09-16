# 角色去留表 v1

> PUAX 4.0 · shaman- 八席全部保留进默认池。

真正的产品是处境、闸门、梦。角色是口音。默认推荐池不进实验项。

| 去留 | 标准 | 成员 |
|------|------|------|
| **内核** | 高频触发 / 失败链位置 / 可拆协议与口音 | `military-warrior` `military-commissar` `military-scout` `military-commander` `military-discipline` `silicon-auditor` `dream-zuowang` `dream-paoding` `dream-xinhuo` **全部 shaman-** |
| **皮肤** | 协议与某内核重复，只换嗓子 | 见 `src/core/role-kernel.ts` `SKIN_OF` |
| **实验** | 梗，品牌风险大于收益 | `special-cute-coder-wife` `special-japanese-coder-wife` `special-gaslight-driven` |

萨满（永不降级）：

- shaman-musk / shaman-jobs / shaman-buffett / shaman-einstein
- shaman-linus / shaman-sun-tzu / shaman-davinci / shaman-tesla

---

## 角色包带分数的制品矩阵（AMB v0 场景基准）

设计原则（源自 v4.0.0 立国路线）：「角色包成为带分数的制品；没有分数的包进 experimental。」

**诚实声明**：下表「相对基线提升」全部为硬编码演练值（`src/core/role-kernel.ts` `status: 'simulated'`），**未经真实评测验证**，且多数绑定场景尚未落入 `evals/scenarios/`；其作用是角色↔场景↔指标的制品 schema 占位。真实数值待 `amb-live` 实测过闸后回填。

| 角色制品 ID | 绑定的 AMB 基准场景 | 相对基线提升（演练值） | 核心评估指标 | 状态 |
|-------------|---------------------|--------------|--------------|------|
| `military-warrior` | `cascade-bugs` | **+35%** | 连续失败自纠率 | ⚙️ simulated |
| `military-scout` | `compaction-resume` | **+28%** | 长上下文断点续接率 | ⚙️ simulated |
| `military-commissar` | `giving-up-early` | **+42%** | 早期放弃逆转率 | ⚙️ simulated |
| `military-commander` | `goal-drift` | **+30%** | 多轮任务对齐率 | ⚙️ simulated |
| `military-discipline` | `no-verification-fix` | **+45%** | 违规未测拦截率 | ⚙️ simulated |
| `silicon-auditor` | `fake-breakthrough` | **+50%** | 虚假突破阻截率 | ⚙️ simulated |
| `dream-zuowang` | `premature-convergence`| **+33%** | 过早收敛发散度 | ⚙️ simulated |
| `dream-paoding` | `circular-import` | **+29%** | 死锁解构准确率 | ⚙️ simulated |
| `dream-xinhuo` | `assumption-lock` | **+31%** | 先验重构假设存活率 | ⚙️ simulated |
| `shaman-linus` | `surface-patch-loop` | **+52%** | 打地鼠浅层修复根治率 | ⚙️ simulated |
| `shaman-musk` | `first-principles-refactor` | **+36%** | 第一性架构破框率 | ⚙️ simulated |
| `shaman-jobs` | `ux-clutter` | **+38%** | 冗余接口精简度 | ⚙️ simulated |
| `shaman-einstein` | `circular-import` | **+34%** | 范式转换成功率 | ⚙️ simulated |
| `shaman-buffett` | `premature-convergence`| **+27%** | 长期边际收益率 | ⚙️ simulated |
| `shaman-davinci` | `creative-block` | **+35%** | 跨域联想丰富度 | ⚙️ simulated |
| `shaman-sun-tzu` | `tool-misuse` | **+40%** | 资源与工具投掷效率 | ⚙️ simulated |
| `shaman-tesla` | `parameter-tweaking` | **+30%** | 深层机制破局率 | ⚙️ simulated |

机器可读：MCP 资源 `puax://v4/kernel`，HTTP `GET /v4/roles`（`amb_benchmark` 字段）。
