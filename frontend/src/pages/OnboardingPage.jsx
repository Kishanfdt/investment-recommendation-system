import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { onboardInvestor } from "../api/client";

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

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Investor Onboarding</h1>
      <p className="text-slate-400 mb-8">
        Tell us about yourself so we can personalize your recommendations.
      </p>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              min="18"
              required
              value={form.age}
              onChange={(e) => handleChange("age", parseInt(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Annual Income</label>
            <select
              value={form.annual_income_range}
              onChange={(e) => handleChange("annual_income_range", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="<5L">Below ₹5L</option>
              <option value="5-10L">₹5L - ₹10L</option>
              <option value="10-25L">₹10L - ₹25L</option>
              <option value="25L+">₹25L+</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Investment Horizon: {form.investment_horizon_years} years
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={form.investment_horizon_years}
            onChange={(e) => handleChange("investment_horizon_years", parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Investment Goal</label>
          <select
            value={form.investment_goal}
            onChange={(e) => handleChange("investment_goal", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="wealth_growth">Wealth Growth</option>
            <option value="retirement">Retirement</option>
            <option value="short_term_gains">Short-Term Gains</option>
            <option value="capital_preservation">Capital Preservation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Investment Experience</label>
          <select
            value={form.existing_investment_experience}
            onChange={(e) => handleChange("existing_investment_experience", e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="experienced">Experienced</option>
          </select>
        </div>

        <hr className="border-slate-700" />
        <h2 className="text-xl font-semibold">Risk Questionnaire</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            If your portfolio dropped 20% in a month, you would:
          </label>
          <select
            value={form.q1_reaction_to_20pct_drop}
            onChange={(e) => handleChange("q1_reaction_to_20pct_drop", parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Sell everything immediately</option>
            <option value={2}>Sell some, keep some</option>
            <option value={3}>Hold and wait it out</option>
            <option value={4}>Buy a little more</option>
            <option value={5}>Buy significantly more</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Your priority is:</label>
          <select
            value={form.q2_investment_priority}
            onChange={(e) => handleChange("q2_investment_priority", parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Maximum safety, minimal growth</option>
            <option value={2}>Mostly safety, some growth</option>
            <option value={3}>Balanced</option>
            <option value={4}>Mostly growth, some safety</option>
            <option value={5}>Maximum growth</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Your income is:</label>
          <select
            value={form.q4_income_stability}
            onChange={(e) => handleChange("q4_income_stability", parseInt(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>Very unstable</option>
            <option value={2}>Somewhat unstable</option>
            <option value={3}>Moderate</option>
            <option value={4}>Stable</option>
            <option value={5}>Very stable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Maximum loss you'd tolerate in a year: {form.q5_loss_tolerance_pct}%
          </label>
          <input
            type="range"
            min="0"
            max="30"
            step="5"
            value={form.q5_loss_tolerance_pct}
            onChange={(e) => handleChange("q5_loss_tolerance_pct", parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg px-4 py-3 font-semibold transition-colors"
        >
          {loading ? "Creating your profile..." : "Get My Risk Profile"}
        </button>
      </form>
    </div>
  );
}