import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { apiFetch } from "@/utils/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtime } from "@/context/RealtimeContext";
import { broadcastSessionChange } from "@/lib/session";

type DashboardData = {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  escalated: number;
  recent: Array<{ _id?: string; receiptId?: string; title: string; category?: string; status?: string; createdAt?: string }>;
};

type UserProfile = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profilePic?: string;
  createdAt?: string;
};

const colors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  "in-progress": "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
  escalated: "bg-destructive/10 text-destructive border-destructive/20",
};

const Profile = () => {
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem("user") || "{}"), []);
  const [profile, setProfile] = useState<UserProfile>({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    address: storedUser?.address || "",
    profilePic: storedUser?.profilePic || "",
    createdAt: storedUser?.createdAt,
  });
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { lastComplaintEvent } = useRealtime();
  const name = profile?.name || "";
  const email = profile?.email || "";
  const initials = (name || email || "U")
    .split(/[ @.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("");

  const load = async () => {
    setLoading(true);
    await Promise.all([
      apiFetch("/api/users/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          profilePic: data.profilePic || "",
          createdAt: data.createdAt,
          id: data.id || data._id,
          _id: data._id,
        });
        localStorage.setItem("user", JSON.stringify(data));
        broadcastSessionChange();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load profile");
      }),
      apiFetch("/api/complaints/my")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setDashboardData(data))
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load profile data");
      })
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const complaint = lastComplaintEvent?.complaint;
    if (!complaint || complaint.user?._id !== (profile.id || profile._id || storedUser.id)) return;
    apiFetch("/api/complaints/my")
      .then((res) => res.json())
      .then((body) => setDashboardData(body))
      .catch((err) => console.error(err));
  }, [lastComplaintEvent, profile.id, profile._id, storedUser.id]);

  const stats = [
    { label: "Total", value: dashboardData?.total ?? 0, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending", value: dashboardData?.pending ?? 0, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
    { label: "Escalated", value: dashboardData?.escalated ?? 0, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Resolved", value: dashboardData?.resolved ?? 0, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  ];

  const handleChange = (field: keyof UserProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);

    try {
      const uploadRes = await apiFetch("/api/users/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      const updateRes = await apiFetch("/api/users/update", {
        method: "PUT",
        body: JSON.stringify({ profilePic: url }),
      });
      if (!updateRes.ok) throw new Error("Profile update failed");
      const updated = await updateRes.json();

      setProfile((current) => ({ ...current, ...updated }));
      localStorage.setItem("user", JSON.stringify(updated));
      broadcastSessionChange();
      toast.success("Profile image updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch("/api/users/update", {
        method: "PUT",
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
        }),
      });
      if (!res.ok) throw new Error("Unable to update profile");
      const updated = await res.json();
      setProfile((current) => ({ ...current, ...updated }));
      localStorage.setItem("user", JSON.stringify(updated));
      broadcastSessionChange();
      toast.success("Profile updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-10 max-w-5xl page-panel">
      <div className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and view your complaint history.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden animate-scale-in">
        <div className="gradient-hero h-28 relative">
          <div className="absolute inset-0 grid-pattern opacity-20" />
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl gradient-teal flex items-center justify-center font-bold text-3xl text-secondary-foreground border-4 border-card shadow-elegant overflow-hidden">
                {profile.profilePic ? (
                  <img
                    src={profile.profilePic}
                    alt={name || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || "U"
                )}
              </div>
              <label className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Camera className="h-3.5 w-3.5" />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold">{name || email || "Citizen"}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                <Shield className="h-3.5 w-3.5 text-success" /> Verified Citizen
                {profile?.createdAt ? ` · Member since ${new Date(profile.createdAt).toLocaleDateString()}` : ""}
              </p>
              {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading image...</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-10 w-10 rounded-xl mb-3" />
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        )) : stats.map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-card p-5 hover-lift animate-fade-in-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        <form
          onSubmit={save}
          className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 space-y-4 animate-fade-in-up"
        >
          <div>
            <h3 className="font-display font-semibold text-lg">Personal information</h3>
            <p className="text-xs text-muted-foreground">Update your contact details below.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" name="name" value={profile.name} onChange={(e) => handleChange("name", e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" name="phone" value={profile.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" name="email" value={profile.email} onChange={(e) => handleChange("email", e.target.value)} className="pl-10" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="address" name="address" value={profile.address || ""} onChange={(e) => handleChange("address", e.target.value)} className="pl-10" />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="hero" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 animate-fade-in-up [animation-delay:120ms]">
          <h3 className="font-display font-semibold text-lg mb-4">Complaint history</h3>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-3 rounded-xl border border-border">
                  <Skeleton className="h-3 w-28 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))
            ) : dashboardData?.recent?.length ? (
              dashboardData.recent.map((h) => (
                <Link
                  key={h.receiptId || h._id}
                  to={`/citizen/track?receiptId=${encodeURIComponent(h.receiptId || h._id || "")}`}
                  className="block p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/30 transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{h.receiptId || h._id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[h.status || "pending"]}`}>
                      {(h.status || "pending").replace("-", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{h.title}</p>
                </Link>
              ))
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                No complaints yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
