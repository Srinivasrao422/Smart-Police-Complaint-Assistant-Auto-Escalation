import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import socket from "@/lib/socket";
import {
  downloadComplaintPdf,
  fetchComplaintDetail,
  fetchComplaintMessages,
  formatLocation,
  formatSlaLabel,
  postComplaintMessage,
  shareAdminComplaint,
  statusLabel,
  statusStyles,
  updateAdminComplaint,
} from "@/lib/admin";
import { api } from "@/lib/api";

const ComplaintDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({ status: "", priority: "", remarks: "" });
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [viewerFile, setViewerFile] = useState<any | null>(null);

  const dirty = useMemo(() => {
    if (!complaint) return false;
    return (
      draft.status !== (complaint.status || "") ||
      draft.priority !== (complaint.priority || "") ||
      draft.remarks !== (complaint.remarks || "")
    );
  }, [complaint, draft]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, messagesBody] = await Promise.all([
        fetchComplaintDetail(id),
        fetchComplaintMessages(id),
      ]);
      api.patch(`/api/admin/complaints/${id}/read`, {}).catch((err) => console.error(err));
      setComplaint(detail);
      setMessages(messagesBody.items || []);
      setDraft({
        status: detail.status || "pending",
        priority: detail.priority || "Low",
        remarks: detail.remarks || "",
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to load complaint");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  useEffect(() => {
    if (!id) return;
    socket.emit("join-complaint", id);
    const onMessage = (payload: any) => {
      if (payload.complaint === id || payload.complaint?._id === id) {
        setMessages((current) =>
          current.some((item) => item._id && item._id === payload._id) ? current : [...current, payload]
        );
      }
    };
    socket.on("message", onMessage);
    return () => {
      socket.off("message", onMessage);
    };
  }, [id]);

  const save = async () => {
    try {
      await updateAdminComplaint(id, draft);
      await load();
      toast.success("Complaint updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to update complaint");
    }
  };

  const share = async () => {
    try {
      const body = await shareAdminComplaint(id, "json");
      await navigator.clipboard.writeText(JSON.stringify(body.payload, null, 2));
      toast.success("Case JSON copied to clipboard");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to share case");
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    try {
      const created = await postComplaintMessage(id, chatMessage);
      setMessages((current) =>
        current.some((item) => item._id && item._id === created._id) ? current : [...current, created]
      );
      setChatMessage("");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to send message");
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading complaint...</div>;
  }

  if (!complaint) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Complaint not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">{complaint.title || "Complaint details"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {complaint.receiptId || complaint._id} - {complaint.category || "Uncategorized"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => downloadComplaintPdf(complaint)}>Download PDF</Button>
          <Button variant="outline" onClick={share}>Share case details</Button>
          <Button
            variant="hero"
            onClick={() => complaint.assignedTo?._id && navigate(`/admin/officers/${complaint.assignedTo._id}?complaintId=${complaint._id}`)}
            disabled={!complaint.assignedTo?._id}
          >
            View assigned officer
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_.95fr]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Citizen</div>
              <div className="font-medium">{complaint.victim?.fullName || complaint.user?.name || "Not Available"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Assigned officer</div>
              <div className="font-medium">{complaint.officerName || complaint.assignedTo?.name || "Unassigned"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Location</div>
              <div className="font-medium">{formatLocation(complaint.location, "Not Available")}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">SLA</div>
              <div className="font-medium">{formatSlaLabel(complaint.sla)}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-muted-foreground">Description</div>
            <div className="whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-sm">
              {complaint.description || "No description provided."}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-muted-foreground">Evidence Viewer</div>
            <div className="space-y-2">
              {(complaint.evidenceFiles || []).map((file: any, index: number) => (
                <button
                  key={`${file.url}-${index}`}
                  onClick={() => setViewerFile(file)}
                  className="w-full rounded-xl border border-border p-3 text-left text-sm transition-colors hover:bg-accent/40"
                >
                  <div className="font-medium">{file.name || `Evidence ${index + 1}`}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{file.tag || file.mimeType || "File"}</div>
                </button>
              ))}
              {(!complaint.evidenceFiles || complaint.evidenceFiles.length === 0) && (
                <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">No evidence files uploaded yet.</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-muted-foreground">Case Timeline</div>
            <div className="space-y-2">
              {(complaint.timeline || []).slice(0, 10).map((entry: any, index: number) => (
                <div key={`${entry.time}-${index}`} className="rounded-xl border border-border p-3 text-sm">
                  <div className="font-medium capitalize">{entry.action}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {entry.time ? new Date(entry.time).toLocaleString() : ""}
                    {entry.byName ? ` - ${entry.byName}` : ""}
                  </div>
                </div>
              ))}
              {(!complaint.timeline || complaint.timeline.length === 0) && (
                <div className="rounded-xl border border-border p-3 text-sm text-muted-foreground">No timeline entries logged yet.</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs text-muted-foreground">Real-time Chat</div>
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="max-h-64 space-y-2 overflow-auto">
                {messages.map((item, index) => (
                  <div key={`${item._id || item.createdAt}-${index}`} className="rounded-lg border border-border p-3">
                    <div className="text-sm font-medium">{item.senderName || item.sender?.name || "Admin"}</div>
                    <div className="mt-1 text-sm">{item.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                ))}
                {!messages.length && <div className="text-sm text-muted-foreground">No chat messages yet.</div>}
              </div>
              <div className="flex gap-2">
                <Input value={chatMessage} onChange={(event) => setChatMessage(event.target.value)} placeholder="Send update to the case room..." />
                <Button variant="hero" onClick={sendMessage}>Send</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <div className="mb-2 text-xs text-muted-foreground">Current status</div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium border ${statusStyles[complaint.status] || statusStyles.pending}`}>
              {statusLabel(complaint.status)}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={draft.priority} onValueChange={(value) => setDraft((current) => ({ ...current, priority: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks</label>
            <Textarea
              value={draft.remarks}
              onChange={(event) => setDraft((current) => ({ ...current, remarks: event.target.value }))}
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Created</div>
              <div className="font-medium">{complaint.createdAt ? new Date(complaint.createdAt).toLocaleString() : "Not Available"}</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Resolved</div>
              <div className="font-medium">{complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : "Not Available"}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {complaint.assignedTo?._id ? (
              <Button variant="outline" asChild>
                <Link to={`/admin/officers/${complaint.assignedTo._id}?complaintId=${complaint._id}`}>Assign Case</Link>
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate("/admin/complaints")}>Assign Case</Button>
            )}
            <Button variant="hero" onClick={save} disabled={!dirty}>Update</Button>
          </div>

          <Input readOnly value={`Resolution time: ${complaint.resolutionHours ?? "Not Available"} hrs`} />
          <Input readOnly value={`SLA status: ${formatSlaLabel(complaint.sla)}`} />
        </div>
      </div>

      <Dialog open={!!viewerFile} onOpenChange={(open) => !open && setViewerFile(null)}>
        <DialogContent className="max-w-4xl" aria-describedby="dialog-desc">
          <DialogHeader>
            <DialogTitle>{viewerFile?.name || "Evidence Viewer"}</DialogTitle>
          </DialogHeader>
          <p id="dialog-desc" className="sr-only">Complaint details</p>
          {viewerFile?.mimeType?.includes("pdf") ? (
            <iframe src={viewerFile.url} className="h-[70vh] w-full rounded-xl border border-border" title="Evidence PDF" />
          ) : (
            <img src={viewerFile?.url} alt={viewerFile?.name || "Evidence"} className="max-h-[70vh] w-full rounded-xl object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintDetail;
