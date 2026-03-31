import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import AuditTrailPage from "./pages/AuditTrailPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuditExecutionPage from "./pages/AuditExecutionPage";
import AuditPlanningPage from "./pages/AuditPlanningPage";
import ChecklistPage from "./pages/ChecklistPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ObservationsPage from "./pages/ObservationsPage";
import ToolsPage from "./pages/ToolsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "AUDITOR", "REVIEWER"]} />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/audits" element={<AuditPlanningPage />} />
          <Route path="/audits/:id/execute" element={<AuditExecutionPage />} />
          <Route path="/audit-trail" element={<AuditTrailPage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/checklists" element={<ChecklistPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
