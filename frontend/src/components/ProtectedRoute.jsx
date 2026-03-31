import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AccessDeniedCard() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">
          Access Denied
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          You do not have permission to access this area.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Contact an administrator if your role needs additional privileges.
        </p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Validating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role.roleCode)) {
    return <AccessDeniedCard />;
  }

  return <Outlet />;
}
