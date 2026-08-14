import { useEffect, useState } from "react";
import { getTopPicks } from "../api/client";
import { Card, SectionHeading, Alert, Skeleton, Badge } from "../components/ui";
import PageGuide, { GuideSection, GuideCallout } from "../components/PageGuide";

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function TopPicksPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTopPicks(5)
      .then(setData)
      .catch(() => setError("Failed to load top picks. This endpoint can take 30–60 s — try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="AI-Ranked" title="Top Picks" subtitle={data.note} />

      <PageGuide title="How to read Top Picks">
        <GuideSection title="What is 'probability of upward movement'?">
          Each stock is scored by a pooled model trained across all NIFTY 50 stocks. The
          probability shown is the model&apos;s confidence that this stock will close higher
          tomorrow. Higher = more bullish, but remember: even 70% confidence means a 30% chance
          of being wrong.
        </GuideSection>
        <GuideSection title="What is 'model agreement' and why does it matter?">
          Model agreement is measured by the standard deviation of predictions across multiple
          model runs or bootstrap samples. A low std (shown as &quot;High agreement&quot;) means
          every version of the model lands on roughly the same answer — that&apos;s a more
          trustworthy signal. High std (&quot;Moderate agreement&quot;) means the models are
          split, and you should treat the pick with more caution.
        </GuideSection>
        <GuideSection title="What are 'top reasons'?">
          For each top pick, SHAP analysis identifies which technical indicators most influenced
          the prediction — e.g. RSI above 60 pushing toward UP. These are not trading rules;
          they&apos;re explanations of the model&apos;s logic.
        </GuideSection>
        <GuideCallout label="Remember:">
          The pooled NIFTY 50 model accuracy is ~48–53%. Top picks reflect the model&apos;s
          strongest signals, not guaranteed winners.
        </GuideCallout>
      </PageGuide>

      <div className="space-y-4">
        {data.top_picks.map((pick, i) => (
          <Card key={pick.ticker}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-serif text-2xl text-gold-500">#{i + 1}</span>
                <span className="font-serif text-xl text-white">{pick.ticker}</span>
              </div>
              <span className="text-emerald-400 font-serif text-xl font-semibold">
                {(pick.probability_up * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-slate-500 text-xs mb-3">
              Cross-model agreement:{" "}
              <span className={pick.model_agreement < 0.03 ? "text-emerald-400" : "text-gold-400"}>
                {pick.model_agreement < 0.03 ? "High" : "Moderate"}
              </span>{" "}
              (std {pick.model_agreement})
            </p>
            <div className="space-y-1.5">
              {pick.top_reasons.map((r, j) => (
                <div
                  key={j}
                  className="flex justify-between bg-navy-900 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-slate-300">
                    {r.feature} = {r.value}
                  </span>
                  <span
                    className={r.direction.includes("UP") ? "text-emerald-400" : "text-rose-400"}
                  >
                    {r.direction}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
