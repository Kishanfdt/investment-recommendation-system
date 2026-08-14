import { useEffect, useState } from "react";
import { getMutualFunds } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, SectionHeading, Badge, Alert, Skeleton } from "../components/ui";
import PageGuide, { GuideSection, GuideCallout } from "../components/PageGuide";

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  );
}

export default function MutualFundsPage() {
  const { profileId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileId) return;
    getMutualFunds(profileId)
      .then(setData)
      .catch(() => setError("Failed to load mutual fund recommendations."))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (!profileId) return <Alert tone="warning">Profile not found — complete onboarding first.</Alert>;
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={`Matched to ${data.risk_category} risk profile`}
        title="Mutual Fund Recommendations"
        subtitle={`Fund tier: ${data.matched_risk_tier}`}
      />

      <PageGuide title="How to read mutual fund recommendations">
        <GuideSection title="What is CAGR?">
          CAGR stands for Compound Annual Growth Rate — the steady annual return that would
          have produced the fund&apos;s actual total return over that period. A 3-year CAGR of 12%
          means ₹1 lakh grew to roughly ₹1.4 lakh over 3 years. It smooths out year-to-year
          swings to give a fair comparison across funds.
        </GuideSection>
        <GuideSection title="What is volatility?">
          Volatility measures how much the fund&apos;s returns bounce around from month to month.
          A fund with 5% volatility is relatively stable; 20% means large swings up and down.
          Higher volatility isn&apos;t always bad — it often comes with higher potential returns —
          but it means you need a stronger stomach and a longer horizon.
        </GuideSection>
        <GuideSection title="What is a risk tier?">
          Funds are classified into tiers (Conservative / Moderate / Aggressive) based on their
          asset mix: debt-heavy funds are conservative; equity-heavy or small-cap funds are
          aggressive. Your risk tier is matched to the risk score from your questionnaire so
          the recommendations fit your actual tolerance, not just your stated goal.
        </GuideSection>
        <GuideCallout label="Data source:">
          Returns and fund metadata are sourced from AMFI (Association of Mutual Funds in India)
          and mfapi.in. Past returns are not a guarantee of future performance.
        </GuideCallout>
      </PageGuide>

      <div className="space-y-3">
        {data.recommendations.map((fund, i) => (
          <Card key={i}>
            <p className="font-medium text-white mb-3">{fund.scheme_name}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>{fund.fund_type}</Badge>
              <Badge>{fund.amc}</Badge>
              {fund.return_3y != null && (
                <Badge tone="positive">3Y CAGR: {fund.return_3y}%</Badge>
              )}
              {fund.return_1y != null && (
                <Badge>1Y: {fund.return_1y}%</Badge>
              )}
              {fund.volatility != null && (
                <Badge>Volatility: {fund.volatility}%</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
