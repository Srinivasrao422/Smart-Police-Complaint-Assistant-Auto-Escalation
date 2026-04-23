import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRealtime } from "@/context/RealtimeContext";

type Notification = {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "update" | "escalation" | "resolved" | "new" | "feedback";
};

const iconFor = (t: Notification["type"]) => {
  switch (t) {
    case "escalation":
      return { Icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" };
    case "resolved":
      return { Icon: CheckCircle2, color: "text-success", bg: "bg-success/10" };
    case "new":
      return { Icon: FileText, color: "text-primary", bg: "bg-primary/10" };
    default:
      return { Icon: Clock, color: "text-warning", bg: "bg-warning/10" };
  }
};

const formatTime = (value: string) => {
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return "";
  const diffMinutes = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unread, hydrateNotifications, markOneRead, markAllRead } = useRealtime();

  const loading = false;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) hydrateNotifications();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <>
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                {unread}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h4 className="font-display font-semibold text-sm">Notifications</h4>
            <p className="text-xs text-muted-foreground">{unread} unread updates</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead} disabled={!notifications.length}>
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-border">
          {loading && (
            <div className="p-4 text-sm text-muted-foreground">Loading notifications...</div>
          )}
          {!loading && notifications.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
          )}
          {!loading && notifications.map((n) => {
            const { Icon, color, bg } = iconFor(n.type);
            return (
              <button
                key={n._id}
                className={`w-full text-left p-3 hover:bg-accent/50 transition-colors flex gap-3 ${n.read ? "" : "bg-accent/20"}`}
                onClick={() => !n.read && markOneRead(n._id)}
              >
                <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.message}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{formatTime(n.createdAt)}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-2 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={hydrateNotifications}>
            View all activity
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
