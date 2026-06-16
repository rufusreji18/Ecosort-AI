import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  FiHome,
  FiCamera,
  FiBarChart2,
  FiClock,
  FiAward,
  FiBookOpen,
  FiSettings,
  FiLogOut,
  FiLogIn,
  FiUserPlus,
  FiMap,
  FiTruck,
  FiMenu,
  FiX
} from "react-icons/fi";

export default function Navigation() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  // Nav link class helper
  const linkClass = (path) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm
    ${isActive(path) 
      ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border-l-4 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:translate-x-1"
    }
  `;

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 flex items-center justify-between z-50">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          <span className="text-xl">♻️</span> EcoSort-AI
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-slate-400 hover:text-slate-200 focus:outline-none"
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <nav className={`
        fixed md:sticky top-0 md:top-6 bottom-0 md:bottom-auto left-0 md:left-auto w-64 md:h-[calc(100vh-48px)] bg-slate-950/95 md:bg-slate-950/40 border-r md:border border-slate-900/80 md:rounded-2xl p-6 flex flex-col justify-between z-40 transition-transform duration-300 md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        ${isOpen ? "top-16" : "top-0"}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <Link to="/" className="hidden md:flex items-center gap-3 font-extrabold text-2xl tracking-wider bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent transition-all hover:scale-[1.02]">
            <span className="text-3xl">♻️</span> EcoSort-AI
          </Link>

          {/* User Info Card */}
          {isAuthenticated && user && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-1 shadow-inner relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Session</span>
              <span className="text-slate-200 font-bold text-base truncate">{user.username}</span>
              <div className="flex items-center mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isAdmin 
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-1">Core</span>
            
            <Link to="/" className={linkClass("/")} onClick={() => setIsOpen(false)}>
              <FiHome size={18} />
              <span>Home</span>
            </Link>

            {/* Public or Common Protected Routes */}
            {isAuthenticated ? (
              <>
                {/* Standard User Links */}
                {!isAdmin && (
                  <>
                    <Link to="/predict" className={linkClass("/predict")} onClick={() => setIsOpen(false)}>
                      <FiCamera size={18} />
                      <span>Classify Waste</span>
                    </Link>
                    <Link to="/dashboard" className={linkClass("/dashboard")} onClick={() => setIsOpen(false)}>
                      <FiBarChart2 size={18} />
                      <span>User Dashboard</span>
                    </Link>
                    <Link to="/history" className={linkClass("/history")} onClick={() => setIsOpen(false)}>
                      <FiClock size={18} />
                      <span>Scan History</span>
                    </Link>
                    <Link to="/achievements" className={linkClass("/achievements")} onClick={() => setIsOpen(false)}>
                      <FiAward size={18} />
                      <span>Achievements</span>
                    </Link>
                  </>
                )}

                {/* Shared Link */}
                <Link to="/recycling-tips" className={linkClass("/recycling-tips")} onClick={() => setIsOpen(false)}>
                  <FiBookOpen size={18} />
                  <span>{isAdmin ? "Manage Tips" : "Education & Tips"}</span>
                </Link>

                {/* Admin Only Links */}
                {isAdmin && (
                  <>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mt-4 mb-1">Admin Panel</span>
                    <Link to="/admin-dashboard" className={linkClass("/admin-dashboard")} onClick={() => setIsOpen(false)}>
                      <FiBarChart2 size={18} />
                      <span>Admin Overview</span>
                    </Link>
                    <Link to="/bin-monitoring" className={linkClass("/bin-monitoring")} onClick={() => setIsOpen(false)}>
                      <FiMap size={18} />
                      <span>Bin Monitoring</span>
                    </Link>
                    <Link to="/collection-requests" className={linkClass("/collection-requests")} onClick={() => setIsOpen(false)}>
                      <FiTruck size={18} />
                      <span>Collection Logs</span>
                    </Link>
                  </>
                )}

                {/* Reports / Tools Shared Link */}
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mt-4 mb-1">Management</span>
                <Link to="/reports" className={linkClass("/reports")} onClick={() => setIsOpen(false)}>
                  <FiSettings size={18} />
                  <span>Export Reports</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className={linkClass("/login")} onClick={() => setIsOpen(false)}>
                  <FiLogIn size={18} />
                  <span>Sign In</span>
                </Link>
                <Link to="/register" className={linkClass("/register")} onClick={() => setIsOpen(false)}>
                  <FiUserPlus size={18} />
                  <span>Create Account</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {isAuthenticated && (
          <div className="border-t border-slate-900 pt-4">
            <button 
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 font-semibold text-sm"
            >
              <FiLogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </nav>
      {/* Spacer for mobile menu height */}
      <div className="h-16 md:hidden"></div>
    </>
  );
}
