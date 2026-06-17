# AGENTS.md

## What lives here
This repository is built and maintained with the help of AI coding agents.

It is a React 19 web application built using Vite, TypeScript, and Tailwind CSS v4. It features a Teachable Machine controller (`src/components/TeachableMachineController.tsx`) and an interactive game (`src/components/GameCanvas.tsx`).

### Project Tech Stack & Structure
- **Frontend Framework**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Key Files**:
  - [App.tsx](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/src/App.tsx): Main application wrapper and state.
  - [GameCanvas.tsx](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/src/components/GameCanvas.tsx): Core interactive game component.
  - [TeachableMachineController.tsx](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/src/components/TeachableMachineController.tsx): Integrates machine learning/camera controls.
  - [types.ts](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/src/types.ts): Main TypeScript definitions.
  - [audio.ts](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/src/utils/audio.ts): Audio utility manager.

## Models in use
- Gemini (cloud) — used for content generation, brainstorming.
- Gemma 4 2B via Ollama or LM Studio (local) — used for offline work and code review.

## Verification Commands
Before submitting pull requests or completing tasks, verify using these commands:
- **Type Checking**: `npm run lint` (runs `tsc --noEmit`)
- **Production Build**: `npm run build` (runs `vite build`)
- **Development Server**: `npm run dev` (runs `vite --port=3000 --host=0.0.0.0`)

## Development & Tracking Workflow
AI agents should follow this workflow to maintain repository consistency:
1. **Planning**: If a task requires major changes, create or update `implementation_plan.md` in the workspace/artifact directory and request user review.
2. **Task Management**: Update status in [TASK.md](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/TASK.md):
   - Mark in-progress tasks with `- [/]`
   - Mark completed tasks with `- [x]`
3. **Prompt Log**: Keep track of successful prompts or patterns used for feature generation in [PROMPTS.md](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/PROMPTS.md).
4. **Verification**: Always run `npm run lint` and `npm run build` to ensure no compiler/type issues are introduced.

## Configuration & Integration Details
### Environment Setup
- `GEMINI_API_KEY`: Required for optional Gemini AI API calls. Configurable via `.env.local` or injected in the AI Studio environment.
- `APP_URL`: The runtime base URL of the application.

### Tech Integrations & Styling
- **Styling**: Tailwind CSS v4 is used. Custom fonts, animations, or utilities should be declared in [index.css](file:///c:/Users/DTC%20USER/Desktop/DAJAY/neo-runner/src/index.css).
- **Teachable Machine**: Loads models dynamically from a TensorFlow.js hosted URL. The system matches user-trained gesture labels to `GameControlAction` entries.

## Responsible AI rules
- Every model output is reviewed by a human before it is merged.
- No personal data, credentials, or proprietary code is sent to a public model.
- AI assistance is disclosed in PR descriptions and in the README footer.
- Known limitations: small local models may hallucinate citations; we verify every citation against the source PDF.
- High-risk changes (auth, payments, student records) require a second human reviewer.

## Escalation
If a model produces something that looks wrong, stop and ask a human.

