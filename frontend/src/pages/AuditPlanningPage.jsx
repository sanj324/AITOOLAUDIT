import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyAuditForm = {
  auditName: "",
  auditType: "Privacy Review",
  team: "",
  toolId: "",
  auditorId: "",
  startDate: "",
  endDate: "",
  status: "PLANNED"
};

const auditStatusClasses = {
  PLANNED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  REVIEW_PENDING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-emerald-100 text-emerald-800"
};

export default function AuditPlanningPage() {
  const { user } = useAuth();
  const canCreate = ["ADMIN", "AUDITOR"].includes(user.role.roleCode);
  const [audits, setAudits] = useState([]);
  const [meta, setMeta] = useState({ tools: [], auditors: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState("");
  const [formData, setFormData] = useState(emptyAuditForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [auditResponse, metaResponse] = await Promise.all([
        api.get("/audits"),
        api.get("/audits/meta")
      ]);
      setAudits(auditResponse.data.data);
      setMeta(metaResponse.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load audit plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = () => {
    setFormData({
      ...emptyAuditForm,
      toolId: meta.tools[0]?.id ? String(meta.tools[0].id) : "",
      auditorId: meta.auditors[0]?.id ? String(meta.auditors[0].id) : ""
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      await api.post("/audits", {
        ...formData,
        toolId: Number(formData.toolId),
        auditorId: Number(formData.auditorId)
      });
      toast.success("Audit created successfully");
      setShowModal(false);
      setFormData(emptyAuditForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create audit");
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (auditId, format) => {
    try {
      setExporting(`${auditId}-${format}`);
      const response = await api.get(`/audits/${auditId}/export/${format}`, {
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `audit-report-${auditId}.${format === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to export report");
    } finally {
      setExporting("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-white/50 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="bg-[linear-gradient(135deg,#172f4e_0%,#244d80_100%)] px-6 py-7 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-100">
              Module 3
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Audit Planning</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              Create controlled audit plans with scoped tool coverage, assigned accountability, reporting status, and direct export actions.
            </p>
          </div>

          {canCreate ? (
            <button
              onClick={openModal}
              className="mt-5 rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-slate-100 md:mt-0"
            >
              Create Audit
            </button>
          ) : null}
        </div>
      </div>

      <div className="executive-card overflow-hidden rounded-[30px]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f2f7fb_100%)] px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Planned Audit Register
          </p>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50/90 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Audit Name</th>
              <th className="px-5 py-4 font-semibold">Type</th>
              <th className="px-5 py-4 font-semibold">Team</th>
              <th className="px-5 py-4 font-semibold">Tool Scope</th>
              <th className="px-5 py-4 font-semibold">Auditor</th>
              <th className="px-5 py-4 font-semibold">Dates</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Score</th>
              <th className="px-5 py-4 font-semibold">Observations</th>
              <th className="px-5 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                  Loading audits...
                </td>
              </tr>
            ) : audits.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                  No audits have been planned yet.
                </td>
              </tr>
            ) : (
              audits.map((audit) => (
                <tr key={audit.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">{audit.auditName}</p>
                    <p className="mt-1 text-xs text-slate-500">{audit.responseCount || 0} responses captured</p>
                  </td>
                  <td className="px-5 py-4">{audit.auditType}</td>
                  <td className="px-5 py-4">{audit.team}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-950">{audit.toolScope.toolName}</p>
                      <p className="mt-1 text-xs text-slate-500">{audit.toolScope.riskLevel} risk</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-950">{audit.auditor.fullName}</p>
                      <p className="mt-1 text-xs text-slate-500">{audit.auditor.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${auditStatusClasses[audit.status] || "bg-slate-100 text-slate-700"}`}>
                      {audit.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-950">
                      {audit.scoreSummary?.auditScorePercent ?? 0}%
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Weighted score
                    </p>
                  </td>
                  <td className="px-5 py-4">{audit.observationCount ?? 0}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/audits/${audit.id}/execute`}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => downloadFile(audit.id, "excel")}
                        disabled={exporting === `${audit.id}-excel`}
                        className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                      >
                        XLSX
                      </button>
                      <button
                        onClick={() => downloadFile(audit.id, "pdf")}
                        disabled={exporting === `${audit.id}-pdf`}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <Modal
          title="Create Audit Plan"
          subtitle="Assign the audit, define scope, and set the working dates before execution begins."
          onClose={() => setShowModal(false)}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Audit Name</label>
                <input
                  name="auditName"
                  value={formData.auditName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="Quarterly ChatGPT Privacy Review"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Audit Type</label>
                <select
                  name="auditType"
                  value={formData.auditType}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="Privacy Review">Privacy Review</option>
                  <option value="Security Control Review">Security Control Review</option>
                  <option value="Compliance Validation">Compliance Validation</option>
                  <option value="Internal Audit">Internal Audit</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Team</label>
                <input
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="Digital Banking"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tool Scope</label>
                <select
                  name="toolId"
                  value={formData.toolId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select tool</option>
                  {meta.tools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.toolName} ({tool.riskLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Auditor</label>
                <select
                  name="auditorId"
                  value={formData.auditorId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select auditor</option>
                  {meta.auditors.map((auditor) => (
                    <option key={auditor.id} value={auditor.id}>
                      {auditor.fullName} ({auditor.roleCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
                <input
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Initial Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="PLANNED">PLANNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-[linear-gradient(135deg,#244d80_0%,#1b3a61_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(36,77,128,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : "Create Audit"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
