import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  Users,
  BarChart3,
  Map,
  LogOut,
  Menu,
  X,
  Search,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/NotificationBell";
import { ConsentNotice } from "@/components/ConsentNotice";
import { toast } from "sonner";
import { clearSession, broadcastSessionChange } from "@/lib/session";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/complaints", label: "Complaints", icon: FileText },
  { to: "/admin/escalations", label: "Escalations", icon: AlertTriangle },
  { to: "/admin/map", label: "Map", icon: Map },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export const AdminLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    clearSession();
    broadcastSessionChange();
    toast.success("Signed out");
    setTimeout(() => navigate("/"), 300);
  };

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <Logo variant="light" />
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-sidebar-primary/20 text-sidebar-primary border border-sidebar-primary/30">
          Admin
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent">
          <div className="h-9 w-9 rounded-full gradient-teal flex items-center justify-center font-semibold text-sm text-secondary-foreground">
            RK
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Insp. R. Kumar</div>
            <div className="text-xs text-sidebar-foreground/60 truncate">
              MG Road Station
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-sidebar-border shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 animate-slide-in-right">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
          <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden md:block">
              <h1 className="font-display text-lg font-bold leading-tight">
                {navItems.find((n) => n.to === pathname)?.label || "Admin"}
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage and resolve citizen complaints
              </p>
            </div>

            <div className="flex-1 max-w-md ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search complaints, citizens, IDs..." className="pl-9" />
              </div>
            </div>

            <NotificationBell />
            <ThemeToggle />
            <div className="hidden sm:flex h-9 w-9 rounded-full gradient-primary items-center justify-center font-semibold text-xs text-primary-foreground">
              RK
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 portal-stage">
          <Outlet />
        </main>
      </div>
      <ConsentNotice />
    </div>
  );
};
