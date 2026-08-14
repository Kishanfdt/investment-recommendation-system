import { useEffect, useState } from "react";
import { getPrediction } from "../api/client";
import {
  Card, SectionHeading, Badge, SignalBadge, Alert, Skeleton,
} from "../components/ui";
import ExplainabilityGuide from "../components/ExplainabilityGuide";
import PageGuide, { GuideSection, GuideCallout } from "../components/PageGuide";

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-48" />
    </div>
  );
}

export default function PredictionPage() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPrediction("TCS.NS")
      .then(setPrediction)
      .catch(() => setError("Failed to load prediction. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <Alert tone="error">{error}</Alert>;

  const signalColorMap = { BUY: "emerald", SELL: "rose", HOLD: "gold" };
  const color = signalColorMap[prediction.signal] ?? "gold";

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={`As of ${prediction.as_of_date}`}
        title={`${prediction.ticker} Prediction`}
        subtitle="Ensemble of Random Forest, XGBoost, LightGBM, and LSTM"
      />

      {/* Beginner guide */}
      <PageGuide title="How to read this prediction">
        <GuideSection title="What is 'ensemble probability'?">
          Four separate ML models — Random Forest, XGBoost, LightGBM, and an LSTM neural network
          — each make an independent prediction for tomorrow&apos;s price direction. Their outputs
          are combined (weighted average) into a single probability. This is called an ensemble
          because no single model is trusted alone.
        </GuideSection>
        <GuideSection title="What do BUY / SELL / HOLD mean?">
          BUY = the ensemble gives &gt;55% probability of upward movement. SELL = &lt;45%.
          HOLD = anywhere in between — the models disagree or the signal is too weak to act on.
        </GuideSection>
        <GuideSection title="Why 4 models instead of 1?">
          Each model has different blind spots. Tree-based models (Random Forest, XGBoost, LightGBM)
          are strong on structured patterns; the LSTM captures longer-term momentum. When they
          agree, the signal is more reliable. When they disagree, HOLD reflects honest uncertainty.
        </GuideSection>
        <GuideCallout label="Accuracy notice:">
          This system&apos;s validated next-day accuracy is 48–53% — closer to a coin flip than a
          crystal ball. That&apos;s not a bug: it reflects how genuinely difficult short-term stock
          prediction is. The value here is in transparency and explainability, not in claiming
          false precision. Always treat signals as one data point among many.
        </GuideCallout>
      </PageGuide>

      {/* Main signal */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-400 text-sm">Ensemble Signal</p>
          <SignalBadge signal={prediction.signal} />
        </div>
        <p className={`text-4xl font-serif font-semibold text-${color}-400`}>
          {(prediction.ensemble_probability_up * 100).toFixed(1)}%
        </p>
        <p className="text-slate-500 text-sm mt-1">probability of upward movement</p>
      </Card>

      {/* Individual models */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-2">Individual Model Signals</p>
        <div className="space-y-2">
          {prediction.individual_models.map((m) => (
            <div
              key={m.model}
              className="flex justify-between items-center bg-navy-900 border border-navy-600 rounded-lg px-4 py-3"
            >
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
      </div>

      {/* SHAP + LIME explainability */}
      <ExplainabilityGuide />

      <div className="grid md:grid-cols-2 gap-6">
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

      <Alert tone="warning">
        <strong className="text-gold-400">Educational only:</strong> next-day accuracy is ~48–53%.
        Not investment advice.
      </Alert>
    </div>
  );
}
