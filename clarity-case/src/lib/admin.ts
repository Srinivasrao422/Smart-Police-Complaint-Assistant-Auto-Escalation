import jsPDF from "jspdf";
import { api } from "@/lib/api";

export const statusStyles: Record<string, string> = {
  escalated: "bg-destructive/10 text-destructive border-destructive/20",
  "in-progress": "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
  closed: "bg-secondary/10 text-secondary border-secondary/20",
  pending: "bg-primary/10 text-primary border-primary/20",
};

export const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border border-destructive/20",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-muted text-muted-foreground",
  Critical: "bg-destructive text-destructive-foreground",
};

export const statusLabel = (status?: string) => `${status || "pending"}`.replace("-", " ");

export const complaintDisplayName = (complaint: any) =>
  complaint?.victim?.fullName || complaint?.user?.name || complaint?.citizen || "—";

export const formatLocation = (location: any, fallback = "Not Available") => {
  if (!location) return fallback;
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    if (location.label) return location.label;
    if (location.lat != null && location.lng != null) return `${location.lat}, ${location.lng}`;
  }
  return fallback;
};

export const toTitleCase = (value?: string) => {
  if (!value) return "—";
  return value
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export const downloadComplaintPdf = (complaint: any) => {
  const doc = new jsPDF();
  const rows = [
    ["Receipt ID", complaint.receiptId || complaint._id],
    ["Title", complaint.title || "Complaint"],
    ["Citizen", complaintDisplayName(complaint)],
    ["Category", complaint.category || "—"],
    ["Status", statusLabel(complaint.status)],
    ["Priority", complaint.priority || complaint.severity || "Medium"],
    ["Location", formatLocation(complaint.location, "—")],
    ["Officer", complaint.officerName || complaint.assignedTo?.name || "Unassigned"],
    ["Remarks", complaint.remarks || "—"],
  ];

  doc.setFontSize(18);
  doc.text("Complaint Case Summary", 14, 18);
  doc.setFontSize(11);

  let y = 30;
  rows.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 8;
  });

  doc.text("Description:", 14, y + 2);
  const description = doc.splitTextToSize(complaint.description || "—", 180);
  doc.text(description, 14, y + 10);
  doc.save(`${complaint.receiptId || complaint._id}-case.pdf`);
};

export const downloadCsv = (filename: string, rows: Record<string, any>[]) => {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => JSON.stringify(row[header] ?? ""))
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const fetchComplaintDetail = (id: string) => api.get(`/api/complaints/${id}`);
export const fetchAdminComplaints = (params: Record<string, string> = {}) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "All")
  );
  return api.get(`/api/admin/complaints${search.toString() ? `?${search.toString()}` : ""}`);
};
export const fetchOfficerWorkload = () => api.get("/api/admin/officers/workload");
export const fetchAdminInsights = () => api.get("/api/admin/analytics/insights");
export const bulkAdminComplaintAction = (payload: any) => api.post("/api/admin/complaints/bulk", payload);
export const fetchComplaintMessages = (id: string) => api.get(`/api/admin/complaints/${id}/messages`);
export const postComplaintMessage = (id: string, message: string) => api.post(`/api/admin/complaints/${id}/messages`, { message });
export const markComplaintRead = (id: string) => api.patch(`/api/admin/complaints/${id}/read`, {});
export const updateAdminComplaint = (id: string, data: any) => api.patch(`/api/admin/complaints/${id}`, data);
export const assignAdminComplaint = (id: string, officerId: string) => api.patch(`/api/admin/complaints/${id}/assign`, { officerId });
export const escalateAdminComplaint = (id: string, level?: string) => api.patch(`/api/admin/complaints/${id}/escalate`, { level });
export const deleteAdminComplaint = (id: string) => api.del(`/api/admin/complaints/${id}`);
export const shareAdminComplaint = (id: string, channel = "json") => api.post(`/api/admin/complaints/${id}/share`, { channel });

export const formatSlaLabel = (sla?: { remainingHours?: number; exceededHours?: number; breached?: boolean }) => {
  if (!sla) return "—";
  if (sla.breached) return `Exceeded by ${sla.exceededHours}h`;
  return `${sla.remainingHours}h left`;
};
