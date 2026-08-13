import { BrowserRouter, Routes, Route } from "react-router-dom";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-navy-950 text-white font-sans">
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/dashboard/:profileId" element={<DashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;