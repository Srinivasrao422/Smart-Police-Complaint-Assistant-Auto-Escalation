import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { api } from "@/lib/api";

type LiveNotification = {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "update" | "escalation" | "resolved" | "new" | "feedback";
};

type RealtimeContextValue = {
  connected: boolean;
  notifications: LiveNotification[];
  unread: number;
  hydrateNotifications: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  lastComplaintEvent: any | null;
  lastFeedbackEvent: any | null;
  lastNotificationEvent: LiveNotification | null;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const inferType = (message: string): LiveNotification["type"] => {
  const text = `${message || ""}`.toLowerCase();
  if (text.includes("feedback")) return "feedback";
  if (text.includes("escalat")) return "escalation";
  if (text.includes("resolved")) return "resolved";
  if (text.includes("created") || text.includes("new complaint")) return "new";
  return "update";
};

const normaliseNotification = (note: any): LiveNotification => ({
  _id: note._id || crypto.randomUUID(),
  message: note.message,
  read: !!note.read,
  createdAt: note.createdAt || new Date().toISOString(),
  type: note.type || inferType(note.message),
});

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [lastComplaintEvent, setLastComplaintEvent] = useState<any | null>(null);
  const [lastFeedbackEvent, setLastFeedbackEvent] = useState<any | null>(null);
  const [lastNotificationEvent, setLastNotificationEvent] = useState<LiveNotification | null>(null);

  const hydrateNotifications = async () => {
    try {
      const body = await api.get("/api/notifications");
      setNotifications((body || []).map(normaliseNotification));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const onNewComplaint = (payload: any) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setLastComplaintEvent({ type: "newComplaint", ...payload });
      if (user.role === "admin" || user.role === "super-admin") {
        toast.success("New complaint received", { description: payload?.complaint?.receiptId || payload?.complaint?.title });
      }
    };
    const onComplaintUpdated = (payload: any) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setLastComplaintEvent({ type: "complaintUpdated", ...payload });
      const isOwner = payload?.complaint?.user?._id === user.id;
      const isAssignedOfficer = payload?.complaint?.assignedTo?._id === user.id;
      if (user.role === "admin" || user.role === "super-admin") {
        toast.success("Case updated", { description: payload?.complaint?.receiptId || payload?.complaint?.title });
      } else if (user.role === "officer" && isAssignedOfficer) {
        toast.success("Assigned complaint updated", { description: payload?.complaint?.receiptId || payload?.complaint?.status });
      } else if (isOwner) {
        toast.success("Complaint status updated", { description: payload?.complaint?.receiptId || payload?.complaint?.status });
      }
    };
    const onFeedbackAdded = (payload: any) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setLastFeedbackEvent(payload);
      if (user.role === "admin" || user.role === "super-admin") {
        toast.success("Feedback received", { description: payload?.receiptId || payload?.complaint?.receiptId });
      }
    };
    const onNotificationAdded = (payload: any) => {
      const next = normaliseNotification(payload);
      setNotifications((current) => [next, ...current.filter((item) => item._id !== next._id)].slice(0, 30));
      setLastNotificationEvent(next);
      toast(next.message, { description: new Date(next.createdAt).toLocaleTimeString() });
    };
    const onNewComplaintLocation = (payload: any) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setLastComplaintEvent({ type: "newComplaintLocation", ...payload });
      if (user.role === "admin" || user.role === "super-admin") {
        toast.success("Live complaint location tracked", {
          description: payload?.complaint?.receiptId || payload?.location?.label || "Geo-tagged complaint received",
        });
      }
    };
    const onHotspotSpike = (payload: any) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setLastComplaintEvent({ type: "hotspotSpike", ...payload });
      if (user.role === "admin" || user.role === "super-admin") {
        toast.error("Hotspot spike detected", {
          description: `${payload?.location?.label || "Mapped zone"} now has ${payload?.count || 0} complaints`,
        });
      }
    };

    socket.on("newComplaint", onNewComplaint);
    socket.on("complaintUpdated", onComplaintUpdated);
    socket.on("feedbackAdded", onFeedbackAdded);
    socket.on("notificationAdded", onNotificationAdded);
    socket.on("newComplaintLocation", onNewComplaintLocation);
    socket.on("hotspotSpike", onHotspotSpike);

    return () => {
      socket.off("newComplaint", onNewComplaint);
      socket.off("complaintUpdated", onComplaintUpdated);
      socket.off("feedbackAdded", onFeedbackAdded);
      socket.off("notificationAdded", onNotificationAdded);
      socket.off("newComplaintLocation", onNewComplaintLocation);
      socket.off("hotspotSpike", onHotspotSpike);
    };
  }, []);

  useEffect(() => {
    const syncSession = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      if (!token || !user?.id) {
        socket.disconnect();
        setConnected(false);
        setNotifications([]);
        return;
      }

      if (!socket.connected) {
        socket.connect();
      } else {
        socket.emit("join", { userId: user.id, role: user.role });
      }

      hydrateNotifications();
    };

    const onConnect = () => {
      setConnected(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?.id) {
        socket.emit("join", { userId: user.id, role: user.role });
      }
    };

    const onDisconnect = () => setConnected(false);

    window.addEventListener("spcaes:session-change", syncSession);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    syncSession();

    return () => {
      window.removeEventListener("spcaes:session-change", syncSession);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const markOneRead = async (id: string) => {
    setNotifications((current) => current.map((note) => note._id === id ? { ...note, read: true } : note));
    try {
      await api.patch(`/api/notifications/${id}/read`, {});
    } catch (err) {
      console.error(err);
      hydrateNotifications();
    }
  };

  const markAllRead = async () => {
    setNotifications((current) => current.map((note) => ({ ...note, read: true })));
    try {
      await api.patch("/api/notifications/read-all", {});
    } catch (err) {
      console.error(err);
      hydrateNotifications();
    }
  };

  const value: RealtimeContextValue = {
    connected,
    notifications,
    unread: notifications.filter((note) => !note.read).length,
    hydrateNotifications,
    markOneRead,
    markAllRead,
    lastComplaintEvent,
    lastFeedbackEvent,
    lastNotificationEvent,
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used within RealtimeProvider");
  return context;
};
