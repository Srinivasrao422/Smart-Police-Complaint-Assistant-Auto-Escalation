import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { downloadCsv, formatLocation } from "@/lib/admin";
import { toast } from "sonner";

const Reports = () => {
  const [report, setReport] = useState<any>({ items: [], categories: [], locations: [], status: [], summary: { total: 0 } });
  const [filters, setFilters] = useState({ start: "", end: "", category: "All" });

  const categories = useMemo(
    () => ["All", ...Array.from(new Set((report.items || []).map((item: any) => item.category).filter(Boolean) as string[]))],
    [report.items]
  );
  const maxLocation = Math.max(...(report.locations || []).map((item: any) => item.count), 1);
  const maxStatus = Math.max(...(report.status || []).map((item: any) => item.count), 1);

  const load = async () => {
    try {
      const query = new URLSearchParams();
      if (filters.start) query.set("start", filters.start);
      if (filters.end) query.set("end", filters.end);
      if (filters.category !== "All") query.set("category", filters.category);
      const body = await api.get(`/api/admin/reports${query.toString() ? `?${query.toString()}` : ""}`);
      setReport(body);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load reports");
    }
  };

  useEffect(() => {
    load();
  }, [filters.start, filters.end, filters.category]);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Admin Complaints Report", 14, 18);
    doc.setFontSize(11);
    doc.text(`Total complaints: ${report.summary?.total || 0}`, 14, 30);
    doc.text(`Date range: ${filters.start || "All"} to ${filters.end || "All"}`, 14, 38);
    doc.text(`Category: ${filters.category}`, 14, 46);
    doc.text("Status summary:", 14, 58);
    (report.status || []).forEach((item: any, index: number) => {
      doc.text(`${item.label}: ${item.count}`, 18, 66 + index * 8);
    });
    const startY = 66 + (report.status || []).length * 8 + 10;
    doc.text("Category summary:", 14, startY);
    (report.categories || []).slice(0, 8).forEach((item: any, index: number) => {
      doc.text(`${item.label}: ${item.count}`, 18, startY + 8 + index * 8);
    });
    doc.save(`admin-report-${filters.start || "all"}-${filters.end || "all"}.pdf`);
  };

  const exportCsv = () => {
    downloadCsv("admin-report.csv", (report.items || []).map((item: any) => ({
      receiptId: item.receiptId,
      title: item.title,
      category: item.category,
      location: formatLocation(item.location),
      status: item.status,
      priority: item.priority || item.severity,
      citizen: item.victim?.fullName || item.user?.name || "",
      createdAt: item.createdAt,
    })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Insights across categories, geographies and trends.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}>Download CSV</Button>
          <Button variant="outline" onClick={exportPdf}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
        <div className="grid md:grid-cols-3 gap-3 mb-5">
          <Input type="date" value={filters.start} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))} />
          <Input type="date" value={filters.end} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))} />
          <Select value={filters.category} onValueChange={(value) => setFilters((current) => ({ ...current, category: value }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <h3 className="font-display font-semibold mb-1">Status summary</h3>
        <p className="text-xs text-muted-foreground mb-4">Live complaints count for the selected date range</p>
        <div className="flex items-end gap-2 h-48">
          {(report.status || []).map((item: any) => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-t-md gradient-primary opacity-80 hover:opacity-100 transition-all" style={{ height: `${(item.count / maxStatus) * 100}%` }} title={`${item.label}: ${item.count}`} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up">
          <h3 className="font-display font-semibold mb-1">Category breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribution across complaint types</p>
          <div className="space-y-4">
            {(report.categories || []).map((item: any) => {
              const percent = report.summary?.total ? Math.round((item.count / report.summary.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 animate-fade-in-up [animation-delay:120ms]">
          <h3 className="font-display font-semibold mb-1">Area-wise issues</h3>
          <p className="text-xs text-muted-foreground mb-4">Top stations by complaint volume</p>
          <div className="space-y-3">
            {(report.locations || []).map((item: any) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm font-medium w-32 truncate">{item.label}</span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full gradient-teal rounded-full" style={{ width: `${(item.count / maxLocation) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
