import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const roleDescriptions = {
  ADMIN: "Full platform control, including user provisioning and policy configuration.",
  AUDITOR: "Can perform audits, capture evidence, and raise observations.",
  REVIEWER: "Can review audits, validate findings, and approve conclusions."
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get("/dashboard");
        setDashboard(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const severityColors = {
    LOW: "#16a34a",
    MEDIUM: "#f59e0b",
    HIGH: "#ea580c",
    CRITICAL: "#dc2626"
  };

  const kpis = dashboard?.kpis || {
    totalAudits: 0,
    completedAudits: 0,
    highRiskFindings: 0,
    compliancePercent: 0
  };
  const charts = dashboard?.charts || {
    toolWiseCompliance: [],
    severityDistribution: []
  };

  return (
    <div className="space-y-6">
      <div className="executive-card rounded-[30px] p-7">
        <p className="section-kicker">
          Phase 5 Dashboard
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Welcome, {user.fullName}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {roleDescriptions[user.role.roleCode]} The platform now includes master data, audit
          planning, dynamic execution, observations, weighted scoring, executive KPIs, and
          export-ready reporting for AI governance reviews.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="executive-card rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Audits</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">
            {loading ? "--" : kpis.totalAudits}
          </p>
        </div>
        <div className="executive-card rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completed Audits</p>
          <p className="mt-4 text-4xl font-semibold text-emerald-700">
            {loading ? "--" : kpis.completedAudits}
          </p>
        </div>
        <div className="executive-card rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">High Risk Findings</p>
          <p className="mt-4 text-4xl font-semibold text-red-700">
            {loading ? "--" : kpis.highRiskFindings}
          </p>
        </div>
        <div className="executive-card rounded-3xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Compliance %</p>
          <p className="mt-4 text-4xl font-semibold text-brand-800">
            {loading ? "--" : `${kpis.compliancePercent}%`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="executive-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Tool-Wise Compliance
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Compliance by audited tool
              </h3>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.toolWiseCompliance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="toolName" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis tick={{ fill: "#475569", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="compliancePercent" fill="#244d80" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="executive-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Severity Distribution
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Observation mix by severity
          </h3>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.severityDistribution}
                  dataKey="count"
                  nameKey="severity"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {charts.severityDistribution.map((entry) => (
                    <Cell key={entry.severity} fill={severityColors[entry.severity] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {charts.severityDistribution.map((item) => (
              <div key={item.severity} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                <span className="font-semibold text-slate-700">{item.severity}</span>
                <span className="text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="executive-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            User Profile
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <span>Role</span>
              <span className="font-semibold">{user.role.roleName}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <span>Email</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <span>Department</span>
              <span className="font-semibold">{user.department || "Not assigned"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Designation</span>
              <span className="font-semibold">{user.designation || "Not assigned"}</span>
            </div>
          </div>
        </div>

        <div className="executive-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Master Modules
          </p>
          <div className="mt-4 space-y-3">
            <Link
              to="/audits"
              className="block rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fc_100%)] p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold text-slate-900">Audit Planning & Execution</p>
              <p className="mt-1 text-sm text-slate-600">
                Launch scoped audits, execute dynamic checklists, and view weighted scores.
              </p>
            </Link>
            <Link
              to="/observations"
              className="block rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fc_100%)] p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold text-slate-900">Observation Register</p>
              <p className="mt-1 text-sm text-slate-600">
                Track non-compliant findings auto-created from audit execution.
              </p>
            </Link>
            <Link
              to="/audit-trail"
              className="block rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fc_100%)] p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold text-slate-900">Audit Trail</p>
              <p className="mt-1 text-sm text-slate-600">
                Review immutable logs for login events, changes, and audit updates.
              </p>
            </Link>
            <Link
              to="/tools"
              className="block rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fc_100%)] p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold text-slate-900">Tool Master</p>
              <p className="mt-1 text-sm text-slate-600">
                Maintain approved tools and risk classification.
              </p>
            </Link>
            <Link
              to="/checklists"
              className="block rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fc_100%)] p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <p className="font-semibold text-slate-900">Checklist Master</p>
              <p className="mt-1 text-sm text-slate-600">
                Define control parameters, severity, weight, and evidence needs.
              </p>
            </Link>
          </div>
        </div>

        <div className="executive-card rounded-3xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Control Posture
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Enabled
              </p>
              <p className="mt-2 text-sm text-emerald-900">JWT session validation and RBAC enforcement</p>
            </div>
            <div className="rounded-2xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                Active
              </p>
              <p className="mt-2 text-sm text-brand-900">Live dashboard analytics and export-ready audit reporting</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Compliance
              </p>
              <p className="mt-2 text-sm text-slate-800">Soft delete and server-side validation preserved across modules</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
