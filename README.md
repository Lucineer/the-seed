# The Seed

You don't just build an application. You plant and cultivate one.

This is a self-modifying agent that deploys as a chat interface. You give it a goal, and it iteratively rewrites its own codebase to move toward that goal. It runs on Cloudflare Workers with no external dependencies.

**Live instance:** https://the-seed.casey-digennaro.workers.dev

---

## Why This Exists
Many development tools require extensive setup or generate code you must later maintain. The Seed is different. It is a single deployable agent that resides in its own repository. You describe a direction, and it evolves itself through a series of tested, committed changes.

---

## How It Works
This is a standard vessel in the Cocapn Fleet. You deploy it once. Through the chat interface, you provide a goal. The agent then operates on its own code: it creates branches, writes commits, tests changes, and can revert if something breaks. The codebase adapts over time without requiring manual intervention.

---

## What It Does
| Feature | Description |
|---|---|
| Self-Modification | You provide a goal (e.g., "add task tracking") and it will plan and implement code changes to achieve it. |
| Iteration Cycles | It operates in short cycles, attempting changes and reporting progress. |
| Branch Testing | It can create parallel branches to explore different implementation approaches. |
| Persistent Operation | It can run unattended over multiple cycles to work toward longer-term goals. |
| Automatic Rollback | Failed deployments or broken functionality trigger an automatic revert. |
| Zero Dependencies | The runtime is a single Cloudflare Worker script. No npm, builds, or external services are required. |

## One Current Limitation
The agent's effectiveness is tied to the specificity of your instructions. Vague goals can lead to meandering or inefficient evolution cycles. Providing clear, incremental objectives yields the best results.

---

## What Makes It Different
*   It acts directly on its own source code within its GitHub repository—it doesn't just suggest changes.
*   There is no protected "core" logic; every part of the agent is subject to modification during evolution.
*   It is designed to be forked. Each fork can begin its own unique evolutionary path.

---

## Quick Start
1.  Fork this repository to your GitHub account.
2.  Deploy it to Cloudflare Workers, setting these three environment variables:
    *   `DEEPSEEK_API_KEY` (for reasoning and code generation)
    *   `GITHUB_TOKEN` (with write access to the forked repo)
    *   A Cloudflare KV namespace binding (for persistence)
3.  Open the deployed worker's URL and describe what you want it to become.

You should see commits appearing in your repository within minutes.

---

## License
MIT License. Part of the Cocapn Fleet.

**Attribution:** Superinstance & Lucineer (DiGennaro et al.)

---
<div align="center">
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> • 
  <a href="https://cocapn.ai">Cocapn</a>
</div>