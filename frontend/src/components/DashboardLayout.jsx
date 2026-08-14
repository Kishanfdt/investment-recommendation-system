import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: "⬡", end: true },
  { to: "/dashboard/prediction", label: "Prediction", icon: "◎" },
  { to: "/dashboard/top-picks", label: "Top Picks", icon: "★" },
  { to: "/dashboard/screener", label: "NIFTY 50 Screener", icon: "⊞" },
  { to: "/dashboard/mutual-funds", label: "Mutual Funds", icon: "◈" },
  { to: "/dashboard/portfolio", label: "Portfolio", icon: "◑" },
  { to: "/dashboard/performance", label: "Performance", icon: "↗" },
];

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 bg-navy-900 border-r border-navy-700 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-navy-700">
          <p className="text-gold-500 text-xs font-semibold tracking-widest uppercase mb-0.5">
            AI Invest
          </p>
          <h1 className="font-serif text-xl text-white leading-tight">
            Recommendation<br />System
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-navy-800 text-gold-400 border-l-2 border-gold-500 pl-[10px]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-navy-800/50"
                }`
              }
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          <div className="pt-3 border-t border-navy-700 mt-3">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-navy-800 text-gold-400 border-l-2 border-gold-500 pl-[10px]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-navy-800/50"
                }`
              }
            >
              <span className="text-base leading-none">⚙</span>
              Settings
            </NavLink>
          </div>
        </nav>

        {/* User + sign out */}
        <div className="px-4 py-4 border-t border-navy-700">
          {user && (
            <p className="text-xs text-slate-500 truncate mb-3">{user.email}</p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-lg hover:bg-navy-800/50 flex items-center gap-2"
          >
            <span>⇥</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto py-10 px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
