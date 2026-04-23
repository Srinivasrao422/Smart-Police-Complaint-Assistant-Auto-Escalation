import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RealtimeProvider } from "@/context/RealtimeContext";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Portal from "./pages/Portal.tsx";

import { CitizenLayout } from "./components/layouts/CitizenLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Raise from "./pages/Raise.tsx";
import Track from "./pages/Track.tsx";
import Assistant from "./pages/Assistant.tsx";
import Profile from "./pages/citizen/Profile.tsx";
import LawsExplorer from "./pages/citizen/LawsExplorer.tsx";
import LegalAwareness from "./pages/citizen/LegalAwareness.tsx";
import Advocates from "./pages/citizen/Advocates.tsx";

import { AdminLayout } from "./components/layouts/AdminLayout.tsx";
import { OfficerLayout } from "./components/layouts/OfficerLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import Complaints from "./pages/admin/Complaints.tsx";
import Escalations from "./pages/admin/Escalations.tsx";
import UsersPage from "./pages/admin/UsersPage.tsx";
import Reports from "./pages/admin/Reports.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import ComplaintDetail from "./pages/admin/ComplaintDetail.tsx";
import OfficerDetail from "./pages/admin/OfficerDetail.tsx";
import UserWizard from "./pages/admin/UserWizard.tsx";
import AdminMap from "./pages/admin/AdminMap.tsx";
import OfficerDashboard from "./pages/officer/OfficerDashboard.tsx";
import { getStoredToken, getStoredUser } from "./lib/session.ts";

const queryClient = new QueryClient();

const RequireRole = ({ allowed }: { allowed: string[] }) => {
  const token = getStoredToken();
  const user = getStoredUser() || {};
  const hierarchy: Record<string, number> = { citizen: 1, officer: 2, admin: 3, "super-admin": 4 };
  if (!token) return <Navigate to="/auth" replace />;
  const allowedByHierarchy = allowed.some((role) => (hierarchy[user?.role] || 0) >= (hierarchy[role] || 0));
  if (!allowedByHierarchy) {
    if (user?.role === "officer") return <Navigate to="/officer/dashboard" replace />;
    if (user?.role === "admin" || user?.role === "super-admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
  }
  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RealtimeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/portal" element={<Portal />} />

          {/* Citizen Portal */}
          <Route element={<RequireRole allowed={["citizen"]} />}>
            <Route path="/citizen" element={<CitizenLayout />}>
              <Route index element={<Navigate to="/citizen/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="raise" element={<Raise />} />
              <Route path="track" element={<Track />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="profile" element={<Profile />} />
              <Route path="laws" element={<LawsExplorer />} />
              <Route path="legal-awareness" element={<LegalAwareness />} />
              <Route path="advocates" element={<Advocates />} />
            </Route>
          </Route>

          {/* Admin Portal */}
          <Route element={<RequireRole allowed={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="complaints" element={<Complaints />} />
              <Route path="complaints/:id" element={<ComplaintDetail />} />
              <Route path="officers/:id" element={<OfficerDetail />} />
              <Route path="escalations" element={<Escalations />} />
              <Route path="map" element={<AdminMap />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserWizard />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          <Route element={<RequireRole allowed={["officer"]} />}>
            <Route path="/officer" element={<OfficerLayout />}>
              <Route index element={<Navigate to="/officer/dashboard" replace />} />
              <Route path="dashboard" element={<OfficerDashboard />} />
            </Route>
          </Route>

          {/* Legacy redirects */}
          <Route path="/dashboard" element={<Navigate to="/citizen/dashboard" replace />} />
          <Route path="/raise" element={<Navigate to="/citizen/raise" replace />} />
          <Route path="/track" element={<Navigate to="/citizen/track" replace />} />
          <Route path="/assistant" element={<Navigate to="/citizen/assistant" replace />} />

          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RealtimeProvider>
  </QueryClientProvider>
);

export default App;
