import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getQuestionnaire, updateProfile } from "../api/client";
import { Card, SectionHeading, MetricCard, Alert, Skeleton } from "../components/ui";

const inputClass =
  "w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-shadow";
const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

export default function SettingsPage() {
  const { profileId, riskProfile, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    getQuestionnaire(profileId)
      .then((data) => setForm(data))
      .catch(() => setError("Failed to load your current settings."))
      .finally(() => setLoading(false));
  }, [profileId]);

  const set = (field) => (e) => {
    const val = ["age", "q1_reaction_to_20pct_drop", "q2_investment_priority",
      "q4_income_stability", "q5_loss_tolerance_pct", "investment_horizon_years"]
      .includes(field)
      ? parseInt(e.target.value)
      : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateProfile(profileId, form);
      await refreshProfile(); // re-sync riskProfile in AuthContext
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (!profileId) return <Alert tone="warning">No profile found — complete onboarding first.</Alert>;
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (error && !form) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Account"
        title="Settings"
        subtitle="Update your investor profile and risk questionnaire. Changes recompute your risk score immediately."
      />

      {/* Current risk profile summary */}
      {riskProfile && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-3">Current Risk Profile</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Risk Score" value={riskProfile.risk_score} />
            <MetricCard label="Category" value={riskProfile.risk_category} tone="gold" />
            <MetricCard label="Max Equity" value={`${riskProfile.max_equity_allocation_pct}%`} />
            <MetricCard
              label="Rebalance"
              value={riskProfile.recommended_rebalance_frequency.replace("_", " ")}
            />
          </div>
        </div>
      )}

      {success && (
        <Alert tone="info">
          ✓ Profile updated successfully. Your risk score and recommendations have been recomputed.
        </Alert>
      )}
      {error && <Alert tone="error">{error}</Alert>}

      {form && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile details */}
          <Card>
            <p className="text-sm font-semibold text-gold-500 uppercase tracking-wide mb-4">
              Profile Details
            </p>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    min="18"
                    value={form.age ?? ""}
                    onChange={set("age")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Annual Income</label>
                  <select
                    value={form.annual_income_range ?? "5-10L"}
                    onChange={set("annual_income_range")}
                    className={inputClass}
                  >
                    <option value="<5L">Below ₹5L</option>
                    <option value="5-10L">₹5L – ₹10L</option>
                    <option value="10-25L">₹10L – ₹25L</option>
                    <option value="25L+">₹25L+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Investment Horizon —{" "}
                  <span className="text-gold-400">{form.investment_horizon_years} years</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={form.investment_horizon_years ?? 5}
                  onChange={set("investment_horizon_years")}
                  className="w-full accent-gold-500"
                />
              </div>

              <div>
                <label className={labelClass}>Investment Goal</label>
                <select
                  value={form.investment_goal ?? "wealth_growth"}
                  onChange={set("investment_goal")}
                  className={inputClass}
                >
                  <option value="wealth_growth">Wealth Growth</option>
                  <option value="retirement">Retirement</option>
                  <option value="short_term_gains">Short-Term Gains</option>
                  <option value="capital_preservation">Capital Preservation</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Investment Experience</label>
                <select
                  value={form.existing_investment_experience ?? "beginner"}
                  onChange={set("existing_investment_experience")}
                  className={inputClass}
                >
                  <option value="none">None</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="experienced">Experienced</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Risk questionnaire */}
          <Card>
            <p className="text-sm font-semibold text-gold-500 uppercase tracking-wide mb-4">
              Risk Questionnaire
            </p>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>If your portfolio dropped 20% in a month, you would:</label>
                <select
                  value={form.q1_reaction_to_20pct_drop ?? 3}
                  onChange={set("q1_reaction_to_20pct_drop")}
                  className={inputClass}
                >
                  <option value={1}>Sell everything immediately</option>
                  <option value={2}>Sell some, keep some</option>
                  <option value={3}>Hold and wait it out</option>
                  <option value={4}>Buy a little more</option>
                  <option value={5}>Buy significantly more</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Your investment priority is:</label>
                <select
                  value={form.q2_investment_priority ?? 3}
                  onChange={set("q2_investment_priority")}
                  className={inputClass}
                >
                  <option value={1}>Maximum safety, minimal growth</option>
                  <option value={2}>Mostly safety, some growth</option>
                  <option value={3}>Balanced</option>
                  <option value={4}>Mostly growth, some safety</option>
                  <option value={5}>Maximum growth</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Your income stability is:</label>
                <select
                  value={form.q4_income_stability ?? 3}
                  onChange={set("q4_income_stability")}
                  className={inputClass}
                >
                  <option value={1}>Very unstable</option>
                  <option value={2}>Somewhat unstable</option>
                  <option value={3}>Moderate</option>
                  <option value={4}>Stable</option>
                  <option value={5}>Very stable</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Maximum loss you&apos;d tolerate in a year —{" "}
                  <span className="text-gold-400">{form.q5_loss_tolerance_pct ?? 10}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={form.q5_loss_tolerance_pct ?? 10}
                  onChange={set("q5_loss_tolerance_pct")}
                  className="w-full accent-gold-500"
                />
              </div>
            </div>
          </Card>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-navy-600 disabled:text-slate-400 disabled:cursor-not-allowed text-navy-950 font-semibold rounded-lg px-4 py-3.5 transition-colors"
          >
            {saving ? "Saving changes…" : "Save & Recompute Risk Profile"}
          </button>
        </form>
      )}
    </div>
  );
}
