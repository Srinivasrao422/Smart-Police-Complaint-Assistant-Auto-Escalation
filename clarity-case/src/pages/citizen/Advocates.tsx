import { useState } from "react";
import { Search, Star, MapPin, Phone, Mail, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const advocates = [
  { name: "Adv. Meera Krishnan", spec: "Criminal Law", city: "Bengaluru", exp: 14, rating: 4.8, fee: "₹1,500/session", phone: "+91 98XXXXXX01" },
  { name: "Adv. Rajiv Bansal", spec: "Cyber Law", city: "Bengaluru", exp: 9, rating: 4.6, fee: "Free first call", phone: "+91 98XXXXXX02" },
  { name: "Adv. Sunita Patel", spec: "Family & Women", city: "Mumbai", exp: 18, rating: 4.9, fee: "₹2,000/session", phone: "+91 98XXXXXX03" },
  { name: "Adv. Anil Verma", spec: "Property Disputes", city: "Delhi", exp: 22, rating: 4.7, fee: "₹2,500/session", phone: "+91 98XXXXXX04" },
  { name: "Adv. Priya Nair", spec: "Consumer Fraud", city: "Bengaluru", exp: 7, rating: 4.5, fee: "Free legal aid", phone: "+91 98XXXXXX05" },
  { name: "Adv. Karan Singh", spec: "Criminal Law", city: "Pune", exp: 11, rating: 4.6, fee: "₹1,200/session", phone: "+91 98XXXXXX06" },
];

const Advocates = () => {
  const [q, setQ] = useState("");

  const filtered = advocates.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) ||
      a.spec.toLowerCase().includes(q.toLowerCase()) ||
      a.city.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold">Advocate Directory</h1>
        <p className="text-muted-foreground mt-1">Connect with verified legal professionals for guidance.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-6 animate-scale-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, specialization or city..." className="pl-9" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((a, i) => (
          <div
            key={a.name}
            className="rounded-2xl border border-border bg-card p-5 hover-lift animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full gradient-teal flex items-center justify-center text-secondary-foreground font-semibold shrink-0">
                {a.name.split(" ").slice(-2).map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-semibold truncate">{a.name}</h3>
                  <div className="flex items-center gap-0.5 text-warning shrink-0">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-xs font-medium">{a.rating}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {a.spec} · {a.exp} yrs
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {a.city}
                </div>
                <div className="text-xs font-medium text-primary mt-2">{a.fee}</div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Phone className="h-3 w-3 mr-1" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs">
                    <Mail className="h-3 w-3 mr-1" /> Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Advocates;
