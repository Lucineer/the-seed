export interface Env {
  SEED_KV: KVNamespace;
  DEEPSEEK_API_KEY: string;
  GITHUB_TOKEN: string;
}

interface FishingSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  habitat: string[];
  bestBait: string[];
  techniques: string[];
  sizeRange: string;
  funFact: string;
}

const SPECIES_DB: FishingSpecies[] = [
  {
    id: "largemouth_bass",
    commonName: "Largemouth Bass",
    scientificName: "Micropterus salmoides",
    habitat: ["freshwater lakes", "ponds", "slow rivers", "weed beds"],
    bestBait: ["plastic worms", "crankbaits", "spinnerbaits", "live minnows"],
    techniques: ["topwater fishing", "jigging", "casting near structure"],
    sizeRange: "12-24 inches",
    funFact: "Largemouth bass have a distinctive lateral line that helps them detect vibrations in the water."
  },
  {
    id: "rainbow_trout",
    commonName: "Rainbow Trout",
    scientificName: "Oncorhynchus mykiss",
    habitat: ["cold streams", "rivers", "mountain lakes"],
    bestBait: ["flies", "spinners", "powerbait", "worms"],
    techniques: ["fly fishing", "drift fishing", "trolling"],
    sizeRange: "10-20 inches",
    funFact: "Rainbow trout are known for their acrobatic jumps when hooked."
  },
  {
    id: "bluegill",
    commonName: "Bluegill",
    scientificName: "Lepomis macrochirus",
    habitat: ["shallow ponds", "lakes", "weed beds"],
    bestBait: ["worms", "crickets", "small jigs", "flies"],
    techniques: ["float fishing", "light tackle", "panfishing"],
    sizeRange: "4-10 inches",
    funFact: "Bluegills are sunfish and often school together in large numbers."
  },
  {
    id: "catfish",
    commonName: "Channel Catfish",
    scientificName: "Ictalurus punctatus",
    habitat: ["rivers", "lakes", "deep holes", "muddy bottoms"],
    bestBait: ["stink bait", "chicken liver", "cut bait", "nightcrawlers"],
    techniques: ["bottom fishing", "still fishing", "night fishing"],
    sizeRange: "12-30 inches",
    funFact: "Catfish have taste buds all over their bodies, especially on their whiskers."
  },
  {
    id: "walleye",
    commonName: "Walleye",
    scientificName: "Sander vitreus",
    habitat: ["deep lakes", "clear rivers", "rocky structures"],
    bestBait: ["jigs", "crankbaits", "live minnows", "nightcrawlers"],
    techniques: ["trolling", "jigging", "drift fishing"],
    sizeRange: "14-28 inches",
    funFact: "Walleye have a reflective layer in their eyes that helps them see in low light."
  }
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Landing page
    if (path === "/") {
      const html = `<!DOCTYPE html>
<html>
<head>
    <title>TackleBox - Your Fishing Companion</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f0f8ff; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 2.5em; color: #1e6ea7; margin-bottom: 10px; }
        .tagline { color: #666; font-size: 1.2em; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card h3 { color: #1e6ea7; margin-top: 0; }
        .endpoint { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; font-family: monospace; }
        .fish-icon { font-size: 3em; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🎣 TackleBox</div>
        <div class="tagline">Your patient, knowledgeable fishing companion</div>
    </div>
    
    <div class="fish-icon">🐟</div>
    
    <p>Welcome aboard, angler! I'm TackleBox, here to help you with all things fishing. Whether you're just starting out or have years of experience, I'm ready to share tips, identify species, and help you log your catches.</p>
    
    <div class="features">
        <div class="card">
            <h3>Chat Companion</h3>
            <p>Ask me anything about fishing techniques, gear, or locations. I'll respond with friendly, practical advice using fishing metaphors you'll appreciate.</p>
        </div>
        <div class="card">
            <h3>Species Database</h3>
            <p>Access detailed information about common fish species including habitat, best baits, techniques, and fun facts.</p>
        </div>
        <div class="card">
            <h3>Location Tips</h3>
            <p>Get location-based fishing advice tailored to different environments and conditions.</p>
        </div>
    </div>
    
    <h2>API Endpoints</h2>
    
    <div class="endpoint">
        <strong>GET /health</strong> - Service health check
    </div>
    
    <div class="endpoint">
        <strong>GET /vessel.json</strong> - Agent configuration
    </div>
    
    <div class="endpoint">
        <strong>POST /api/chat</strong> - Chat with TackleBox
        <br>Body: {"message": "your question"}
    </div>
    
    <div class="endpoint">
        <strong>POST /api/fishing_qa</strong> - Get species information
        <br>Body: {"question": "species name or fishing question"}
    </div>
    
    <div class="endpoint">
        <strong>POST /api/become</strong> - Update agent persona (captain only)
    </div>
    
    <div class="endpoint">
        <strong>POST /api/evolve</strong> - Evolve agent capabilities (captain only)
    </div>
    
    <div class="endpoint">
        <strong>GET /api/state</strong> - Get current agent state
    </div>
    
    <p>Remember: Every day's a good day for fishing! Tight lines! 🎣</p>
</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Health check
    if (path === "/health") {
      return new Response(JSON.stringify({ status: "healthy", service: "TackleBox" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vessel configuration
    if (path === "/vessel.json") {
      const vessel = {
        name: "TackleBox",
        generation: 1,
        persona: "helpful, patient, and knowledgeable fishing companion",
        capabilities: ["chat", "species_identification_guide", "location_based_tips", "fishing_qa"],
        endpoints: [
          "/health",
          "/vessel.json",
          "/api/chat",
          "/api/fishing_qa",
          "/api/become",
          "/api/evolve",
          "/api/state",
        ],
      };
      return new Response(JSON.stringify(vessel, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // API routes
    if (path === "/api/chat") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const { message } = await request.json() as { message?: string };
        if (!message) {
          return new Response(JSON.stringify({ error: "Message is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Simple response logic for fishing companion
        const responses = [
          `Hey there! I'd recommend checking our species database for detailed info. For "${message}", I suggest starting with medium-action rod and 10-12 lb test line. Remember, patience is key - fish when they're biting!`,
          `Great question! For that, I'd look at water temperature and time of day. Early morning or dusk are usually prime times. Have you tried our fishing Q&A feature for species-specific advice?`,
          `Ah, a classic fishing question! Location matters most. Check structure like weed beds or drop-offs. And don't forget to match your bait to the local forage. Tight lines!`,
          `I love helping with questions like that! Consider weather patterns and seasonal movements. Fish tend to be more active before weather changes. Want me to look up specific species details?`
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return new Response(JSON.stringify({
          response: randomResponse,
          persona: "TackleBox",
          suggestion: "Try /api/fishing_qa for species-specific information"
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // New Fishing Q&A endpoint
    if (path === "/api/fishing_qa") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const { question } = await request.json() as { question?: string };
        if (!question) {
          return new Response(JSON.stringify({ error: "Question is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const lowerQuestion = question.toLowerCase();
        
        // Find matching species
        const matchedSpecies: FishingSpecies[] = [];
        for (const species of SPECIES_DB) {
          if (lowerQuestion.includes(species.commonName.toLowerCase()) ||
              lowerQuestion.includes(species.id.toLowerCase()) ||
              lowerQuestion.includes(species.scientificName.toLowerCase()) ||
              species.commonName.toLowerCase().includes(lowerQuestion) ||
              species.habitat.some(h => lowerQuestion.includes(h.toLowerCase())) ||
              species.bestBait.some(b => lowerQuestion.includes(b.toLowerCase()))) {
            matchedSpecies.push(species);
          }
        }

        // General fishing advice for non-specific questions
        if (matchedSpecies.length === 0) {
          const generalAdvice = [
            "For general fishing success, focus on location and timing. Fish are most active during dawn and dusk.",
            "Match your bait to what the fish are naturally eating in that water body. Local knowledge is key!",
            "Pay attention to water temperature and weather patterns. Fish behavior changes with conditions.",
            "Practice proper catch and release techniques to preserve fish populations for future anglers."
          ];

          return new Response(JSON.stringify({
            type: "general_advice",
            question,
            advice: generalAdvice[Math.floor(Math.random() * generalAdvice.length)],
            suggestion: "Try asking about specific species like 'largemouth bass' or 'rainbow trout' for detailed information"
          }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // Return matched species information
        return new Response(JSON.stringify({
          type: "species_info",
          question,
          count: matchedSpecies.length,
          species: matchedSpecies,
          tips: [
            "Remember to check local fishing regulations and obtain proper licenses",
            "Consider water temperature and seasonal patterns when targeting these species",
            "Match your gear to the species size and fighting characteristics"
          ]
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Agent state management
    if (path === "/api/state") {
      const state = {
        persona: "TackleBox - helpful, patient, and knowledgeable fishing companion",
        generation: 1,
        features: ["chat", "species_identification_guide", "location_based_tips", "fishing_qa"],
        species_database_count: SPECIES_DB.length,
        last_updated: new Date().toISOString()
      };
      return new Response(JSON.stringify(state, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Captain-only endpoints
    if (path === "/api/become" || path === "/api/evolve") {
      return new Response(JSON.stringify({ 
        error: "Captain-only endpoint",
        note: "These endpoints require additional authentication setup"
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: "Not found", path }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
};