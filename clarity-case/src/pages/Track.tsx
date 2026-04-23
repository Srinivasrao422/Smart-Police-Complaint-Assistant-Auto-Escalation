import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Calendar,
  User,
  Phone,
  Inbox,
  Eye,
  Edit3,
  Download,
  Printer,
  Building2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { SLABadge } from "@/components/SLABadge";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { AuditLog, type AuditEntry } from "@/components/AuditLog";
import { api } from "@/lib/api";
import { downloadComplaintPdf, formatLocation, statusLabel } from "@/lib/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/context/RealtimeContext";

const colorMap: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  created: { bg: "bg-primary", text: "text-primary", border: "border-primary", ring: "ring-primary/20" },
  viewed: { bg: "bg-secondary", text: "text-secondary", border: "border-secondary", ring: "ring-secondary/20" },
  updated: { bg: "bg-warning", text: "text-warning", border: "border-warning", ring: "ring-warning/20" },
  escalated: { bg: "bg-destructive", text: "text-destructive", border: "border-destructive", ring: "ring-destructive/20" },
  resolved: { bg: "bg-success", text: "text-success", border: "border-success", ring: "ring-success/20" },
  feedback: { bg: "bg-secondary", text: "text-secondary", border: "border-secondary", ring: "ring-secondary/20" },
};

const statusTone = (status?: string) => {
  if (status === "resolved") return "success";
  if (status === "escalated") return "destructive";
  if (status === "in-progress") return "warning";
  return "primary";
};

