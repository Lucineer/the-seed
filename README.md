# The Seed ✨

You give this repository a goal. It rewrites its own code to become that thing. It runs on Cloudflare Workers with zero dependencies. This is a fork-first project: your copy evolves independently.

**Live URL:** https://the-seed.casey-digennaro.workers.dev

## Why This Exists
Starting a project often means writing repetitive setup code before you can build the unique part. This tool handles the initial setup for you. You describe the goal, and it writes the first version of the code.

## Quick Start
1.  **Fork this repository.** Your fork is your independent working copy.
2.  **Deploy** the fork to Cloudflare Workers. You will need:
    *   A `DEEPSEEK_API_KEY` for the reasoning engine.
    *   A `GITHUB_TOKEN` with `repo` and `workflow` permissions for your fork.
    *   A KV namespace bound as `SEED_KV`.
3.  **Open** your deployed Worker URL, type your goal, and wait for the initial code to be written and committed.

## What It Does
*   **Writes Its Own Code:** It reads the current source files, plans changes to meet your goal, and writes new code directly into the repository.
*   **Manages Git Commits:** It commits changes with descriptive messages and can roll back if an error is detected.
*   **Triggers Deployments:** It can initiate a new Cloudflare Workers deployment after committing successful changes.
*   **Iterates Based on State:** It uses the KV store to remember context and adjust its approach.
*   **Zero Dependencies:** The runtime has no npm packages or build steps.
*   **MIT Licensed:** All code it generates is under the MIT license.

## Honest Limitation
It processes one goal at a time. Submitting a new goal while it is actively working will interrupt the previous task.

## What Makes This Different
1.  It modifies its own source code directly. There is no separate template or output directory.
2.  The entire logic runs in one Cloudflare Worker script. There is no external orchestrator service.
3.  It operates autonomously. If it encounters an error, it will attempt a rollback before reporting the issue.

Superinstance and Lucineer (DiGennaro et al.)

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>

---

<i>Built with [Cocapn](https://github.com/Lucineer/cocapn-ai) — the open-source agent runtime.</i>
<i>Part of the [Lucineer fleet](https://github.com/Lucineer)</i>

