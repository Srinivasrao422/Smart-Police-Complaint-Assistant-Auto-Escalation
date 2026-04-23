import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Eye, Filter, MoreVertical, Search, UserPlus, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { SLABadge } from "@/components/SLABadge";
import {
  assignAdminComplaint,
  bulkAdminComplaintAction,
  complaintDisplayName,
  deleteAdminComplaint,
  downloadComplaintPdf,
  escalateAdminComplaint,
  fetchAdminComplaints,
  fetchComplaintDetail,
  formatLocation,
  fetchOfficerWorkload,
  markComplaintRead,
  priorityStyles,
  shareAdminComplaint,
  statusLabel,
  statusStyles,
  updateAdminComplaint,
} from "@/lib/admin";
import { useRealtime } from "@/context/RealtimeContext";
import { Skeleton } from "@/components/ui/skeleton";

const statusFilters = [
  { label: "All", value: "All" },
  { label: "Submitted", value: "pending" },
  { label: "In Progress", value: "in-progress" },
  { label: "Escalated", value: "escalated" },
  { label: "Resolved", value: "resolved" },
];

const priorityFilters = ["All", "High", "Medium", "Low"];

const Complaints = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "All",
    category: "All",
    priority: "All",
    query: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [suggestedOfficer, setSuggestedOfficer] = useState<any | null>(null);
  const [assignFor, setAssignFor] = useState<any | null>(null);
  const [chosenOfficerId, setChosenOfficerId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { status: string; priority: string; remarks: string }>>({});
  const { lastComplaintEvent } = useRealtime();

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(complaints.map((item) => item.category).filter(Boolean)))],
    [complaints]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintsBody, workloadBody] = await Promise.all([
        fetchAdminComplaints({
          status: filters.status,
          category: filters.category,
          priority: filters.priority,
          q: filters.query,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        fetchOfficerWorkload(),
      ]);

      const nextComplaints = (complaintsBody.items || []).map((item: any) => ({
        ...item,
        id: item._id,
        citizen: complaintDisplayName(item),
        station: formatLocation(item.location, "Not Available"),
        officer: item.officerName || item.assignedTo?.name || "Unassigned",
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "",
      }));

      setComplaints(nextComplaints);
      setOfficers(workloadBody.items || []);
      setSuggestedOfficer(workloadBody.suggestedOfficer || null);
      setDrafts(
        Object.fromEntries(
          nextComplaints.map((item: any) => [
            item.id,
            {
              status: item.status || "pending",
              priority: item.priority || "Low",
              remarks: item.remarks || "",
            },
          ])
        )
      );
      setSelectedIds((current) => current.filter((id) => nextComplaints.some((item: any) => item.id === id)));
    } catch (err) {
      console.error(err);
      toast.error("Unable to load complaints");
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.category, filters.priority, filters.query, filters.startDate, filters.endDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters.query, load]);

  useEffect(() => {
    if (lastComplaintEvent) {
      load();
    }
  }, [lastComplaintEvent, load]);

  const isDirty = (complaint: any) => {
    const draft = drafts[complaint.id];
    if (!draft) return false;
    return (
      draft.status !== (complaint.status || "pending") ||
      draft.priority !== (complaint.priority || "Low") ||
      draft.remarks !== (complaint.remarks || "")
    );
  };

  const openComplaint = async (id: string) => {
    try {
      await markComplaintRead(id);
    } catch (err) {
      console.error(err);
    }
    navigate(`/admin/complaints/${id}`);
  };

  const openAssign = (complaint: any) => {
    setAssignFor(complaint);
    setChosenOfficerId(suggestedOfficer?._id || officers[0]?._id || "");
  };

  const confirmAssign = async () => {
    if (!assignFor || !chosenOfficerId) return;
    try {
      await assignAdminComplaint(assignFor.id, chosenOfficerId);
      toast.success("Officer assigned");
      setAssignFor(null);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to assign complaint");
    }
  };

  const saveUpdate = async (complaint: any) => {
    try {
      const updated = await updateAdminComplaint(complaint.id, drafts[complaint.id]);
      setComplaints((current) => current.map((item) => (item.id === complaint.id ? { ...item, ...updated } : item)));
      toast.success("Complaint updated");
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to update complaint");
    }
  };

  const handleMenu = async (action: string, complaint: any) => {
    try {
      if (action === "pdf") {
        const detail = await fetchComplaintDetail(complaint.id);
        downloadComplaintPdf(detail);
        return;
      }
      if (action === "share") {
        const body = await shareAdminComplaint(complaint.id);
        await navigator.clipboard.writeText(JSON.stringify(body.payload, null, 2));
        toast.success("Case details copied");
        return;
      }
      if (action === "escalate") {
        await escalateAdminComplaint(complaint.id);
        toast.success("Complaint escalated");
        return load();
      }
      if (action === "close") {
        await updateAdminComplaint(complaint.id, { status: "resolved" });
        toast.success("Case closed");
        return load();
      }
      if (action === "delete") {
        await deleteAdminComplaint(complaint.id);
        toast.success("Complaint deleted");
        return load();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Action failed");
    }
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)));
  };

  const handleBulk = async (action: "assign" | "close" | "export") => {
    if (!selectedIds.length) return toast.info("Select complaints first");
    try {
      const body = await bulkAdminComplaintAction({
        ids: selectedIds,
        action,
        officerId: action === "assign" ? chosenOfficerId || suggestedOfficer?._id : undefined,
      });
      if (action === "export") {
        const blob = new Blob([JSON.stringify(body.items || [], null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "complaints-export.json";
        anchor.click();
        URL.revokeObjectURL(url);
      }
      toast.success(action === "export" ? "Export ready" : `Bulk ${action} completed`);
      setSelectedIds([]);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Bulk action failed");
    }
  };

  return (
    <div className="space-y-6 page-panel">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Complaint Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Triage, assign officers, monitor SLA and execute bulk actions.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card animate-fade-in-up">
        <div className="p-5 border-b border-border space-y-3">
          <div className="grid lg:grid-cols-[1.4fr_repeat(4,_minmax(0,_1fr))] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search by ID, citizen, category or station..."
                className="pl-9"
              />
            </div>
            <Input type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
            <Input type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
            <Select value={filters.priority} onValueChange={(value) => setFilters((current) => ({ ...current, priority: value }))}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                {priorityFilters.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load}>
              <Filter className="h-4 w-4 mr-2" /> Apply
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-center mr-2">Status:</span>
            {statusFilters.map((item) => (
              <button
                key={item.value}
                onClick={() => setFilters((current) => ({ ...current, status: item.value }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.status === item.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-center mr-2">Category:</span>
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setFilters((current) => ({ ...current, category: item }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.category === item ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => handleBulk("assign")} disabled={!selectedIds.length}>
              <WandSparkles className="h-4 w-4 mr-2" /> Bulk assign
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulk("close")} disabled={!selectedIds.length}>
              Close selected
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulk("export")} disabled={!selectedIds.length}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              Suggested officer: <span className="text-foreground font-medium">{suggestedOfficer?.name || "Not available"}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left font-medium py-3 px-5 w-12">
                  <Checkbox
                    checked={!!complaints.length && selectedIds.length === complaints.length}
                    onCheckedChange={(checked) => setSelectedIds(checked ? complaints.map((item) => item.id) : [])}
                  />
                </th>
                <th className="text-left font-medium py-3 px-5">ID</th>
                <th className="text-left font-medium py-3 px-5">Citizen</th>
                <th className="text-left font-medium py-3 px-5 hidden md:table-cell">Category</th>
                <th className="text-left font-medium py-3 px-5 hidden lg:table-cell">Officer</th>
                <th className="text-left font-medium py-3 px-5">Priority</th>
                <th className="text-left font-medium py-3 px-5">SLA</th>
                <th className="text-left font-medium py-3 px-5">Status</th>
                <th className="text-right font-medium py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-accent/40 transition-colors">
                  <td className="py-3 px-5">
                    <Checkbox
                      checked={selectedIds.includes(complaint.id)}
                      onCheckedChange={(checked) => toggleSelected(complaint.id, !!checked)}
                    />
                  </td>
                  <td className="py-3 px-5 font-medium text-primary">{complaint.receiptId || complaint.id}</td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full gradient-teal flex items-center justify-center text-[10px] font-semibold text-secondary-foreground">
                        {complaint.citizen.split(" ").map((part: string) => part[0]).join("")}
                      </div>
                      {complaint.citizen}
                    </div>
                  </td>
                  <td className="py-3 px-5 hidden md:table-cell text-muted-foreground">{complaint.category || "—"}</td>
                  <td className="py-3 px-5 hidden lg:table-cell">
                    <span className={`text-xs ${complaint.officer === "Unassigned" ? "text-destructive italic" : "text-muted-foreground"}`}>
                      {complaint.officer}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <Select
                      value={drafts[complaint.id]?.priority || complaint.priority}
                      onValueChange={(value) => setDrafts((current) => ({ ...current, [complaint.id]: { ...current[complaint.id], priority: value } }))}
                    >
                      <SelectTrigger className={`w-[115px] h-9 text-xs ${priorityStyles[drafts[complaint.id]?.priority || complaint.priority] || priorityStyles.Low}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-5">
                    {complaint.status === "resolved" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <SLABadge hoursLeft={complaint.sla?.breached ? -Math.ceil(complaint.sla.exceededHours) : Math.ceil(complaint.sla?.remainingHours || 0)} />
                    )}
                  </td>
                  <td className="py-3 px-5">
                    <Select
                      value={drafts[complaint.id]?.status || complaint.status}
                      onValueChange={(value) => setDrafts((current) => ({ ...current, [complaint.id]: { ...current[complaint.id], status: value } }))}
                    >
                      <SelectTrigger className={`w-[140px] h-9 text-xs border ${statusStyles[drafts[complaint.id]?.status || complaint.status] || statusStyles.pending}`}>
                        <SelectValue>{statusLabel(drafts[complaint.id]?.status || complaint.status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="escalated">Escalated</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => openComplaint(complaint.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => openAssign(complaint)}>
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => saveUpdate(complaint)} disabled={!isDirty(complaint)}>
                        Update
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMenu("pdf", complaint)}>Download Case PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMenu("escalate", complaint)}>Escalate</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMenu("close", complaint)}>Close Case</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleMenu("share", complaint)}>Share case details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMenu("delete", complaint)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && complaints.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">No complaints match your filters.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={9} className="py-6 px-5">
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-9 gap-3">
                          {Array.from({ length: 9 }).map((__, itemIndex) => (
                            <Skeleton key={itemIndex} className="h-10" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!assignFor} onOpenChange={(open) => !open && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign / Reassign Officer</DialogTitle>
            <DialogDescription>
              Least busy suggestion: {suggestedOfficer?.name || "Not available"}. You can still pick any officer manually.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Select value={chosenOfficerId} onValueChange={setChosenOfficerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an officer" />
              </SelectTrigger>
              <SelectContent>
                {officers.map((officer) => (
                  <SelectItem key={officer._id} value={officer._id}>
                    {officer.name} · {officer.department || officer.role} · {officer.activeCases || 0} active
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignFor(null)}>Cancel</Button>
            <Button variant="hero" onClick={confirmAssign} disabled={!chosenOfficerId}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Complaints;
