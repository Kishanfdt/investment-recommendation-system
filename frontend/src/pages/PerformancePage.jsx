import { useEffect, useState } from "react";
import { getMonitoringStats } from "../api/client";
import { SectionHeading, MetricCard, Card, Alert, Skeleton, Badge } from "../components/ui";
import PageGuide, { GuideSection, GuideCallout } from "../components/PageGuide";

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

/** Simple inline SVG line chart for rolling accuracy */
function AccuracyChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-8 text-center">
        No resolved predictions yet — chart will appear once predictions are resolved.
      </p>
    );
  }

  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  // Build rolling accuracy (window = 10)
  const window = 10;
  const points = history.map((row, i) => {
    const slice = history.slice(Math.max(0, i - window + 1), i + 1);
    const acc = slice.filter((r) => r.correct).length / slice.length;
    return acc;
  });

  const xScale = (i) => PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const yScale = (v) => PAD.top + (1 - v) * innerH;

  const pathD = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`)
    .join(" ");

  // 50% baseline
  const y50 = yScale(0.5).toFixed(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1.0].map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="#1f2b4d"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 6}
            y={yScale(v) + 4}
            fill="#64748b"
            fontSize="10"
            textAnchor="end"
          >
            {Math.round(v * 100)}%
          </text>
        </g>
      ))}

      {/* 50% reference line */}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={y50}
        y2={y50}
        stroke="#d4a94a"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <text x={W - PAD.right + 4} y={parseFloat(y50) + 4} fill="#d4a94a" fontSize="9">
        50%
      </text>

      {/* Accuracy line */}
      <path d={pathD} fill="none" stroke="#34d399" strokeWidth="2" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((v, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(v)}
          r="2.5"
          fill={v >= 0.5 ? "#34d399" : "#f87171"}
        />
      ))}

      {/* X-axis labels (first, mid, last) */}
      {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((i) => {
        if (!history[i]) return null;
        return (
          <text
            key={i}
            x={xScale(i)}
            y={H - 6}
            fill="#64748b"
            fontSize="9"
            textAnchor="middle"
          >
            {history[i].date}
          </text>
        );
      })}
    </svg>
  );
}

export default function PerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMonitoringStats("TCS.NS")
      .then(setData)
      .catch(() => setError("Failed to load performance stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;

  const hasData = data.total_resolved > 0;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Model Monitoring"
        title="Prediction Performance"
        subtitle={`Tracking ${data.ticker} accuracy over time`}
      />

      <PageGuide title="How to read the performance page">
        <GuideSection title="What are 'resolved' vs 'pending' predictions?">
          Every time the prediction endpoint is called, the signal and probability are logged
          with today&apos;s date. A prediction is &quot;pending&quot; until the actual next-day
          close price is available. Once the market closes the following day, the system checks
          whether the direction was correct and marks the prediction as &quot;resolved.&quot;
          Only resolved predictions count toward accuracy.
        </GuideSection>
        <GuideSection title="What is rolling accuracy?">
          Instead of one static accuracy number, the chart shows a rolling 10-prediction window.
          Each point on the line is the accuracy of the most recent 10 resolved predictions up
          to that date. This reveals trends: is the model improving, degrading, or staying flat?
          Look for stretches above the gold 50% line (dashed) as periods of better-than-random
          performance.
        </GuideSection>
        <GuideSection title="Why is ~50% accuracy acceptable here?">
          Beating a coin flip consistently in financial markets is extremely hard — professional
          quant funds with massive resources often hover around 52–55%. This system is
          transparent about its 48–53% validated accuracy. The value is in the explainability
          layer (SHAP/LIME), not in claiming false precision. A model you understand and trust
          is more useful than a black box you don&apos;t.
        </GuideSection>
        <GuideCallout label="Note:">
          Run{" "}
          <code className="bg-navy-700 px-1 rounded text-gold-300 text-xs">
            POST /monitoring/resolve
          </code>{" "}
          periodically (ideally once per trading day) to update resolved predictions and keep
          the chart current.
        </GuideCallout>
      </PageGuide>

      {/* KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Resolved"
          value={data.total_resolved}
          sublabel="logged predictions with outcomes"
        />
        <MetricCard
          label="Overall Accuracy"
          value={hasData ? `${(data.overall_accuracy * 100).toFixed(1)}%` : "—"}
          tone={hasData && data.overall_accuracy >= 0.5 ? "positive" : "neutral"}
          sublabel="correct direction calls"
        />
        <MetricCard
          label={`Recent Accuracy (${data.recent_window_days}d)`}
          value={data.recent_accuracy != null ? `${(data.recent_accuracy * 100).toFixed(1)}%` : "—"}
          tone={data.recent_accuracy != null && data.recent_accuracy >= 0.5 ? "positive" : "neutral"}
          sublabel="last window"
        />
      </div>

      {/* Chart */}
      <Card>
        <p className="text-sm font-medium text-slate-300 mb-4">
          Rolling Accuracy — 10-Prediction Window
        </p>
        <AccuracyChart history={data.history} />
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-emerald-400"></span> Rolling accuracy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-px border-t border-dashed border-gold-500"></span>{" "}
            50% baseline
          </span>
        </div>
      </Card>

      {/* Recent history table */}
      {hasData && (
        <Card>
          <p className="text-sm font-medium text-slate-300 mb-4">Recent Predictions</p>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {[...data.history].reverse().slice(0, 30).map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-900 text-sm"
              >
                <span className="text-slate-500 w-24 shrink-0">{row.date}</span>
                <Badge>{row.signal}</Badge>
                <span className="text-slate-400 tabular-nums w-16 text-right">
                  {(row.ensemble_probability_up * 100).toFixed(1)}%
                </span>
                <span className={row.correct ? "text-emerald-400" : "text-rose-400"}>
                  {row.correct ? "✓ Correct" : "✗ Wrong"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!hasData && (
        <Alert tone="info">
          No resolved predictions yet. Call the prediction endpoint a few times, then run{" "}
          <code>POST /monitoring/resolve</code> after market close to start building history.
        </Alert>
      )}
    </div>
  );
}
