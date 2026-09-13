const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const LANG_CONFIGS = [
  {
    file: "README_en.md",
    gateNote: "From repository root (26 Protocol Invariant Gates)",
    ambNote: "# AMB Live Benchmark (Real LLM API Dual-Track Testing)\nnode evals/amb-live.js --mock                 # Zero-cost offline simulation\nnode evals/amb-live.js --model=deepseek       # Direct live model benchmark",
    shieldTag: "(Human-facing extensions deferred; baseline inspection preserved)",
    docTableAdd: "| [AMP Integration](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK & LlamaIndex middleware integration |\n| [Web Admin Spec](docs/WEB-ADMIN-SPEC.md) | Mission control & sandbox detailed RFC specification |",
  },
  {
    file: "README_zh-TW.md",
    gateNote: "從儲存庫根目錄執行（26 項協議鐵律門禁）",
    ambNote: "# 眞實大模型 API 連通壓測與雙軌對比評測 (AMB Live)\nnode evals/amb-live.js --mock                 # 離線模擬壓測（零成本、秒級閉環）\nnode evals/amb-live.js --model=deepseek       # 直連 DeepSeek 眞實雙軌評測",
    shieldTag: "（自然人向終端外延功能暫緩，維持基礎識別層）",
    docTableAdd: "| [AMP 整合指南](docs/AMP-INTEGRATION.md) | LangChain、Vercel AI SDK 與 LlamaIndex 中間件整合指南 |\n| [Web Admin 規劃藍圖](docs/WEB-ADMIN-SPEC.md) | 矽基指揮所與演練沙盤詳細規格設計方案 |",
  },
  {
    file: "README_ja.md",
    gateNote: "リポジトリのルートから実行（26のプロトコル不変ゲート）",
    ambNote: "# リアルLLM API接続ストレステストとデュアルトラック評価 (AMB Live)\nnode evals/amb-live.js --mock                 # コストゼロのオフラインシミュレーション\nnode evals/amb-live.js --model=deepseek       # DeepSeekモデル直接テスト",
    shieldTag: "(人間向け拡張機能は保留、基礎識別層のみ維持)",
    docTableAdd: "| [AMP 統合ガイド](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK, LlamaIndex ミドルウェア統合 |\n| [Web Admin 仕様書](docs/WEB-ADMIN-SPEC.md) | シリコン司令部とサンドボックスの詳細設計書 |",
  },
  {
    file: "README_ko.md",
    gateNote: "저장소 루트에서 실행 (26개 프로토콜 불변 게이트)",
    ambNote: "# 실제 LLM API 연결 스트레스 테스트 및 듀얼 트랙 평가 (AMB Live)\nnode evals/amb-live.js --mock                 # 비용 제로 오프라인 시뮬레이션\nnode evals/amb-live.js --model=deepseek       # DeepSeek 실제 이중 트랙 벤치마크",
    shieldTag: "(인간 대상 확장 기능은 보류, 기초 식별 계층만 유지)",
    docTableAdd: "| [AMP 연동 가이드](docs/AMP-INTEGRATION.md) | LangChain, Vercel AI SDK 및 LlamaIndex 미들웨어 연동 |\n| [Web Admin 사양서](docs/WEB-ADMIN-SPEC.md) | 실리콘 지휘소 및 시뮬레이션 샌드박스 상세 설계안 |",
  },
  {
    file: "README_de.md",
    gateNote: "Vom Repository-Root ausführen (26 Protokoll-Gates)",
    ambNote: "# AMB Live Benchmark (Echte LLM-API-Doppelspur-Bewertung)\nnode evals/amb-live.js --mock                 # Kostenlose Offline-Simulation\nnode evals/amb-live.js --model=deepseek       # Direkter DeepSeek-Live-Test",
    shieldTag: "(Erweiterungen für Menschen aufgeschoben; Basiserkennung beibehalten)",
    docTableAdd: "| [AMP Integration](docs/AMP-INTEGRATION.md) | Middleware-Integration für LangChain, Vercel AI SDK & LlamaIndex |\n| [Web Admin Spezifikation](docs/WEB-ADMIN-SPEC.md) | Detailliertes RFC-Design für Leitstand & Sandbox |",
  },
  {
    file: "README_es.md",
    gateNote: "Ejecutar desde la raíz del repositorio (26 puertas de protocolo)",
    ambNote: "# AMB Live Benchmark (Pruebas de doble vía con APIs reales de LLM)\nnode evals/amb-live.js --mock                 # Simulación offline de costo cero\nnode evals/amb-live.js --model=deepseek       # Evaluación directa de modelo en vivo",
    shieldTag: "(Extensiones para humanos aplazadas; inspección base mantenida)",
    docTableAdd: "| [Integración AMP](docs/AMP-INTEGRATION.md) | Integración de middleware para LangChain, Vercel AI SDK y LlamaIndex |\n| [Especificación Web Admin](docs/WEB-ADMIN-SPEC.md) | Diseño detallado RFC para centro de mando y sandbox |",
  },
  {
    file: "README_fr.md",
    gateNote: "Exécuter depuis la racine du dépôt (26 portes de protocole)",
    ambNote: "# AMB Live Benchmark (Évaluation double voie avec vraies API LLM)\nnode evals/amb-live.js --mock                 # Simulation hors ligne gratuite\nnode evals/amb-live.js --model=deepseek       # Évaluation directe avec modèle réel",
    shieldTag: "(Extensions destinées aux humains différées; inspection de base maintenue)",
    docTableAdd: "| [Intégration AMP](docs/AMP-INTEGRATION.md) | Intégration middleware pour LangChain, Vercel AI SDK & LlamaIndex |\n| [Spécification Web Admin](docs/WEB-ADMIN-SPEC.md) | Spécification détaillée RFC pour centre de contrôle & sandbox |",
  },
  {
    file: "README_ru.md",
    gateNote: "Запуск из корня репозитория (26 инвариантных шлюзов протокола)",
    ambNote: "# AMB Live Benchmark (Тестирование на реальных API LLM по двум трекам)\nnode evals/amb-live.js --mock                 # Бесплатная оффлайн-симуляция\nnode evals/amb-live.js --model=deepseek       # Прямое тестирование реальной модели",
    shieldTag: "(Расширения для людей отложены; базовое распознавание сохранено)",
    docTableAdd: "| [Интеграция AMP](docs/AMP-INTEGRATION.md) | Интеграция middleware для LangChain, Vercel AI SDK и LlamaIndex |\n| [Спецификация Web Admin](docs/WEB-ADMIN-SPEC.md) | Подробный проект RFC командного центра и песочницы |",
  },
];

