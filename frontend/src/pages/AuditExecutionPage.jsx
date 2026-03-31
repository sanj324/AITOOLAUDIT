import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const executionStatuses = [
  { value: "COMPLIANT", label: "Compliant" },
  { value: "PARTIAL", label: "Partial" },
  { value: "NON_COMPLIANT", label: "Non-Compliant" },
  { value: "NA", label: "NA" }
];

const auditStatuses = ["PLANNED", "IN_PROGRESS", "REVIEW_PENDING", "COMPLETED"];

function createInitialDraft(response) {
  return {
    responseStatus: response?.responseStatus || "COMPLIANT",
    comments: response?.comments || "",
    evidence: null,
    currentFileName: response?.evidenceFileName || "",
    observationTitle: "",
    observationDescription: "",
    observationSeverity: "",
    observationRecommendation: ""
  };
}

export default function AuditExecutionPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canRespond = ["ADMIN", "AUDITOR"].includes(user.role.roleCode);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rowSavingId, setRowSavingId] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [exporting, setExporting] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const fileBaseUrl = useMemo(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
    return apiBaseUrl.replace(/\/api\/?$/, "");
  }, []);

  const loadAudit = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/audits/${id}`);
      const auditData = response.data.data;
      setAudit(auditData);

      const nextDrafts = {};
      auditData.checklistItems.forEach((item) => {
        nextDrafts[item.id] = createInitialDraft(item.response);
      });
      setDrafts(nextDrafts);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load audit execution data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [id]);

  const updateDraft = (checklistId, key, value) => {
    setDrafts((current) => ({
      ...current,
      [checklistId]: {
        ...current[checklistId],
        [key]: value
      }
    }));
  };

  const saveResponse = async (checklistId) => {
    const draft = drafts[checklistId];
    const formData = new FormData();
    formData.append("checklistId", String(checklistId));
    formData.append("responseStatus", draft.responseStatus);
    formData.append("comments", draft.comments || "");
    formData.append("observationTitle", draft.observationTitle || "");
    formData.append("observationDescription", draft.observationDescription || "");
    formData.append("observationSeverity", draft.observationSeverity || "");
    formData.append("observationRecommendation", draft.observationRecommendation || "");
    if (draft.evidence) {
      formData.append("evidence", draft.evidence);
    }

    try {
      setRowSavingId(checklistId);
      await api.post(`/audits/${id}/responses`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      toast.success("Response saved");
      await loadAudit();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save response");
    } finally {
      setRowSavingId(null);
    }
  };

  const analyzeScreenshot = async (checklistId) => {
    const draft = drafts[checklistId];

    if (!draft?.evidence && !draft?.currentFileName) {
      toast.error("Upload a screenshot or use the existing uploaded evidence");
      return;
    }

    const formData = new FormData();
    formData.append("checklistId", String(checklistId));
    if (draft.evidence) {
      formData.append("evidence", draft.evidence);
    }

    try {
      setAnalyzingId(checklistId);
      const response = await api.post(`/audits/${id}/analyze-screenshot`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      const aiDraft = response.data.data;
      setDrafts((current) => ({
        ...current,
        [checklistId]: {
          ...current[checklistId],
          responseStatus: aiDraft.suggestedResponseStatus || current[checklistId].responseStatus,
          comments: aiDraft.comments || current[checklistId].comments,
          observationTitle: aiDraft.observationTitle || "",
          observationDescription: aiDraft.observationDescription || "",
          observationSeverity: aiDraft.observationSeverity || "",
          observationRecommendation: aiDraft.observationRecommendation || ""
        }
      }));

      toast.success("Screenshot analyzed and draft fields generated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to analyze screenshot");
    } finally {
      setAnalyzingId(null);
    }
  };

  const updateAuditStatus = async (status) => {
    try {
      setStatusSaving(true);
      await api.patch(`/audits/${id}/status`, { status });
      toast.success("Audit status updated");
      await loadAudit();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  const downloadFile = async (format) => {
    try {
      setExporting(format);
      const response = await api.get(`/audits/${id}/export/${format}`, {
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `audit-report-${id}.${format === "excel" ? "xlsx" : "pdf"}`;
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

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-panel">
        Loading audit execution...
      </div>
    );
  }

  if (!audit) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            Module 4
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{audit.auditName}</h2>
          <p className="mt-2 text-sm text-slate-600">
            Execute the scoped checklist for {audit.toolScope.toolName} and capture evidence-backed responses.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Audit Type</p>
              <p className="mt-2 font-semibold">{audit.auditType}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Team</p>
              <p className="mt-2 font-semibold">{audit.team}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Auditor</p>
              <p className="mt-2 font-semibold">{audit.auditor.fullName}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date Window</p>
              <p className="mt-2 font-semibold">
                {new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-brand-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                Audit Score
              </p>
              <p className="mt-2 text-3xl font-semibold text-brand-900">
                {audit.scoreSummary?.auditScorePercent ?? 0}%
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tool Score
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {audit.scoreSummary?.toolScore?.scorePercent ?? 0}%
              </p>
            </div>
            <div className="rounded-2xl bg-red-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
                Observations
              </p>
              <p className="mt-2 text-3xl font-semibold text-red-900">
                {audit.observationCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/audits"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Planning
          </Link>
          <select
            value={audit.status}
            onChange={(event) => updateAuditStatus(event.target.value)}
            disabled={statusSaving}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          >
            {auditStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            onClick={() => downloadFile("excel")}
            disabled={exporting === "excel"}
            className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
          >
            Export Excel
          </button>
          <button
            onClick={() => downloadFile("pdf")}
            disabled={exporting === "pdf"}
            className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-panel">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Checklist Parameter</th>
              <th className="px-5 py-4 font-semibold">Severity / Weight</th>
              <th className="px-5 py-4 font-semibold">Response</th>
              <th className="px-5 py-4 font-semibold">Comments</th>
              <th className="px-5 py-4 font-semibold">Evidence</th>
              <th className="px-5 py-4 font-semibold text-right">Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {audit.checklistItems.map((item) => {
              const draft = drafts[item.id] || createInitialDraft(item.response);

              return (
                <tr key={item.id}>
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-slate-900">{item.parameterName}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description || "No description"}</p>
                    {item.evidenceRequired ? (
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
                        Evidence Required
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <p className="font-semibold text-slate-900">{item.severity}</p>
                    <p className="mt-1 text-xs text-slate-500">Weight {item.weight}</p>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <select
                      value={draft.responseStatus}
                      onChange={(event) => updateDraft(item.id, "responseStatus", event.target.value)}
                      disabled={!canRespond}
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                    >
                      {executionStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <textarea
                      value={draft.comments}
                      onChange={(event) => updateDraft(item.id, "comments", event.target.value)}
                      disabled={!canRespond}
                      rows="4"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                      placeholder="Add execution observations or rationale"
                    />
                  </td>
                  <td className="px-5 py-4 align-top">
                    <input
                      type="file"
                      disabled={!canRespond}
                      onChange={(event) => updateDraft(item.id, "evidence", event.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700"
                    />
                    {canRespond ? (
                      <button
                        onClick={() => analyzeScreenshot(item.id)}
                        disabled={analyzingId === item.id || (!draft.evidence && !draft.currentFileName)}
                        className="mt-3 rounded-2xl border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {analyzingId === item.id ? "Analyzing..." : "Analyze Screenshot"}
                      </button>
                    ) : null}
                    {draft.currentFileName ? (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-slate-500">Current file: {draft.currentFileName}</p>
                        {item.response?.evidenceFilePath ? (
                          <a
                            href={`${fileBaseUrl}${item.response.evidenceFilePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-brand-700 hover:underline"
                          >
                            View uploaded evidence
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">No evidence uploaded</p>
                    )}
                    {draft.observationTitle ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          AI Observation Draft
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                          {draft.observationTitle}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {draft.observationSeverity || item.severity}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-600">
                          {draft.observationRecommendation || "Recommendation will be generated on save."}
                        </p>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 align-top text-right">
                    {canRespond ? (
                      <button
                        onClick={() => saveResponse(item.id)}
                        disabled={rowSavingId === item.id}
                        className="rounded-2xl bg-brand-700 px-4 py-3 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {rowSavingId === item.id ? "Saving..." : "Save Row"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Reviewer view</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
