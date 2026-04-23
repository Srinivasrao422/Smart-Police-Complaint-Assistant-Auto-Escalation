import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Ban, CheckCircle2, ShieldCheck, Crown, Shield, User as UserIcon, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Role = "Citizen" | "Officer" | "Admin";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  complaints: number;
  status: "active" | "blocked";
  joined: string;
}

const roleStyles: Record<Role, { bg: string; icon: React.ElementType }> = {
  Citizen: { bg: "bg-muted text-muted-foreground border-border", icon: UserIcon },
  Officer: { bg: "bg-primary/10 text-primary border-primary/20", icon: Shield },
  Admin: { bg: "bg-destructive/10 text-destructive border-destructive/20", icon: Crown },
};

const labelRole = (role: string): Role => {
  if (role === "officer") return "Officer";
  if (role === "admin" || role === "super-admin") return "Admin";
  return "Citizen";
};

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: "", email: "", password: "", department: "" });

  const load = async () => {
    try {
      const body = await api.get("/api/admin/users");
      setUsers((body.items || []).map((user: any) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: labelRole(user.role),
        complaints: user.complaints || 0,
        status: user.status || "active",
        joined: new Date(user.createdAt).toLocaleDateString(),
      })));
    } catch (err) {
      console.error(err);
      toast.error("Unable to load users");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string) => {
    const user = users.find((item) => item.id === id);
    if (!user) return;
    const newStatus = user.status === "active" ? "blocked" : "active";
    try {
      await api.patch(`/api/admin/users/${id}/status`, { status: newStatus });
      setUsers((current) => current.map((item) => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`${user.name} ${newStatus === "active" ? "unblocked" : "blocked"}`);
    } catch (err) {
      console.error(err);
      toast.error("Unable to update user");
    }
  };

  const createOfficer = async () => {
    try {
      await api.post("/api/admin/officers", newOfficer);
      toast.success("Officer created");
      setCreateOpen(false);
      setNewOfficer({ name: "", email: "", password: "", department: "" });
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to create officer");
    }
  };

  const filtered = users.filter((user) => !query || user.name.toLowerCase().includes(query.toLowerCase()) || user.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">View user details, complaint history, activity logs and account controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{users.filter((user) => user.status === "active").length}</span> active ·{" "}
            <span className="font-bold text-destructive">{users.filter((user) => user.status === "blocked").length}</span> blocked
          </div>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Create Officer
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card animate-fade-in-up">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left font-medium py-3 px-5">User</th>
                <th className="text-left font-medium py-3 px-5">Role</th>
                <th className="text-left font-medium py-3 px-5 hidden md:table-cell">Contact</th>
                <th className="text-left font-medium py-3 px-5 hidden lg:table-cell">Complaints</th>
                <th className="text-left font-medium py-3 px-5">Status</th>
                <th className="text-left font-medium py-3 px-5 hidden md:table-cell">Joined</th>
                <th className="text-right font-medium py-3 px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => {
                const RoleIcon = roleStyles[user.role].icon;
                return (
                  <tr key={user.id} className="hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${user.id}`)}>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full gradient-teal flex items-center justify-center text-xs font-semibold text-secondary-foreground">
                          {user.name.split(" ").map((part) => part[0]).join("")}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border inline-flex items-center gap-1 ${roleStyles[user.role].bg}`}>
                        <RoleIcon className="h-3 w-3" /> {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell">
                      <div className="text-sm">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.phone}</div>
                    </td>
                    <td className="py-3 px-5 hidden lg:table-cell">{user.complaints}</td>
                    <td className="py-3 px-5">
                      {user.status === "active" ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-success/10 text-success border-success/20 inline-flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-destructive/10 text-destructive border-destructive/20 inline-flex items-center gap-1">
                          <Ban className="h-3 w-3" /> Blocked
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 hidden md:table-cell text-muted-foreground text-xs">{user.joined}</td>
                    <td className="py-3 px-5 text-right" onClick={(event) => event.stopPropagation()}>
                      <Button size="sm" variant={user.status === "active" ? "outline" : "hero"} onClick={() => toggle(user.id)}>
                        {user.status === "active" ? (
                          <>
                            <Ban className="h-3.5 w-3.5 mr-1" /> Block
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Unblock
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Officer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="officer-name">Name</Label>
              <Input id="officer-name" value={newOfficer.name} onChange={(event) => setNewOfficer((current) => ({ ...current, name: event.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="officer-email">Email</Label>
              <Input id="officer-email" value={newOfficer.email} onChange={(event) => setNewOfficer((current) => ({ ...current, email: event.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="officer-password">Password</Label>
              <Input id="officer-password" type="password" value={newOfficer.password} onChange={(event) => setNewOfficer((current) => ({ ...current, password: event.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="officer-department">Department</Label>
              <Input id="officer-department" value={newOfficer.department} onChange={(event) => setNewOfficer((current) => ({ ...current, department: event.target.value }))} className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={createOfficer}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
