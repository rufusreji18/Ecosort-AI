import { useState, useEffect } from "react";
import axios from "axios";
import { FiClock, FiCheck, FiX, FiSearch, FiSliders } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import "../styles/History.css";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/history");
      if (response.data.error) {
        addToast(response.data.error, "error");
      } else {
        setHistory(response.data);
      }
    } catch (e) {
      addToast("Failed to fetch historical classification logs", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter and Search handler
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === "All" ||
      (filterType === "Recyclable" && item.prediction === "Recyclable") ||
      (filterType === "Non-Recyclable" && item.prediction === "Non-Recyclable");
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-cyan-400 font-mono animate-pulse">
        Accessing Classification Archives...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Classification Archive
          </h1>
          <p className="text-slate-400 mt-2">
            Verify details of all your previous waste classification outputs
          </p>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          Refresh Archive
        </button>
      </div>

      {/* Search and Filters Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-md">
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <FiSearch size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 outline-none transition-all text-sm font-semibold"
            placeholder="Search filenames..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <FiSliders /> Filter
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full md:w-44 bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded-xl py-2.5 px-3 text-slate-200 outline-none transition-all text-sm font-semibold cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Recyclable">Recyclable</option>
            <option value="Non-Recyclable">Non-Recyclable</option>
          </select>
        </div>
      </div>

      {/* History Items list */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item, index) => (
            <div
              key={index}
              className={`bg-slate-900 border p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:border-cyan-500/20 shadow-md ${
                item.prediction === "Recyclable"
                  ? "border-emerald-500/10 hover:border-emerald-500/20"
                  : "border-red-500/10 hover:border-red-500/20"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl p-3 bg-slate-950 border border-slate-850 rounded-xl">
                  {item.prediction === "Recyclable" ? "♻️" : "🚫"}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-200 max-w-xs md:max-w-md truncate" title={item.filename}>
                    {item.filename.split("_").slice(1).join("_") || item.filename}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-500 text-xs font-mono">{item.created_at}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Source: {item.source}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Confidence */}
              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block text-right md:text-right">
                    Confidence
                  </span>
                  <span className="font-black font-mono text-cyan-400 text-base">
                    {(item.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold ${
                  item.prediction === "Recyclable"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {item.prediction === "Recyclable" ? <FiCheck size={14} /> : <FiX size={14} />}
                  {item.prediction}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-850 rounded-3xl bg-slate-900/40">
            <span className="text-4xl">📋</span>
            <h3 className="text-slate-400 font-bold mt-2">No archived records found</h3>
            <p className="text-slate-500 text-sm mt-1">
              Your filtered criteria matched no historical scans. Try adjusting filters or search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
