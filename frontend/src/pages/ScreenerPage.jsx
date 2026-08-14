import { useEffect, useState } from "react";
import { getScreener } from "../api/client";
import { Card, SectionHeading, Alert, Skeleton, SignalBadge } from "../components/ui";
import PageGuide, { GuideSection, GuideCallout } from "../components/PageGuide";

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function ScreenerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getScreener()
      .then(setData)
      .catch(() =>
        setError("Failed to load screener. This endpoint can take 30–60 s — try refreshing.")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;

  const buyCount = data.filter((s) => s.signal === "BUY").length;
  const sellCount = data.filter((s) => s.signal === "SELL").length;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Market Scan"
        title="NIFTY 50 Screener"
        subtitle="Ranked by pooled model probability. TATAMOTORS.NS excluded (2025 demerger)."
      />

      <PageGuide title="How to read the NIFTY 50 Screener">
        <GuideSection title="What is this scanning?">
          A single pooled model — trained on all NIFTY 50 stocks simultaneously — scores every
          stock for tomorrow&apos;s expected direction. Stocks are ranked by probability of upward
          movement, from highest to lowest.
        </GuideSection>
        <GuideSection title="Why 'pooled'?">
          Instead of training a separate model per stock (which would overfit on limited data),
          one model learns shared patterns across all 50 stocks. It sees more training examples
          and generalises better, at the cost of missing stock-specific nuance.
        </GuideSection>
        <GuideSection title="BUY / SELL / HOLD signal meanings">
          BUY = probability &gt;55%. SELL = &lt;45%. HOLD = in between. A column of mostly HOLD
          signals means the model sees an uncertain or quiet day ahead — not a bug, just honesty.
        </GuideSection>
        <GuideCallout label="Low-agreement warning:">
          Stocks near the 50% mark should be treated as HOLD regardless of the displayed signal.
          The further from 50%, the stronger the model&apos;s conviction.
        </GuideCallout>
      </PageGuide>

      {/* Summary bar */}
      <div className="flex gap-4 text-sm">
        <span className="text-emerald-400 font-medium">{buyCount} BUY</span>
        <span className="text-slate-500">·</span>
        <span className="text-rose-400 font-medium">{sellCount} SELL</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400">{data.length - buyCount - sellCount} HOLD</span>
      </div>

      <Card>
        <div className="space-y-1">
          {data.map((stock) => (
            <div
              key={stock.ticker}
              className="flex justify-between items-center px-3 py-2.5 hover:bg-navy-900 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-white">{stock.ticker}</span>
              <div className="flex items-center gap-4">
                {stock.probability_up != null && (
                  <span className="text-slate-400 text-sm tabular-nums">
                    {(stock.probability_up * 100).toFixed(1)}%
                  </span>
                )}
                <SignalBadge signal={stock.signal} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
