import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SLABadgeProps {
  /** Hours remaining until SLA breach. Negative = breached. */
  hoursLeft: number;
  className?: string;
}

export const SLABadge = ({ hoursLeft, className = "" }: SLABadgeProps) => {
  let style = "bg-success/10 text-success border-success/20";
  let Icon = CheckCircle2;
  let label = `${hoursLeft}h left`;

  if (hoursLeft < 0) {
    style = "bg-destructive/10 text-destructive border-destructive/20";
    Icon = AlertTriangle;
    label = `Breached ${Math.abs(hoursLeft)}h ago`;
  } else if (hoursLeft <= 24) {
    style = "bg-warning/10 text-warning border-warning/20";
    Icon = Clock;
    label = `${hoursLeft}h left`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${style} ${className}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
};
