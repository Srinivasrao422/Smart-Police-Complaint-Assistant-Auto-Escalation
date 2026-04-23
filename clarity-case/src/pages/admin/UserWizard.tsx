import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { complaintDisplayName, statusLabel, statusStyles } from "@/lib/admin";

const steps = ["Basic Info", "Complaints History", "Activity Logs", "Actions"];

const UserWizard = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [userBody, complaintsBody] = await Promise.all([
        api.get(`/api/admin/users/${id}`),
        api.get(`/api/admin/users/${id}/complaints`),
      ]);
      setUser(userBody);
      setComplaints(complaintsBody.items || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to load user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const toggleStatus = async () => {
    if (!user) return;
    const nextStatus = user.status === "active" ? "blocked" : "active";
    try {
      const updated = await api.patch(`/api/admin/users/${id}/status`, { status: nextStatus });
      setUser(updated);
      toast.success(`User ${nextStatus}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to update user");
    }
  };

  const resetPassword = async () => {
    try {
      const body = await api.post(`/api/admin/users/${id}/reset-password`, {});
      await navigator.clipboard.writeText(body.temporaryPassword || "");
      toast.success("Temporary password copied to clipboard");
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to reset password");
    }
  };

  const activity = useMemo(() => {
    if (!user) return [];
    const logs = [...(user.activityLogs || [])];
    complaints.forEach((complaint) => {
      (complaint.activityLogs || []).slice(0, 2).forEach((entry: any) => {
        logs.push({
          action: entry.action,
          message: `${entry.message} · ${complaint.receiptId}`,
          createdAt: entry.createdAt,
        });
      });
    });
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user, complaints]);

  if (loading) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading user...</div>;
  }

  if (!user) {
    return <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold">{user.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">User management wizard and complaint history.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <button
            key={step}
            className={`px-3 py-2 rounded-lg text-sm transition-colors ${activeStep === index ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            onClick={() => setActiveStep(index)}
          >
            {step}
          </button>
        ))}
      </div>

      {activeStep === 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Phone</div>
            <div className="font-medium">{user.phone || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Role</div>
            <div className="font-medium">{user.role}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="font-medium">{user.status}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Joined</div>
            <div className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Complaints filed</div>
            <div className="font-display text-3xl font-bold">{complaints.length}</div>
          </div>
        </div>
      )}

      {activeStep === 1 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          {complaints.map((complaint) => (
            <button
              key={complaint._id}
              className="w-full text-left rounded-xl border border-border p-4 hover:bg-accent/40 transition-colors"
              onClick={() => navigate(`/admin/complaints/${complaint._id}`)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{complaint.title || complaint.receiptId}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {complaint.receiptId} · {complaint.category || "—"} · {complaintDisplayName(complaint)}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[complaint.status] || statusStyles.pending}`}>
                  {statusLabel(complaint.status)}
                </span>
              </div>
            </button>
          ))}
          {complaints.length === 0 && <div className="text-sm text-muted-foreground">No complaints filed by this user.</div>}
        </div>
      )}

      {activeStep === 2 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          {activity.map((entry: any, index: number) => (
            <div key={`${entry.createdAt}-${index}`} className="rounded-xl border border-border p-4">
              <div className="font-medium text-sm">{entry.message || entry.action}</div>
              <div className="text-xs text-muted-foreground mt-1">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}</div>
            </div>
          ))}
          {activity.length === 0 && <div className="text-sm text-muted-foreground">No activity available.</div>}
        </div>
      )}

      {activeStep === 3 && (
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-wrap gap-3">
          <Button variant={user.status === "active" ? "outline" : "hero"} onClick={toggleStatus}>
            {user.status === "active" ? "Block user" : "Unblock user"}
          </Button>
          <Button variant="outline" onClick={resetPassword}>Reset password</Button>
          <Button variant="outline" onClick={() => setActiveStep(1)}>View complaints</Button>
        </div>
      )}
    </div>
  );
};

export default UserWizard;
