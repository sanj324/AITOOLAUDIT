import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

const statusClasses = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  CLOSED: "bg-emerald-100 text-emerald-700"
};

export default function ObservationsPage() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const fileBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api").replace(
    /\/api\/?$/,
    ""
  );

  const loadObservations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/observations");
      setObservations(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load observations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      setSavingId(id);
      await api.patch(`/observations/${id}/status`, { status });
      toast.success("Observation status updated");
      await loadObservations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update observation");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
          Module 5
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Observation Register</h2>
        <p className="mt-2 text-sm text-slate-600">
          Non-compliant responses automatically generate observations for remediation tracking.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-panel">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Title</th>
              <th className="px-5 py-4 font-semibold">Audit</th>
              <th className="px-5 py-4 font-semibold">Severity</th>
              <th className="px-5 py-4 font-semibold">Description</th>
              <th className="px-5 py-4 font-semibold">Recommendation</th>
              <th className="px-5 py-4 font-semibold">Evidence</th>
              <th className="px-5 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                  Loading observations...
                </td>
              </tr>
            ) : observations.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                  No observations raised yet.
                </td>
              </tr>
            ) : (
              observations.map((observation) => (
                <tr key={observation.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{observation.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {observation.checklist?.parameterName || "Checklist item"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{observation.audit?.auditName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Audit status: {observation.audit?.status}
                    </p>
                  </td>
                  <td className="px-5 py-4">{observation.severity}</td>
                  <td className="px-5 py-4">{observation.description || "No description"}</td>
                  <td className="px-5 py-4">{observation.recommendation || "No recommendation"}</td>
                  <td className="px-5 py-4">
                    {observation.evidence?.filePath ? (
                      <div>
                        <p className="font-semibold text-slate-900">
                          {observation.evidence.fileName || "Attached evidence"}
                        </p>
                        <a
                          href={`${fileBaseUrl}${observation.evidence.filePath}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs font-semibold text-brand-700 hover:underline"
                        >
                          View evidence
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400">No evidence linked</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={observation.status}
                      onChange={(event) => updateStatus(observation.id, event.target.value)}
                      disabled={savingId === observation.id}
                      className={`rounded-2xl border border-slate-300 px-4 py-3 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${statusClasses[observation.status] || "bg-slate-100 text-slate-700"}`}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
