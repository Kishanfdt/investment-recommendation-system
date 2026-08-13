import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getRiskProfile,
  getPrediction,
  getScreener,
  getTopPicks,
  getMutualFunds,
  getPortfolio,
} from "../api/client";
import { Card, SectionHeading, MetricCard, Badge, SignalBadge, ProgressBar, Alert, Skeleton } from "../components/ui";
import ExplainabilityGuide from "../components/ExplainabilityGuide";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "topPicks", label: "Top Picks" },
  { id: "screener", label: "NIFTY 50 Screener" },
  { id: "funds", label: "Mutual Funds" },
  { id: "portfolio", label: "Portfolio" },
];

export default function DashboardPage() {
  const { profileId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  const [riskProfile, setRiskProfile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [screener, setScreener] = useState(null);
  const [topPicks, setTopPicks] = useState(null);
  const [funds, setFunds] = useState(null);
  const [portfolio, setPortfolio] = useState(null);

  const [loading, setLoading] = useState({ overview: true });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadOverview() {
      try {
        const [riskRes, predRes] = await Promise.all([
          getRiskProfile(profileId),
          getPrediction("TCS.NS"),
        ]);
        setRiskProfile(riskRes);
        setPrediction(predRes);
      } catch (err) {
        setErrors((prev) => ({ ...prev, overview: "Failed to load overview data." }));
      } finally {
        setLoading((prev) => ({ ...prev, overview: false }));
      }
    }
    loadOverview();
  }, [profileId]);

  const loadTab = async (tabId) => {
    if (loading[tabId]) return;
    if (tabId === "screener" && screener) return;
    if (tabId === "topPicks" && topPicks) return;
    if (tabId === "funds" && funds) return;
    if (tabId === "portfolio" && portfolio) return;

    setLoading((prev) => ({ ...prev, [tabId]: true }));
    try {
      if (tabId === "screener") setScreener(await getScreener());
      if (tabId === "topPicks") setTopPicks(await getTopPicks(5));
      if (tabId === "funds") setFunds(await getMutualFunds(profileId));
      if (tabId === "portfolio") setPortfolio(await getPortfolio(profileId));
    } catch (err) {
      setErrors((prev) => ({ ...prev, [tabId]: `Failed to load ${tabId} data.` }));
    } finally {
      setLoading((prev) => ({ ...prev, [tabId]: false }));
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    loadTab(tabId);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-2">
        Portfolio Dashboard
      </p>
      <h1 className="font-serif text-4xl text-white mb-8">Your Investment Overview</h1>

      <div className="flex gap-1 border-b border-navy-600 mb-10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-gold-500 text-gold-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab loading={loading.overview} error={errors.overview} riskProfile={riskProfile} prediction={prediction} />
      )}
      {activeTab === "topPicks" && (
        <TopPicksTab loading={loading.topPicks} error={errors.topPicks} data={topPicks} />
      )}
      {activeTab === "screener" && (
        <ScreenerTab loading={loading.screener} error={errors.screener} data={screener} />
      )}
      {activeTab === "funds" && (
        <FundsTab loading={loading.funds} error={errors.funds} data={funds} />
      )}
      {activeTab === "portfolio" && (
        <PortfolioTab loading={loading.portfolio} error={errors.portfolio} data={portfolio} />
      )}

      <Alert tone="warning" className="mt-10">
        <strong className="text-gold-400">Model performance notice:</strong> backtesting shows
        near-random directional accuracy (~48-50%) and a poorly calibrated confidence score for
        stock predictions. This is an educational demonstration, not investment advice.
      </Alert>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
    </div>
  );
}

