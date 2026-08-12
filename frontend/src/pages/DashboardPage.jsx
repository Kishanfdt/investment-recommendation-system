import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPrediction } from "../api/client";
import apiClient from "../api/client";

export default function DashboardPage() {
  const { profileId } = useParams();
  const [riskProfile, setRiskProfile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const riskRes = await apiClient.get(`/profile/${profileId}/risk`);
        setRiskProfile(riskRes.data);

        const predRes = await getPrediction("TCS.NS");
        setPrediction(predRes);
      } catch (err) {
        setError("Failed to load dashboard. Check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [profileId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <p className="text-slate-400">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  const signalColor = {
    BUY: "bg-green-900/50 border-green-700 text-green-200",
    SELL: "bg-red-900/50 border-red-700 text-red-200",
    HOLD: "bg-yellow-900/50 border-yellow-700 text-yellow-200",
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
      <h1 className="text-3xl font-bold">Your Investment Dashboard</h1>

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

        <h3 className="font-semibold mb-2">Why — Top Contributing Factors</h3>
        <div className="space-y-2">
          {prediction.top_shap_factors.map((f) => (
            <div key={f.feature} className="flex justify-between bg-slate-900 rounded-lg px-4 py-2 text-sm">
              <span>{f.feature} = {f.value}</span>
              <span className={f.shap_value > 0 ? "text-green-400" : "text-red-400"}>
                {f.direction} ({f.shap_value > 0 ? "+" : ""}{f.shap_value})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-200 rounded-lg p-4 text-sm">
        <strong>Important:</strong> backtesting shows near-random directional accuracy
        (~48-50%) and a poorly calibrated confidence score. This is an educational
        demonstration, not investment advice.
      </div>
    </div>
  );
}