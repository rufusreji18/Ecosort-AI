import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiMap,
  FiTrendingUp,
  FiAlertTriangle,
  FiTruck,
  FiActivity,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { useToast } from "../context/ToastContext";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/dashboard/admin");
      if (response.data.error) {
        addToast(response.data.error, "error");
      } else {
        setData(response.data);
      }
    } catch (e) {
      console.error(e);
      addToast("Failed to fetch admin dashboard telemetry", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-cyan-400 font-mono animate-pulse">
        Fetching System Telemetry...
      </div>
    );
  }

  const { metrics, bin_status, waste_trends, recent_alerts } = data || {};

  // Formatted data for Pie Chart
  const pieData = [
    { name: "Normal (0-50%)", value: bin_status?.normal || 0, color: "#10b981" },
    { name: "Warning (51-80%)", value: bin_status?.warning || 0, color: "#eab308" },
    { name: "Full (81-100%)", value: bin_status?.full || 0, color: "#ef4444" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          System Control Panel
        </h1>
        <p className="text-slate-400 mt-2">
          Real-time Smart Waste Management telemetry and node analytics
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all duration-300"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Users</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{metrics?.total_users}</h2>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-cyan-400 border border-slate-800">
            <FiUsers size={22} />
          </div>
        </div>

        {/* Total Smart Bins */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Smart Bins</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{metrics?.total_bins}</h2>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-emerald-400 border border-slate-800">
            <FiMap size={22} />
          </div>
        </div>

        {/* Total Classifications */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all duration-300"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">AI Scans</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{metrics?.total_scans}</h2>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-purple-400 border border-slate-800">
            <FiTrendingUp size={22} />
          </div>
        </div>

        {/* Full Bins */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-full blur-xl group-hover:bg-red-500/20 transition-all duration-300"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Bins</span>
            <h2 className={`text-3xl font-extrabold mt-2 ${metrics?.full_bins > 0 ? "text-red-400 animate-pulse" : "text-slate-100"}`}>
              {metrics?.full_bins}
            </h2>
          </div>
          <div className={`p-4 bg-slate-950 rounded-xl border border-slate-800 ${metrics?.full_bins > 0 ? "text-red-400 animate-bounce" : "text-slate-500"}`}>
            <FiAlertTriangle size={22} />
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-500/10 rounded-full blur-xl group-hover:bg-yellow-500/20 transition-all duration-300"></div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Tasks</span>
            <h2 className="text-3xl font-extrabold text-slate-100 mt-2">{metrics?.pending_requests}</h2>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl text-yellow-400 border border-slate-800">
            <FiTruck size={22} />
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Area Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <FiActivity className="text-cyan-400" /> AI Classification Trends (Last 7 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={waste_trends}>
                <defs>
                  <linearGradient id="colorRecyclable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNonRecyclable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
                <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#94a3b8" }}
                />
                <Legend />
                <Area type="monotone" dataKey="recyclable" stroke="#10b981" fillOpacity={1} fill="url(#colorRecyclable)" name="Recyclable" />
                <Area type="monotone" dataKey="non_recyclable" stroke="#ef4444" fillOpacity={1} fill="url(#colorNonRecyclable)" name="Non-Recyclable" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bin Capacity Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
            <FiMap className="text-emerald-400" /> Bin Fill-Level Ratios
          </h3>
          <div className="h-80 flex flex-col items-center justify-center">
            {metrics?.total_bins > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="flex justify-center gap-4 text-xs mt-2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-400">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm">No bins registered in system</p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Logging list */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <FiAlertTriangle className="text-red-400" /> Real-Time Critical Capacity Alerts
          </h3>
          <Link to="/bin-monitoring" className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors">
            Manage Nodes →
          </Link>
        </div>

        <div className="space-y-4">
          {recent_alerts && recent_alerts.length > 0 ? (
            recent_alerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-950 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center justify-between transition-all hover:bg-slate-900/40"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">
                      CRITICAL LEVEL
                    </span>
                    <span className="text-slate-500 text-xs">{alert.created_at}</span>
                  </div>
                  <p className="text-slate-300 text-sm font-semibold mt-2">{alert.message}</p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  NODE ID: <span className="text-cyan-400 font-bold">#{alert.bin_id}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-2xl">
              <span className="text-3xl">🌿</span>
              <p className="text-slate-500 text-sm mt-2 font-semibold">
                No capacity warnings. All smart bin registers are within bounds!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
