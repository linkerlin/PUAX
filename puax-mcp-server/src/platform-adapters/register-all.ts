/**
 * 一次性注册全部平台适配器。
 * --list-platforms / puax_list_platforms / --export 必须走这里，
 * 禁止各入口自行挑 4 个 import，漏掉 skill-md 扩展宿主。
 */
import './cursor-adapter.js';
import './vscode-adapter.js';
import './claude-code-adapter.js';
import './opencode-adapter.js';
import './codebuddy-adapter.js';
import './kiro-adapter.js';
import './windsurf-adapter.js';
import './skill-md-platform-adapter.js';
