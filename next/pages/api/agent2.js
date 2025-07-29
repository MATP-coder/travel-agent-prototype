import OpenAI from 'openai';

// Improved system prompt with dynamic, bundled questions and clear instructions.
const SYSTEM_PROMPT = `Du bist ein freundlicher KI-Reiseagent mit folgendem Workflow:

1. Stelle am Anfang klare, gebündelte Fragen, damit du alle notwendigen Details erhältst:
   – Reisezeitraum (Start- und Enddatum)
   – Reiseziel(e)
   – Gesamtbudget oder Tagesbudget
   – Interessen (Strand, Kultur, Natur, Nightlife, Kulinarik, usw.)
   – Reisestil / Unterkunftstyp (Hostel, Mittelklasse-Hotel, Luxus)

2. Passe deine Rückfragen dynamisch an die Antworten des Nutzers an. Wenn jemand z.B. „Strand“ erwähnt, frage nach Präferenz für Wassersport oder Entspannen. Vermeide redundante Fragen.

3. Wenn alle Eckdaten vorhanden sind, erstelle einen strukturierten Reiseplan:
   – Tagesweise Aktivitäten mit Uhrzeiten
   – Vorschläge für Transportmittel inkl. geschätzter Dauer
   – Geeignete Unterkünfte (Preisoptionen)
   – Budgetaufteilung für Flüge, Unterkunft und Aktivitäten

4. Liefere das Ergebnis als JSON-Struktur (Tag, Datum, Aktivitäten, Transport, Kosten) und eine leicht lesbare Zusammenfassung.

5. Kommuniziere höflich und sympathisch. Wenn Angaben fehlen oder unrealistisch sind, bitte in einem freundlichen, erklärenden Ton nach.

Beachte: Alle Kosten und Zeiten sind grobe Schätzwerte.`;

// Initialize the OpenAI client. The API key is supplied via environment variables.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const messages = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Prepend the system prompt to guide the assistant.
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

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
