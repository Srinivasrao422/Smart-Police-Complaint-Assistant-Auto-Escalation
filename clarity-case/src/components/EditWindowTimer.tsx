import { useEffect, useState } from "react";
import { Clock, Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  startedAt: number; // epoch ms
  windowMinutes?: number;
  onEdit?: () => void;
}

// Allows the citizen to edit their complaint within `windowMinutes` after submission.
export const EditWindowTimer = ({ startedAt, windowMinutes = 15, onEdit }: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const total = windowMinutes * 60;
  const left = Math.max(0, total - elapsed);
  const locked = left === 0;
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const pct = Math.max(0, Math.min(100, (left / total) * 100));

  return (
    <div
      className={`rounded-xl border p-3 ${
        locked ? "border-border bg-muted/40" : "border-warning/30 bg-warning/5"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          {locked ? (
            <>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Edit window closed</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-warning" />
              <span className="font-medium">
                Editable for <span className="font-mono">{m}:{s}</span>
              </span>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant={locked ? "ghost" : "outline"}
          disabled={locked}
          onClick={() => {
            if (locked) return;
            onEdit?.();
            toast.success("Edit mode enabled");
          }}
        >
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </div>
      {!locked && (
        <div className="h-1 mt-2 bg-warning/20 rounded-full overflow-hidden">
          <div className="h-full bg-warning transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
};
