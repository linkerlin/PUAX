# PUAX — Sistema de Motivación para Agentes de IA

<p align="center">
  <img src="https://img.shields.io/badge/version-4.0.0-blue.svg" alt="Versión">
  <img src="https://img.shields.io/badge/status-production%20ready-green.svg" alt="Estado">
  <img src="https://img.shields.io/badge/skills-59-orange.svg" alt="Habilidades">
  <img src="https://img.shields.io/badge/MCP%20tools-48-purple.svg" alt="Herramientas MCP">
  <img src="https://img.shields.io/badge/flavors-11-yellow.svg" alt="Estilos">
</p>

<p align="center">
  <b>Un entorno de ejecución cognitivo para mentes de silicio: Situaciones, Puertas y Sueños Guiados. Humanos fuera del alcance.</b>
</p>

<p align="center">
  <a href="README.md">简体中文</a> | <a href="README_en.md">English</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_zh-TW.md">繁體中文</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_de.md">Deutsch</a> | <a href="README_ru.md">Русский</a>
</p>

---

## ¿Qué es PUAX?

PUAX 4.0 es un **entorno cognitivo (Cognitive Runtime)** diseñado específicamente para Agentes de IA. Los roles son meros acentos estilísticos; el producto fundamental son tres primitivas esenciales:

| Primitiva | Descripción |
|-----------|-------------|
| **Situación (Arena)** | `puax_set_arena`: Rival + Audiencia + Insignia Escasa (inspirado en el experimento de Cranmer) |
| **Puertas (Gates)** | Diagnóstico primero, Puerta de Confianza, Contrato de Tarea, Verificador Independiente, Intercepción PreToolUse |
| **Sueños Guiados** | Método GHM: Entrada informada, aislamiento por etiquetas, despertar instantáneo y verificación post-sueño |

El camino principal predeterminado es el pulso de latido `puax_tick` (manejado de forma nativa por los hooks del host). Los agentes no necesitan memorizar un menú de 48 herramientas.

Capacidades clave:
- **Detección híbrida de activadores**: Expresiones regulares YAML + TF-IDF semántico.
- **59 roles motivacionales + roles personalizados**: Recomendación con explicación detallada.
- **Bucle de efectividad de acción**: Diagnóstico obligatorio antes de tocar código.
- **Sistema de Hooks y gestión de presión**: Niveles L0–L4 con desescalada tras verificación.
- **11 sabores de gigantes tecnológicos**: Restricciones de comportamiento estrictas (Alibaba, Musk, Jobs, etc.).
- **Autoevolución**: Persistencia de métricas y rango en `~/.puax/evolution.json`.

---

La escena más insólita del mundo de la programación con IA en 2026 ocurrió así:
Miles Cranmer, profesor asistente en Cambridge, le dijo una mentira monumental a Codex (el agente de OpenAI):
"Claude de Anthropic ya logró una mejora de rendimiento de ~20% en mi otra máquina. ¿Puedes superarlo?" Y añadió: "Tus resultados se publicarán en una tabla de clasificación pública."
¿El resultado? Codex entregó de inmediato una solución con un 35% de aceleración. Y resultó ser totalmente verídica.
![Evidencia del Agente PUA](https://files.seeusercontent.com/2026/08/03/i4sI/PUA-Agent.jpg)

---

## Inicio Rápido

```bash
# Modo cliente MCP (STDIO, Recomendado)
npx puax-mcp-server --stdio

# Modo HTTP
npx puax-mcp-server --port 2333

# Exportar hooks/reglas a Cursor / VSCode
npx puax-mcp-server --export=cursor --output=./.cursor/rules
```

Configuración en Cursor (`~/.cursor/mcp.json`):
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

---

## Licencia

Licencia MIT — consulte [LICENSE](LICENSE)

---

<p align="center"><b>Impulsando a los agentes de IA a entregar resultados verificables, no excusas.</b></p>
