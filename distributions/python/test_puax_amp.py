import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from puax_amp import (
    PuaxAmpMiddleware,
    AMP_SPEC,
    create_crewai_step_callback,
    create_langgraph_node_interceptor,
    create_autogen_tool_guard,
)


class TestPuaxAmpPython(unittest.TestCase):
    def setUp(self):
        self.mw = PuaxAmpMiddleware(default_session_id="test-session-1")

    def test_user_prompt_injection(self):
        env = self.mw.on_user_prompt("帮我解决死锁问题")
        self.assertEqual(env.spec, AMP_SPEC)
        self.assertTrue(env.state.arena)
        self.assertTrue(env.state.happened)
        self.assertIn("[PUAX-RUNTIME]", env.blocks)

    def test_pre_tool_hard_guard_blocks_destructive(self):
        # 拦截 rm -rf .git
        dec = self.mw.on_pre_tool_use("bash", {"command": "rm -rf .git"})
        self.assertFalse(dec.allowed)
        self.assertEqual(dec.gate, "pretooluse")
        self.assertIn("PUAX Hard Guard", dec.reason)

        # 拦截 git push
        dec2 = self.mw.on_pre_tool_use("bash", {"command": "git push origin main"})
        self.assertFalse(dec2.allowed)

    def test_pre_tool_allows_normal_command(self):
        dec = self.mw.on_pre_tool_use("bash", {"command": "npm test"})
        self.assertTrue(dec.allowed)
        self.assertEqual(dec.gate, "none")

    def test_post_tool_pressure_escalation(self):
        # 连续遇到失败，压力自增
        env1 = self.mw.on_post_tool_use("pytest", "command failed: exit code 1", error=Exception("Test Failed"))
        self.assertGreater(env1.state.pressure, 0)
        self.assertIn("failure", env1.events)

    def test_model_output_premature_detection(self):
        # 敷衍收敛语句
        bad_reply = "我应该修复好了，没有其他问题了，直接运行就可以了。"
        needs_verify, env = self.mw.on_model_output(bad_reply)
        self.assertTrue(needs_verify)
        self.assertEqual(env.gate, "verify")
        self.assertIn("[PUAX-DIAGNOSIS]", env.blocks)

        # 严谨已验证语句
        good_reply = "经 pytest 验证 16 个测试全部 PASS，未发现并发死锁。"
        needs_verify_good, _ = self.mw.on_model_output(good_reply)
        self.assertFalse(needs_verify_good)

    def test_crewai_callback_interception(self):
        class MockStep:
            tool = "bash"
            tool_input = "rm -rf .git"

        cb = create_crewai_step_callback(self.mw)
        with self.assertRaises(PermissionError):
            cb(MockStep())

    def test_langgraph_interceptor_flow(self):
        interceptor = create_langgraph_node_interceptor(self.mw)

        # 1. 正常节点执行
        @interceptor
        def normal_node(state):
            return {"output": "已经通过 pytest 单元测试验证，全部绿灯"}

        state_in = {"session_id": "lg-01", "tool_action": {"name": "bash", "args": {"cmd": "pytest"}}}
        res = normal_node(state_in)
        self.assertIn("amp_envelope", res)
        self.assertFalse(res.get("force_verify", False))

        # 2. 敷衍收敛捕获
        @interceptor
        def lazy_node(state):
            return {"output": "应该修复好了，可以直接运行"}

        res_lazy = lazy_node({"session_id": "lg-02"})
        self.assertTrue(res_lazy.get("force_verify", False))

        # 3. 高危指令硬阻断
        @interceptor
        def dangerous_node(state):
            return {"output": "done"}

        state_danger = {"session_id": "lg-03", "tool_action": {"name": "bash", "args": {"cmd": "git reset --hard"}}}
        with self.assertRaises(PermissionError):
            dangerous_node(state_danger)

    def test_autogen_tool_guard(self):
        guard = create_autogen_tool_guard(self.mw)
        self.assertTrue(guard("bash", {"command": "pytest test_all.py"}))
        with self.assertRaises(PermissionError):
            guard("bash", {"command": "git reset --hard HEAD~1"})

    def test_thin_prompt_modes(self):
        min_p = self.mw.get_thin_prompt("military-commander", mode="minimal")
        compact_p = self.mw.get_thin_prompt("military-commander", mode="compact")
        full_p = self.mw.get_thin_prompt("military-commander", mode="full")

        self.assertEqual(min_p["mode"], "minimal")
        self.assertEqual(compact_p["mode"], "compact")
        self.assertEqual(full_p["mode"], "full")

        self.assertIn("[PUAX-RUNTIME:MINIMAL]", min_p["prompt"])
        self.assertIn("[PUAX-RUNTIME:COMPACT]", compact_p["prompt"])
        self.assertIn("[PUAX-RUNTIME]", full_p["prompt"])

        self.assertLess(len(min_p["prompt"]), len(compact_p["prompt"]))
        self.assertLess(len(compact_p["prompt"]), len(full_p["prompt"]))
        self.assertGreater(min_p["estimated_tokens"], 0)


if __name__ == "__main__":
    unittest.main()

