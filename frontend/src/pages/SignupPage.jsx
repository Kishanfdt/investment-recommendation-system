import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, Alert } from "../components/ui";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputClass =
    "w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-shadow";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUp(form.email, form.password, form.full_name);
      // After sign-up, Supabase may require email confirmation depending on project settings.
      // If email confirmation is disabled (common for dev), session is active immediately.
      navigate("/onboarding");
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-3">
            AI Investment System
          </p>
          <h1 className="font-serif text-4xl text-white mb-2">Create account</h1>
          <p className="text-slate-400 text-sm">Get personalised investment recommendations</p>
        </div>

        <Card>
          {error && (
            <div className="mb-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={set("full_name")}
                className={inputClass}
                placeholder="Arjun Sharma"
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                className={inputClass}
                placeholder="Min. 6 characters"
              />
            </div>

            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={form.confirm}
                onChange={set("confirm")}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-navy-600 disabled:text-slate-400 disabled:cursor-not-allowed text-navy-950 font-semibold rounded-lg px-4 py-3.5 transition-colors"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-gold-400 hover:text-gold-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
