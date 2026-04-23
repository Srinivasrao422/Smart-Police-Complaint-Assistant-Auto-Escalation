import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/api";

const AdminSettings = () => {
  const [settings, setSettings] = useState<any>({
    slaTime: 48,
    notificationsEnabled: true,
    theme: "system",
  });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });

  const load = async () => {
    try {
      const body = await api.get("/api/admin/settings");
      setSettings({
        slaTime: body.slaTime || 48,
        notificationsEnabled: body.notificationsEnabled ?? true,
        theme: body.theme || "system",
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to load settings");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const body = await api.patch("/api/admin/settings", settings);
      setSettings({
        slaTime: body.slaTime,
        notificationsEnabled: body.notificationsEnabled,
        theme: body.theme,
      });
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Unable to save settings");
    }
  };

  const changePassword = async () => {
    try {
      await api.patch("/api/admin/change-password", passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Unable to change password");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="animate-fade-in">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure escalation rules, notifications and station details.</p>
      </div>

      <form onSubmit={save} className="space-y-4 animate-fade-in-up">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-display font-semibold">Escalation rules</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slaTime">SLA time (hours)</Label>
              <Input id="slaTime" type="number" value={settings.slaTime} onChange={(event) => setSettings((current: any) => ({ ...current, slaTime: Number(event.target.value) }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Input id="theme" value={settings.theme} onChange={(event) => setSettings((current: any) => ({ ...current, theme: event.target.value }))} className="mt-1.5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-display font-semibold">Notifications</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="notificationsEnabled" className="text-sm font-normal">Enable admin notifications</Label>
            <Switch
              id="notificationsEnabled"
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked) => setSettings((current: any) => ({ ...current, notificationsEnabled: checked }))}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-display font-semibold">System preferences</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="theme-readonly">Current theme</Label>
              <Input id="theme-readonly" value={settings.theme} readOnly className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="sla-readonly">Current SLA target</Label>
              <Input id="sla-readonly" value={`${settings.slaTime} hours`} readOnly className="mt-1.5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications-summary" className="text-sm font-normal">Notifications status</Label>
            <Switch id="notifications-summary" checked={settings.notificationsEnabled} disabled />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-display font-semibold">Change admin password</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} className="mt-1.5" />
            </div>
          </div>
          <Button type="button" variant="outline" onClick={changePassword}>Update password</Button>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="hero">Save changes</Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
