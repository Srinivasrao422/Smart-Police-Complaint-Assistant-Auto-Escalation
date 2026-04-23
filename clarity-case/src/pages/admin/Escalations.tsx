import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, ArrowUpRight, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatLocation } from "@/lib/admin";

const priorityStyles: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/10 text-destructive border border-destructive/20",
  Medium: "bg-warning/10 text-warning border border-warning/20",
};

const Escalations = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ activeEscalations: 0, avgOverdueHours: 0, autoEscalatedToday: 0 });

  const load = async () => {
    try {
      const body = await api.get("/api/admin/escalations");
      setItems(body.items || []);
      setSummary(body.summary || {});
    } catch (err) {
      console.error(err);
      toast.error("Unable to load escalations");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const override = async (id: string) => {
    try {
      await api.patch(`/api/admin/complaints/${id}`, { status: "in-progress" });
      toast.success("Manual override applied");
      load();
    } catch (err) {
      console.error(err);
      toast.error("Unable to override escalation");
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Escalation Control</h1>
        <p className="text-muted-foreground text-sm mt-1">Cases that have crossed SLA thresholds. Review, override, or fast-track manually.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Active escalations", value: summary.activeEscalations || 0, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Avg overdue", value: `${summary.avgOverdueHours || 0} h`, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
          { label: "Auto-escalated today", value: summary.autoEscalatedToday || 0, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
        ].map((item, index) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-5 hover-lift animate-scale-in" style={{ animationDelay: `${index * 80}ms` }}>
            <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center mb-3`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div className="font-display text-2xl font-bold">{item.value}</div>
            <div className="text-sm text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in-up">
        <div className="p-5 border-b border-border bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h3 className="font-display font-semibold">Cases past SLA</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Highlighted cases require immediate attention from senior officers.</p>
        </div>

        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <div key={item._id} className="p-5 hover:bg-accent/30 transition-colors animate-fade-in" style={{ animationDelay: `${index * 60}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-primary">{item.receiptId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityStyles[item.priority] || priorityStyles.Medium}`}>
                      {item.priority || "Medium"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Overdue {item.timeExceededHours}h
                    </span>
                  </div>
                  <h4 className="font-medium mt-1.5">{item.title || item.category || item.receiptId}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Citizen: {item.victim?.fullName || item.user?.name || "—"} · Station: {formatLocation(item.location, "Not Available")} · Escalated to: <span className="text-foreground font-medium">{item.escalationLevel || "L2 - Senior Officer"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    SLA deadline: {item.slaDeadline ? new Date(item.slaDeadline).toLocaleString() : "—"} · Assigned officer: {item.assignedTo?.name || item.officerName || "Unassigned"} · Priority: {item.priority || "Medium"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/admin/complaints/${item._id}`)}>
                    View case
                  </Button>
                  <Button variant="hero" size="sm" onClick={() => override(item._id)}>
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Override
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!items.length && <div className="p-5 text-sm text-muted-foreground">No escalations found.</div>}
        </div>
      </div>
    </div>
  );
};

export default Escalations;
