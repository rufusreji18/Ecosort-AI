import { useState, useEffect } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiCheck,
  FiX,
  FiAward,
  FiActivity,
  FiGlobe,
} from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchUserDashboard();
  }, []);

  const fetchUserDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/dashboard/user");
      if (response.data.error) {
        addToast(response.data.error, "error");
      } else {
        setData(response.data);
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to fetch user stats", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-cyan-400 font-mono animate-pulse">
        Retrieving Eco Profile...
      </div>
    );
  }

  const { username, points, scans, impact, achievements, recent_history } = data || {};
  const totalScans = scans?.total || 0;
  const recyclableCount = scans?.recyclable || 0;
  const nonRecyclableCount = scans?.non_recyclable || 0;

  const pieData = [
    { name: "Recyclable", value: recyclableCount },
    { name: "Non-Recyclable", value: nonRecyclableCount },
  ];

  const barData = [
    {
      name: "Items",
      recyclable: recyclableCount,
      nonRecyclable: nonRecyclableCount,
    },
  ];

  const recyclablePercentage =
    totalScans > 0 ? ((recyclableCount / totalScans) * 100).toFixed(1) : 0;
  const nonRecyclablePercentage =
    totalScans > 0 ? ((nonRecyclableCount / totalScans) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Welcome back, {username}!
          </h1>
          <p className="text-slate-400 mt-2">
            Track your personal sorting metrics and carbon saving index
          </p>
        </div>
        <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
          <span className="text-2xl">⚡</span>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Score Balance</span>
            <span className="text-xl font-black text-cyan-400">{points} PTS</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Scans</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{totalScans}</h2>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-cyan-400 border border-slate-800">
            <FiTrendingUp size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Recyclable</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{recyclableCount}</h2>
            <span className="text-emerald-400 text-xs font-bold mt-1 inline-block">{recyclablePercentage}% Rate</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-emerald-400 border border-slate-800">
            <FiCheck size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-full blur-xl"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Non-Recyclable</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{nonRecyclableCount}</h2>
            <span className="text-red-400 text-xs font-bold mt-1 inline-block">{nonRecyclablePercentage}% Rate</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-red-400 border border-slate-800">
            <FiX size={22} />
          </div>
        </div>
      </div>

      {/* Environmental Impact Widgets */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          <FiGlobe className="text-emerald-400" /> Carbon Saving Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex items-center gap-4">
            <span className="text-4xl">🍃</span>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">CO2 Emissions Saved</span>
              <span className="text-2xl font-black text-emerald-400">{impact?.co2_saved_kg} kg CO₂</span>
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex items-center gap-4">
            <span className="text-4xl">🌳</span>
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Tree Equivalents Saved</span>
              <span className="text-2xl font-black text-emerald-400">{impact?.trees_saved} Trees</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <FiPieChart className="text-cyan-400" /> Waste Distribution
          </h3>
          {totalScans > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center border border-dashed border-slate-850 rounded-2xl">
              <p className="text-slate-500 text-sm">No classifications logged in system</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <FiBarChart2 className="text-cyan-400" /> Waste Comparison
          </h3>
          {totalScans > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="recyclable" fill="#10b981" radius={[6, 6, 0, 0]} name="Recyclable" />
                  <Bar dataKey="nonRecyclable" fill="#ef4444" radius={[6, 6, 0, 0]} name="Non-Recyclable" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center border border-dashed border-slate-850 rounded-2xl">
              <p className="text-slate-500 text-sm">No classifications logged in system</p>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Achievements Milestone List */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
        <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
          <FiAward className="text-cyan-400" /> Milestone Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {achievements &&
            achievements.map((ach) => (
              <div
                key={ach.id}
                className={`border p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden transition-all duration-300 ${
                  ach.unlocked
                    ? "bg-slate-950 border-emerald-500/20 text-slate-100 shadow-md"
                    : "bg-slate-950/40 border-slate-850 text-slate-500 opacity-60"
                }`}
              >
                <div className="text-4xl">{ach.badge_icon}</div>
                <div>
                  <h4 className="font-extrabold text-sm">{ach.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{ach.description}</p>
                  <span className="text-[9px] font-bold text-slate-500 mt-2 block">
                    REQUIRES {ach.points_required} PTS
                  </span>
                </div>
                {ach.unlocked && (
                  <span className="absolute top-2 right-2 text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    UNLOCKED
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
