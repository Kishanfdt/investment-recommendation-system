import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { onboardInvestor } from "../api/client";
import { Card, Alert } from "../components/ui";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    age: 25,
    annual_income_range: "5-10L",
    investment_horizon_years: 5,
    investment_goal: "wealth_growth",
    existing_investment_experience: "beginner",
    q1_reaction_to_20pct_drop: 3,
    q2_investment_priority: 3,
    q4_income_stability: 3,
    q5_loss_tolerance_pct: 10,
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await onboardInvestor(form);
      navigate(`/dashboard/${result.profile_id}`);
    } catch (err) {
      setError(
        err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : "Something went wrong. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-shadow";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-2">
        Get Started
      </p>
      <h1 className="font-serif text-4xl text-white mb-2">Investor Onboarding</h1>
      <p className="text-slate-400 mb-10">
        A few questions help us personalize every recommendation to your risk tolerance.
      </p>

      {error && <Alert tone="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-8 mt-6">
        <Card>
          <p className="text-sm font-semibold text-gold-500 uppercase tracking-wide mb-4">
            About You
          </p>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Age</label>
                <input
                  type="number"
                  min="18"
                  required
                  value={form.age}
                  onChange={(e) => handleChange("age", parseInt(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Annual Income</label>
                <select
                  value={form.annual_income_range}
                  onChange={(e) => handleChange("annual_income_range", e.target.value)}
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
                Investment Horizon — <span className="text-gold-400">{form.investment_horizon_years} years</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={form.investment_horizon_years}
                onChange={(e) => handleChange("investment_horizon_years", parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>

            <div>
              <label className={labelClass}>Investment Goal</label>
              <select
                value={form.investment_goal}
                onChange={(e) => handleChange("investment_goal", e.target.value)}
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
                value={form.existing_investment_experience}
                onChange={(e) => handleChange("existing_investment_experience", e.target.value)}
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

        <Card>
          <p className="text-sm font-semibold text-gold-500 uppercase tracking-wide mb-4">
            Risk Questionnaire
          </p>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>If your portfolio dropped 20% in a month, you would:</label>
              <select
                value={form.q1_reaction_to_20pct_drop}
                onChange={(e) => handleChange("q1_reaction_to_20pct_drop", parseInt(e.target.value))}
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
              <label className={labelClass}>Your priority is:</label>
              <select
                value={form.q2_investment_priority}
                onChange={(e) => handleChange("q2_investment_priority", parseInt(e.target.value))}
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
              <label className={labelClass}>Your income is:</label>
              <select
                value={form.q4_income_stability}
                onChange={(e) => handleChange("q4_income_stability", parseInt(e.target.value))}
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
                Maximum loss you'd tolerate in a year — <span className="text-gold-400">{form.q5_loss_tolerance_pct}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={form.q5_loss_tolerance_pct}
                onChange={(e) => handleChange("q5_loss_tolerance_pct", parseInt(e.target.value))}
                className="w-full accent-gold-500"
              />
            </div>
          </div>
        </Card>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-navy-600 disabled:text-slate-400 disabled:cursor-not-allowed text-navy-950 font-semibold rounded-lg px-4 py-3.5 transition-colors"
        >
          {loading ? "Creating your profile..." : "Get My Risk Profile"}
        </button>
      </form>
    </div>
  );
}