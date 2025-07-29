import { useState } from 'react';

export default function Home() {
  // Maintain a list of conversation turns. Each turn has a role (user or assistant) and content.
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Send the current input to the backend when the form is submitted. The backend returns the agent reply.
  async function handleSubmit(event) {
    event.preventDefault();
    // Ignore empty submissions
    if (!input.trim()) return;

    // Append the user's message to the conversation
    const newMessages = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history to the API route. It will include the system prompt automatically.
      const res = await fetch('/api/agent2', { ... })
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) {
        // On error just show a generic message
        setMessages([
          ...newMessages,
          { role: 'assistant', content: 'Entschuldige, es gab ein Problem bei der Anfrage.' },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.assistantMessage },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Es ist ein Fehler aufgetreten.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Reiseagent‑Prototyp</h1>
      <div className="chat">
        {messages.map((msg, idx) => (
          <p key={idx} className={msg.role === 'user' ? 'user' : 'assistant'}>
            <strong>{msg.role === 'user' ? 'Du' : 'Agent'}: </strong>
            {msg.content}
          </p>
        ))}
        {isLoading && <p className="assistant"><strong>Agent: </strong>…</p>}
      </div>
      <form onSubmit={handleSubmit} className="inputForm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Erzähl mir von deinen Reiseplänen…"
          autoFocus
        />
        <button type="submit">Senden</button>
      </form>
      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 2rem auto;
          padding: 0 1rem;
          font-family: Arial, sans-serif;
        }
        h1 {
          text-align: center;
        }
        .chat {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
          height: 400px;
          overflow-y: auto;
          margin-bottom: 1rem;
          background-color: #fafafa;
        }
        .chat p {
          margin: 0.5rem 0;
        }
        .chat p.user {
          text-align: right;
        }
        .chat p.assistant {
          text-align: left;
        }
        .inputForm {
          display: flex;
          gap: 0.5rem;
        }
        .inputForm input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .inputForm button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          background-color: #0070f3;
          color: white;
          cursor: pointer;
        }
        .inputForm button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </div>
  );
}
