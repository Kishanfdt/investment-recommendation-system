import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OnboardingPage from "./pages/OnboardingPage";
import OverviewPage from "./pages/OverviewPage";
import PredictionPage from "./pages/PredictionPage";
import TopPicksPage from "./pages/TopPicksPage";
import ScreenerPage from "./pages/ScreenerPage";
import MutualFundsPage from "./pages/MutualFundsPage";
import PortfolioPage from "./pages/PortfolioPage";
import PerformancePage from "./pages/PerformancePage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-navy-950 text-white font-sans">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Onboarding — protected (must be logged in, but no profile yet) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Dashboard — protected, persistent sidebar layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="prediction" element={<PredictionPage />} />
              <Route path="top-picks" element={<TopPicksPage />} />
              <Route path="screener" element={<ScreenerPage />} />
              <Route path="mutual-funds" element={<MutualFundsPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="performance" element={<PerformancePage />} />
            </Route>

            {/* Settings — inside the sidebar layout */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SettingsPage />} />
            </Route>

            {/* Legacy redirect — old /dashboard/:profileId links */}
            <Route path="/dashboard/:profileId" element={<Navigate to="/dashboard" replace />} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;