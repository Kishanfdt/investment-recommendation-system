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

  // Overview loads immediately
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

  // Other tabs load lazily, only once, when first opened
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
    <div className="max-w-5xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-6">Your Investment Dashboard</h1>

      <div className="flex gap-2 border-b border-slate-700 mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <OverviewTab
          loading={loading.overview}
          error={errors.overview}
          riskProfile={riskProfile}
          prediction={prediction}
        />
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

      <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-200 rounded-lg p-4 text-sm mt-8">
        <strong>Important:</strong> backtesting shows near-random directional accuracy
        (~48-50%) and a poorly calibrated confidence score for stock predictions. This
        is an educational demonstration, not investment advice.
      </div>
    </div>
  );
}

// ------------------------------------------------------------------

function LoadingState({ message = "Loading..." }) {
  return <p className="text-slate-400 py-8">{message}</p>;
}

function ErrorState({ message }) {
  return (
    <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-4">
      {message}
    </div>
  );
}

function OverviewTab({ loading, error, riskProfile, prediction }) {
  if (loading) return <LoadingState message="Loading your profile and TCS prediction..." />;
  if (error) return <ErrorState message={error} />;
  if (!riskProfile || !prediction) return null;

  const signalColor = {
    BUY: "bg-green-900/50 border-green-700 text-green-200",
    SELL: "bg-red-900/50 border-red-700 text-red-200",
    HOLD: "bg-yellow-900/50 border-yellow-700 text-yellow-200",
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Your Risk Profile</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-400 text-sm">Risk Score</p>
            <p className="text-2xl font-bold">{riskProfile.risk_score}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Category</p>
            <p className="text-2xl font-bold capitalize">{riskProfile.risk_category}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Max Equity</p>
            <p className="text-2xl font-bold">{riskProfile.max_equity_allocation_pct}%</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Rebalance</p>
            <p className="text-2xl font-bold capitalize">
              {riskProfile.recommended_rebalance_frequency.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{prediction.ticker} Prediction</h2>
          <span className="text-slate-400 text-sm">as of {prediction.as_of_date}</span>
        </div>

        <div className={`border rounded-lg p-4 mb-6 ${signalColor[prediction.signal]}`}>
          <p className="text-sm opacity-80">Ensemble Signal</p>
          <p className="text-3xl font-bold">{prediction.signal}</p>
          <p className="text-sm mt-1">
            {(prediction.ensemble_probability_up * 100).toFixed(1)}% probability UP
          </p>
        </div>

        <h3 className="font-semibold mb-2">Individual Model Signals</h3>
        <div className="space-y-2 mb-6">
          {prediction.individual_models.map((m) => (
            <div key={m.model} className="flex justify-between bg-slate-900 rounded-lg px-4 py-2">
              <span>{m.model}</span>
              <span className="text-slate-300">
                {m.probability_up != null
                  ? `${(m.probability_up * 100).toFixed(1)}% UP`
                  : `${(m.predicted_return * 100).toFixed(2)}% predicted return`}
                <span className="text-slate-500 ml-2">(weight {(m.weight * 100).toFixed(0)}%)</span>
              </span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-2">SHAP — Top Contributing Factors</h3>
        <div className="space-y-2 mb-6">
          {prediction.top_shap_factors.map((f) => (
            <div key={f.feature} className="flex justify-between bg-slate-900 rounded-lg px-4 py-2 text-sm">
              <span>{f.feature} = {f.value}</span>
              <span className={f.shap_value > 0 ? "text-green-400" : "text-red-400"}>
                {f.direction} ({f.shap_value > 0 ? "+" : ""}{f.shap_value})
              </span>
            </div>
          ))}
        </div>

        <h3 className="font-semibold mb-2">LIME — Local Explanation</h3>
        <div className="space-y-2">
          {prediction.top_lime_factors.map((f, i) => (
            <div key={i} className="flex justify-between bg-slate-900 rounded-lg px-4 py-2 text-sm">
              <span>{f.condition}</span>
              <span className={f.weight > 0 ? "text-green-400" : "text-red-400"}>
                {f.direction} ({f.weight > 0 ? "+" : ""}{f.weight})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopPicksTab({ loading, error, data }) {
  if (loading) return <LoadingState message="Analyzing NIFTY 50 for top picks (30-60 seconds)..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState message="Click this tab to load top picks." />;

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">{data.note}</p>
      {data.top_picks.map((pick, i) => (
        <div key={pick.ticker} className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-slate-500">#{i + 1}</span>
              <span className="text-xl font-semibold">{pick.ticker}</span>
            </div>
            <span className="text-green-400 font-semibold text-lg">
              {(pick.probability_up * 100).toFixed(1)}% UP
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            Model agreement std: {pick.model_agreement}{" "}
            ({pick.model_agreement < 0.03 ? "high agreement" : "moderate agreement"})
          </p>
          <div className="space-y-1">
            {pick.top_reasons.map((r, j) => (
              <div key={j} className="flex justify-between bg-slate-900 rounded-lg px-3 py-2 text-sm">
                <span>{r.feature} = {r.value}</span>
                <span className={r.direction.includes("UP") ? "text-green-400" : "text-red-400"}>
                  {r.direction}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenerTab({ loading, error, data }) {
  if (loading) return <LoadingState message="Scanning NIFTY 50 (this takes 30-60 seconds)..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState message="Click this tab to load the screener." />;

  const signalColor = {
    BUY: "text-green-400",
    SELL: "text-red-400",
    HOLD: "text-yellow-400",
    ERROR: "text-slate-500",
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">NIFTY 50 Screener</h2>
      <p className="text-slate-400 text-sm mb-4">
        Ranked by pooled model probability of next-day UP move. TATAMOTORS.NS excluded (2025 demerger).
      </p>
      <div className="space-y-1">
        {data.map((stock) => (
          <div key={stock.ticker} className="flex justify-between items-center bg-slate-900 rounded-lg px-4 py-2">
            <span className="font-medium">{stock.ticker}</span>
            <div className="flex items-center gap-4">
              {stock.probability_up != null && (
                <span className="text-slate-400 text-sm">
                  {(stock.probability_up * 100).toFixed(1)}%
                </span>
              )}
              <span className={`font-semibold ${signalColor[stock.signal]}`}>{stock.signal}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FundsTab({ loading, error, data }) {
  if (loading) return <LoadingState message="Loading personalized fund recommendations..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState message="Click this tab to load recommendations." />;

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-1">Mutual Fund Recommendations</h2>
      <p className="text-slate-400 text-sm mb-4">
        Matched to your <span className="capitalize font-medium">{data.risk_category}</span> risk profile
        (fund tier: {data.matched_risk_tier})
      </p>
      <div className="space-y-2">
        {data.recommendations.map((fund, i) => (
          <div key={i} className="bg-slate-900 rounded-lg px-4 py-3">
            <p className="font-medium">{fund.scheme_name}</p>
            <div className="flex gap-4 text-sm text-slate-400 mt-1">
              <span>{fund.fund_type}</span>
              <span>{fund.amc}</span>
              {fund.return_3y != null && <span className="text-green-400">3Y: {fund.return_3y}%</span>}
              {fund.return_1y != null && <span>1Y: {fund.return_1y}%</span>}
              {fund.volatility != null && <span>Vol: {fund.volatility}%</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioTab({ loading, error, data }) {
  if (loading) return <LoadingState message="Loading portfolio recommendation..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState message="Click this tab to load your portfolio." />;

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-1">Portfolio Recommendation</h2>
      <p className="text-slate-400 text-sm mb-6">
        Strategy: <span className="font-medium">{data.strategy}</span> (matched to your{" "}
        <span className="capitalize">{data.risk_category}</span> risk profile)
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-slate-400 text-sm">Expected Return</p>
          <p className="text-2xl font-bold">{(data.expected_return * 100).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Volatility</p>
          <p className="text-2xl font-bold">{(data.volatility * 100).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-slate-400 text-sm">Sharpe Ratio</p>
          <p className="text-2xl font-bold">{data.sharpe_ratio.toFixed(3)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Asset Allocation</h3>
      <div className="space-y-2">
        {data.weights.map((w) => (
          <div key={w.asset} className="flex items-center gap-3">
            <span className="w-32 text-sm">{w.asset}</span>
            <div className="flex-1 bg-slate-900 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${w.weight * 100}%` }}
              />
            </div>
            <span className="w-14 text-right text-sm">{(w.weight * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}