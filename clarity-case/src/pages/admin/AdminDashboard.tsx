import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, CartesianGrid, LineChart, Line, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Timer,
  MoreVertical,
  TrendingUp,
  BrainCircuit,
  Map,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { api } from "@/lib/api";
import { complaintDisplayName, deleteAdminComplaint, fetchAdminComplaints, fetchAdminInsights, formatLocation, markComplaintRead, statusLabel, statusStyles } from "@/lib/admin";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/context/RealtimeContext";

const chartColors = ["#0f766e", "#1d4ed8", "#f59e0b", "#dc2626", "#16a34a", "#7c3aed"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [officerPerformance, setOfficerPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lastComplaintEvent, lastFeedbackEvent } = useRealtime();

  const load = async () => {
    setLoading(true);
    try {
      const [overviewBody, categoriesBody, statusBody, trendBody, locationBody, complaintsBody, insightsBody, officerPerformanceBody] = await Promise.all([
        api.get("/api/admin/analytics/overview"),
        api.get("/api/admin/analytics/categories"),
        api.get("/api/admin/analytics/status"),
        api.get("/api/admin/analytics/trend"),
        api.get("/api/admin/analytics/location"),
        fetchAdminComplaints(),
        fetchAdminInsights(),
        api.get("/api/admin/analytics/officer-performance"),
      ]);
      setOverview(overviewBody);
      setCategories(categoriesBody.items || []);
      setStatuses(statusBody.items || []);
      setTrend(trendBody.items || []);
      setLocations(locationBody.items || []);
      setRecent((complaintsBody.items || []).slice(0, 5));
      setInsights(insightsBody);
      setOfficerPerformance(officerPerformanceBody.items || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (lastComplaintEvent || lastFeedbackEvent) {
      load();
    }
  }, [lastComplaintEvent, lastFeedbackEvent]);

  const stats = [
    { label: "Total Cases", value: overview?.totalCases || 0, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending", value: overview?.pending || 0, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Escalated", value: overview?.escalated || 0, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Resolved", value: overview?.resolved || 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  const performance = [
    { label: "Total Active Cases", value: overview?.totalActiveCases || 0, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
    { label: "Resolved Today", value: overview?.resolvedToday || 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
    { label: "Average Resolution Time", value: `${overview?.averageResolutionTime || 0}h`, icon: Timer, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "High Priority Cases", value: overview?.highPriorityCases || 0, icon: TrendingUp, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const statusChartConfig = useMemo(() => (
    Object.fromEntries((statuses || []).map((item, index) => [
      item.status,
      { label: statusLabel(item.status), color: chartColors[index % chartColors.length] },
    ]))
  ), [statuses]);

  const categoryChartConfig = useMemo(() => (
    Object.fromEntries((categories || []).map((item, index) => [
      item.category,
      { label: item.category, color: chartColors[index % chartColors.length] },
    ]))
  ), [categories]);

  const openComplaint = async (id: string) => {
    try {
      await markComplaintRead(id);
    } catch (err) {
      console.error(err);
    }
    navigate(`/admin/complaints/${id}`);
  };

  const handleAction = async (action: string, item: any) => {
    try {
      if (action === "view") return openComplaint(item._id);
      if (action === "assign") {
        if (item.assignedTo?._id) {
          return navigate(`/admin/officers/${item.assignedTo._id}?complaintId=${item._id}`);
        }
        return navigate(`/admin/complaints/${item._id}`);
      }
      if (action === "escalate") {
        await api.patch(`/api/admin/complaints/${item._id}/escalate`, {});
        toast.success("Case escalated");
        return load();
      }
      if (action === "delete") {
        await deleteAdminComplaint(item._id);
        toast.success("Complaint deleted");
        return load();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Action failed");
    }
  };

  return (
    <div className="space-y-6 page-panel">
      {!!overview?.escalated && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{overview.escalated} escalated complaints need review</div>
            <div className="text-xs text-muted-foreground mt-0.5">Review escalated cases to keep resolution moving.</div>
          </div>
          <Button asChild variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
            <Link to="/admin/escalations">Review escalations</Link>
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading ? Array.from({ length: 4 }).map((_, index) => ({ label: `loading-${index}`, loading: true })) : stats).map((s: any, i) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 hover-lift animate-scale-in" style={{ animationDelay: `${i * 70}ms` }}>
            {loading ? (
              <>
                <Skeleton className="h-10 w-10 rounded-xl mb-4" />
                <Skeleton className="h-9 w-20 mb-2" />
                <Skeleton className="h-4 w-28" />
              </>
            ) : (
              <>
                <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div className="font-display text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold">Performance Metrics</h3>
            <p className="text-xs text-muted-foreground">Department-wide accountability</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Live</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {performance.map((p) => (
            <div key={p.label} className="rounded-xl border border-border p-4 hover-lift">
              <div className={`h-9 w-9 rounded-lg ${p.bg} flex items-center justify-center mb-2`}>
                <p.icon className={`h-4 w-4 ${p.color}`} />
              </div>
              <div className="font-display text-2xl font-bold">{loading ? <Skeleton className="h-7 w-20" /> : p.value}</div>
              <div className="text-xs text-muted-foreground">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Complaint Volume</h3>
              <p className="text-xs text-muted-foreground">By category</p>
            </div>
          </div>
          {loading ? <Skeleton className="h-72 w-full rounded-xl" /> : <ChartContainer config={categoryChartConfig} className="h-72 w-full">
            <BarChart data={categories}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="category" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={8}>
                {categories.map((item, index) => (
                  <Cell key={item.category} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up [animation-delay:100ms]">
          <h3 className="font-display font-semibold mb-4">Complaints by Status</h3>
          {loading ? <Skeleton className="h-72 w-full rounded-xl" /> : <ChartContainer config={statusChartConfig} className="h-72 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
              <Pie data={statuses} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85}>
                {statuses.map((item, index) => (
                  <Cell key={item.status} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Pattern summary from live complaints</p>
            </div>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">Most common category</div>
              <div className="font-medium mt-1">{insights?.mostCommonCategory?.category || "N/A"}</div>
              <div className="text-xs text-muted-foreground mt-1">{insights?.mostCommonCategory?.count || 0} cases</div>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground">Average resolution time</div>
              <div className="font-medium mt-1">{insights?.avgResolutionTime || 0}h</div>
              <div className="text-xs text-muted-foreground mt-1">Resolved complaints only</div>
            </div>
            <div className="rounded-xl border border-border p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Hotspot area</div>
                <div className="font-medium mt-1">{insights?.complaintsPerArea?.[0]?.area || "N/A"}</div>
                <div className="text-xs text-muted-foreground mt-1">{insights?.complaintsPerArea?.[0]?.count || 0} complaints</div>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/admin/map">
                  <Map className="h-4 w-4 mr-2" /> Open map
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
          <div className="mb-4">
            <h3 className="font-display font-semibold">Officer Performance</h3>
            <p className="text-xs text-muted-foreground">Assigned vs resolved complaints</p>
          </div>
          <div className="space-y-3">
            {officerPerformance.slice(0, 5).map((item) => (
              <div key={item.officerId} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{item.department || "Operations"}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{item.resolved}/{item.totalAssigned} resolved</div>
                    <div>{item.avgResolutionTime || 0}h avg time</div>
                  </div>
                </div>
              </div>
            ))}
            {!officerPerformance.length && <div className="text-sm text-muted-foreground">No officer performance data yet.</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
          <div className="mb-4">
            <h3 className="font-display font-semibold">Complaints Trend</h3>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
          {loading ? <Skeleton className="h-72 w-full rounded-xl" /> : <ChartContainer config={{ count: { label: "Complaints", color: chartColors[0] } }} className="h-72 w-full">
            <LineChart data={trend}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="count" stroke={chartColors[0]} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ChartContainer>}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
          <div className="mb-4">
            <h3 className="font-display font-semibold">Complaints by Location</h3>
            <p className="text-xs text-muted-foreground">Highest complaint volumes</p>
          </div>
          <div className="space-y-3">
            {locations.map((item, index) => {
              const max = Math.max(...locations.map((entry) => entry.count), 1);
              return (
                <div key={formatLocation(item.location)} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-32 truncate">{formatLocation(item.location)}</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: chartColors[index % chartColors.length] }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{item.count}</span>
                </div>
              );
            })}
            {!locations.length && <div className="text-sm text-muted-foreground">No location data yet.</div>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card animate-fade-in-up [animation-delay:200ms]">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold">Recent Complaints</h3>
            <p className="text-xs text-muted-foreground">Latest 5 submissions</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/complaints">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left font-medium py-3 px-5">ID</th>
                <th className="text-left font-medium py-3 px-5">Citizen</th>
                <th className="text-left font-medium py-3 px-5 hidden md:table-cell">Category</th>
                <th className="text-left font-medium py-3 px-5">Status</th>
                <th className="text-left font-medium py-3 px-5 hidden md:table-cell">Date</th>
                <th className="text-right font-medium py-3 px-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map((item) => (
                <tr key={item._id} className="hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => openComplaint(item._id)}>
                  <td className="py-3 px-5 font-medium text-primary">{item.receiptId || item._id}</td>
                  <td className="py-3 px-5">{complaintDisplayName(item)}</td>
                  <td className="py-3 px-5 hidden md:table-cell text-muted-foreground">{item.category || "—"}</td>
                  <td className="py-3 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[item.status || "pending"]}`}>
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="py-3 px-5 hidden md:table-cell text-muted-foreground text-xs">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                  </td>
                  <td className="py-3 px-5 text-right" onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction("view", item)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("assign", item)}>Assign Officer</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("escalate", item)}>Escalate Case</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction("delete", item)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">No complaints yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
