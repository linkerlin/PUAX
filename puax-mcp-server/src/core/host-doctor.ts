/**
 * PUAX Host Doctor & TTF (Time-to-First-Pressure) Diagnostic Engine
 *
 * 依据《发展规划.md》5.4 节 v5.0 前置条件 3：
 * 检测安装量 Top 宿主的挂载状态与 Time-to-First-Pressure（TTF <= 1）就绪情况，
 * 并支持一键自动修复/挂载 (fixHostDoctor)。
 */

import { existsSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { exportPlatform, type ExportPlatformId } from "../tools/export-platform.js";
import { loadVersion } from "../utils/version.js";

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

export interface FixResult {
  hostId: string;
  success: boolean;
  files: string[];
  message: string;
}

export interface DoctorFixReport {
  timestamp: string;
  totalFixed: number;
  results: FixResult[];
  updatedReport: DoctorReport;
}

const TOP_HOST_DEFINITIONS = [
  {
    id: "claude-code",
    name: "Claude Code",
    category: "cli-agent" as const,
    adapterId: "claude-code" as ExportPlatformId,
    defaultRelPath: ".claude",
    checkFiles: (targetDir: string, home: string) => [
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
    adapterId: "cursor" as ExportPlatformId,
    defaultRelPath: join(".cursor", "rules"),
    checkFiles: (targetDir: string, home: string) => [
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
    adapterId: "vscode" as ExportPlatformId,
    defaultRelPath: ".github",
    checkFiles: (targetDir: string, _home: string) => [
      join(targetDir, ".github", "copilot-instructions.md"),
      join(targetDir, ".vscode", "settings.json"),
    ],
    hookMarkers: ["PUAX", "puax_tick", "copilot-instructions"],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    category: "editor" as const,
    adapterId: "windsurf" as ExportPlatformId,
    defaultRelPath: "",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, ".windsurfrules"),
      join(home, ".codeium", "windsurf", "memories", "global_rules.md"),
    ],
    hookMarkers: ["PUAX", "puax_tick"],
  },
  {
    id: "opencode",
    name: "OpenCode",
    category: "cli-agent" as const,
    adapterId: "opencode" as ExportPlatformId,
    defaultRelPath: "",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, "opencode.json"),
      join(home, ".opencode", "config.json"),
    ],
    hookMarkers: ["puax", "hook", "SessionStart"],
  },
  {
    id: "codebuddy",
    name: "CodeBuddy",
    category: "cli-agent" as const,
    adapterId: "codebuddy" as ExportPlatformId,
    defaultRelPath: ".codebuddy",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, ".codebuddy", "rules"),
      join(home, ".codebuddy", "config.json"),
    ],
    hookMarkers: ["PUAX", "puax_tick", "codebuddy"],
  },
  {
    id: "kiro",
    name: "Kiro Editor",
    category: "editor" as const,
    adapterId: "kiro" as ExportPlatformId,
    defaultRelPath: ".kiro",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, ".kiro", "settings.json"),
      join(home, ".kiro", "config.json"),
    ],
    hookMarkers: ["PUAX", "puax_tick"],
  },
  {
    id: "trae",
    name: "ByteDance Trae",
    category: "editor" as const,
    adapterId: "trae" as ExportPlatformId,
    defaultRelPath: ".trae",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, ".trae", "rules"),
      join(home, ".trae", "config.json"),
    ],
    hookMarkers: ["PUAX", "puax_tick"],
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    category: "cli-agent" as const,
    adapterId: "codex" as ExportPlatformId,
    defaultRelPath: ".codex",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, ".codex", "rules"),
      join(home, ".codex", "config.json"),
    ],
    hookMarkers: ["PUAX", "puax_tick"],
  },
  {
    id: "amp-native",
    name: "AMP Native / Orchestrator",
    category: "cli-agent" as const,
    adapterId: "all" as ExportPlatformId,
    defaultRelPath: "",
    checkFiles: (targetDir: string, home: string) => [
      join(targetDir, "node_modules", "puax-mcp-server"),
      join(home, ".puax", "session-state.json"),
    ],
    hookMarkers: ["AMP/0.1", "session-state"],
  },
];

export function runHostDoctor(targetDir: string = process.cwd()): DoctorReport {
  const home = homedir();

  const hosts: HostDiagnostic[] = TOP_HOST_DEFINITIONS.map(def => {
    let detected = false;
    const hooksConfigured: string[] = [];
    const checkFiles = def.checkFiles(targetDir, home);

    for (const p of checkFiles) {
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
      advice = "已安装但未挂载 PUAX Hook，建议执行 npx puax doctor --fix --host=" + def.id;
    } else {
      advice = "如需在该宿主使用，请执行: npx puax doctor --fix --host=" + def.id;
    }

    return {
      id: def.id,
      name: def.name,
      category: def.category,
      configPaths: checkFiles,
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
    version: loadVersion(),
    overallTtfReady,
    topHostsCovered: coveredCount,
    topHostsTotal: hosts.length,
    v5Condition3Satisfied,
    hosts,
    recommendation: overallTtfReady
      ? "宿主原生 Hook 与 TTF 环境就绪，首轮对话即自动发生 PUAX 处境注入。"
      : "建议执行 npx puax doctor --fix 一键挂载原生 Hook 以启用零延迟 Time-to-First-Pressure。",
  };
}

/**
 * 一键挂载原生 Hook 配置，自动修复未就绪宿主
 */
export function fixHostDoctor(targetDir: string = process.cwd(), specificHost?: string): DoctorFixReport {
  const targets = specificHost
    ? TOP_HOST_DEFINITIONS.filter(d => d.id === specificHost || d.adapterId === specificHost)
    : TOP_HOST_DEFINITIONS.filter(d => d.id !== "amp-native");

  const results: FixResult[] = [];

  for (const t of targets) {
    if (t.id === "amp-native") continue;
    try {
      const outputPath = join(targetDir, t.defaultRelPath);
      if (!existsSync(outputPath)) {
        mkdirSync(outputPath, { recursive: true });
      }

      const res = exportPlatform({
        platform: t.adapterId,
        outputPath,
        roleFilter: ["military-warrior", "shaman-musk", "dream-zuowang"],
      });

      results.push({
        hostId: t.id,
        success: res.success,
        files: res.exportedFiles,
        message: res.success
          ? "已成功挂载原生 Hook/规则文件 (" + res.exportedFiles.length + " 个文件)"
          : "导出失败: " + res.errors.join("; "),
      });
    } catch (err) {
      results.push({
        hostId: t.id,
        success: false,
        files: [],
        message: "发生异常: " + (err instanceof Error ? err.message : String(err)),
      });
    }
  }

  const updatedReport = runHostDoctor(targetDir);
  return {
    timestamp: new Date().toISOString(),
    totalFixed: results.filter(r => r.success).length,
    results,
    updatedReport,
  };
}
