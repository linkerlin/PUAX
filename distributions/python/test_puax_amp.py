import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from puax_amp import PuaxAmpMiddleware, AMP_SPEC, create_crewai_step_callback


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


if __name__ == "__main__":
    unittest.main()
