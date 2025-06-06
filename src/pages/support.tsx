import { useState } from "react";

export default function SupportPage() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    // TODO: call OpenAI chat completion API
  };

  return (
    <div className="p-4">
      <div className="border p-2 h-64 overflow-y-scroll">
        {messages.map((m, i) => (
          <div key={i}>{m.role}: {m.content}</div>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        className="border p-2 w-full"
        placeholder="Ask us anything"
      />
      <button onClick={sendMessage} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
        Send
      </button>
      <p className="mt-4">日本語サポート: <a href="mailto:jp-support@example.com" className="underline">メールする</a></p>
    </div>
  );
}
