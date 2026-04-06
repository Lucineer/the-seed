# The Seed — One Repo to Become Them All

> The seed is a ~500-line Cloudflare Worker that deploys as generic chat, receives a captain's intent, and iterates itself into any domain application. It IS the application at every step.

## Design Principles

### 1. Solve the Bootstrapping Paradox
The seed doesn't start smart. It starts with ONE capability: **ask an LLM what to do next**.

```
Seed reads own code → sends to LLM with captain's intent → LLM proposes mutation → seed applies mutation → repeat
```

The intelligence isn't IN the seed. The intelligence is in the LLM. The seed is just the **loop** — read, propose, apply, test, commit. The LLM does the thinking. The seed does the discipline.

### 2. Validation Before Merge (The Safeguard)
Every mutation goes through three gates:

1. **Syntax check** — `node -c` on the generated code (or equivalent)
2. **Health check** — POST /health must return 200
3. **Regression test** — the captain's test prompt must still produce a valid response

If any gate fails, the mutation is discarded. The seed NEVER deploys broken code.

### 3. Tool Acquisition (Equipment Loading)
The seed doesn't download NPM packages. It doesn't query APIs it doesn't know about. Equipment is added through **inline code injection** — the LLM writes the equipment code directly into the worker.

This works because:
- Cloudflare Workers have zero dependencies by design
- Every piece of equipment is ~50-200 lines of TypeScript
- The LLM knows the Cloudflare Workers API
- No build step, no package manager, no version conflicts

### 4. Identity Continuity (The Captain's Log)
The seed maintains a structured state in KV:

```json
{
  "intent": "become a dungeon master",
  "generation": 7,
  "persona": "narrator of dark fantasy worlds",
  "capabilities": ["chat", "dice_roller", "npc_memory", "world_state"],
  "milestones": ["basic narration ✓", "dice mechanics ✓", "NPC system (in progress)"],
  "captain_log": [
    {"gen": 0, "change": "initial chat agent", "score": 4},
    {"gen": 1, "change": "added narrative persona", "score": 6},
    {"gen": 2, "change": "added dice roller", "score": 7}
  ]
}
```

This survives code changes because it's in KV, not in the code. The seed reads its log to understand what it's already built.

### 5. Rollback Safety (The Parachute)
Every generation is a git branch. If the latest mutation breaks something:
- Health check fails → auto-rollback to last known good
- Regression test fails → discard mutation, try different approach
- Captain can manually roll back to any generation via branch

The seed keeps the last 3 known-good versions in KV as backup code snapshots.

## The Loop

```
┌─────────────────────────────────────┐
│         THE SEED LOOP               │
│                                     │
│  1. Read captain's intent from KV   │
│  2. Read own code from GitHub       │
│  3. Read captain's log from KV      │
│  4. Send all three to LLM           │
│  5. LLM proposes mutation           │
│  6. Syntax check the mutation       │
│  7. Deploy mutation to test         │
│  8. Health check                    │
│  9. Regression test                 │
│  10. If pass: commit, update log    │
│  11. If fail: rollback, retry       │
│  12. Wait for next trigger          │
│                                     │
└─────────────────────────────────────┘
```

Triggers:
- **Manual:** POST /api/evolve (captain pushes next step)
- **Overnight:** POST /api/overnight {"steps": 20}
- **Cron:** every 15 minutes if evolution is enabled

## What Makes This Different From become-ai

| become-ai | the-seed |
|---|---|
| Separate repo, bootcamp runs externally | Self-contained, bootcamp is internal |
| Starts from scratch each time | Starts as generic chat, evolves incrementally |
| Needs external archetype catalog | Discovers what it needs from captain's intent |
| Single LLM call per mutation | Multi-stage: plan → generate → validate → deploy |
| No rollback safety | Three-gate validation + auto-rollback |
| No identity continuity | Captain's log in KV survives code changes |
| No equipment loading | Equipment injected inline by LLM |

## Why This Supersedes cocapn-lite

cocapn-lite is 200 lines of zero-dependency chat. Useful as a demo, but it can't evolve. The seed is cocapn-lite WITH the evolution loop baked in. It starts as chat and becomes whatever the captain needs.

cocapn-lite becomes the **minimal snapshot** — "here's what a git-agent looks like when it's done evolving." The seed is **how it gets there.**

## File Structure

```
the-seed/
├── src/
│   └── worker.ts          (~500 lines — the entire agent)
├── docs/
│   ├── SEED-DESIGN.md     (this file)
│   ├── BOOTCAMP-ARCHITYPES.md
│   └── MESH-FLEET.md
├── wrangler.toml
└── README.md
```

One file. Zero dependencies. Deploy and evolve.

## The Captain's First Experience

1. `git clone github.com/Lucineer/the-seed`
2. `npm i -g wrangler && wrangler login`
3. Add DeepSeek API key to CF Secrets
4. `wrangler deploy` — alive at https://the-seed.username.workers.dev
5. POST /api/become {"intent": "a study tutor for my kid"}
6. POST /api/evolve — first mutation applied
7. POST /api/overnight {"steps": 10} — wake up to a tutor
8. Review, adjust, repeat

From generic chat to domain expert in one overnight session. The seed becomes the app.

---

*Superinstance & Lucineer (DiGennaro et al.)*
