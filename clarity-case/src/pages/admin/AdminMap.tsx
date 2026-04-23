import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.heat";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Flame, MapPin, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useRealtime } from "@/context/RealtimeContext";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status: string;
  category: string;
  priority: string;
  assignedTo: string;
  complaintId: string;
  receiptId: string;
};

const center: [number, number] = [20.5937, 78.9629];

const buildQuery = (filters: Record<string, string>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString() ? `?${params.toString()}` : "";
};

const heatWeight = (item: MapPoint) => {
  if (item.priority === "Critical") return 1;
  if (item.priority === "High") return 0.8;
  if (item.priority === "Medium") return 0.55;
  return 0.35;
};

const MapLayers = ({ items, showHeatmap, onOpenDetails }: { items: MapPoint[]; showHeatmap: boolean; onOpenDetails: (id: string) => void }) => {
  const map = useMap();

  useEffect(() => {
    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15,
    });

    items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]);
      const popupRoot = document.createElement("div");
      popupRoot.className = "space-y-2 min-w-[220px]";
      popupRoot.innerHTML = `
        <div class="font-medium">${item.title}</div>
        <div class="text-xs text-slate-500">Category: ${item.category}</div>
        <div class="text-xs text-slate-500">Status: ${item.status}</div>
        <div class="text-xs text-slate-500">Assigned officer: ${item.assignedTo}</div>
        <button type="button" class="map-detail-btn inline-flex items-center justify-center rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white">
          View Details
        </button>
      `;
      popupRoot.querySelector(".map-detail-btn")?.addEventListener("click", () => onOpenDetails(item.complaintId));
      marker.bindPopup(popupRoot);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    const heatLayer = (L as any).heatLayer(
      items.map((item) => [item.lat, item.lng, heatWeight(item)]),
      { radius: 28, blur: 22, maxZoom: 16, minOpacity: 0.25 }
    );

    if (showHeatmap) {
      map.addLayer(heatLayer);
    }

    if (items.length) {
      const bounds = L.latLngBounds(items.map((item) => [item.lat, item.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
    } else {
      map.setView(center, 5);
    }

    return () => {
      map.removeLayer(clusterGroup);
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [items, map, onOpenDetails, showHeatmap]);

  return null;
};

const AdminMap = () => {
  const navigate = useNavigate();
  const { lastComplaintEvent } = useRealtime();
  const [items, setItems] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    priority: "",
  });
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const body = await api.get(`/api/admin/map-data${buildQuery(filters)}`);
        setItems(Array.isArray(body) ? body : []);
      } catch (err) {
        console.error(err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [filters, refreshToken]);

  useEffect(() => {
    if (lastComplaintEvent?.complaint?.coordinates) {
      setRefreshToken((current) => current + 1);
    }
  }, [lastComplaintEvent]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category).filter(Boolean))].sort(), [items]);

  const summary = useMemo(() => ({
    total: items.length,
    resolved: items.filter((item) => item.status === "resolved").length,
    unassigned: items.filter((item) => item.assignedTo === "Unassigned").length,
    highPriority: items.filter((item) => item.priority === "High" || item.priority === "Critical").length,
  }), [items]);

  return (
    <div className="space-y-6 page-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Complaint Map View</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitor clustered complaint locations and density in real time.</p>
        </div>
        <Button variant="outline" onClick={() => setRefreshToken((current) => current + 1)}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Category</span>
            <select
              value={filters.category}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Status</span>
            <select
              value={filters.status}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Priority</span>
            <select
              value={filters.priority}
              onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
            >
              <option value="">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="text-muted-foreground">Layer</span>
            <button
              type="button"
              onClick={() => setShowHeatmap((current) => !current)}
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-left"
            >
              {showHeatmap ? "Heatmap enabled" : "Heatmap disabled"}
            </button>
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.45fr_.8fr] gap-4">
        <div className="rounded-2xl border border-border bg-card p-3 min-h-[520px] overflow-hidden">
          {loading ? (
            <Skeleton className="h-[494px] w-full rounded-xl" />
          ) : (
            <MapContainer center={center} zoom={5} className="h-[494px] w-full rounded-xl">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapLayers items={items} showHeatmap={showHeatmap} onOpenDetails={(id) => navigate(`/admin/complaints/${id}`)} />
            </MapContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold">Mapped Complaints</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">Visible Markers</div>
              <div className="text-xl font-semibold mt-1">{summary.total}</div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <div className="text-xs text-muted-foreground">High Priority</div>
              <div className="text-xl font-semibold mt-1">{summary.highPriority}</div>
            </div>
          </div>

          <div className="space-y-3 max-h-[470px] overflow-auto pr-1">
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Flame className="h-4 w-4 text-primary" />
                Live Density
              </div>
              <div className="space-y-2 mt-3 text-xs text-muted-foreground">
                <div>Heatmap: {showHeatmap ? "Enabled" : "Disabled"}</div>
                <div>Resolved markers: {summary.resolved}</div>
                <div>Unassigned complaints: {summary.unassigned}</div>
              </div>
            </div>

            {items.map((item) => (
              <button
                key={item.id}
                className="w-full rounded-xl border border-border p-3 text-left hover:bg-accent/40 transition-colors"
                onClick={() => navigate(`/admin/complaints/${item.complaintId}`)}
              >
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.receiptId}</div>
                <div className="text-xs mt-2">Category: {item.category}</div>
                <div className="text-xs">Status: {item.status}</div>
                <div className="text-xs">Officer: {item.assignedTo}</div>
              </button>
            ))}
            {!loading && !items.length && (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
                No complaints with coordinates match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMap;
