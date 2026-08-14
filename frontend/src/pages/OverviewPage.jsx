import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, SectionHeading, MetricCard, Alert, Skeleton } from "../components/ui";

const FEATURE_LINKS = [
  { to: "/dashboard/prediction", icon: "◎", label: "Prediction", desc: "TCS.NS ensemble signal with SHAP & LIME explainability" },
  { to: "/dashboard/top-picks", icon: "★", label: "Top Picks", desc: "AI-ranked NIFTY 50 stocks by model agreement" },
  { to: "/dashboard/screener", icon: "⊞", label: "NIFTY 50 Screener", desc: "Full market scan of all NIFTY 50 stocks" },
  { to: "/dashboard/mutual-funds", icon: "◈", label: "Mutual Funds", desc: "Funds matched to your risk tier from AMFI data" },
  { to: "/dashboard/portfolio", icon: "◑", label: "Portfolio", desc: "MPT-optimised asset allocation for your risk profile" },
  { to: "/dashboard/performance", icon: "↗", label: "Performance", desc: "Rolling accuracy tracking for all logged predictions" },
];

export default function OverviewPage() {
  const { profileId, riskProfile, loading, user } = useAuth();
  const navigate = useNavigate();

  // Still loading auth/profile
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  // Logged in but no profile — prompt to onboard
  if (!profileId) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Get Started"
          title="Complete your investor profile"
          subtitle="You need to complete the onboarding questionnaire to unlock recommendations."
        />
        <Alert tone="warning">
          No investor profile found for your account. Complete the risk questionnaire to get started.
        </Alert>
        <button
          onClick={() => navigate("/onboarding")}
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 font-semibold rounded-lg px-6 py-3 transition-colors"
        >
          Start Onboarding →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <div>
        <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-1">
          Portfolio Dashboard
        </p>
        <h1 className="font-serif text-4xl text-white">
          {user?.user_metadata?.full_name
            ? `Welcome back, ${user.user_metadata.full_name.split(" ")[0]}`
            : "Your Investment Overview"}
        </h1>
      </div>

      {/* Risk profile summary */}
      {riskProfile && (
        <div>
          <SectionHeading eyebrow="Investor Profile" title="Your Risk Assessment" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Risk Score" value={riskProfile.risk_score} />
            <MetricCard label="Category" value={riskProfile.risk_category} tone="gold" />
            <MetricCard
              label="Max Equity"
              value={`${riskProfile.max_equity_allocation_pct}%`}
            />
            <MetricCard
              label="Rebalance"
              value={riskProfile.recommended_rebalance_frequency.replace("_", " ")}
            />
          </div>
        </div>
      )}

      {/* Feature quick-links */}
      <div>
        <SectionHeading
          eyebrow="Features"
          title="Explore Your Dashboard"
          subtitle="Click any section to dive into AI-powered analysis."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_LINKS.map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="text-left bg-navy-800 border border-navy-600 hover:border-gold-600/50 rounded-2xl p-5 transition-all hover:bg-navy-700/60 group"
            >
              <span className="text-2xl mb-3 block text-gold-500 group-hover:scale-110 transition-transform inline-block">
                {item.icon}
              </span>
              <p className="font-serif text-lg text-white mb-1">{item.label}</p>
              <p className="text-slate-400 text-sm leading-snug">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <Alert tone="warning">
        <strong className="text-gold-400">Model performance notice:</strong> backtesting shows
        near-random directional accuracy (~48–53%) for stock predictions. This is an educational
        demonstration, not investment advice.
      </Alert>
    </div>
  );
}
