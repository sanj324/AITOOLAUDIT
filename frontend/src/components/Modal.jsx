export default function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.35),rgba(15,23,42,0.7))] px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/50 bg-white/95 shadow-[0_32px_90px_rgba(15,23,42,0.28)]">
        <div className="bg-[linear-gradient(135deg,#172f4e_0%,#244d80_100%)] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-100">
                Controlled Update
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{title}</h2>
              {subtitle ? <p className="mt-2 text-sm text-slate-200">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15"
            >
              Close
            </button>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbfe_100%)] px-6 py-6">
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
