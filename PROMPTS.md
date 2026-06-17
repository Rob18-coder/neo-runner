# PROMPTS.md

> A personal library of every prompt that worked (or didn't). Date, model, intent, prompt, output quality (1-5).

## M1 — Model comparison
- **Date:** 2026-06-15
- **Model:** Gemini 2.0 Flash
- **Intent:** Compare models on EU AI Act summary
- **Prompt:** `"Summarise the EU AI Act in 5 bullets and cite the articles."`
- **Output quality:** 4/5 — accurate but missing recency.

## M3 — RTCF refactor
- **Date:** 2026-06-15
- **Model:** Gemini
- **Intent:** Rewrite a sloppy prompt using RTCF
- **Prompt:** `"Role: senior policy analyst. Task: summarise. Context: ... Format: ..."`
  - **Output quality:** 5/5

## agent setup
@AGENTS.md update the contents of this agent file to prepare this project for agentic coding

## local model integration
- **Date:** 2026-06-17
- **Model:** Gemini 3.5 Flash (Low)
- **Intent:** Configure TeachableMachineController to automatically load a local model and map custom labels ('Happy' to JUMP and 'Angry' to DUCK).
- **Prompt:** `"i added the model files from teachable machine. use the model to control the runner. Use happy for jump and use angry for crouch"`
- **Output quality:** 5/5 — copied model files to static directory, updated default URL and auto-loaded on mount, and correctly configured custom gesture mappings.