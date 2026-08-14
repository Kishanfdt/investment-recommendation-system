import { useEffect, useState } from "react";
import { getPortfolio } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, SectionHeading, MetricCard, ProgressBar, Alert, Skeleton } from "../components/ui";
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

export default function PortfolioPage() {
  const { profileId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId) return;
    getPortfolio(profileId)
      .then(setData)
      .catch(() => setError("Failed to load portfolio recommendation."))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (!profileId) return <Alert tone="warning">Profile not found — complete onboarding first.</Alert>;
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={`Matched to ${data.risk_category} risk profile`}
        title="Portfolio Recommendation"
        subtitle={`Strategy: ${data.strategy}`}
      />

      <PageGuide title="How to read your portfolio">
        <GuideSection title="What is Modern Portfolio Theory (MPT)?">
          MPT, developed by Harry Markowitz in 1952, is the mathematical framework behind this
          allocation. The core idea: by combining assets that don&apos;t move in lockstep (low
          correlation), you can achieve a target return with less total risk than holding any
          single asset. The &quot;efficient frontier&quot; is the set of portfolios that get the
          highest possible return for each level of risk.
        </GuideSection>
        <GuideSection title="What is the Sharpe Ratio?">
          The Sharpe ratio measures return per unit of risk: (portfolio return − risk-free rate)
          ÷ portfolio volatility. A Sharpe of 1.0 means you earn 1% extra return for every 1%
          of risk taken. Higher is better. Below 0.5 is generally considered poor risk/reward;
          above 1.5 is strong. This portfolio is optimised to maximise the Sharpe ratio for your
          risk category.
        </GuideSection>
        <GuideSection title="What does 'diversification' actually do?">
          If stocks A and B both go up and down together, holding both doesn&apos;t reduce risk.
          But if A zigs when B zags, combining them smooths out the ride. This is diversification:
          it doesn&apos;t remove market risk, but it eliminates the unnecessary risk of being
          concentrated in a single asset. The allocation bars below show how your capital is
          spread across different asset classes.
        </GuideSection>
        <GuideCallout label="Note:">
          Expected return and volatility are estimated from historical data. Future results may
          differ significantly — especially in volatile market regimes. Rebalance as recommended
          to keep the allocation on target.
        </GuideCallout>
      </PageGuide>

      {/* KPI metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Expected Return"
          value={`${(data.expected_return * 100).toFixed(2)}%`}
          tone="positive"
        />
        <MetricCard
          label="Volatility"
          value={`${(data.volatility * 100).toFixed(2)}%`}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={data.sharpe_ratio.toFixed(3)}
          tone="gold"
        />
      </div>

      {/* Asset allocation */}
      <Card>
        <p className="text-sm font-medium text-slate-300 mb-4">Asset Allocation</p>
        <div className="space-y-4">
          {data.weights.map((w) => (
            <div key={w.asset}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-300">{w.asset}</span>
                <span className="text-white font-medium">{(w.weight * 100).toFixed(1)}%</span>
              </div>
              <ProgressBar value={w.weight} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
