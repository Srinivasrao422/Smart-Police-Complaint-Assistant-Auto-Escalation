import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatLocation } from "@/lib/admin";
import { useRealtime } from "@/context/RealtimeContext";

const OfficerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>({ assignedComplaints: [], statusUpdates: [], summary: {} });
  const { lastComplaintEvent } = useRealtime();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const body = await api.get("/api/officer/dashboard");
      setDashboard(body);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (lastComplaintEvent?.complaint?.assignedTo?._id === user.id || lastComplaintEvent?.complaint?.assignedTo === user.id) {
      load();
    }
  }, [lastComplaintEvent, load]);

  const stats = useMemo(() => ([
    { label: "Assigned", value: dashboard.summary?.totalAssigned || 0, icon: Clock3 },
    { label: "Pending", value: dashboard.summary?.pending || 0, icon: AlertTriangle },
    { label: "In Progress", value: dashboard.summary?.inProgress || 0, icon: RefreshCcw },
    { label: "Resolved", value: dashboard.summary?.resolved || 0, icon: CheckCircle2 },
  ]), [dashboard.summary]);

  return (
    <div className="space-y-6 page-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Assigned Complaints</h1>
          <p className="text-muted-foreground text-sm mt-1">Track active cases and recent status updates in real time.</p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-5">
            <item.icon className="h-5 w-5 text-primary mb-3" />
            <div className="font-display text-3xl font-bold">{loading ? <Skeleton className="h-8 w-14" /> : item.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_.9fr] gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold mb-4">Complaint Queue</h3>
          <div className="space-y-3">
            {(dashboard.assignedComplaints || []).map((complaint: any) => (
              <div key={complaint._id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{complaint.title || complaint.receiptId}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {complaint.receiptId} · {complaint.category || "Other"} · {complaint.status}
                    </div>
                  </div>
                  <span className="text-xs rounded-full border border-border px-2 py-1">{complaint.priority || "Low"}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-3">{formatLocation(complaint.location, "Not Available")}</div>
              </div>
            ))}
            {!loading && !(dashboard.assignedComplaints || []).length && (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                No complaints assigned yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display font-semibold mb-4">Status Updates</h3>
          <div className="space-y-3">
            {(dashboard.statusUpdates || []).map((update: any, index: number) => (
              <div key={`${update.receiptId}-${index}`} className="rounded-xl border border-border p-4">
                <div className="font-medium">{update.receiptId}</div>
                <div className="text-sm text-muted-foreground mt-1">{update.action || "update"} · {update.status}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {update.byName} · {update.time ? new Date(update.time).toLocaleString() : "Now"}
                </div>
              </div>
            ))}
            {!loading && !(dashboard.statusUpdates || []).length && (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                No recent status updates.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;
