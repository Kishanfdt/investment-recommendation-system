export function Card({ children, className = "" }) {
  return (
    <div className={`bg-navy-800 border border-navy-600 rounded-2xl p-6 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-1">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-2xl text-white">{title}</h2>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function MetricCard({ label, value, sublabel, tone = "neutral" }) {
  const toneStyles = {
    neutral: "text-white",
    positive: "text-emerald-400",
    negative: "text-rose-400",
    gold: "text-gold-400",
  };
  return (
    <div className="bg-navy-900 border border-navy-600 rounded-xl px-5 py-4">
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold font-serif ${toneStyles[tone]}`}>{value}</p>
      {sublabel && <p className="text-slate-500 text-xs mt-1">{sublabel}</p>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const toneStyles = {
    neutral: "bg-slate-700/50 text-slate-300 border-slate-600",
    positive: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
    negative: "bg-rose-900/40 text-rose-300 border-rose-700",
    warning: "bg-gold-500/10 text-gold-400 border-gold-600/40",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

export function SignalBadge({ signal }) {
  const map = {
    BUY: { tone: "positive", label: "BUY" },
    SELL: { tone: "negative", label: "SELL" },
    HOLD: { tone: "warning", label: "HOLD" },
    ERROR: { tone: "neutral", label: "N/A" },
  };
  const cfg = map[signal] || map.HOLD;
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}

export function ProgressBar({ value, max = 1, tone = "gold" }) {
  const toneStyles = { gold: "bg-gold-500", blue: "bg-blue-500", emerald: "bg-emerald-500" };
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-navy-900 rounded-full h-2 overflow-hidden">
      <div className={`h-full ${toneStyles[tone]} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`bg-navy-700 animate-pulse rounded-lg ${className}`} />;
}

export function Alert({ children, tone = "warning" }) {
  const toneStyles = {
    warning: "bg-gold-500/10 border-gold-600/40 text-gold-300",
    error: "bg-rose-900/40 border-rose-700 text-rose-200",
    info: "bg-blue-900/30 border-blue-700 text-blue-200",
  };
  return <div className={`border rounded-xl p-4 text-sm ${toneStyles[tone]}`}>{children}</div>;
}