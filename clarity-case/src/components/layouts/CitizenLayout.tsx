import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  Search,
  Bot,
  UserCircle,
  LogOut,
  Menu,
  X,
  Scale,
  BookOpen,
  Users as UsersIcon,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { NotificationBell } from "@/components/NotificationBell";
import { ConsentNotice } from "@/components/ConsentNotice";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { clearSession, broadcastSessionChange } from "@/lib/session";

const items = [
  { to: "/citizen/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/citizen/raise", label: "Raise Complaint", icon: FilePlus2 },
  { to: "/citizen/track", label: "Track", icon: Search },
  { to: "/citizen/assistant", label: "AI Assistant", icon: Bot },
  { to: "/citizen/profile", label: "Profile", icon: UserCircle },
];

const legalItems = [
  { to: "/citizen/laws", label: "Laws Explorer", icon: Scale, desc: "Search IPC, IT Act & more" },
  { to: "/citizen/legal-awareness", label: "Legal Awareness", icon: BookOpen, desc: "Know your rights" },
  { to: "/citizen/advocates", label: "Advocate Directory", icon: UsersIcon, desc: "Verified legal experts" },
];

export const CitizenLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = () => {
    clearSession();
    broadcastSessionChange();
    toast.success("Signed out");
    setTimeout(() => navigate("/"), 300);
  };

  const legalActive = legalItems.some((l) => pathname === l.to);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20">
              Citizen
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {items.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    legalActive
                      ? "text-secondary bg-secondary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  <Scale className="h-4 w-4" />
                  Legal Help
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {legalItems.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link to={l.to} className="flex items-start gap-3 py-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <l.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{l.label}</div>
                        <div className="text-xs text-muted-foreground">{l.desc}</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex">
              <NotificationBell />
            </div>
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex">
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border/60 bg-background animate-fade-in">
            <div className="container py-3 flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    pathname === item.to
                      ? "bg-secondary/10 text-secondary"
                      : "text-muted-foreground hover:bg-accent/60"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-border">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Legal Help
                </div>
                {legalItems.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      pathname === l.to
                        ? "bg-secondary/10 text-secondary"
                        : "text-muted-foreground hover:bg-accent/60"
                    }`}
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </Link>
                ))}
              </div>
              <Button variant="outline" className="mt-2" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 portal-stage">
        <Outlet />
      </main>

      <Footer />
      <ConsentNotice />
    </div>
  );
};
