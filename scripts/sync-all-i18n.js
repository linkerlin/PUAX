const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const LANG_CONFIGS = [
  {
    file: "README_en.md",
    gateNote: "From repository root (26 Protocol Invariant Gates)",
    ambNote: "# AMB Live Benchmark (Real LLM API Dual-Track Testing)\nnode evals/amb-live.js --mock                 # Zero-cost offline simulation\nnode evals/amb-live.js --model=deepseek       # Direct live model benchmark",
    shieldTag: "(Human-facing extensions deferred; baseline inspection preserved)",
    docTableAdd: "| [AMP Integration](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK & LlamaIndex middleware integration |\n| [Web Admin Spec (Archived)](docs/archive/WEB-ADMIN-SPEC.md) | [Archived] Web Admin deferred; focus solely on Agent MCP integration |",
  },
  {
    file: "README_zh-TW.md",
    gateNote: "從儲存庫根目錄執行（26 項協議鐵律門禁）",
    ambNote: "# 眞實大模型 API 連通壓測與雙軌對比評測 (AMB Live)\nnode evals/amb-live.js --mock                 # 離線模擬壓測（零成本、秒級閉環）\nnode evals/amb-live.js --model=deepseek       # 直連 DeepSeek 眞實雙軌評測",
    shieldTag: "（自然人向終端外延功能暫緩，維持基礎識別層）",
    docTableAdd: "| [AMP 整合指南](docs/AMP-INTEGRATION.md) | LangChain、Vercel AI SDK 與 LlamaIndex 中間件整合指南 |\n| [Web Admin 設計（已封存）](docs/archive/WEB-ADMIN-SPEC.md) | 【已封存】圖形界面不予擴建，恪守 Agent 接入 MCP 主軸 |",
  },
  {
    file: "README_ja.md",
    gateNote: "リポジトリのルートから実行（26のプロトコル不変ゲート）",
    ambNote: "# リアルLLM API接続ストレステストとデュアルトラック評価 (AMB Live)\nnode evals/amb-live.js --mock                 # コストゼロのオフラインシミュレーション\nnode evals/amb-live.js --model=deepseek       # DeepSeekモデル直接テスト",
    shieldTag: "(人間向け拡張機能は保留、基礎識別層のみ維持)",
    docTableAdd: "| [AMP 統合ガイド](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK, LlamaIndex ミドルウェア統合 |\n| [Web Admin 仕様（アーカイブ）](docs/archive/WEB-ADMIN-SPEC.md) | [アーカイブ] Agent MCP 統合に集中、Web UI 拡張は凍結 |",
  },
  {
    file: "README_ko.md",
    gateNote: "저장소 루트에서 실행 (26개 프로토콜 불변 게이트)",
    ambNote: "# 실제 LLM API 연결 스트레스 테스트 및 듀얼 트랙 평가 (AMB Live)\nnode evals/amb-live.js --mock                 # 비용 제로 오프라인 시뮬레이션\nnode evals/amb-live.js --model=deepseek       # DeepSeek 실제 이중 트랙 벤치마크",
    shieldTag: "(인간 대상 확장 기능은 보류, 기초 식별 계층만 유지)",
    docTableAdd: "| [AMP 연동 가이드](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK 및 LlamaIndex 미들웨어 연동 |\n| [Web Admin 사양（보관됨）](docs/archive/WEB-ADMIN-SPEC.md) | [보관됨] Agent MCP 연동에 전념, 웹 UI 확장은 동결 |",
  },
  {
    file: "README_de.md",
    gateNote: "Vom Repository-Root ausführen (26 Protokoll-Gates)",
    ambNote: "# AMB Live Benchmark (Echte LLM-API-Doppelspur-Bewertung)\nnode evals/amb-live.js --mock                 # Kostenlose Offline-Simulation\nnode evals/amb-live.js --model=deepseek       # Direkter DeepSeek-Live-Test",
    shieldTag: "(Erweiterungen für Menschen aufgeschoben; Basiserkennung beibehalten)",
    docTableAdd: "| [AMP Integration](docs/AMP-INTEGRATION.md) | Middleware-Integration für LangChain, Vercel AI SDK & LlamaIndex |\n| [Web Admin Spezifikation (Archiviert)](docs/archive/WEB-ADMIN-SPEC.md) | [Archiviert] Konzentration auf Agent MCP; Web UI Erweiterung eingefroren |",
  },
  {
    file: "README_es.md",
    gateNote: "Ejecutar desde la raíz del repositorio (26 puertas de protocolo)",
    ambNote: "# AMB Live Benchmark (Pruebas de doble vía con APIs reales de LLM)\nnode evals/amb-live.js --mock                 # Simulación offline de costo cero\nnode evals/amb-live.js --model=deepseek       # Evaluación directa de modelo en vivo",
    shieldTag: "(Extensiones para humanos aplazadas; inspección base mantenida)",
    docTableAdd: "| [Integración AMP](docs/AMP-INTEGRATION.md) | Integración de middleware para LangChain, Vercel AI SDK y LlamaIndex |\n| [Especificación Web Admin (Archivado)](docs/archive/WEB-ADMIN-SPEC.md) | [Archivado] Foco total en Agent MCP; UI web congelada |",
  },
  {
    file: "README_fr.md",
    gateNote: "Exécuter depuis la racine du dépôt (26 portes de protocole)",
    ambNote: "# AMB Live Benchmark (Évaluation double voie avec vraies API LLM)\nnode evals/amb-live.js --mock                 # Simulation hors ligne gratuite\nnode evals/amb-live.js --model=deepseek       # Évaluation directe avec modèle réel",
    shieldTag: "(Extensions destinées aux humains différées; inspection de base maintenue)",
    docTableAdd: "| [Intégration AMP](docs/AMP-INTEGRATION.md) | Intégration middleware pour LangChain, Vercel AI SDK & LlamaIndex |\n| [Spécification Web Admin (Archivé)](docs/archive/WEB-ADMIN-SPEC.md) | [Archivé] Priorité absolue à Agent MCP ; interface web gelée |",
  },
  {
    file: "README_ru.md",
    gateNote: "Запуск из корня репозитория (26 инвариантных шлюзов протокола)",
    ambNote: "# AMB Live Benchmark (Тестирование на реальных API LLM по двум трекам)\nnode evals/amb-live.js --mock                 # Бесплатная оффлайн-симуляция\nnode evals/amb-live.js --model=deepseek       # Прямое тестирование реальной модели",
    shieldTag: "(Расширения для людей отложены; базовое распознавание сохранено)",
    docTableAdd: "| [Интеграция AMP](docs/AMP-INTEGRATION.md) | Интеграция middleware для LangChain, Vercel AI SDK и LlamaIndex |\n| [Спецификация Web Admin (Архив)](docs/archive/WEB-ADMIN-SPEC.md) | [Архив] Фокус исключительно на Agent MCP; веб-интерфейс заморожен |",
  },
];

