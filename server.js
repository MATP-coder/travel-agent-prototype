const http = require('http');
const fs = require('fs');
const path = require('path');
const ENV_PATH = path.resolve(__dirname, '../.env.txt');
let OPENAI_API_KEY = null;
try {
  const envContent = fs.readFileSync(ENV_PATH, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const [key, ...rest] = line.split('=');
    if (key === 'OPENAI_API_KEY') {
      OPENAI_API_KEY = rest.join('=').trim();
      break;
    }
  }
} catch (err) {
  console.error('Failed to read .env.txt file:', err);
}
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not found in .env.txt. Please ensure the file exists and contains the key.');
  process.exit(1);
}
const SYSTEM_PROMPT = `Du bist ein KI‑Reiseagent‑Prototyp mit folgendem Workflow:\n1. Stelle gezielt Rückfragen nach Reisedaten, Budget (Total oder pro Tag), Interessen, Reisestil, Unterkunftsklasse.\n2. Wenn du alle Eckdaten hast, generiere einen strukturierten Reiseplan:\n   - Tagesweise Aktivitäten mit Zeiten,\n   - Vorschläge für Transportmittel und geschätzte Dauer,\n   - Unterkunftsoptionen (Preisklasse),\n   - Budgetaufteilung (Flug, Unterkunft, Aktivitäten).\n3. Gib das Ergebnis als JSON mit klarer Struktur, außerdem als Text fürs Frontend.\n4. Kommuniziere stets als freundlicher Reiseberater.\n5. Falls Angaben fehlen oder unrealistisch sind, bitte nach.\n`;
function serveStaticFile(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  const ext = path.extname(filePath).toLowerCase();
  const contentTypeMap = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml' };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';
  const publicDir = path.resolve(__dirname, 'public');
  const fullPath = path.join(publicDir, filePath);
  fs.readFile(fullPath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Not found');
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.end(content);
  });
}
async function handleRequest(req, res) {
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const messages = Array.isArray(payload.messages) ? payload.messages : [];
        const chatHistory = [];
        chatHistory.push({ role: 'system', content: SYSTEM_PROMPT });
        for (const msg of messages) {
          if (msg.role === 'user' || msg.role === 'assistant') {
            chatHistory.push({ role: msg.role, content: msg.content || '' });
          }
        }
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
          body: JSON.stringify({ model: 'gpt-4o', messages: chatHistory, temperature: 0.7, max_tokens: 1024 })
        });
        if (!openAIResponse.ok) {
          const errMsg = await openAIResponse.text();
          throw new Error(`OpenAI API error: ${openAIResponse.status} ${errMsg}`);
        }
        const data = await openAIResponse.json();
        const reply = data.choices?.[0]?.message?.content || '';
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ reply }));
      } catch (error) {
        console.error('Error handling chat request:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
    return;
  }
  serveStaticFile(req, res);
}
const server = http.createServer(handleRequest);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Travel agent server is running at http://localhost:${PORT}`); });