function OverviewTab({ loading, error, riskProfile, prediction }) {
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!riskProfile || !prediction) return null;

  const signalTone = { BUY: "positive", SELL: "negative", HOLD: "gold" };

  return (
    <div className="space-y-10">
      <div>
        <SectionHeading eyebrow="Investor Profile" title="Your Risk Assessment" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Risk Score" value={riskProfile.risk_score} />
          <MetricCard label="Category" value={riskProfile.risk_category} tone="gold" />
          <MetricCard label="Max Equity" value={`${riskProfile.max_equity_allocation_pct}%`} />
          <MetricCard label="Rebalance" value={riskProfile.recommended_rebalance_frequency.replace("_", " ")} />
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow={`As of ${prediction.as_of_date}`}
          title={`${prediction.ticker} Prediction`}
          subtitle="Ensemble of Random Forest, XGBoost, LightGBM, and LSTM"
        />

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-400 text-sm">Ensemble Signal</p>
            <SignalBadge signal={prediction.signal} />
          </div>
          <p className={`text-4xl font-serif font-semibold text-${signalTone[prediction.signal] === "positive" ? "emerald" : signalTone[prediction.signal] === "negative" ? "rose" : "gold"}-400`}>
            {(prediction.ensemble_probability_up * 100).toFixed(1)}%
          </p>
          <p className="text-slate-500 text-sm mt-1">probability of upward movement</p>
        </Card>

        <p className="text-sm font-medium text-slate-300 mb-2">Individual Model Signals</p>
        <div className="space-y-2 mb-8">
          {prediction.individual_models.map((m) => (
            <div key={m.model} className="flex justify-between items-center bg-navy-900 border border-navy-600 rounded-lg px-4 py-3">
              <span className="text-sm text-slate-300">{m.model}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white font-medium">
                  {m.probability_up != null
                    ? `${(m.probability_up * 100).toFixed(1)}% UP`
                    : `${(m.predicted_return * 100).toFixed(2)}% return`}
                </span>
                <Badge>weight {(m.weight * 100).toFixed(0)}%</Badge>
              </div>
            </div>
          ))}
        </div>

        <ExplainabilityGuide />

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">SHAP — Exact Contributions</p>
            <div className="space-y-2">
              {prediction.top_shap_factors.map((f) => (
                <div key={f.feature} className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{f.feature}</span>
                    <span className={f.shap_value > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {f.shap_value > 0 ? "+" : ""}{f.shap_value}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">value: {f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">LIME — Local Conditions</p>
            <div className="space-y-2">
              {prediction.top_lime_factors.map((f, i) => (
                <div key={i} className="bg-navy-900 border border-navy-600 rounded-lg px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">{f.condition}</span>
                    <span className={f.weight > 0 ? "text-emerald-400" : "text-rose-400"}>
                      {f.weight > 0 ? "+" : ""}{f.weight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopPicksTab({ loading, error, data }) {
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <p className="text-slate-500 py-8">Select this tab to run the analysis.</p>;

  return (
    <div>
      <SectionHeading eyebrow="AI-Ranked" title="Top Picks" subtitle={data.note} />
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
              Cross-model agreement: {pick.model_agreement < 0.03 ? "High" : "Moderate"} (std {pick.model_agreement})
            </p>
            <div className="space-y-1.5">
              {pick.top_reasons.map((r, j) => (
                <div key={j} className="flex justify-between bg-navy-900 rounded-lg px-3 py-2 text-sm">
                  <span className="text-slate-300">{r.feature} = {r.value}</span>
                  <span className={r.direction.includes("UP") ? "text-emerald-400" : "text-rose-400"}>{r.direction}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ScreenerTab({ loading, error, data }) {
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <p className="text-slate-500 py-8">Select this tab to scan NIFTY 50.</p>;

  return (
    <div>
      <SectionHeading
        eyebrow="Market Scan"
        title="NIFTY 50 Screener"
        subtitle="Ranked by pooled model probability. TATAMOTORS.NS excluded (2025 demerger)."
      />
      <Card>
        <div className="space-y-1">
          {data.map((stock) => (
            <div key={stock.ticker} className="flex justify-between items-center px-3 py-2.5 hover:bg-navy-900 rounded-lg transition-colors">
              <span className="text-sm font-medium text-white">{stock.ticker}</span>
              <div className="flex items-center gap-4">
                {stock.probability_up != null && (
                  <span className="text-slate-400 text-sm">{(stock.probability_up * 100).toFixed(1)}%</span>
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

function FundsTab({ loading, error, data }) {
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <p className="text-slate-500 py-8">Select this tab to load recommendations.</p>;

  return (
    <div>
      <SectionHeading
        eyebrow={`Matched to ${data.risk_category} risk profile`}
        title="Mutual Fund Recommendations"
        subtitle={`Fund tier: ${data.matched_risk_tier}`}
      />
      <div className="space-y-3">
        {data.recommendations.map((fund, i) => (
          <Card key={i}>
            <p className="font-medium text-white mb-2">{fund.scheme_name}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>{fund.fund_type}</Badge>
              <Badge>{fund.amc}</Badge>
              {fund.return_3y != null && <Badge tone="positive">3Y: {fund.return_3y}%</Badge>}
              {fund.return_1y != null && <Badge>1Y: {fund.return_1y}%</Badge>}
              {fund.volatility != null && <Badge>Vol: {fund.volatility}%</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PortfolioTab({ loading, error, data }) {
  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) return <p className="text-slate-500 py-8">Select this tab to load your portfolio.</p>;

  return (
    <div>
      <SectionHeading
        eyebrow={`Matched to ${data.risk_category} risk profile`}
        title="Portfolio Recommendation"
        subtitle={`Strategy: ${data.strategy}`}
      />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <MetricCard label="Expected Return" value={`${(data.expected_return * 100).toFixed(2)}%`} tone="positive" />
        <MetricCard label="Volatility" value={`${(data.volatility * 100).toFixed(2)}%`} />
        <MetricCard label="Sharpe Ratio" value={data.sharpe_ratio.toFixed(3)} tone="gold" />
      </div>

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