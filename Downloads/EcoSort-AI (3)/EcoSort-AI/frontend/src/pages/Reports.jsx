import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { FiDownload, FiFileText, FiDatabase, FiGrid } from "react-icons/fi";

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const handleExport = async (type) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/api/reports/export?report_type=${type}`);
      
      if (response.data.error) {
        addToast(response.data.error, "error");
        return;
      }

      const { data, format, report_type } = response.data;
      
      // Download utility using Blob
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `${report_type}_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      addToast(`Successfully exported ${report_type} in CSV format!`, "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to compile and download report", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Reports & Data Export
        </h1>
        <p className="text-slate-400 mt-2">
          Compile logs, map registers, and classification data sheets into downloadable documents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Card */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-lg relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-300"></div>
          <div className="flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl w-fit text-cyan-400 border border-slate-850">
                <FiFileText size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Personal Classification Sheet</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generates a complete historic record of your personal AI classifications, including file names, confidence intervals, categorization results, and logging timestamps.
              </p>
            </div>
            <button
              onClick={() => handleExport("user_history")}
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all"
            >
              <FiDownload size={18} /> Export Scan Logs (CSV)
            </button>
          </div>
        </div>

        {/* Admin Card */}
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-lg relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300"></div>
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-2xl w-fit text-emerald-400 border border-slate-850">
                  <FiDatabase size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-100">Smart Bins Coordinate Sheet</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Extracts an administrator data sheet containing all registered Smart Dustbin coordinates, location labels, current fill-level capacities, operational statuses, and last-updated times.
                </p>
              </div>
              <button
                onClick={() => handleExport("admin_bins")}
                disabled={loading}
                className="mt-8 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all"
              >
                <FiDownload size={18} /> Export Bins Directory (CSV)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Specs Info */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <FiGrid className="text-cyan-400" /> Export Metadata Schema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
          <div className="space-y-2">
            <span className="font-bold text-slate-300">Format:</span>
            <p>Comma Separated Values (.csv)</p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-slate-300">Encoding:</span>
            <p>UTF-8 Unicode</p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-slate-300">Compatibility:</span>
            <p>Excel, Google Sheets, Pandas, R studio, etc.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