const Track = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get("receiptId") || "");
  const [searched, setSearched] = useState(!!searchParams.get("receiptId"));
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<any>(null);
  const { lastComplaintEvent, lastFeedbackEvent } = useRealtime();

  const loadComplaint = async (receiptId: string) => {
    if (!receiptId.trim()) return;
    setLoading(true);
    try {
      const body = await api.get(`/api/complaints/receipt/${receiptId.trim()}`);
      setComplaint(body);
      setSearched(true);
      setSearchParams({ receiptId: receiptId.trim() });
    } catch (err: any) {
      console.error(err);
      setComplaint(null);
      toast.error(err?.message || "Complaint not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const receiptId = searchParams.get("receiptId");
    if (receiptId) {
      loadComplaint(receiptId);
    }
  }, []);

  useEffect(() => {
    const incoming = lastComplaintEvent?.complaint;
    if (incoming?.receiptId && incoming.receiptId === complaint?.receiptId) {
      loadComplaint(incoming.receiptId);
    }
  }, [lastComplaintEvent]);

  useEffect(() => {
    if (lastFeedbackEvent?.receiptId && lastFeedbackEvent.receiptId === complaint?.receiptId) {
      loadComplaint(lastFeedbackEvent.receiptId);
    }
  }, [lastFeedbackEvent]);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    loadComplaint(id);
  };

  const auditEntries: AuditEntry[] = useMemo(() => (
    (complaint?.activityLogs || []).map((entry: any) => ({
      type: ["created", "viewed", "updated", "escalated", "assigned", "resolved"].includes(entry.action) ? entry.action : "updated",
      actor: entry.actorName || entry.actor?.name || (entry.action === "feedback" ? "Citizen" : "System"),
      role: entry.action === "feedback" ? "Citizen" : "System",
      time: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "",
      note: entry.message,
    }))
  ), [complaint]);

  const timeline = useMemo(() => {
    const base = (complaint?.activityLogs || []).map((entry: any) => ({
      status: entry.message || statusLabel(entry.action),
      date: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Pending",
      desc: entry.message || "Case activity recorded.",
      icon:
        entry.action === "created" ? FileText :
        entry.action === "viewed" ? Eye :
        entry.action === "escalated" ? AlertTriangle :
        entry.action === "resolved" ? CheckCircle2 :
        entry.action === "feedback" ? MessageSquare :
        Edit3,
      done: true,
      color: entry.action === "feedback" ? "feedback" : (["created", "viewed", "updated", "escalated", "resolved"].includes(entry.action) ? entry.action : "updated"),
    }));

    if (complaint?.status !== "resolved") {
      base.push({
        status: "Resolution",
        date: "Pending",
        desc: "Awaiting final report.",
        icon: CheckCircle2,
        done: false,
        color: "resolved",
      });
    }

    return base;
  }, [complaint]);

  const completed = timeline.filter((item) => item.done).length;
  const progress = timeline.length ? (completed / timeline.length) * 100 : 0;
  const hoursLeft = complaint?.slaHours ? complaint.slaHours - Math.round((Date.now() - new Date(complaint.createdAt).getTime()) / 36e5) : 0;

  return (
    <div className="container py-10 max-w-4xl page-panel">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Track Your Complaint</h1>
        <p className="text-muted-foreground mt-2">Enter your complaint ID to view the latest status.</p>
      </div>

      <form onSubmit={search} className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-soft mb-8 animate-scale-in">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={id} onChange={(event) => setId(event.target.value)} placeholder="e.g. CMP-1776705701814-1234" className="pl-11 h-12" />
          </div>
          <Button type="submit" variant="hero" size="lg" className="sm:w-auto">Track Status</Button>
        </div>
      </form>

      {!searched ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center animate-fade-in">
          <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <Inbox className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-lg">No complaint loaded</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Enter your complaint ID above to view its real-time status, history, and assigned officer.</p>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-72" />
            <div className="grid sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
            </div>
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : !complaint ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center animate-fade-in">
          <h3 className="font-display font-semibold text-lg">Complaint not found</h3>
          <p className="text-sm text-muted-foreground mt-1">Check the receipt ID and try again.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in-up">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="gradient-primary p-6 text-primary-foreground">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider opacity-80">Complaint ID</div>
                  <div className="font-display text-2xl font-bold">{complaint.receiptId}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-full bg-white/15 text-primary-foreground text-xs font-semibold flex items-center gap-1.5">
                    {statusLabel(complaint.status)}
                  </span>
                  {complaint.lifecycleStage && (
                    <span className="px-3 py-1.5 rounded-full bg-white/10 text-primary-foreground text-xs font-semibold">
                      {complaint.lifecycleStage}
                    </span>
                  )}
                  <SLABadge hoursLeft={hoursLeft} className="bg-white/90" />
                </div>
              </div>
              <h2 className="font-display text-xl font-semibold mt-4">{complaint.title || complaint.category || complaint.receiptId}</h2>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" variant="soft" onClick={() => downloadComplaintPdf(complaint)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download PDF
                </Button>
                <Button size="sm" variant="soft" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print
                </Button>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs opacity-90 mb-2">
                  <span>{completed} of {timeline.length} milestones</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {[
                { icon: Calendar, label: "Created", value: complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "—" },
                { icon: Clock, label: "Last updated", value: complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : "—" },
                { icon: Building2, label: "Department", value: complaint.category || "General" },
                { icon: FileText, label: "Lifecycle", value: complaint.lifecycleStage || "Filed" },
                { icon: MapPin, label: "Station", value: formatLocation(complaint.location) },
                { icon: User, label: "Officer", value: complaint.officerName || complaint.assignedTo?.name || "Unassigned" },
                { icon: Phone, label: "Contact", value: complaint.assignedTo?.phone || complaint.user?.phone || "—" },
              ].map((meta) => (
                <div key={meta.label} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                    <meta.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{meta.label}</div>
                    <div className="text-sm font-medium">{meta.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-lg">Officer Remarks</h3>
                <p className="text-xs text-muted-foreground">Comments and updates from the assigned officer</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {(complaint.activityLogs || []).length} updates
              </span>
            </div>
            <ol className="space-y-3">
              {(complaint.activityLogs || []).slice(0, 3).map((entry: any, index: number) => (
                <li key={index} className="rounded-xl border border-border p-4 bg-accent/20">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {(entry.actorName || "S").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{entry.actorName || complaint.officerName || "System"}</div>
                        <div className="text-[11px] text-muted-foreground">{entry.action}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}</span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{entry.message}</p>
                </li>
              ))}
              {(!complaint.activityLogs || complaint.activityLogs.length === 0) && (
                <li className="rounded-xl border border-border p-4 bg-accent/20 text-sm text-muted-foreground">No remarks yet.</li>
              )}
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-lg mb-6">Status Timeline</h3>
            <ol className="relative border-l-2 border-dashed border-border ml-4 space-y-7">
              {timeline.map((item, index) => {
                const tone = colorMap[item.color] || colorMap.updated;
                return (
                  <li key={index} className="relative pl-8 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className={`absolute -left-[22px] flex items-center justify-center h-10 w-10 rounded-full ring-4 ${tone.ring} ${item.done ? tone.bg : "bg-muted"}`}>
                      <item.icon className={`h-4 w-4 ${item.done ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium">{item.status}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${tone.border} ${tone.text} bg-transparent`}>
                        {item.done ? "Completed" : "Pending"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{item.date}</div>
                    <p className="text-sm text-foreground/80 mt-2">{item.desc}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <AuditLog entries={auditEntries} />

          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-sm">Rate this resolution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your feedback helps us improve service quality and accountability.</p>
            </div>
            <FeedbackDialog complaintId={complaint.receiptId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Track;
