import { useState } from "react";
import { Card } from "./ui";

export default function ExplainabilityGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="!bg-navy-900/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-1">
            Understanding this page
          </p>
          <h3 className="font-serif text-lg text-white">How to read SHAP and LIME</h3>
        </div>
        <span className="text-slate-400 text-xl">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-5 text-sm text-slate-300 leading-relaxed">
          <div>
            <p className="font-semibold text-white mb-1">The short version</p>
            <p>
              The model doesn't just say "BUY" or "SELL" — it also shows you{" "}
              <em>why</em>. Two independent methods, SHAP and LIME, each look at the same
              prediction from a different angle and tell you which factors mattered most.
              When both agree, that's a stronger signal than either alone.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white mb-1">SHAP — "How much did each factor push the price?"</p>
            <p>
              SHAP works directly inside the model's decision tree. For every factor
              (like RSI, MACD, or trading volume), it calculates an exact number showing
              how much that factor pushed the prediction toward UP or DOWN, compared to
              an average day. Think of it like a detailed receipt: the final prediction
              is the sum of every factor's individual contribution.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white mb-1">LIME — "What would need to be true for this to flip?"</p>
            <p>
              LIME works differently: it doesn't look inside the model at all. Instead,
              it nudges the input data slightly in many directions and watches how the
              prediction changes, then summarizes the pattern as simple conditions — like
              "RSI above 65 → pushes toward UP." It's model-agnostic, meaning it would work
              the same way even on a completely different type of model.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white mb-1">Why show both?</p>
            <p>
              SHAP is precise but tied to this specific model's internal structure. LIME
              is more approximate but independently verifies the same conclusion from
              the outside. Two different techniques landing on the same answer is more
              trustworthy than either one alone — that's the whole point of explainable AI.
            </p>
          </div>

          <div className="bg-navy-800 border border-navy-600 rounded-lg p-3">
            <p className="text-xs text-slate-400">
              <span className="text-gold-400 font-medium">Important caveat:</span> explaining{" "}
              <em>why</em> a model made a prediction is not the same as the prediction being{" "}
              <em>correct</em>. This system's validated accuracy for next-day direction is
              close to 50% — see the Model Performance notice for details.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}