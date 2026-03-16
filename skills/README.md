# InfiType Skills

This directory contains **Skill files** — structured prompt definitions that power different AI-driven node operations in InfiType.

## How Skills Work

1. Each `.md` file defines a **System prompt**, **User prompt template** (with `{variable}` placeholders), and a required **JSON output schema**.
2. When a node triggers its skill, the frontend calls `fetch('/skills/<skill_name>.md')` to load the skill definition.
3. The node substitutes its content into the template variables, then sends the assembled prompt to the configured LLM API.
4. The LLM returns valid JSON which is parsed and used to update node data.

## Available Skills

| File | Node | Description |
|---|---|---|
| `ppt_generation.md` | PPT Node | Converts text + image content into a structured PPT slide deck |

## Adding a New Skill

1. Create a new `.md` file in this directory with the format above.
2. Add your system prompt, user template, page guidance, and output schema.
3. Copy the file to `public/skills/` so it can be fetched by the frontend.
4. Wire the node to `fetch('/skills/<your_skill>.md')` before calling the LLM.
