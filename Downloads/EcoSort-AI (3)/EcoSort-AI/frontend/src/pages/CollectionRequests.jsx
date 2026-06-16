import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import { FiTruck, FiUser, FiCheckCircle, FiClock, FiEdit } from "react-icons/fi";

export default function CollectionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [statusVal, setStatusVal] = useState("Pending");
  const [worker, setWorker] = useState("");

  const { addToast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/collection-requests");
      if (response.data.error) {
        addToast(response.data.error, "error");
      } else {
        setRequests(response.data);
      }
    } catch (e) {
      addToast("Failed to fetch collection logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (req) => {
    setSelectedReqId(req.id);
    setStatusVal(req.status);
    setWorker(req.assigned_worker || "");
    setModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: statusVal,
        assigned_worker: worker
      };
      await axios.put(`http://127.0.0.1:8000/api/collection-requests/${selectedReqId}`, payload);
      addToast("Collection logs updated successfully", "success");
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      addToast("Failed to update collection assignment", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-cyan-400 font-mono animate-pulse">
        Retrieving Collection Dispatch Logs...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Waste Collection Logs
          </h1>
          <p className="text-slate-400 mt-2">
            Monitor, assign, and update waste pickup requests for municipal workers
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-4 py-2.5 rounded-xl transition-all"
        >
          Refresh Logs
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
          <FiTruck className="text-cyan-400" /> Active Dispatch Queue
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-4 font-semibold">Request ID</th>
                <th className="py-4 font-semibold">Bin Node</th>
                <th className="py-4 font-semibold">Location Area</th>
                <th className="py-4 font-semibold">Assigned Crew</th>
                <th className="py-4 font-semibold">Created Date</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-4 font-mono font-bold text-slate-400">#REQ_{req.id}</td>
                    <td className="py-4 font-semibold text-slate-200">
                      {req.bin_name} <span className="text-xs text-slate-500 font-mono">({req.bin_id})</span>
                    </td>
                    <td className="py-4 text-slate-400">{req.location}</td>
                    <td className="py-4">
                      {req.assigned_worker ? (
                        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                          <FiUser size={14} /> {req.assigned_worker}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-semibold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 text-slate-500 font-mono text-xs">{req.created_date}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : req.status === "In Progress"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : req.status === "Assigned"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                      }`}>
                        {req.status === "Completed" ? (
                          <FiCheckCircle size={12} />
                        ) : (
                          <FiClock size={12} />
                        )}
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {req.status !== "Completed" ? (
                        <button
                          onClick={() => openAssignModal(req)}
                          className="flex items-center gap-1.5 ml-auto bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                        >
                          <FiEdit size={14} /> Dispatch/Assign
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs font-mono font-semibold">
                          COMPLETED: {req.completed_date ? req.completed_date.split(" ")[0] : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-semibold">
                    No waste collection requests filed in dispatch queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-fadeIn">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              Update Dispatch Request
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assign Pickup Worker / Crew
                </label>
                <input
                  type="text"
                  value={worker}
                  onChange={(e) => setWorker(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 outline-none transition-all text-sm font-semibold"
                  placeholder="e.g. John Doe (Truck #3)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Dispatch Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-3 text-slate-200 outline-none transition-all text-sm font-semibold cursor-pointer"
                >
                  <option value="Pending">Pending Alert</option>
                  <option value="Assigned">Assigned Crew</option>
                  <option value="In Progress">In Transit / In Progress</option>
                  <option value="Completed">Completed & Emptied</option>
                </select>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold py-3 rounded-xl border border-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-colors"
                >
                  Save Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
