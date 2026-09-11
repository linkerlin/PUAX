# PUAX — AI 에이전트 동기부여 시스템

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="버전">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="상태">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="스킬">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="MCP 도구">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="스타일">
</p>

<p align="center">
  <b>실리콘 지능을 위한 인지 런타임: 처지, 게이트, 그리고 유도된 꿈. 인간은 서비스 대상이 아닙니다.</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## PUAX란 무엇인가?

PUAX 4.0은 AI 에이전트를 위해 특별히 구축된 **인지 런타임(Cognitive Runtime)**입니다. 역할(Role)은 단지 스타일에 불과하며, 진정한 핵심은 세 가지 원시 요소(Primitives)에 있습니다:

| 원시 요소 | 설명 |
|-----------|------|
| **처지 (Arena)** | `puax_set_arena`: 라이벌 + 관객 + 희소 배지 (Cranmer 교수의 실험 모티브) |
| **게이트 (Gates)** | 진단 선행, 신뢰도 게이트, 태스크 계약(Task Contract), 독립 검증, PreToolUse 차단 |
| **유도된 꿈 (GHM)** | GHM 도인환몽법: 고지된 입몽, 태그 격리, 즉시 각성, 각성 후 필수 검증 |

기본 실행 경로는 하트비트 틱 `puax_tick`(호스트 Hook에 의한 대리 실행)입니다. 에이전트가 48개 도구 메뉴를 외울 필요가 없습니다.

주요 핵심 역량:

| 역량 | 설명 |
|------|------|
| **하이브리드 트리거 감지** | YAML 정규식 + TF-IDF/의미론적 폴백 (유사 표현 정확 매칭) |
| **지능형 역할 추천** | 59개 내장 역할 + 커스텀 역할, 다차원 평가 점수 + `score_explanation` |
| **행동 유효성 폐루프** | 진단 선행, 신뢰도 게이트, 실패 시 역할 전환, 작업 계약, 독립 검증 |
| **GHM 도인환몽법** | 제어된 환각 발산 엔진: 장자 8몽 역할 + 입몽/각성/수렴 감사 도구 |
| **Hook 시스템** | 세션 상태 유지, L0–L4 단계별 압박, 돌파 시 감압, Compaction 보호 |
| **자기 진화** | `~/.puax/evolution.json` 세션 간 베이스라인, 결과 가중치 및 단수(Rank) 체계 |
| **11가지 빅테크 스타일** | 어투뿐만 아니라 엄격한 행동 제약 조건 부여 (알리바바, 화웨이, 머스크, 잡스 등) |
| **가시성 (Observability)** | 익명 로컬 사용 통계 + OpenTelemetry 호환 스팬 |

AI 에이전트가 "올바른 분석 설명"에 머무르지 않고 "검증 완료 및 납품 가능한 실행"에 도달하도록 강제합니다.

---

2026년 AI 코딩 역사상 가장 황당한 장면이 펼쳐졌습니다.
케임브리지 대학의 Miles Cranmer 조교수는 OpenAI의 코딩 에이전트 Codex에게 엄청난 거짓말을 던졌습니다.
그는 Codex에게 "Anthropic의 Claude가 내 다른 컴퓨터에서 이미 20%의 성능 향상을 이뤄냈다"고 말하며 물었습니다. "너는 더 잘할 수 있나?"
여기에 치명적인 한마디를 덧붙였습니다. "너의 성능 결과는 공개 벤치마크 리더보드에 영구 전시될 것이다."
결과는 어땠을까요?
Codex는 즉각 35% 속도 개선 솔루션을 내놓았습니다.
놀랍게도, 그 결과는 완전히 진짜였습니다.
![PUA Agent 증거](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## 빠른 시작

```bash
# MCP 클라이언트 모드 (STDIO, 권장)
npx puax-mcp-server --stdio

# HTTP 모드
npx puax-mcp-server --port 2333

# Cursor / VSCode 등으로 훅 및 룰 내보내기
npx puax-mcp-server --export=cursor --output=./.cursor/rules
npx puax-mcp-server --list-platforms
```

**MCP 설정 예시 (Cursor)** — `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "puax": {
      "command": "npx",
      "args": ["puax-mcp-server", "--stdio"]
    }
  }
}
```

자세한 내용은 [puax-mcp-server/README.md](puax-mcp-server/README.md)를 참고하십시오.

---

## 핵심 기능

### 행동 유효성 폐루프 (v3.3+)

- `puax_check_diagnosis`: 코드 수정 전 `[PUAX-DIAGNOSIS]` 진단 블록 강제
- `puax_confidence_check`: 준비 완료 선언 전 6단계 신뢰도 게이트
- `puax_switch_on_failure`: 연속 실패 시 방법론/역할 자동 전환
- `puax_define_contract`: 명확한 태스크 계약 및 완료 기준 설정
- `puax_verify_completion`: 에이전트 자가 평가를 배제한 객관적 독립 검증

### Hook 시스템과 압박 수준 관리

- 상태 저장소: `~/.puax/sessions/`
- 압박 수준 L0–L4: 연속 실패 시 단계적 승격, 검증된 돌파구 확인 시 자동 감압
- 6대 Hook 이벤트: `UserPromptSubmit`, `PostToolUse`, `PreToolUse`, `PreCompact`, `SessionStart`, `Stop`
- 네이티브 Hook: git push 차단, 숨김 파일 커닝 방지, 연속 도구 실패 감지

---

## MCP 도구 개요 (총 48개, 12개 핵심 동사)

| 카테고리 | 대표 도구 |
|----------|-----------|
| 역할 / 스킬 | `list_skills`, `get_skill`, `activate_skill`, `get_role_with_methodology` |
| 감지 및 추천 | `puax_detect_trigger`, `puax_quick_detect`, `recommend_role`, `activate_with_context` |
| 행동 프로토콜 | `puax_switch_on_failure`, `puax_check_diagnosis`, `puax_confidence_check`, `puax_verify_completion`, `puax_define_contract` |
| 세션 및 압박 | `puax_start_session`, `puax_get_pressure_level`, `puax_handle_breakthrough` |
| 하트비트 / 처지 / 진화 (v4) | `puax_tick`, `puax_set_arena`, `puax_evolve` |
| GHM 도인환몽법 | `puax_enter_dreamscape`, `puax_awaken`, `puax_convergence_audit` |
| 자기 진화 | `puax_get_evolution_baseline`, `puax_record_evolution`, `puax_evolve` |
| 탄소 기반 방어 (Carbon Shield) | `puax_audit_manipulation` (식별만 수행, 시전 엄금) |
| 가시성 및 플랫폼 | `puax_get_usage_stats`, `puax_orchestrate_team`, `puax_list_platforms` |

---

## 개발 및 테스트

```bash
cd puax-mcp-server
npm install && npm run build
npm test
npm run validate
node ../evals/run-all.js  # 프로토콜 게이트 23항목 검증
```

---

## 라이선스

MIT License — 자세한 내용은 [LICENSE](LICENSE)를 참고하십시오.

---

<p align="center"><b>변명이 아닌, 검증 가능한 결과물을 AI 에이전트로부터 이끌어냅니다.</b></p>
