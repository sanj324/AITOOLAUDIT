import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);
        const response = await api.get("/audit-trails");
        setLogs(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load audit trail");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
          Audit Trail
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Immutable Activity Log</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tracks authentication events, data changes, and audit workflow updates. Records are append-only and cannot be deleted.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-panel">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Timestamp</th>
              <th className="px-5 py-4 font-semibold">User</th>
              <th className="px-5 py-4 font-semibold">Action</th>
              <th className="px-5 py-4 font-semibold">Entity</th>
              <th className="px-5 py-4 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-slate-500">
                  Loading audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-5 py-8 text-center text-slate-500">
                  No audit trail records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    {log.user ? (
                      <div>
                        <p className="font-semibold text-slate-900">{log.user.fullName}</p>
                        <p className="mt-1 text-xs text-slate-500">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">System</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{log.action}</td>
                  <td className="px-5 py-4">
                    {log.entity}
                    {log.entityId ? ` #${log.entityId}` : ""}
                  </td>
                  <td className="px-5 py-4">{log.description || "No description"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
