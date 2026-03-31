import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/50 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.18)] backdrop-blur lg:grid-cols-[1.2fr_0.8fr]">
        <div className="executive-gridline hidden bg-[linear-gradient(180deg,#162841_0%,#10243d_48%,#0e1e31_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-200">
              RBI-Aligned Governance
            </p>
            <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-tight tracking-[-0.04em]">
              AI Privacy & Security Internal Audit System
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-200">
              Centralized access control for audit teams monitoring ChatGPT, GitHub,
              GitHub Copilot, Claude, and Eraser usage across the enterprise.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Coverage</p>
                <p className="mt-3 text-lg font-semibold">5 AI tools</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Controls</p>
                <p className="mt-3 text-lg font-semibold">Team + Business</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Reporting</p>
                <p className="mt-3 text-lg font-semibold">Score + Export</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-brand-200">Environment</p>
                <p className="mt-2 text-2xl font-semibold">Internal Audit</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-brand-200">Access Model</p>
                <p className="mt-2 text-2xl font-semibold">3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(247,250,252,0.98)_100%)] p-8 sm:p-12">
          <div className="mx-auto max-w-md">
            <p className="section-kicker">
              Secure Sign In
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Access the audit control room
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in using your assigned audit credentials. Role permissions are
              enforced after login.
            </p>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="admin@aiaudit.local"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-300/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#244d80_0%,#1b3a61_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(36,77,128,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-[linear-gradient(180deg,#fff9eb_0%,#fff4d8_100%)] p-4 text-sm text-amber-900">
              Seed admin credential:
              <span className="ml-1 font-semibold">admin@aiaudit.local / Admin@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
