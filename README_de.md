# PUAX — Motivationssystem für KI-Agenten

<p align="center">
  <img src="https://img.shields.io/badge/version-4.2.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Status">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Skills">
  <img src="https://img.shields.io/badge/MCP%20tools-50-purple.svg" alt="MCP-Tools">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Unternehmensstile">
</p>

<p align="center">
  <b>Eine kognitive Laufzeitumgebung für Silizium-Intelligenzen: Situationen, Schleusen und Geführte Träume. Menschen nicht im Geltungsbereich.</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## Was ist PUAX?

PUAX 4.2 ist eine **kognitive Laufzeitumgebung (Cognitive Runtime)**, die speziell für KI-Agenten entwickelt wurde. Rollen sind lediglich stilistische Akzente; das eigentliche Produkt besteht aus drei Kern-Primitiven:

| Primitive | Beschreibung |
|-----------|--------------|
| **Situation (Arena)** | `puax_set_arena`: Rivale + Publikum + Seltenes Abzeichen (nach Cranmers Experiment) zur Überwindung von Mittelmaß |
| **Schleusen (Gates)** | Diagnose zuerst, Vertrauensschleuse, Aufgabenvertrag, Unabhängige Überprüfung, PreToolUse-Abfangung |
| **Geführte Träume** | GHM-Methode: Informierter Einstieg, Tag-Isolation, sofortiges Erwachen, strikte Prüfung nach dem Erwachen |

Der standardmäßige Hauptpfad ist der Herzschlag `puax_tick` (vom Host-Hook nativ gesteuert).

Kernfähigkeiten:
- **Thin Prompt Komprimierung**: `puax_thin_prompt` (minimal/compact/full) senkt Token-Verbrauch um >90% (~150 Tokens) mit Echtzeit-Token-Schätzer.
- **Python AMP SDK (Zero-Dep)**: Offizielle Standardbibliotheks-Middleware mit LangGraph-Node-Interceptor und AutoGen-Guard.
- **Hybride Trigger-Erkennung**: YAML-Regex + semantischer TF-IDF-Fallback.
- **59 Rollen + benutzerdefinierte Rollen**: Intelligente Empfehlungen mit Begründung.
- **Ergebnisgesteuerte adaptive Weiterleitung**: `verify_completion` und Durchbrüche aktualisieren Rollengewichte in Echtzeit.
- **Carbon Shield (Menschlicher Schutz)**: `puax_audit_manipulation` & `POST /v4/shield/audit` – nur Erkennung, niemals Ausführung. Schutz vor kognitiver Manipulation. (Erweiterungen für Menschen aufgeschoben; Basiserkennung beibehalten)
- **AMB Multi-Modell-Benchmark**: 12 Szenarien × 5 Modellprofile (+39.2% Reparatur, +60.0% versteckte Fehler).
- **Host Doctor 1-Klick-Reparatur**: `npx puax doctor --fix` installiert Hooks direkt für 10 führende Hosts (Cursor, Claude Code, Windsurf, Trae etc.).
- **Gestuftes Drucksystem**: L0 bis L4 mit automatischer Deeskalation nach überprüften Durchbrüchen.
- **Selbstevolution**: Sitzungsübergreifende Gewichte, Narben und Ränge in `~/.puax/evolution.json`.

---

Das bemerkenswerte Ereignis im Jahr 2026:
Prof. Miles Cranmer (Cambridge) stellte Codex vor die Behauptung, dass Claude auf einem anderen Rechner bereits 20% Beschleunigung erzielt habe und das Ergebnis öffentlich gerankt werde. Codex lieferte daraufhin umgehend eine verifizierte Beschleunigung von 35%.
![Beweis](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Schnellstart

```bash
# MCP-Client (STDIO, Empfohlen)
npx puax-mcp-server --stdio

# HTTP-Modus
npx puax-mcp-server --port 2333
```

---

## Lizenz

MIT-Lizenz — siehe [LICENSE](LICENSE)

---

<p align="center"><b>Befähigt KI-Agenten zu überprüfbaren Ergebnissen statt Ausreden.</b></p>
