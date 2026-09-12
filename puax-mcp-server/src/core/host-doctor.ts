/**
 * PUAX Host Doctor & TTF (Time-to-First-Pressure) Diagnostic Engine
 *
 * 依据《发展规划.md》5.4 节 v5.0 前置条件 3：
 * 检测安装量 Top 宿主的挂载状态与 Time-to-First-Pressure（TTF <= 1）就绪情况。
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface HostDiagnostic {
  id: string;
  name: string;
  category: "editor" | "cli-agent" | "extension";
  configPaths: string[];
  detected: boolean;
  hooksConfigured: string[];
  ttfReady: boolean;
  score: number; // 0 - 100
  advice: string;
}

export interface DoctorReport {
  timestamp: string;
  version: string;
  overallTtfReady: boolean;
  topHostsCovered: number;
  topHostsTotal: number;
  v5Condition3Satisfied: boolean;
  hosts: HostDiagnostic[];
  recommendation: string;
}

export function runHostDoctor(targetDir: string = process.cwd()): DoctorReport {
  const home = homedir();

  const TOP_HOST_DEFINITIONS = [
    {
      id: "claude-code",
      name: "Claude Code",
      category: "cli-agent" as const,
      checkFiles: [
        join(home, ".claude", "settings.json"),
        join(home, ".claude", "config.json"),
        join(targetDir, ".claude", "settings.json"),
      ],
      hookMarkers: ["SessionStart", "UserPromptSubmit", "PreToolUse", "PostToolUse", "puax hook"],
    },
    {
      id: "cursor",
      name: "Cursor AI",
      category: "editor" as const,
      checkFiles: [
        join(targetDir, ".cursor", "rules"),
        join(targetDir, ".cursorrules"),
        join(home, ".cursor", "rules"),
      ],
      hookMarkers: ["PUAX", "puax_tick", "SessionStart"],
    },
    {
      id: "vscode-copilot",
      name: "VSCode / GitHub Copilot",
      category: "editor" as const,
      checkFiles: [
        join(targetDir, ".github", "copilot-instructions.md"),
        join(targetDir, ".vscode", "settings.json"),
      ],
      hookMarkers: ["PUAX", "puax_tick", "copilot-instructions"],
    },
    {
      id: "windsurf",
      name: "Windsurf",
      category: "editor" as const,
      checkFiles: [
        join(targetDir, ".windsurfrules"),
        join(home, ".codeium", "windsurf", "memories", "global_rules.md"),
      ],
      hookMarkers: ["PUAX", "puax_tick"],
    },
    {
      id: "opencode",
      name: "OpenCode",
      category: "cli-agent" as const,
      checkFiles: [
        join(targetDir, "opencode.json"),
        join(home, ".opencode", "config.json"),
      ],
      hookMarkers: ["puax", "hook", "SessionStart"],
    },
    {
      id: "amp-native",
      name: "AMP Native / Orchestrator",
      category: "cli-agent" as const,
      checkFiles: [
        join(targetDir, "node_modules", "puax-mcp-server"),
        join(home, ".puax", "session-state.json"),
      ],
      hookMarkers: ["AMP/0.1", "session-state"],
    },
  ];

  const hosts: HostDiagnostic[] = TOP_HOST_DEFINITIONS.map(def => {
    let detected = false;
    const hooksConfigured: string[] = [];

    for (const p of def.checkFiles) {
      if (existsSync(p)) {
        detected = true;
        try {
          const content = readFileSync(p, "utf-8");
          for (const marker of def.hookMarkers) {
            if (content.includes(marker) && !hooksConfigured.includes(marker)) {
              hooksConfigured.push(marker);
            }
          }
        } catch {
          // 目录或读取限制，仍视作检测到
        }
      }
    }

    // TTF 就绪判断：至少检测到文件，且配置了关键 Hook 或处于本机已挂载状态
    const ttfReady = detected && (hooksConfigured.length > 0 || def.id === "amp-native");
    const score = ttfReady ? Math.min(100, 40 + hooksConfigured.length * 20) : detected ? 40 : 0;

    let advice = "未检测到该宿主配置";
    if (ttfReady) {
      advice = "TTF <= 1 轮就绪：首轮即可原生发生动机注入";
    } else if (detected) {
      advice = "已安装但未挂载 PUAX Hook，建议执行 npx puax --export=" + def.id;
    } else {
      advice = "如需在该宿主使用，请导出配置: npx puax --export=" + def.id;
    }

    return {
      id: def.id,
      name: def.name,
      category: def.category,
      configPaths: def.checkFiles,
      detected,
      hooksConfigured,
      ttfReady,
      score,
      advice,
    };
  });

  const coveredCount = hosts.filter(h => h.ttfReady || h.detected).length;
  const overallTtfReady = hosts.some(h => h.ttfReady);
  const v5Condition3Satisfied = coveredCount >= Math.ceil(hosts.length * 0.5);

  return {
    timestamp: new Date().toISOString(),
    version: "4.0.0",
    overallTtfReady,
    topHostsCovered: coveredCount,
    topHostsTotal: hosts.length,
    v5Condition3Satisfied,
    hosts,
    recommendation: overallTtfReady
      ? "宿主原生 Hook 与 TTF 环境就绪，首轮对话即自动发生 PUAX 处境注入。"
      : "建议配置至少一种主流宿主原生 Hook 以启用零延迟 Time-to-First-Pressure。",
  };
}
