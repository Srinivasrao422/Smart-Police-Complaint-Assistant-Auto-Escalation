import { FileText, Eye, Edit3, AlertTriangle, UserCheck, CheckCircle2 } from "lucide-react";

export interface AuditEntry {
  type: "created" | "viewed" | "updated" | "escalated" | "assigned" | "resolved";
  actor: string;
  role: string;
  time: string;
  note?: string;
}

const meta: Record<AuditEntry["type"], { icon: React.ElementType; color: string; label: string }> = {
  created: { icon: FileText, color: "text-primary", label: "Created" },
  viewed: { icon: Eye, color: "text-muted-foreground", label: "Viewed" },
  updated: { icon: Edit3, color: "text-warning", label: "Updated" },
  escalated: { icon: AlertTriangle, color: "text-destructive", label: "Escalated" },
  assigned: { icon: UserCheck, color: "text-secondary", label: "Assigned" },
  resolved: { icon: CheckCircle2, color: "text-success", label: "Resolved" },
};

interface Props {
  entries: AuditEntry[];
  title?: string;
  compact?: boolean;
}

export const AuditLog = ({ entries, title = "Audit Trail", compact = false }: Props) => {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-display font-semibold text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">
          Tamper-evident activity log · {entries.length} events
        </p>
      </div>
      <ol className="divide-y divide-border">
        {entries.map((e, i) => {
          const m = meta[e.type];
          const Icon = m.icon;
          return (
            <li key={i} className={`flex items-start gap-3 ${compact ? "p-3" : "p-4"}`}>
              <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-xs text-muted-foreground">by {e.actor}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {e.role}
                  </span>
                </div>
                {e.note && <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>}
                <div className="text-[11px] text-muted-foreground mt-0.5">{e.time}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
