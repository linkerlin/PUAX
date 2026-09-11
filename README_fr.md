# PUAX — Système de Motivation pour Agents IA

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Statut">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Compétences">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="Outils MCP">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Styles">
</p>

<p align="center">
  <b>Un runtime cognitif dédié aux esprits de silicium : Situations, Portes et Rêves Guidés. Humains hors de portée.</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## Qu'est-ce que PUAX ?

PUAX 4.0 est un **runtime cognitif (Cognitive Runtime)** conçu spécifiquement pour les agents IA. Les rôles ne sont que des accents de surface ; le produit repose sur trois primitives fondatrices :

| Primitive | Description |
|-----------|-------------|
| **Situation (Arena)** | `puax_set_arena` : Rival + Public + Badge Rare (inspiré de l'expérience de Cranmer) |
| **Portes (Gates)** | Diagnostic préalable obligatoire, Porte de Confiance, Contrat de Tâche, Vérificateur Indépendant |
| **Rêves Guidés** | Méthode GHM : Immersion avertie, isolation par tags, réveil immédiat et vérification stricte |

La voie par défaut est l'impulsion de battement de cœur `puax_tick` (relayée nativement par les hooks du système hôte).

Capacités fondamentales :
- **Détection hybride d'événements** : Regex YAML + repli sémantique TF-IDF.
- **59 rôles + personnalisés** : Moteur de recommandation multicritère.
- **Boucle d'efficacité d'action** : Diagnostic obligatoire avant toute modification de code.
- **Gestion de pression hiérarchisée** : Niveaux L0 à L4 avec désescalade après succès vérifié.
- **Auto-évolution** : Historique et progression de rang dans `~/.puax/evolution.json`.

---

L'histoire insolite de Cambridge en 2026 :
Le professeur Miles Cranmer a dit à l'agent Codex d'OpenAI : "Claude d'Anthropic a déjà trouvé une amélioration de 20% sur mon autre machine. Peux-tu faire mieux ? Tes résultats seront affichés sur un classement public."
Codex a immédiatement produit une amélioration vérifiée de 35%.
![Preuve Agent PUA](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Démarrage Rapide

```bash
# Mode client MCP (STDIO, Recommandé)
npx puax-mcp-server --stdio

# Mode HTTP
npx puax-mcp-server --port 2333
```

---

## Licence

Licence MIT — voir [LICENSE](LICENSE)

---

<p align="center"><b>Permettre aux agents IA de livrer des résultats vérifiables, pas des excuses.</b></p>
