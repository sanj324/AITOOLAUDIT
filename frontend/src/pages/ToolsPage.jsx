import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyToolForm = {
  toolName: "",
  description: "",
  riskLevel: "MEDIUM",
  isActive: true
};

function RiskBadge({ value }) {
  const classes = {
    LOW: "bg-emerald-100 text-emerald-800",
    MEDIUM: "bg-amber-100 text-amber-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800"
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes[value] || "bg-slate-100 text-slate-700"}`}>
      {value}
    </span>
  );
}

export default function ToolsPage() {
  const { user } = useAuth();
  const isAdmin = user.role.roleCode === "ADMIN";
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [formData, setFormData] = useState(emptyToolForm);
  const [saving, setSaving] = useState(false);

  const loadTools = async () => {
    try {
      setLoading(true);
      const response = await api.get("/tools");
      setTools(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load tools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const openCreateModal = () => {
    setEditingTool(null);
    setFormData(emptyToolForm);
    setShowModal(true);
  };

  const openEditModal = (tool) => {
    setEditingTool(tool);
    setFormData({
      toolName: tool.toolName,
      description: tool.description || "",
      riskLevel: tool.riskLevel,
      isActive: tool.isActive
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
      if (editingTool) {
        await api.put(`/tools/${editingTool.id}`, formData);
        toast.success("Tool updated successfully");
      } else {
        await api.post("/tools", formData);
        toast.success("Tool created successfully");
      }

      setShowModal(false);
      setFormData(emptyToolForm);
      await loadTools();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save tool");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tool) => {
    const confirmed = window.confirm(`Delete tool "${tool.toolName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/tools/${tool.id}`);
      toast.success("Tool deleted successfully");
      await loadTools();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete tool");
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[30px] border border-white/50 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
        <div className="bg-[linear-gradient(135deg,#172f4e_0%,#244d80_100%)] px-6 py-7 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-100">
              Module 1
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Tool Master</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              Maintain the approved AI tool inventory with explicit risk classification, ownership visibility, and governance readiness for audit planning.
            </p>
          </div>

          {isAdmin ? (
            <button
              onClick={openCreateModal}
              className="mt-5 rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-slate-100 md:mt-0"
            >
              Add Tool
            </button>
          ) : null}
        </div>
      </div>

      <div className="executive-card overflow-hidden rounded-[30px]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f2f7fb_100%)] px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Approved Tool Inventory
          </p>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50/90 text-slate-600">
            <tr>
              <th className="px-5 py-4 font-semibold">Tool Name</th>
              <th className="px-5 py-4 font-semibold">Description</th>
              <th className="px-5 py-4 font-semibold">Risk Level</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Linked Checklists</th>
              <th className="px-5 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                  Loading tools...
                </td>
              </tr>
            ) : tools.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                  No tools available.
                </td>
              </tr>
            ) : (
              tools.map((tool) => (
                <tr key={tool.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-semibold text-slate-950">{tool.toolName}</td>
                  <td className="px-5 py-4">{tool.description || "No description"}</td>
                  <td className="px-5 py-4">
                    <RiskBadge value={tool.riskLevel} />
                  </td>
                  <td className="px-5 py-4">
                    {tool.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">{tool.checklistCount ?? 0}</td>
                  <td className="px-5 py-4 text-right">
                    {isAdmin ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(tool)}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(tool)}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
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
          title={editingTool ? "Edit Tool" : "Create Tool"}
          subtitle="Maintain AI tool definitions and risk ratings used by audit teams."
          onClose={() => setShowModal(false)}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Tool Name</label>
                <input
                  name="toolName"
                  value={formData.toolName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="ChatGPT"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Risk Level</label>
                <select
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                placeholder="Summarize the tool's usage context and governance relevance."
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
              />
              Mark this tool as active for new checklist mapping
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
                className="rounded-2xl bg-[linear-gradient(135deg,#244d80_0%,#1b3a61_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(36,77,128,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Saving..." : editingTool ? "Update Tool" : "Create Tool"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