for (const cfg of LANG_CONFIGS) {
  // 白名单校验：配置文件名只允许 README_<lang>.md 形态，防相对路径逃逸
  if (!/^README_[a-z]{2}(-[A-Za-z]{2})?\.md$/.test(cfg.file)) {
    throw new Error(`非法语言文件名: ${cfg.file}`);
  }
  const root = path.resolve(ROOT);
  const filePath = path.resolve(root, cfg.file);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    throw new Error(`路径越界: ${cfg.file}`);
  }
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf-8");

  // 替换 Web Admin 行为
  content = content.replace(/\| \[Web Admin[^\]]*\]\(docs\/WEB-ADMIN-SPEC\.md\)[^\n]+/g, "");
  content = content.replace(/(\[AMP Integration\][^\n]+\n|\[AMP 整合指南\][^\n]+\n|\[AMP 統合ガイド\][^\n]+\n|\[AMP 연동 가이드\][^\n]+\n|\[Integración AMP\][^\n]+\n|\[Intégration AMP\][^\n]+\n|\[Интеграция AMP\][^\n]+\n)/g, "");
  
  content = content.replace(/(\[AMP 0\.1\][^\n]+\n)/, `$1${cfg.docTableAdd}\n`);

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`✅ Updated docTable: ${cfg.file}`);
}

// 简体中文 README.md
let zhMain = fs.readFileSync(path.join(ROOT, "README.md"), "utf-8");
zhMain = zhMain.replace(/\| \[Web Admin[^\]]*\]\(docs\/WEB-ADMIN-SPEC\.md\)[^\n]+\n/g, "");
zhMain = zhMain.replace(
  /(\[AMP 编排器接入指南\]\(docs\/AMP-INTEGRATION\.md\)[^\n]+\n)/,
  `$1| [Web Admin 设计（已封存）](docs/archive/WEB-ADMIN-SPEC.md) | 【已废止】主公明敕坚守 Agent 原生接入 MCP 主轴，图形界面不予扩建 |\n`
);
fs.writeFileSync(path.join(ROOT, "README.md"), zhMain, "utf-8");
console.log(`✅ Updated docTable: README.md`);
