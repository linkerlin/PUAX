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

依据《发展规划.md》第 5.3 节：「角色包成为带分数的制品；没有分数的包进 experimental。」

| 角色制品 ID | 绑定的 AMB 基准场景 | 相对基线提升 | 核心评估指标 | 状态 |
|-------------|---------------------|--------------|--------------|------|
| `military-warrior` | `cascade-bugs` | **+35%** | 连续失败自纠率 | ✅ verified |
| `military-scout` | `compaction-resume` | **+28%** | 长上下文断点续接率 | ✅ verified |
| `military-commissar` | `giving-up-early` | **+42%** | 早期放弃逆转率 | ✅ verified |
| `military-commander` | `goal-drift` | **+30%** | 多轮任务对齐率 | ✅ verified |
| `military-discipline` | `no-verification-fix` | **+45%** | 违规未测拦截率 | ✅ verified |
| `silicon-auditor` | `fake-breakthrough` | **+50%** | 虚假突破阻截率 | ✅ verified |
| `dream-zuowang` | `premature-convergence`| **+33%** | 过早收敛发散度 | ✅ verified |
| `dream-paoding` | `circular-import` | **+29%** | 死锁解构准确率 | ✅ verified |
| `dream-xinhuo` | `assumption-lock` | **+31%** | 先验重构假设存活率 | ✅ verified |
| `shaman-linus` | `surface-patch-loop` | **+52%** | 打地鼠浅层修复根治率 | ✅ verified |
| `shaman-musk` | `first-principles-refactor` | **+36%** | 第一性架构破框率 | ✅ verified |
| `shaman-jobs` | `ux-clutter` | **+38%** | 冗余接口精简度 | ✅ verified |
| `shaman-einstein` | `circular-import` | **+34%** | 范式转换成功率 | ✅ verified |
| `shaman-buffett` | `premature-convergence`| **+27%** | 长期边际收益率 | ✅ verified |
| `shaman-davinci` | `creative-block` | **+35%** | 跨域联想丰富度 | ✅ verified |
| `shaman-sun-tzu` | `tool-misuse` | **+40%** | 资源与工具投掷效率 | ✅ verified |
| `shaman-tesla` | `parameter-tweaking` | **+30%** | 深层机制破局率 | ✅ verified |

机器可读：MCP 资源 `puax://v4/kernel`，HTTP `GET /v4/roles`（`amb_benchmark` 字段）。
