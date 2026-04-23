import { ShieldCheck, AlertTriangle, FileText, Phone, Lightbulb } from "lucide-react";

const articles = [
  {
    icon: ShieldCheck,
    title: "Your rights when filing an FIR",
    desc: "Police cannot refuse to register an FIR for cognizable offences. You can approach the SP if denied.",
    time: "3 min read",
  },
  {
    icon: AlertTriangle,
    title: "How to report cyber fraud",
    desc: "Report within 24 hours at cybercrime.gov.in or dial 1930 to freeze fraudulent transactions.",
    time: "4 min read",
  },
  {
    icon: FileText,
    title: "Difference between FIR and NCR",
    desc: "FIR is for cognizable offences; NCR (Non-Cognizable Report) is for minor disputes requiring court permission.",
    time: "2 min read",
  },
  {
    icon: ShieldCheck,
    title: "Women's safety helpline & laws",
    desc: "Dial 112 / 1091. Sections 354, 509 IPC and POSH Act protect women against harassment.",
    time: "5 min read",
  },
];

const helplines = [
  { label: "Police Emergency", num: "112" },
  { label: "Women Helpline", num: "1091" },
  { label: "Cyber Crime", num: "1930" },
  { label: "Child Helpline", num: "1098" },
];

const LegalAwareness = () => {
  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold">Legal Awareness</h1>
        <p className="text-muted-foreground mt-1">Know your rights. Stay informed. Stay protected.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {helplines.map((h) => (
          <div key={h.num} className="rounded-2xl border border-border bg-card p-4 hover-lift">
            <Phone className="h-4 w-4 text-destructive mb-2" />
            <div className="text-xs text-muted-foreground">{h.label}</div>
            <div className="font-display text-2xl font-bold">{h.num}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {articles.map((a, i) => (
          <div
            key={a.title}
            className="rounded-2xl border border-border bg-card p-5 hover-lift animate-fade-in-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <a.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">{a.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{a.desc}</p>
                <div className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> {a.time}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LegalAwareness;
