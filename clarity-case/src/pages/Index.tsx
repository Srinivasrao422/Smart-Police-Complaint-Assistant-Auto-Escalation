import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Bot,
  Activity,
  Lock,
  FileText,
  Search,
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  TrendingUp,
  Clock,
  User,
  Shield,
  EyeOff,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Complaint Assistant",
    desc: "Get guided help drafting clear, complete complaints in your own words.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: Activity,
    title: "Real-time Tracking",
    desc: "Follow every step of your complaint from submission to resolution.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Smart Escalation",
    desc: "Stalled cases are automatically escalated to higher authorities.",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  {
    icon: EyeOff,
    title: "Anonymous Reporting",
    desc: "Optional anonymity with bank-grade encryption protects your identity.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: ShieldCheck,
    title: "Verified Authorities",
    desc: "Complaints are routed only to verified police stations and officers.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    desc: "End-to-end encrypted and never shared with third parties.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

const steps = [
  { n: "01", title: "Sign Up Securely", desc: "Create your account in under a minute with phone or email verification." },
  { n: "02", title: "Describe Your Issue", desc: "Use the AI assistant or guided form to file your complaint clearly." },
  { n: "03", title: "Track in Real-Time", desc: "Receive a unique ID and follow each update on a transparent timeline." },
  { n: "04", title: "Justice Delivered", desc: "If progress stalls, our auto-escalation engine ensures accountability." },
];

const stats = [
  { icon: Users, value: "120K+", label: "Citizens Empowered" },
  { icon: FileText, value: "85K+", label: "Complaints Filed" },
  { icon: CheckCircle2, value: "92%", label: "Resolution Rate" },
  { icon: Clock, value: "48h", label: "Avg. Response" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-secondary/20 blur-3xl animate-blob [animation-delay:3s]" />

        <div className="container relative py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-medium animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Trusted by 120,000+ citizens nationwide
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] animate-fade-in-up">
              Smart Police Complaint
              <br />
              <span className="text-gradient">Assistant & Auto Escalation</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up [animation-delay:150ms]">
              Raise complaints fearlessly. Ensure justice transparently — powered
              by AI guidance, real-time tracking, and smart escalation.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 animate-fade-in-up [animation-delay:300ms]">
              <Button asChild variant="teal" size="xl">
                <Link to="/auth?role=citizen">
                  <User className="mr-1" /> Citizen Login <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button asChild variant="hero" size="xl">
                <Link to="/auth?role=admin">
                  <Shield className="mr-1" /> Admin Login <ArrowRight className="ml-1" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-muted-foreground animate-fade-in [animation-delay:500ms]">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Govt-grade security</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> 24/7 AI assistant</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> Auto escalation</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-5 text-center hover-lift animate-scale-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <s.icon className="h-5 w-5 mx-auto text-primary mb-2" />
                <div className="font-display text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container py-20 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
            Why SPCAES
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
            Built for citizens. Trusted by authorities.
          </h2>
          <p className="text-muted-foreground text-lg">
            Every feature is designed to make justice transparent, fast, and fair — no matter who you are.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-card p-6 hover-lift animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`h-12 w-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className={`h-6 w-6 ${f.color}`} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative py-20 bg-gradient-to-b from-transparent via-accent/30 to-transparent scroll-mt-20">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-secondary text-sm font-semibold uppercase tracking-wider mb-3">
              How it works
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4">
              Justice in four simple steps
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className="relative rounded-2xl bg-card border border-border p-6 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-5xl font-display font-bold text-gradient opacity-80 mb-3">
                  {s.n}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                    <ArrowRight className="h-5 w-5 text-secondary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 sm:p-16 text-center">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative max-w-2xl mx-auto space-y-6 text-primary-foreground">
            <TrendingUp className="h-10 w-10 mx-auto" />
            <h2 className="font-display text-3xl sm:text-5xl font-bold">
              Your voice deserves to be heard.
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Join thousands of citizens making their communities safer through transparent justice.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="teal" size="xl">
                <Link to="/auth?role=citizen">
                  <User className="mr-1" /> Citizen Login
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link to="/auth?role=admin">
                  <Shield className="mr-1" /> Admin Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
