import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { FiBookOpen, FiPlus, FiTag, FiFileText } from "react-icons/fi";

export default function RecyclingTips() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  // New Tip Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/recycling-tips");
      if (response.data.error) {
        addToast(response.data.error, "error");
      } else {
        setTips(response.data);
      }
    } catch (e) {
      addToast("Failed to retrieve recycling education database", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !category) {
      addToast("Please fill in all fields", "warning");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post("http://127.0.0.1:8000/api/recycling-tips", {
        title,
        content,
        category,
      });
      addToast("Recycling education tip saved successfully", "success");
      setTitle("");
      setContent("");
      setCategory("General");
      fetchTips();
    } catch (err) {
      addToast("Failed to save recycling tip", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-cyan-400 font-mono animate-pulse">
        Accessing Segregation Guidelines...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Recycling & Segregation Guide
        </h1>
        <p className="text-slate-400 mt-2">
          Learn how to sort waste responsibly and protect local ecosystems
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tips Listing */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <FiBookOpen className="text-cyan-400" /> Educational Articles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tips.length > 0 ? (
              tips.map((tip) => (
                <div
                  key={tip.id}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.01]"
                >
                  <div className="space-y-3">
                    <span className="inline-block text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {tip.category}
                    </span>
                    <h4 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                      {tip.title}
                    </h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{tip.content}</p>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono mt-4 pt-3 border-t border-slate-800">
                    ADDED ON: {tip.created_at.split(" ")[0]}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 border border-dashed border-slate-800 rounded-3xl text-slate-500 font-semibold">
                No recycling guides found. Check back later!
              </div>
            )}
          </div>
        </div>

        {/* Admin Form Column */}
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg h-fit">
            <h3 className="text-lg font-bold text-slate-200 mb-6 flex items-center gap-2">
              <FiPlus className="text-emerald-400" /> Create Guideline Tip
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tip Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <FiTag size={18} />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-700 outline-none transition-all text-sm font-semibold"
                    placeholder="e.g. Wash Plastic Bottles"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-3 text-slate-200 outline-none transition-all text-sm font-semibold cursor-pointer"
                >
                  <option value="General">General Segregation</option>
                  <option value="Plastic">Plastic Materials</option>
                  <option value="Glass">Glass Bottles</option>
                  <option value="Paper">Paper & Cardboard</option>
                  <option value="Metal">Metals & Cans</option>
                  <option value="E-Waste">Electronics & E-waste</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Guide / Tip Content
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-slate-500">
                    <FiFileText size={18} />
                  </div>
                  <textarea
                    rows="4"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-700 outline-none transition-all text-sm font-semibold resize-none"
                    placeholder="Provide simple, actionable descriptions of how to sort or recycle..."
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? "Publishing..." : "Publish Tip"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
