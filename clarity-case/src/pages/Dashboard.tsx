import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Bot,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Timer,
  Percent,
  ShieldAlert,
} from "lucide-react";
import { PublicNotices } from "@/components/PublicNotices";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/context/RealtimeContext";
import { api } from "@/lib/api";
import { getStoredToken, getStoredUser } from "@/lib/session";

type DashboardData = {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  escalated: number;
  recent: Array<{ _id?: string; receiptId?: string; title: string; category?: string; status?: string; createdAt?: string }>;
};

// initial empty values replaced by API

const statusStyles: Record<string, string> = {
  'pending': "bg-warning/10 text-warning border-warning/20",
  'in-progress': "bg-warning/10 text-warning border-warning/20",
  'resolved': "bg-success/10 text-success border-success/20",
  'escalated': "bg-destructive/10 text-destructive border-destructive/20",
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lastComplaintEvent } = useRealtime();
  const user = getStoredUser() || {};
  const userName = user?.name || user?.email || "Citizen";

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (!getStoredToken()) {
        throw new Error("Unauthorized");
      }
      const next = await api.get("/api/complaints/my");
      setData(next);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const complaint = lastComplaintEvent?.complaint;
    if (!complaint || complaint.user?._id !== user?.id) return;
    fetchData(true);
  }, [lastComplaintEvent, user?.id]);

  const categoryCounts = (data?.recent || []).reduce<Record<string, number>>((acc, complaint) => {
    const key = complaint.category || "Other";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const categoryTotal = Object.values(categoryCounts).reduce((sum, value) => sum + value, 0);
  const categoryRows = Object.entries(categoryCounts).map(([label, count], index) => ({
    label,
    value: categoryTotal ? Math.round((count / categoryTotal) * 100) : 0,
    color: ["bg-destructive", "bg-warning", "bg-primary", "bg-secondary"][index % 4],
  }));

  return (
    <div className="container py-10 page-panel">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">
            {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your complaints and recent activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/citizen/track"><Search className="mr-1 h-4 w-4" /> Track</Link>
          </Button>
          <Button asChild variant="hero">
            <Link to="/citizen/raise"><Plus className="mr-1 h-4 w-4" /> New Complaint</Link>
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-5">
              <Skeleton className="h-11 w-11 rounded-xl mb-4" />
              <Skeleton className="h-9 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : error ? (
          <div className="col-span-full text-center text-destructive">{error}</div>
        ) : data ? (
          [
            { label: 'Total Complaints', value: data.total, icon: FileText, bg: 'bg-primary/10', color: 'text-primary' },
            { label: 'Pending', value: data.pending, icon: Clock, bg: 'bg-warning/10', color: 'text-warning' },
            { label: 'Escalated', value: data.escalated, icon: AlertTriangle, bg: 'bg-destructive/10', color: 'text-destructive' },
            { label: 'Resolved', value: data.resolved, icon: CheckCircle2, bg: 'bg-success/10', color: 'text-success' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-card p-5 hover-lift animate-scale-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-4">
                <div className="font-display text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center">No data</div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card animate-fade-in-up">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-lg">Recent Complaints</h2>
              <p className="text-xs text-muted-foreground">Your last 5 submissions</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/citizen/track">View all</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data && data.recent && data.recent.length > 0 ? (
              data.recent.map((c, i) => (
                <Link
                  key={c.receiptId || c._id || i}
                  to={`/citizen/track?receiptId=${encodeURIComponent(c.receiptId || c._id || "")}`}
                  className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{c.receiptId || c._id}</span> · <span>{c.category || '—'}</span> · <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[c.status || 'pending']}`}>
                    {c.status ? c.status.replace('-', ' ') : 'pending'}
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center">No complaints yet</div>
            )}
          </div>
        </div>

        <div className="space-y-4 animate-fade-in-up [animation-delay:200ms]">
          <Link
            to="/citizen/raise"
            className="block rounded-2xl gradient-primary p-6 text-primary-foreground hover-lift relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <Plus className="h-8 w-8 mb-3" />
            <h3 className="font-display font-semibold text-lg">New Complaint</h3>
            <p className="text-sm opacity-90 mt-1">File a new complaint with our guided form.</p>
          </Link>

          <Link
            to="/citizen/assistant"
            className="block rounded-2xl gradient-teal p-6 text-secondary-foreground hover-lift relative overflow-hidden"
          >
            <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <Bot className="h-8 w-8 mb-3" />
            <h3 className="font-display font-semibold text-lg">AI Assistant</h3>
            <p className="text-sm opacity-90 mt-1">Need help drafting? Chat with our AI.</p>
          </Link>

          <Link
            to="/citizen/track"
            className="block rounded-2xl bg-card border border-border p-6 hover-lift"
          >
            <Search className="h-8 w-8 mb-3 text-primary" />
            <h3 className="font-display font-semibold text-lg">Track Complaint</h3>
            <p className="text-sm text-muted-foreground mt-1">Check status with your complaint ID.</p>
          </Link>
        </div>
      </div>

      {/* Crime insights widget */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Crime Insights — Your Area
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Bengaluru · Last 30 days</p>
          </div>
          {data && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
              {data.total} total complaints
            </span>
          )}
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          {(categoryRows.length ? categoryRows : [{ label: "No complaints", value: 0, color: "bg-muted" }]).map((c) => (
            <div key={c.label} className="rounded-xl border border-border p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">{c.value}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public notices */}
      <div className="mt-6">
        <PublicNotices />
      </div>
    </div>
  );
};

export default Dashboard;
