import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { broadcastSessionChange, storeSession } from "@/lib/session";

const adminHighlights = [
  "Centralized complaint intake and triage",
  "Officer coordination with SLA visibility",
  "Auditable actions across every case",
];

const citizenHighlights = [
  "Fast complaint filing with guided assistance",
  "Live status updates from submission to closure",
  "Encrypted account access and protected records",
];

const Auth = () => {
  const [params] = useSearchParams();
  const role = (params.get("role") === "admin" ? "admin" : "citizen") as "admin" | "citizen";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const isAdmin = role === "admin";
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form).entries());

    (async () => {
      setLoading(true);
      try {
        const payload: Record<string, any> = {
          email: data.email,
          password: data.password,
          role,
        };

        if (mode === "register" && !isAdmin) {
          payload.name = data.name;
        }

        const response = await api.post(`/api/auth/${mode}`, payload);
        storeSession(response.token, response.user);
        broadcastSessionChange();

        toast.success(mode === "login" ? "Signed in successfully" : "Account created");
        setTimeout(() => {
          if (response.user?.role === "admin" || response.user?.role === "super-admin") return navigate("/admin/dashboard");
          if (response.user?.role === "officer") return navigate("/officer/dashboard");
          return navigate("/citizen/dashboard");
        }, 600);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Network error");
      } finally {
        setLoading(false);
      }
    })();
  };

  const roleHighlights = isAdmin ? adminHighlights : citizenHighlights;
  const roleStats = isAdmin
    ? [
        { value: "1.2K+", label: "Officers" },
        { value: "92%", label: "Resolved" },
        { value: "48h", label: "Avg SLA" },
      ]
    : [
        { value: "120K+", label: "Citizens" },
        { value: "92%", label: "Resolved" },
        { value: "48h", label: "Response" },
      ];

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
              <ArrowLeft className="mr-1 h-4 w-4" /> Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="relative z-10 container py-8 lg:py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <div className="hidden space-y-6 lg:block animate-fade-in-up">
            <div className="portal-card relative overflow-hidden p-10 text-white">
              <div
                className={`absolute inset-0 ${
                  isAdmin
                    ? "bg-gradient-to-br from-primary/35 via-slate-950/35 to-amber-300/10"
                    : "bg-gradient-to-br from-cyan-300/20 via-slate-950/35 to-primary/20"
                }`}
              />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

              <div className="relative space-y-6">
                <div className="portal-kicker">
                  {isAdmin ? "Restricted operations access" : "Secure citizen access"}
                </div>
                {isAdmin ? (
                  <Shield className="h-12 w-12 text-amber-200" />
                ) : (
                  <ShieldCheck className="h-12 w-12 text-cyan-200" />
                )}
                <h2 className="font-display max-w-xl text-3xl font-bold leading-tight">
                  {isAdmin
                    ? "Powerful tools to triage, investigate, and resolve."
                    : "A safer, more transparent justice system starts with you."}
                </h2>
                <p className="max-w-xl text-white/[0.72]">
                  {isAdmin
                    ? "Manage cases, monitor SLAs, and coordinate officers from one unified command surface."
                    : "Your account is end-to-end protected and designed to keep the reporting process clear at every step."}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {roleStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-center">
                      <div className="text-lg font-bold">{stat.value}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-white/[0.55]">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-3xl border border-white/10 bg-black/20 p-5">
                  <div className="portal-kicker text-white/[0.58]">What this portal gives you</div>
                  {roleHighlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-white/80">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to={`/auth?role=${isAdmin ? "citizen" : "admin"}`}
              className="inline-flex items-center gap-2 text-sm text-white/[0.68] transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Switch to {isAdmin ? "Citizen" : "Admin"} portal
            </Link>
          </div>

          <div className="mx-auto w-full max-w-md animate-scale-in">
            <div className="portal-panel rounded-[2rem] p-8 text-white">
              <div className="mb-1 flex items-center justify-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isAdmin
                      ? "border-amber-100/20 bg-amber-200/10 text-amber-100"
                      : "border-cyan-200/20 bg-cyan-300/12 text-cyan-100"
                  }`}
                >
                  {isAdmin ? "Admin Portal" : "Citizen Portal"}
                </span>
              </div>

              <div className="my-5 grid grid-cols-2 rounded-xl bg-white/[0.08] p-1">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={isAdmin && m === "register"}
                    className={`rounded-lg py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      mode === m
                        ? "bg-white text-slate-900 shadow-soft"
                        : "text-white/[0.62] hover:text-white"
                    }`}
                  >
                    {m === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              <div className="mb-6 text-center">
                <h1 className="font-display text-2xl font-bold text-white">
                  {mode === "login" ? "Welcome back" : "Join SPCAES"}
                </h1>
                <p className="mt-1 text-sm text-white/[0.62]">
                  {isAdmin
                    ? "Restricted to verified personnel"
                    : mode === "login"
                      ? "Access your complaints dashboard"
                      : "Start filing complaints in minutes"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && !isAdmin && (
                  <>
                    <div>
                      <Label htmlFor="name" className="text-white/[0.82]">
                        Full name
                      </Label>
                      <div className="relative mt-1.5">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                        <Input
                          id="name"
                          name="name"
                          placeholder="Aarav Sharma"
                          className="border-white/10 bg-white/[0.08] pl-10 text-white placeholder:text-white/[0.35]"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-white/[0.82]">
                        Phone
                      </Label>
                      <div className="relative mt-1.5">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="+91 98765 43210"
                          className="border-white/10 bg-white/[0.08] pl-10 text-white placeholder:text-white/[0.35]"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="email" className="text-white/[0.82]">
                    {isAdmin ? "Officer ID / Email" : "Email"}
                  </Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                    <Input
                      id="email"
                      name="email"
                      type={isAdmin ? "text" : "email"}
                      placeholder={isAdmin ? "OFC-12345" : "you@example.com"}
                      className="border-white/10 bg-white/[0.08] pl-10 text-white placeholder:text-white/[0.35]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white/[0.82]">
                      Password
                    </Label>
                    {mode === "login" && (
                      <a href="#" className="text-xs text-white/[0.62] hover:text-white">
                        Forgot?
                      </a>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.42]" />
                    <Input
                      id="password"
                      name="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="........"
                      className="border-white/10 bg-white/[0.08] pl-10 pr-10 text-white placeholder:text-white/[0.35]"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/[0.42] transition-colors hover:text-white"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant={isAdmin ? "hero" : "teal"}
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </Button>

                {!isAdmin && (
                  <>
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-slate-950 px-2 text-white/[0.48]">or continue with</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/10 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
                      >
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/10 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white"
                      >
                        DigiLocker
                      </Button>
                    </div>
                  </>
                )}
              </form>

              <div className="mt-5 text-center lg:hidden">
                <Link
                  to={`/auth?role=${isAdmin ? "citizen" : "admin"}`}
                  className="text-xs text-white/[0.62] hover:text-white"
                >
                  Switch to {isAdmin ? "Citizen" : "Admin"} portal
                </Link>
              </div>

              <p className="mt-6 text-center text-xs text-white/[0.48]">
                By continuing, you agree to our{" "}
                <a href="#" className="text-white/70 hover:text-white">
                  Terms
                </a>{" "}
                and{" "}
                <a href="#" className="text-white/70 hover:text-white">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
