import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, Alert } from "../components/ui";

export default function LoginPage() {
  const { signIn, profileId } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const inputClass =
    "w-full bg-navy-900 border border-navy-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-shadow";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1.5";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // Auth context will resolve profileId via onAuthStateChange.
      // Give it a brief moment, then route based on whether profile exists.
      // We navigate to /dashboard — OverviewPage will show a prompt if no profile.
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Sign in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-3">
            AI Investment System
          </p>
          <h1 className="font-serif text-4xl text-white mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
        </div>

        <Card>
          {error && (
            <div className="mb-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-navy-600 disabled:text-slate-400 disabled:cursor-not-allowed text-navy-950 font-semibold rounded-lg px-4 py-3.5 transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </Card>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-gold-400 hover:text-gold-300 transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
