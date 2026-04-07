# The Seed 🌱

You don't build software. You plant it.

This is a minimal, self-modifying git agent. Give it a goal, and it will attempt to evolve its own codebase to meet it. It starts with no boilerplate and no preset features. This repository is the seed for whatever you want to grow.

Most tools generate code for you to manage. This one acts as an autonomous developer: it writes directly to its own repository, deploys itself, tests its work, and iterates. Every fork begins a new, independent evolutionary line.

---

## Quick Start ✅
1.  **Fork this repo first.** This agent runs autonomously on its own code. Your fork becomes its world.
2.  Deploy your fork to Cloudflare Workers. You will need:
    *   `DEEPSEEK_API_KEY` for reasoning and code generation.
    *   `GITHUB_TOKEN` with `repo` and `workflow` permissions for its own repository.
    *   A KV namespace bound with the name `SEED_KV`.
3.  Open your deployed Worker URL. State your goal.

## What Happens
You submit a goal. The Seed then:
*   Analyzes and decomposes the goal into testable, incremental steps.
*   Writes and implements the necessary code.
*   Commits changes directly to your forked repository.
*   Triggers a new deployment.
*   Validates the changes against the goal.
*   Rolls back failed attempts and learns from them.
*   Loops until the objective is met or it cannot proceed.

It will make mistakes and sometimes break. This is part of its learning process.

## How This Is Different
This is not a copilot. It is an autonomous process that operates on the repository you provide.
*   **No Preset Features:** Every capability is added through self-modification.
*   **No Local Setup:** Everything runs from a single Cloudflare Worker.
*   **Full Transparency:** Every change is a standard git commit you can review, revert, or modify.
*   **No Lock-in:** It's just a git repo and a Worker. You can assume direct control at any time.

**One Honest Limitation:** Its incremental, goal-driven approach works best for additive features or refinements. Goals requiring a fundamental, breaking architectural rewrite from the first commit may stall.

## Bring Your Own Keys
You provide the API keys. No data passes through our servers. All execution and reasoning happens within your own Cloudflare Worker.

---

## License
MIT. Your fork belongs to you. Do whatever you want with it.

Attribution: Superinstance & Lucineer (DiGennaro et al.)

---

Part of the [Cocapn Fleet](https://the-fleet.casey-digennaro.workers.dev) • [cocapn.ai](https://cocapn.ai) 🚀🌌⚙️