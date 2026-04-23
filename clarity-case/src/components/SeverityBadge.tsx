import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { Priority } from "@/lib/smart";

const cfg: Record<Priority, { cls: string; icon: typeof Info; label: string }> = {
  Low: {
    cls: "bg-muted text-muted-foreground border-border",
    icon: Info,
    label: "Low Severity",
  },
  Medium: {
    cls: "bg-warning/10 text-warning border-warning/30",
    icon: AlertTriangle,
    label: "Medium Severity",
  },
  High: {
    cls: "bg-destructive/10 text-destructive border-destructive/30",
    icon: AlertCircle,
    label: "High Severity",
  },
};

export const SeverityBadge = ({ priority, className = "" }: { priority: Priority; className?: string }) => {
  const c = cfg[priority];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.cls} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" /> {c.label}
    </span>
  );
};
