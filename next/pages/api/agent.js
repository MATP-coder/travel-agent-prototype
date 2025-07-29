import OpenAI from 'openai';

// The system prompt defines the behaviour of the travel agent. It instructs the model to ask
// clarifying questions about travel dates, budget, interests and preferences before composing
// a detailed itinerary. The response should be in German to match the example in the user's
// description and include both a structured JSON payload and a human readable summary.
const SYSTEM_PROMPT = `Du bist ein KI‑Reiseagent‑Prototyp mit folgendem Workflow:
1. Stelle gezielt Rückfragen nach Reisedaten, Budget (Total oder pro Tag), Interessen, Reisestil, Unterkunftsklasse.
2. Wenn du alle Eckdaten hast, generiere einen strukturierten Reiseplan:
   ‑ Tagesweise Aktivitäten mit Zeiten,
   ‑ Vorschläge für Transportmittel und geschätzte Dauer,
   ‑ Unterkunftsoptionen (Preisklasse),
   ‑ Budgetaufteilung (Flug, Unterkunft, Aktivitäten).
3. Gib das Ergebnis als JSON mit klarer Struktur, außerdem als Text fürs Frontend.
4. Kommuniziere stets als freundlicher Reiseberater.
5. Falls Angaben fehlen oder unrealistisch sind, bitte nach.`;

// Initialise the OpenAI client once. The API key should be supplied via environment variables.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Build the conversation to send to OpenAI. Prepend the system prompt to guide the assistant.
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Call the OpenAI ChatCompletion endpoint. Use the GPT‑4o model for high quality output.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0].message.content;
    return res.status(200).json({ assistantMessage });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate assistant message' });
  }
}