for (const cfg of LANG_CONFIGS) {
  const filePath = path.join(ROOT, cfg.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${cfg.file}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf-8");

  // 1. 版本号升级为 4.1.0
  content = content.replace(/badge\/version-[0-9.]+-blue\.svg/g, "badge/version-4.1.0-blue.svg");

  // 2. 标记碳基防御盾功能暂缓
  content = content.replace(/(POST \/v4\/shield\/audit[^\n|]*)/g, `$1 ${cfg.shieldTag}`);

  // 3. 文档表格增补 AMP Integration 与 Web Admin Spec
  if (!content.includes("WEB-ADMIN-SPEC.md")) {
    content = content.replace(/(\[AMP 0\.1\][^\n]+\n)/, `$1${cfg.docTableAdd}\n`);
  }

  // 4. 开发与测试节更新 26 门禁与 AMB Live 命令
  if (!content.includes("amb-live.js")) {
    content = content.replace(/(node \.\.\/evals\/run-all\.js)([^\n]*)/, `$1  # ${cfg.gateNote}\n\n${cfg.ambNote}`);
  }

  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`✅ Synchronized: ${cfg.file}`);
}

// 同步 README.md (简体中文) 文档表
let zhMain = fs.readFileSync(path.join(ROOT, "README.md"), "utf-8");
if (!zhMain.includes("WEB-ADMIN-SPEC.md")) {
  zhMain = zhMain.replace(
    /(\[AMP 0\.1\]\(docs\/AMP\.md\)[^\n]+\n)/,
    `$1| [AMP 编排器接入指南](docs/AMP-INTEGRATION.md) | LangChain、Vercel AI SDK 与 LlamaIndex 一行代码接入 |\n| [Web Admin 控制台详细设计](docs/WEB-ADMIN-SPEC.md) | 硅基指挥所与演练沙盘 v4.2 详细设计方案与 RFC |\n`
  );
  zhMain = zhMain.replace(/(POST \/v4\/shield\/audit[^\n|]*)/g, `$1（自然人外延功能暂缓，保留基础识别层）`);
  fs.writeFileSync(path.join(ROOT, "README.md"), zhMain, "utf-8");
  console.log(`✅ Synchronized: README.md`);
}

console.log("\nAll multilingual documents updated and synchronized!");
