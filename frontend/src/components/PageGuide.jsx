import { useState } from "react";
import { Card } from "./ui";

/**
 * Reusable collapsible "What am I looking at?" panel.
 * Same toggle pattern as ExplainabilityGuide.jsx — collapsed by default.
 *
 * Props:
 *   eyebrow  — small gold uppercase label above the title (optional)
 *   title    — panel heading (string)
 *   children — the explanation content (JSX)
 */
export default function PageGuide({ eyebrow = "Understanding this page", title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="!bg-navy-900/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-1">
            {eyebrow}
          </p>
          <h3 className="font-serif text-lg text-white">{title}</h3>
        </div>
        <span className="text-slate-400 text-xl ml-4 shrink-0">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-4 text-sm text-slate-300 leading-relaxed">
          {children}
        </div>
      )}
    </Card>
  );
}

/** Reusable section within a PageGuide */
export function GuideSection({ title, children }) {
  return (
    <div>
      {title && <p className="font-semibold text-white mb-1">{title}</p>}
      <p>{children}</p>
    </div>
  );
}

/** Highlighted callout box within a PageGuide */
export function GuideCallout({ label, children }) {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-lg p-3">
      <p className="text-xs text-slate-400">
        {label && <span className="text-gold-400 font-medium">{label} </span>}
        {children}
      </p>
    </div>
  );
}
