import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Landmark,
  LayoutDashboard,
  Lock,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";

const userPerks = [
  { icon: Bot, label: "AI complaint assistant" },
  { icon: Activity, label: "Real-time tracking" },
  { icon: Lock, label: "Private and encrypted" },
];

const adminPerks = [
  { icon: LayoutDashboard, label: "Unified case dashboard" },
  { icon: Users, label: "Officer and station management" },
  { icon: BarChart3, label: "Analytics and reporting" },
];

const trustStats = [
  { value: "24x7", label: "Assisted filing" },
  { value: "92%", label: "Timely resolution" },
  { value: "E2E", label: "Protected records" },
];

const Portal = () => {
  return (
    <div className="portal-shell">
      <div className="portal-backdrop" />
      <div className="portal-vignette" />

      <header className="relative z-10 container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="border border-white/10 bg-black/20 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/">
              <ArrowRight className="mr-1 h-4 w-4 rotate-180" /> Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 container py-10 lg:py-16">
        <div className="mx-auto mb-12 max-w-4xl space-y-6 text-center">
          <div className="portal-chip animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Choose your portal
          </div>
          <h1 className="font-display animate-fade-in-up text-4xl font-bold leading-[0.98] text-white sm:text-5xl lg:text-7xl">
            One justice platform,
            <br className="hidden sm:block" /> two focused entry points.
          </h1>
          <p className="portal-copy mx-auto max-w-3xl animate-fade-in-up text-base sm:text-lg lg:text-xl [animation-delay:120ms]">
            Built for fast reporting, secure case handling, and visible accountability.
            Pick the portal that matches your role.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-in-up [animation-delay:180ms]">
            <span className="portal-chip">
              <Scale className="h-3.5 w-3.5 text-amber-300" /> Evidence-first workflow
            </span>
            <span className="portal-chip">
              <Landmark className="h-3.5 w-3.5 text-cyan-300" /> Built for public trust
            </span>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          <Link
            to="/auth?role=citizen"
            className="portal-card group relative overflow-hidden p-8 sm:p-10 animate-fade-in-up [animation-delay:200ms]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/16 via-transparent to-amber-300/10 opacity-70 transition-opacity duration-500" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/18 blur-3xl transition-all duration-500 group-hover:bg-cyan-300/26" />

            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div className="gradient-teal shadow-teal flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110">
                  <User className="h-7 w-7 text-secondary-foreground" />
                </div>
                <span className="rounded-full border border-cyan-200/20 bg-cyan-300/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-100">
                  For Citizens
                </span>
              </div>

              <div className="space-y-2">
                <div className="portal-kicker">Citizen experience</div>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  User Portal
                </h2>
                <p className="portal-copy leading-relaxed">
                  File complaints, chat with the AI assistant, and follow your case
                  from submission to resolution.
                </p>
              </div>

              <ul className="space-y-2.5">
                {userPerks.map((perk) => (
                  <li key={perk.label} className="flex items-center gap-3 text-sm text-white/[0.88]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-200/15 bg-cyan-300/12">
                      <perk.icon className="h-3.5 w-3.5 text-cyan-200" />
                    </div>
                    <span>{perk.label}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {trustStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                    <div className="text-lg font-semibold text-white">{stat.value}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/[0.55]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="text-xs text-white/[0.58]">
                  No prior account? Sign up in 60 seconds.
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-cyan-200 transition-all group-hover:gap-3">
                  Enter <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>

          <Link
            to="/auth?role=admin"
            className="portal-card group relative overflow-hidden p-8 sm:p-10 animate-fade-in-up [animation-delay:320ms]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-300/14 via-transparent to-primary/18 opacity-70 transition-opacity duration-500" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl transition-all duration-500 group-hover:bg-primary/30" />

            <div className="relative space-y-6">
              <div className="flex items-start justify-between">
                <div className="gradient-primary shadow-glow flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="rounded-full border border-amber-100/20 bg-amber-200/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-100">
                  For Officers
                </span>
              </div>

              <div className="space-y-2">
                <div className="portal-kicker">Operations console</div>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Admin Portal
                </h2>
                <p className="portal-copy leading-relaxed">
                  Triage complaints, assign officers, monitor SLAs and resolve cases
                  with powerful analytics.
                </p>
              </div>

              <ul className="space-y-2.5">
                {adminPerks.map((perk) => (
                  <li key={perk.label} className="flex items-center gap-3 text-sm text-white/[0.88]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200/15 bg-amber-300/12">
                      <perk.icon className="h-3.5 w-3.5 text-amber-200" />
                    </div>
                    <span>{perk.label}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                  <div className="text-lg font-semibold text-white">Live</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/[0.55]">
                    Queues
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                  <div className="text-lg font-semibold text-white">SLA</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/[0.55]">
                    Tracking
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                  <div className="text-lg font-semibold text-white">Audit</div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-white/[0.55]">
                    Controls
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-1.5 text-xs text-white/[0.62]">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                  Restricted to verified personnel
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-100 transition-all group-hover:gap-3">
                  Enter <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-white/[0.66] animate-fade-in [animation-delay:500ms]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Govt-grade security
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> 24/7 AI assistant
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Auto escalation
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> End-to-end encrypted
          </div>
        </div>
      </main>
    </div>
  );
};

export default Portal;
