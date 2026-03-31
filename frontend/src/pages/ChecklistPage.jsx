import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyChecklistForm = {
  parameterName: "",
  description: "",
  toolId: "",
  severity: "MEDIUM",
  weight: "10",
  evidenceRequired: true,
  isActive: true
};

export default function ChecklistPage() {
  const { user } = useAuth();
  const isAdmin = user.role.roleCode === "ADMIN";
  const [tools, setTools] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [formData, setFormData] = useState(emptyChecklistForm);
  const [saving, setSaving] = useState(false);

  const activeTools = useMemo(
    () => tools.filter((tool) => tool.isActive),
    [tools]
  );

  const selectableTools = useMemo(() => {
    if (!editingChecklist) {
      return activeTools;
    }

    return tools.filter(
      (tool) => tool.isActive || tool.id === editingChecklist.toolId
    );
  }, [activeTools, editingChecklist, tools]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toolResponse, checklistResponse] = await Promise.all([
        api.get("/tools"),
        api.get("/checklists")
      ]);
      setTools(toolResponse.data.data);
      setChecklists(checklistResponse.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load checklist data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingChecklist(null);
    setFormData({
      ...emptyChecklistForm,
      toolId: activeTools[0]?.id ? String(activeTools[0].id) : ""
    });
    setShowModal(true);
  };

  const openEditModal = (checklist) => {
    setEditingChecklist(checklist);
    setFormData({
      parameterName: checklist.parameterName,
      description: checklist.description || "",
      toolId: String(checklist.toolId),
      severity: checklist.severity,
      weight: String(checklist.weight),
      evidenceRequired: checklist.evidenceRequired,
      isActive: checklist.isActive
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      const payload = {
        ...formData,
        toolId: Number(formData.toolId),
        weight: Number(formData.weight)
      };

      if (editingChecklist) {
        await api.put(`/checklists/${editingChecklist.id}`, payload);
        toast.success("Checklist updated successfully");
      } else {
        await api.post("/checklists", payload);
        toast.success("Checklist created successfully");
      }

      setShowModal(false);
      setFormData(emptyChecklistForm);
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save checklist");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (checklist) => {
    const confirmed = window.confirm(`Delete checklist "${checklist.parameterName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/checklists/${checklist.id}`);
      toast.success("Checklist deleted successfully");
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete checklist");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">
            Module 2
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Checklist Master</h2>
          <p className="mt-2 text-sm text-slate-600">
            Define audit checkpoints by tool, severity, scoring weight, and evidence requirements.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={openCreateModal}
            disabled={activeTools.length === 0}
            className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add Checklist Parameter
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-panel">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Parameter Name</th>
              <th className="px-5 py-4 font-semibold">Tool</th>
              <th className="px-5 py-4 font-semibold">Severity</th>
              <th className="px-5 py-4 font-semibold">Weight</th>
              <th className="px-5 py-4 font-semibold">Evidence Required</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                  Loading checklists...
                </td>
              </tr>
            ) : checklists.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-8 text-center text-slate-500">
                  No checklist parameters available.
                </td>
              </tr>
            ) : (
              checklists.map((checklist) => (
                <tr key={checklist.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{checklist.parameterName}</p>
                    <p className="mt-1 text-xs text-slate-500">{checklist.description || "No description"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{checklist.tool.toolName}</p>
                      <p className="mt-1 text-xs text-slate-500">{checklist.tool.riskLevel} risk tool</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">{checklist.severity}</td>
                  <td className="px-5 py-4">{checklist.weight}</td>
                  <td className="px-5 py-4">{checklist.evidenceRequired ? "Yes" : "No"}</td>
                  <td className="px-5 py-4">
                    {checklist.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isAdmin ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(checklist)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(checklist)}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <Modal
          title={editingChecklist ? "Edit Checklist Parameter" : "Create Checklist Parameter"}
          subtitle="Each checklist parameter must be linked to an active tool."
          onClose={() => setShowModal(false)}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Parameter Name</label>
                <input
                  name="parameterName"
                  value={formData.parameterName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="Sensitive Data Prompt Controls"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tool</label>
                <select
                  name="toolId"
                  value={formData.toolId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">Select tool</option>
                  {selectableTools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.toolName} ({tool.riskLevel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                placeholder="Describe the control expectation and evidence to inspect."
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Weight</label>
                <input
                  name="weight"
                  type="number"
                  min="0.01"
                  max="999.99"
                  step="0.01"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-700">Evidence</p>
                <label className="mt-3 flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="evidenceRequired"
                    checked={formData.evidenceRequired}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                  />
                  Evidence collection is mandatory
                </label>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
              />
              Mark this checklist parameter as active
            </label>

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
                className="rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : editingChecklist ? "Update Checklist" : "Create Checklist"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
