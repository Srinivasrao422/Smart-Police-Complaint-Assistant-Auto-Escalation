import { Megaphone, Pin } from "lucide-react";

const notices = [
  {
    id: 1,
    title: "New Cybercrime Reporting Portal — 24×7",
    body: "Citizens can now report cyber-financial frauds round the clock. Quick response within 60 minutes.",
    tag: "Advisory",
    date: "Mar 15, 2024",
    pinned: true,
  },
  {
    id: 2,
    title: "Festival Security Drive — Apr 1 to Apr 14",
    body: "Increased patrolling in market areas. Report suspicious activity via the Raise Complaint section.",
    tag: "Notice",
    date: "Mar 12, 2024",
    pinned: false,
  },
  {
    id: 3,
    title: "Service Maintenance: Mar 20, 02:00–04:00 IST",
    body: "Brief downtime for security upgrades. Emergency line 100 remains active.",
    tag: "Maintenance",
    date: "Mar 10, 2024",
    pinned: false,
  },
];

const tagStyles: Record<string, string> = {
  Advisory: "bg-primary/10 text-primary border-primary/20",
  Notice: "bg-secondary/10 text-secondary border-secondary/20",
  Maintenance: "bg-warning/10 text-warning border-warning/20",
};

export const PublicNotices = () => {
  return (
    <div className="rounded-2xl border border-border bg-card animate-fade-in-up">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Public Notices</h3>
            <p className="text-xs text-muted-foreground">Official announcements</p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          Govt. of India
        </span>
      </div>
      <div className="divide-y divide-border">
        {notices.map((n) => (
          <div key={n.id} className="p-4 hover:bg-accent/40 transition-colors">
            <div className="flex items-start gap-3">
              {n.pinned && <Pin className="h-3.5 w-3.5 text-destructive mt-1 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagStyles[n.tag]}`}>
                    {n.tag}
                  </span>
                  <span className="text-xs text-muted-foreground">{n.date}</span>
                </div>
                <h4 className="font-medium text-sm">{n.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
