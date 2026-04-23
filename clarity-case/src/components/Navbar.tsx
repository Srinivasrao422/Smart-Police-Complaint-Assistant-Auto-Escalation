import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, Shield } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", to: "/" },
  { label: "How it works", to: "/#how" },
  { label: "Features", to: "/#features" },
  { label: "Portals", to: "/portal" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 glass">
      <div className="container flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" && !hash : pathname + hash === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth?role=citizen">
              <User className="h-4 w-4 mr-1" /> Citizen Login
            </Link>
          </Button>
          <Button asChild variant="hero" className="hidden sm:inline-flex">
            <Link to="/auth?role=admin">
              <Shield className="h-4 w-4 mr-1" /> Admin Login
            </Link>
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
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/60"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button asChild variant="outline">
                <Link to="/auth?role=citizen">
                  <User className="h-4 w-4 mr-1" /> Citizen
                </Link>
              </Button>
              <Button asChild variant="hero">
                <Link to="/auth?role=admin">
                  <Shield className="h-4 w-4 mr-1" /> Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
