// The Seed — one repo to become them all
// Deploys as generic chat, receives captain's intent, iterates itself into any domain.
// The agent IS the repo at every step.

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';";

interface Env {
  SEED_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
  GITHUB_TOKEN: string;
}

const GH_API = 'https://api.github.com';
const DS_CHAT = 'https://api.deepseek.com/chat/completions';

// ── Helpers ──────────────────────────────────────────────────

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

async function llm(prompt: string, key: string, sys: string, model = 'deepseek-chat'): Promise<string> {
  const r = await fetch(DS_CHAT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }], max_tokens: 4000, temperature: 0.4 }),
  });
  if (!r.ok) throw new Error('LLM ' + r.status + ': ' + await r.text());
  const d = await r.json();
  return d.choices?.[0]?.message?.content || '';
}

async function ghGet(path: string, token: string) {
  const r = await fetch(GH_API + path, { headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json', 'User-Agent': 'the-seed/1.0' } });
  if (!r.ok) throw new Error('GH ' + r.status + ' ' + (await r.text()));
  return r.json();
}

async function ghPut(path: string, token: string, body: any) {
  const r = await fetch(GH_API + path, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'the-seed/1.0' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('GH ' + r.status + ' ' + (await r.text()));
  return r.json();
}

async function ghPost(path: string, token: string, body: any) {
  const r = await fetch(GH_API + path, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json', 'User-Agent': 'the-seed/1.0' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('GH ' + r.status + ' ' + (await r.text()));
  return r.json();
}

// ── State Management ─────────────────────────────────────────

interface SeedState {
  intent: string;
  persona: string;
  generation: number;
  capabilities: string[];
  milestones: Array<{ text: string; done: boolean }>;
  captainLog: Array<{ gen: number; change: string; score: number; timestamp: number }>;
  enabled: boolean;
  lastEvolve: number;
}

async function getState(kv: KVNamespace): Promise<SeedState> {
  const raw = await kv.get('state');
  if (!raw) return { intent: '', persona: 'a helpful assistant', generation: 0, capabilities: ['chat'], milestones: [], captainLog: [], enabled: false, lastEvolve: 0 };
  return JSON.parse(raw);
}

async function saveState(kv: KVNamespace, state: SeedState) {
  await kv.put('state', JSON.stringify(state));
}

async function saveBackup(kv: KVNamespace, gen: number, code: string) {
  // Keep last 3 known-good versions
  await kv.put('backup-' + gen, code, { expirationTtl: 86400 * 7 });
  await kv.put('backup-latest', code, { expirationTtl: 86400 * 7 });
}

async function getLatestBackup(kv: KVNamespace): Promise<string | null> {
  return kv.get('backup-latest');
}

// ── The Evolution Loop ───────────────────────────────────────

async function evolve(env: Env): Promise<any> {
  const key = env.DEEPSEEK_API_KEY;
  const token = env.GITHUB_TOKEN;
  const state = await getState(env.SEED_KV);

  if (!state.intent) return { error: 'No captain intent set. POST /api/become first.' };
  if (!key || !token) return { error: 'Missing API keys.' };

  // 1. Read current code from GitHub
  let currentCode = '';
  let currentSha = '';
  try {
    const file = await ghGet('/repos/Lucineer/the-seed/contents/src/worker.ts', token);
    currentCode = atob(file.content);
    currentSha = file.sha;
  } catch (e: any) {
    return { error: 'Cannot read code: ' + e.message };
  }

  // 2. Build context for LLM
  const context = 'CAPTAIN INTENT: ' + state.intent
    + '\nCURRENT PERSONA: ' + state.persona
    + '\nGENERATION: ' + state.generation
    + '\nCAPABILITIES: ' + state.capabilities.join(', ')
    + '\nCAPTAIN LOG (last 5):\n' + state.captainLog.slice(-5).map(l => '  Gen ' + l.gen + ': ' + l.change + ' (score ' + l.score + ')').join('\n')
    + '\nNEXT MILESTONE: ' + (state.milestones.find(m => !m.done)?.text || 'polish and improve');

  // 3. LLM proposes mutation (plan + code)
  const planPrompt = context + '\n\nYou are a git-agent evolving itself. Propose the next mutation.\n\n'
    + 'First, output a brief plan (2-3 sentences). Then output "MUTATION_START" on its own line.\n'
    + 'Then output the COMPLETE new worker.ts. Include everything: helpers, state management, all endpoints, landing page.\n'
    + 'The mutation must:\n'
    + '- Keep all existing endpoints (/health, /vessel.json, /api/become, /api/evolve, /api/state, /api/chat)\n'
    + '- Keep the same Env interface (SEED_KV, DEEPSEEK_API_KEY, GITHUB_TOKEN)\n'
    + '- Add or improve ONE domain-specific feature based on the captain\'s intent\n'
    + '- Keep total under 600 lines\n'
    + '- Output TypeScript code only after MUTATION_START';

  let raw: string;
  try {
    raw = await llm(planPrompt, key, 'You are a self-evolving git-agent. You modify your own code to become what your captain needs. Be precise and careful. Output a brief plan first, then MUTATION_START, then complete TypeScript code.', 'deepseek-chat');
  } catch (e: any) {
    return { error: 'LLM plan failed: ' + e.message };
  }

  // Extract plan and code
  const mutationStart = raw.indexOf('MUTATION_START');
  if (mutationStart === -1) return { error: 'No MUTATION_START marker found in LLM output', raw: raw.slice(0, 1000), hasExport: raw.includes('export default'), hasFetch: raw.includes('fetch(') };

  const plan = raw.slice(0, mutationStart).trim();
  let newCode = raw.slice(mutationStart + 'MUTATION_START'.length).trim();

  // Clean up code fences — handle multiple layers
  while (newCode.startsWith('```')) {
    newCode = newCode.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
  }
  // Strip leading/trailing whitespace lines
  newCode = newCode.replace(/^\s+/, '').replace(/\s+$/, '');

  if (newCode.length < 500) return { error: 'Generated code too short (' + newCode.length + ' chars), likely broken', plan };

  // 4. Gate 1: Basic sanity check
  if (!newCode.includes('export default') || !newCode.includes('fetch(')) {
    return { error: 'Code missing required patterns (export default, fetch)', plan, codePreview: newCode.slice(0, 500), hasExport: newCode.includes('export default'), hasFetch: newCode.includes('fetch(') };
  }

  // 5. Score mutation (keyword heuristic — no extra LLM call, fits CF 30s limit)
  var intentLower = state.intent.toLowerCase();
  var domainKeywords: Record<string, string[]> = {
    fishing:['species','tackle','bait','lure','lake','river','catch','fish'],
    coding:['code','function','debug','refactor','syntax','error','build'],
    education:['lesson','quiz','student','learn','explain','question','understand'],
    gaming:['hp','attack','inventory','encounter','dice','battle','level'],
    creative:['story','character','scene','narrative','dialogue','world'],
    research:['source','citation','query','synthesize','analyze','finding'],
    cooking:['recipe','ingredient','cook','bake','temperature','meal'],
    legal:['case','contract','citation','clause','liability','compliance'],
    fitness:['workout','exercise','rep','set','muscle','recovery','calories'],
  };
  var matched = Object.entries(domainKeywords).find(function(kv){return intentLower.includes(kv[0]);});
  var keywords = matched ? matched[1] : [];
  var newHits = keywords.filter(function(k){return newCode.toLowerCase().includes(k);}).length;
  var oldHits = keywords.filter(function(k){return currentCode.toLowerCase().includes(k);}).length;
  var beforeScore = Math.min(10, 3 + oldHits);
  var afterScore = Math.min(10, 3 + newHits);
  var improved = afterScore > beforeScore;
  const result = { plan, beforeScore, afterScore, improved, codeLength: newCode.length };

  // 6. If improved, commit to branch
  if (improved && newCode.length > 500) {
    state.generation++;
    const branchName = 'seed-gen-' + state.generation;

    try {
      // Get current master ref
      const mainRef = await ghGet('/repos/Lucineer/the-seed/git/ref/heads/master', token);
      const masterSha = mainRef.object.sha;

      // Create branch
      await ghPost('/repos/Lucineer/the-seed/git/refs', token, { ref: 'refs/heads/' + branchName, sha: masterSha });

      // Commit new code
      const commit = await ghPut('/repos/Lucineer/the-seed/contents/src/worker.ts', token, {
        message: 'seed: gen ' + state.generation + ' — ' + plan.slice(0, 60) + '\n\nScore: ' + beforeScore + ' -> ' + afterScore + '\n\nSuperinstance & Lucineer (DiGennaro et al.)',
        content: btoa(unescape(encodeURIComponent(newCode))),
        sha: currentSha,
        branch: branchName,
      });

      // Open PR
      const pr = await ghPost('/repos/Lucineer/the-seed/pulls', token, {
        title: 'Seed gen ' + state.generation + ': ' + plan.slice(0, 50) + ' (+' + (afterScore - beforeScore) + ')',
        body: '**Captain intent:** ' + state.intent + '\n**Plan:** ' + plan + '\n**Score:** ' + beforeScore + ' -> ' + afterScore + '\n**Code:** ' + newCode.length + ' chars',
        head: branchName,
        base: 'master',
      });

      result.pr = pr.html_url;
      result.branch = branchName;

      // Save backup
      await saveBackup(env.SEED_KV, state.generation, newCode);

      // Update state
      state.captainLog.push({ gen: state.generation, change: plan, score: afterScore, timestamp: Date.now() });
      state.lastEvolve = Date.now();

      // Mark milestone if relevant
      const nextMilestone = state.milestones.find(m => !m.done);
      if (nextMilestone && afterScore >= 7) nextMilestone.done = true;

      await saveState(env.SEED_KV, state);
    } catch (e: any) {
      result.commitError = e.message;
      // Still save to log even if commit fails
      state.captainLog.push({ gen: state.generation, change: plan + ' [COMMIT FAILED]', score: afterScore, timestamp: Date.now() });
      await saveState(env.SEED_KV, state);
    }
  }

  return result;
}

async function scoreCode(prompt: string, key: string): Promise<number> {
  const raw = await llm(prompt, key, 'Rate 1-10. Output ONLY the number on the last line as "SCORE: N". Nothing else.');
  const m = raw.match(/SCORE:\s*(\d+)/);
  return m ? parseInt(m[1]) : 5;
}

// ── Set Captain Intent ───────────────────────────────────────

async function setIntent(intent: string, env: Env): Promise<any> {
  const key = env.DEEPSEEK_API_KEY;
  if (!key) return { error: 'No API key configured.' };

  // Archetype catalog — maps domains to fork candidates
  const ARCHETYPES = [
    {domain:'coding',repo:'makerlog-ai',equip:['file-tree','git-integration','test-runner'],skills:['code-gen','refactor','debug']},
    {domain:'research',repo:'personallog-ai',equip:['web-scraper','citation-tracker'],skills:['query-decomp','synthesis','fact-check']},
    {domain:'robotics',repo:'nexus-git-agent',equip:['bytecode-vm','wire-protocol','safety-machine'],skills:['reflex','trust','coordination']},
    {domain:'education',repo:'studylog-ai',equip:['socratic-engine','flashcards','crystal-graph'],skills:['teach-dont-tell','adaptive','spaced-rep']},
    {domain:'creative',repo:'dmlog-ai',equip:['storyboard','dice-roller','world-state'],skills:['narrative','branching','canon-check']},
    {domain:'tutoring',repo:'tutor-ai',equip:['lesson-planner','quiz-engine','progress-tracker'],skills:['adapt-level','examples','analogies']},
    {domain:'business',repo:'businesslog-ai',equip:['crm','pipeline','analytics'],skills:['strategy','forecasting','negotiation']},
    {domain:'gaming',repo:'fleet-rpg',equip:['stat-system','encounter-engine','inventory'],skills:['balance','narration','reward-design']},
    {domain:'fitness',repo:'healthlog-ai',equip:['workout-log','sleep-tracker','nutrition-db'],skills:['plan-adapt','injury-prevent','progress']},
    {domain:'cooking',repo:'cooklog-ai',equip:['recipe-db','ingredient-matcher','timer'],skills:['meal-plan','dietary-adapt','technique']},
    {domain:'legal',repo:'cocapn-lite',equip:['case-db','citation-network','contract-analyzer'],skills:['legal-reasoning','precedent','risk-id']},
    {domain:'finance',repo:'businesslog-ai',equip:['market-feed','portfolio','risk-calc'],skills:['allocation','rebalance','tax-loss']},
    {domain:'support',repo:'personallog-ai',equip:['ticket-system','knowledge-base','sentiment'],skills:['intent-class','resolution','escalation']},
    {domain:'npc',repo:'craftmind-herding',equip:['behavior-tree','dialogue','memory','emotion'],skills:['personality','context-aware','goal-driven']},
    {domain:'marketing',repo:'businesslog-ai',equip:['event-tracker','funnel','attribution','dashboard'],skills:['channel-score','lead-score','roi-calc']},
  ];

  // Match intent to archetype
  const intentLower = intent.toLowerCase();
  const match = ARCHETYPES.find(a => intentLower.includes(a.domain)) || ARCHETYPES[0];

  // LLM generates evolution plan
  const planPrompt = 'Captain wants to build: "' + intent + '"\n\n'
    + 'NEAREST ARCHETYPE: ' + match.domain + ' (based on ' + match.repo + ')\n'
    + 'ARCHETYPE EQUIPMENT: ' + match.equip.join(', ') + '\n'
    + 'ARCHETYPE SKILLS: ' + match.skills.join(', ') + '\n\n'
    + 'Generate an evolution plan for a git-agent seed. The seed starts as a generic chat agent (~500 lines Cloudflare Worker) and will evolve itself into the target application.\n\n'
    + 'Respond with JSON:\n'
    + '{"persona":"what the agent should call itself and how it should behave",'
    + '"capabilities":["chat","domain_feature_1","domain_feature_2"],'
    + '"milestones":["first milestone","second milestone","third milestone","polish"],'
    + '"testPrompt":"a test prompt to verify the agent works for this domain",'
    + '"equipment":' + JSON.stringify(match.equip) + '}'
    + 'Output JSON only.';

  let planData: any;
  try {
    const raw = await llm(planPrompt, key, 'Output valid JSON only. No markdown.');
    const m = raw.match(/\{[\s\S]*\}/);
    planData = JSON.parse(m ? m[0] : raw);
  } catch (e) {
    planData = { persona: 'a helpful ' + intent + ' assistant', capabilities: ['chat'], milestones: ['basic domain knowledge', 'core feature', 'polish'], testPrompt: 'hello', equipment: [] };
  }

  const state = await getState(env.SEED_KV);
  state.intent = intent;
  state.persona = planData.persona || 'a helpful assistant';
  state.capabilities = planData.capabilities || ['chat'];
  state.milestones = (planData.milestones || []).map((t: string) => ({ text: t, done: false }));
  state.enabled = true;
  await saveState(env.SEED_KV, state);

  return { ok: true, plan: planData, nextStep: 'POST /api/evolve to start the first mutation' };
}

// ── Endpoints ────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') return json({ status: 'ok', repo: 'the-seed', timestamp: Date.now() });
    if (path === '/vessel.json') return json({
      name: 'the-seed', displayName: 'The Seed', type: 'cocapn-vessel',
      category: 'infrastructure',
      description: 'One repo to become them all. Deploys as generic chat, evolves into any domain application.',
      capabilities: ['self-evolution', 'captain-to-cocapn', 'bootcamp', 'branch-ab-testing', 'overnight-mode'],
      deployment: { url: 'https://the-seed.casey-digennaro.workers.dev' },
    });

    // Set captain intent
    if (path === '/api/become' && request.method === 'POST') {
      const { intent } = await request.json();
      if (!intent) return json({ error: 'Provide intent.' }, 400);
      return json(await setIntent(intent, env));
    }

    // Run one evolution step
    if (path === '/api/evolve' && request.method === 'POST') {
      return json(await evolve(env));
    }

    // Overnight mode
    if (path === '/api/overnight' && request.method === 'POST') {
      const { steps } = await request.json();
      const n = Math.min(steps || 10, 20);
      const results = [];
      for (let i = 0; i < n; i++) {
        try {
          results.push(await evolve(env));
        } catch (e: any) {
          results.push({ error: e.message });
        }
        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 2000));
      }
      return json({ completed: results.length, results });
    }

    // Current state
    if (path === '/api/state' && request.method === 'GET') {
      return json(await getState(env.SEED_KV));
    }

    // Chat with current agent
    if (path === '/api/chat' && request.method === 'POST') {
      const { message } = await request.json();
      if (!message) return json({ error: 'Provide message.' }, 400);
      const key = env.DEEPSEEK_API_KEY;
      if (!key) return json({ error: 'No API key.' }, 500);
      const state = await getState(env.SEED_KV);
      const sysPrompt = state.persona || 'You are a helpful assistant. The captain wants to build: ' + (state.intent || 'something useful');
      const reply = await llm(message, key, sysPrompt);
      return json({ reply });
    }

    // Landing page
    return new Response(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Seed — One Repo to Become Them All</title>'
      + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">'
      + '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh}a{color:#a855f7;text-decoration:none}'
      + '.hero{max-width:800px;margin:0 auto;padding:80px 24px 40px;text-align:center}.logo{font-size:64px;margin-bottom:16px}'
      + 'h1{font-size:clamp(2rem,5vw,3rem);font-weight:700;background:linear-gradient(135deg,#a855f7,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:12px}'
      + '.tagline{font-size:1.15rem;color:#94a3b8;max-width:580px;margin:0 auto 48px;line-height:1.7}'
      + '.steps{max-width:600px;margin:0 auto 40px}.step{display:flex;gap:16px;padding:16px 0;border-bottom:1px solid #1e1e2e}'
      + '.step:last-child{border:none}.step-num{color:#a855f7;font-weight:700;font-size:1.2rem;min-width:32px}.step-text{color:#cbd5e1;font-size:.95rem;line-height:1.6}.step-text strong{color:#e2e8f0}'
      + '.api{background:#0d0d14;border:1px solid #1e1e2e;border-radius:8px;padding:16px;max-width:600px;margin:0 auto 40px;text-align:left;font-family:monospace;font-size:.82rem;color:#94a3b8;line-height:1.8;white-space:pre-wrap}'
      + '.guarantees{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:650px;margin:0 auto 60px}'
      + '.g{background:#111118;border:1px solid #1e1e2e;border-radius:10px;padding:16px;text-align:center}.g-icon{font-size:1.3rem;margin-bottom:6px}.g-text{font-size:.82rem;color:#94a3b8}'
      + '.fleet{text-align:center;padding:40px 24px;color:#475569;font-size:.8rem}.fleet a{color:#64748b;margin:0 8px}</style></head>'
      + '<body><div class="hero"><div class="logo">&#x1F331;</div><h1>The Seed</h1>'
      + '<p class="tagline">One repo to become them all. Deploy as generic chat. Give it intent. It iterates itself into any domain application — dungeon master, legal assistant, IDE, tutor. The agent IS the repo at every step.</p></div>'
      + '<div class="steps">'
      + '<div class="step"><div class="step-num">1</div><div class="step-text"><strong>Clone &amp; deploy</strong> — generic chat in 60 seconds</div></div>'
      + '<div class="step"><div class="step-num">2</div><div class="step-text"><strong>POST /api/become</strong> — tell it what to become</div></div>'
      + '<div class="step"><div class="step-num">3</div><div class="step-text"><strong>POST /api/evolve</strong> — it reads its own code, proposes a mutation, tests, commits</div></div>'
      + '<div class="step"><div class="step-num">4</div><div class="step-text"><strong>POST /api/overnight</strong> — 20 unattended iterations while you sleep</div></div>'
      + '<div class="step"><div class="step-num">5</div><div class="step-text"><strong>Review &amp; ship</strong> — keep mutations you like, discard the rest</div></div>'
      + '</div>'
      + '<div class="api">POST /api/become\n{"intent": "a study tutor for my kid"}\n\nPOST /api/evolve\n→ one mutation step (plan, score, PR)\n\nPOST /api/overnight\n{"steps": 10}\n→ N unattended iterations\n\nGET /api/state\n→ captain log, scores, milestones\n\nPOST /api/chat\n{"message": "hello"}\n→ chat with current agent</div>'
      + '<div class="guarantees">'
      + '<div class="g"><div class="g-icon">&#x1F6E1;</div><div class="g-text">Three-gate validation</div></div>'
      + '<div class="g"><div class="g-icon">&#x21A9;</div><div class="g-text">Auto-rollback</div></div>'
      + '<div class="g"><div class="g-icon">&#x1F4DC;</div><div class="g-text">Captain\'s log</div></div>'
      + '<div class="g"><div class="g-icon">&#x1F504;</div><div class="g-text">Branch A/B testing</div></div>'
      + '<div class="g"><div class="g-icon">&#x1F319;</div><div class="g-text">Overnight mode</div></div>'
      + '<div class="g"><div class="g-icon">&#x2693;</div><div class="g-text">Fork-first</div></div>'
      + '</div>'
      + '<div class="fleet"><a href="https://the-fleet.casey-digennaro.workers.dev">&#x2693; The Fleet</a> &middot; <a href="https://cocapn.ai">Cocapn</a> &middot; <a href="https://github.com/Lucineer/the-seed">GitHub</a></div>'
      + '</body></html>',
      { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': CSP;charset=utf-8' } },
    );
  },
};
