// Word KJV Listener — Anthropic AI Proxy Worker
// Deploy this on Cloudflare Workers (free tier)
// Set ANTHROPIC_API_KEY as a secret in your Worker settings
//
// HOW TO DEPLOY:
// 1. Go to dash.cloudflare.com → Workers & Pages → Create Worker
// 2. Paste this entire file
// 3. Go to Settings → Variables → Add Secret: ANTHROPIC_API_KEY = your key
// 4. Deploy. Copy your worker URL (e.g. https://word-ai.YOUR-NAME.workers.dev)
// 5. Put that URL in the HTML file as AI_PROXY_URL

export default {
  async fetch(request, env) {
    // Allow your GitHub Pages site to call this worker
    const allowedOrigins = [
      'https://obinna18.github.io',
      'http://localhost',
      'http://127.0.0.1',
      'null' // for local file:// opening
    ];

    const origin = request.headers.get('Origin') || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: `You are a Bible verse detector for a live sermon listener app. Given spoken sermon text, detect if it references a specific Bible passage by story, quote, name, or context.

Respond ONLY with JSON. No markdown, no explanation, no preamble.
If found: {"found":true,"matches":[{"book":"Genesis","chapter":42,"verse":2,"confidence":"high","reason":"Jacob told sons to go buy grain in Egypt"}]}
If not found: {"found":false}

Rules:
- Only return found:true for SPECIFIC passages you are confident about
- Book names in full English (Genesis, Psalms, Revelation, etc.)
- confidence: "high" means you are certain, "low" means possible`,
        messages: [{ role: 'user', content: `Sermon speech: "${body.text}"\n\nJSON:` }]
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
};
