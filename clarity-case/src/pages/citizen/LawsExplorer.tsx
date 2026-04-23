import { useState } from "react";
import { Search, BookOpen, Scale, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";

const laws = [
  { code: "IPC §378", title: "Theft", desc: "Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent...", tag: "Theft" },
  { code: "IPC §379", title: "Punishment for Theft", desc: "Imprisonment up to 3 years, or fine, or both.", tag: "Theft" },
  { code: "IPC §420", title: "Cheating & Fraud", desc: "Cheating and dishonestly inducing delivery of property — punishable up to 7 years.", tag: "Fraud" },
  { code: "IT Act §66C", title: "Identity Theft", desc: "Fraudulent use of electronic signature, password or other unique identification feature.", tag: "Cybercrime" },
  { code: "IT Act §66D", title: "Cheating by Personation", desc: "Cheating by personation by using computer resource — up to 3 years and ₹1 lakh fine.", tag: "Cybercrime" },
  { code: "IPC §354", title: "Assault on Woman", desc: "Outraging the modesty of a woman — punishable with imprisonment of 1 to 5 years.", tag: "Harassment" },
  { code: "IPC §509", title: "Insulting Modesty", desc: "Word, gesture or act intended to insult the modesty of a woman.", tag: "Harassment" },
  { code: "MV Act §184", title: "Dangerous Driving", desc: "Driving dangerously — fine up to ₹5,000 or imprisonment up to 6 months.", tag: "Vehicle" },
];

const tags = ["All", "Theft", "Fraud", "Cybercrime", "Harassment", "Vehicle"];

const LawsExplorer = () => {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("All");

  const filtered = laws.filter(
    (l) =>
      (tag === "All" || l.tag === tag) &&
      (l.title.toLowerCase().includes(q.toLowerCase()) ||
        l.code.toLowerCase().includes(q.toLowerCase()) ||
        l.desc.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 animate-fade-in flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
          <Scale className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Laws Explorer</h1>
          <p className="text-muted-foreground mt-1">Search Indian laws and sections relevant to your situation.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-6 animate-scale-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search laws, sections or keywords..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tag === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((l, i) => (
          <div
            key={l.code}
            className="rounded-2xl border border-border bg-card p-5 hover-lift animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                {l.tag}
              </span>
            </div>
            <div className="text-xs font-mono text-primary">{l.code}</div>
            <h3 className="font-display font-semibold mt-1">{l.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{l.desc}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-10 text-center">
            <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No laws match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LawsExplorer;
