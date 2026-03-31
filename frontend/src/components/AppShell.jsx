import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/audits", label: "Audit Planning" },
  { to: "/observations", label: "Observations" },
  { to: "/audit-trail", label: "Audit Trail" },
  { to: "/tools", label: "Tool Master" },
  { to: "/checklists", label: "Checklist Master" }
];

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-transparent lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="hidden lg:flex lg:min-h-screen lg:flex-col lg:border-r lg:border-white/20 lg:bg-[linear-gradient(180deg,#10243d_0%,#132b46_38%,#172f4e_100%)] lg:px-6 lg:py-7 lg:text-white">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-100">
            AI Audit Console
          </p>
          <h1 className="mt-3 text-[1.8rem] font-semibold leading-tight tracking-[-0.04em]">
            Privacy & Security Internal Audit
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            A professional oversight workspace for AI governance, control monitoring, audit execution, and evidence-driven reporting.
          </p>
        </div>

        <div className="mt-8 rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-100">Signed In</p>
          <p className="mt-3 text-lg font-semibold">{user.fullName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">
            {user.role.roleName}
          </p>
          <div className="mt-5 space-y-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Environment</p>
              <p className="mt-2 font-semibold">Internal Control Review</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-100">Coverage</p>
              <p className="mt-2 font-semibold">AI tools, findings, scoring, reports</p>
            </div>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-white text-brand-900 shadow-[0_18px_30px_rgba(15,23,42,0.18)]"
                    : "border border-transparent text-slate-200 hover:border-white/10 hover:bg-white/8 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-8">
          <button
            onClick={logout}
            className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 border-b border-white/60 bg-slate-50/85 backdrop-blur-xl lg:hidden">
          <div className="px-6 py-5">
            <p className="section-kicker">AI Audit Console</p>
            <h1 className="mt-2 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-950">
              AI Privacy & Security Internal Audit System
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Executive oversight workspace for AI governance and evidence-based review.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-800 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </header>

        <main className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="rounded-[32px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(248,251,254,0.92)_100%)] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:p-5 lg:min-h-[calc(100vh-4rem)] lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
