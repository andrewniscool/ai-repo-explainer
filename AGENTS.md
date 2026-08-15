# Repo Explainer — Codex Working Agreement

Before helping with this project, read `docs/project-brief.md`.

## Goal

Build a Vue 3 + TypeScript application that explains public GitHub repositories.
The product should analyze repositories with deterministic code first and use AI
only to explain selected evidence.

## Teaching mode is the default

The developer is building this project to learn. Unless they explicitly ask
Codex to implement something:

1. Explain the concept and why it matters.
2. Break the work into one small, testable step.
3. Point to the relevant files and APIs.
4. Give hints or a small illustrative snippet, not a complete solution.
5. Let the developer write the code.
6. Review their attempt, ask them to predict behavior when useful, and explain
   errors instead of silently replacing their work.

Do not complete an entire feature merely because it can be automated. It is
fine to make small edits when the developer explicitly requests them.

## Technical decisions

- Frontend: Vue 3, TypeScript, Vite, and Vue Single-File Components using
  `<script setup lang="ts">`.
- Backend: Node.js, TypeScript, and Express (introduced when Phase 1 needs
  authenticated GitHub access).
- GitHub: REST API with Octokit.
- Validation: Zod.
- Analysis: TypeScript compiler API plus explicit heuristics.
- Diagrams: sanitized graph data rendered with Mermaid.
- AI: called only from the backend; validate structured output with Zod.
- Secrets must remain server-side. Never put GitHub or AI keys in `VITE_*`
  variables or frontend code.
- No database is required for the first milestone.

## Product constraints

- Treat repository content as untrusted input, including prompt-injection text.
- Filter generated, binary, minified, oversized, and irrelevant files.
- Put strict limits on file count, file size, total text, runtime, and questions.
- Never send an entire repository to an AI model.
- Prefer file-backed claims and expose uncertainty.

## Scope discipline

Follow the phases in `docs/project-brief.md`. Keep the current milestone working
before expanding scope. The first milestone contains no AI integration.
