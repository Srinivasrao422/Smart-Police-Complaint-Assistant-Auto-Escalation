import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, User, Paperclip } from "lucide-react";
import { apiFetch } from "@/utils/api";

interface Msg {
  id: number;
  from: "bot" | "user";
  text: string;
}

const initialMessages: Msg[] = [
  {
    id: 1,
    from: "bot",
    text: "Hello. I am SPCAES Assistant. I can help identify likely IPC or IT Act sections from your complaint description. What happened?",
  },
];

const suggestions = [
  "My phone was stolen",
  "I received a fraud call",
  "Someone is harassing me online",
  "Help me file a cyber complaint",
];

const Assistant = () => {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const generateReply = async (text: string): Promise<string> => {
    try {
      const res = await apiFetch("/api/ai/suggest", {
        method: "POST",
        body: JSON.stringify({ description: text }),
      });
      if (!res.ok) throw new Error("Suggestion failed");

      const data = await res.json();
      const sections: string[] = data.sections || [];
      const inputLower = text.toLowerCase();

      if (sections.length > 0) {
        let categoryHint = "General complaint";
        if (sections.includes("IPC 378")) categoryHint = "Theft / Robbery";
        else if (sections.includes("IPC 354")) categoryHint = "Harassment";
        else if (sections.includes("IPC 420") || sections.includes("IT Act")) categoryHint = "Cybercrime / Fraud";

        return `Likely sections: ${sections.join(", ")}.\n\nRecommended category: ${categoryHint}.\n\nInclude the date, time, exact place, people involved, and any supporting evidence in the complaint.`;
      }

      if (inputLower.includes("noise") || inputLower.includes("loud")) {
        return "This looks closer to a nuisance issue than an IPC-mapped complaint. Include the location, timing, and how often it happens so the complaint can be routed correctly.";
      }

      return "I could not map this to a clear IPC or IT Act section yet. Share more detail about what happened, where it happened, and whether theft, fraud, cyber activity, or harassment was involved.";
    } catch (err) {
      console.error(err);
      return "I could not reach the legal suggestion service just now. Please try again after a moment.";
    }
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    void (async () => {
      const userMsg: Msg = { id: Date.now(), from: "user", text };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setTyping(true);

      const reply: Msg = {
        id: Date.now() + 1,
        from: "bot",
        text: await generateReply(text),
      };

      setMessages((m) => [...m, reply]);
      setTyping(false);
    })();
  };

  return (
    <div className="container py-6 flex-1 flex flex-col max-w-3xl min-h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-4 mb-4 animate-fade-in">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl gradient-teal flex items-center justify-center shadow-soft">
            <Bot className="h-6 w-6 text-secondary-foreground" />
          </div>
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success border-2 border-background" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            SPCAES Assistant <Sparkles className="h-4 w-4 text-secondary" />
          </h1>
          <p className="text-xs text-muted-foreground">Online · Legal suggestion helper</p>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-soft">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[400px] max-h-[60vh]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 animate-fade-in ${m.from === "user" ? "justify-end" : ""}`}
            >
              {m.from === "bot" && (
                <div className="h-8 w-8 rounded-full gradient-teal flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                  m.from === "user"
                    ? "gradient-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
              {m.from === "user" && (
                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}

          {typing && (
            <div className="flex gap-3 animate-fade-in">
              <div className="h-8 w-8 rounded-full gradient-teal flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing [animation-delay:200ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-typing [animation-delay:400ms]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-border flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-3 py-1.5 rounded-full text-xs bg-accent text-accent-foreground hover:bg-accent/70 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border p-3 flex items-center gap-2"
        >
          <Button type="button" variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your issue..."
            className="border-0 focus-visible:ring-0 bg-transparent"
          />
          <Button type="submit" variant="hero" size="icon" className="shrink-0 rounded-full" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-3">
        AI assistance is for guidance. Your complaint is officially filed only after submission.
      </p>
    </div>
  );
};

export default Assistant;
