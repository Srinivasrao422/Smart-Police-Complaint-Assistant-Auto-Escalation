import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { shareAdminComplaint } from "@/lib/admin";

const OfficerDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get("complaintId");
  const [officer, setOfficer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const body = await api.get(`/api/admin/officers/${id}`);
        setOfficer(body);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Unable to load officer");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const assignCase = async () => {
    if (!complaintId) return;
    try {
      await api.patch(`/api/admin/complaints/${complaintId}/assign`, { officerId: id });
      toast.success("Case assigned");
      navigate(`/admin/complaints/${complaintId}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Assignment failed");
    }
  };

  const shareCase = async () => {
    if (!complaintId) return;
    try {
      const body = await shareAdminComplaint(complaintId, "email");
      await navigator.clipboard.writeText(JSON.stringify(body.payload, null, 2));
      toast.success("Case details copied for sharing");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to share case");
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading officer...</div>;
  }

  if (!officer) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Officer not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{officer.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Officer details and active case workload.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground">Department</div>
            <div className="font-medium">{officer.department || "Operations"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Contact</div>
            <div className="font-medium">{officer.phone || officer.email || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Role</div>
            <div className="font-medium">{officer.role}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Active cases</div>
            <div className="font-display text-3xl font-bold">{officer.activeCases || 0}</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="hero" onClick={assignCase} disabled={!complaintId}>Assign Case</Button>
            <Button variant="outline" onClick={shareCase} disabled={!complaintId}>Share case details</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display font-semibold mb-4">Recent assigned complaints</h3>
          <div className="space-y-3">
            {(officer.recentComplaints || []).map((complaint: any) => (
              <button
                key={complaint._id}
                className="w-full text-left rounded-xl border border-border p-4 hover:bg-accent/40 transition-colors"
                onClick={() => navigate(`/admin/complaints/${complaint._id}`)}
              >
                <div className="font-medium">{complaint.title || complaint.receiptId}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {complaint.receiptId} · {complaint.category || "—"} · {complaint.status}
                </div>
              </button>
            ))}
            {(!officer.recentComplaints || officer.recentComplaints.length === 0) && (
              <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">No assigned cases yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficerDetail;
