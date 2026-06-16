import { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useToast } from "../context/ToastContext";
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiRefreshCw, FiGrid } from "react-icons/fi";

export default function BinMonitoring() {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form states
  const [binId, setBinId] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(12.9716);
  const [longitude, setLongitude] = useState(77.5946);
  const [status, setStatus] = useState("Normal");
  const [fillLevel, setFillLevel] = useState(0.0);

  const { addToast } = useToast();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersGroup = useRef(null);

  useEffect(() => {
    fetchBins();
  }, []);

  useEffect(() => {
    // Initialize Leaflet Map
    if (mapRef.current && !mapInstance.current) {
      // Centered on Bangalore coordinates by default
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        fadeAnimation: true
      }).setView([12.9716, 77.5946], 14);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstance.current);

      markersGroup.current = L.layerGroup().addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        // Map will persist across re-renders
      }
    };
  }, []);

  // Update map markers when bins change
  useEffect(() => {
    if (markersGroup.current && bins.length > 0) {
      markersGroup.current.clearLayers();

      const coordinates = [];

      bins.forEach((bin) => {
        const lat = parseFloat(bin.latitude);
        const lon = parseFloat(bin.longitude);
        
        if (isNaN(lat) || isNaN(lon)) return;
        coordinates.push([lat, lon]);

        // Setup color based on fill level
        let markerColor = "#10b981"; // Green
        let glowColor = "rgba(16, 185, 129, 0.4)";
        if (bin.fill_level > 80.0) {
          markerColor = "#ef4444"; // Red
          glowColor = "rgba(239, 68, 68, 0.5)";
        } else if (bin.fill_level > 50.0) {
          markerColor = "#eab308"; // Yellow
          glowColor = "rgba(234, 179, 8, 0.4)";
        }

        // Create glowing CircleMarker
        const marker = L.circleMarker([lat, lon], {
          radius: 12,
          fillColor: markerColor,
          color: "#0f172a",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
          className: "pulse-marker"
        });

        // HTML details inside Popup
        const popupContent = `
          <div style="font-family: 'Segoe UI', sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 10px; border-radius: 8px; min-width: 180px;">
            <h4 style="margin: 0 0 5px 0; color: #22d3ee; font-weight: bold; font-size:14px;">${bin.name}</h4>
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size:11px;"><i class="fi fi-map-pin"></i> ${bin.location}</p>
            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e293b; padding-top: 8px; margin-top: 4px;">
              <span style="font-size: 11px; font-weight: bold;">Fill Level:</span>
              <span style="color: ${markerColor}; font-weight: bold; font-size: 12px;">${bin.fill_level}%</span>
            </div>
            <div style="font-size: 9px; color: #64748b; margin-top: 6px;">Last update: ${bin.last_updated}</div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: "custom-leaflet-popup"
        });

        marker.addTo(markersGroup.current);
      });

      // Fit map boundary to include all markers if active
      if (coordinates.length > 0 && mapInstance.current) {
        mapInstance.current.fitBounds(L.latLngBounds(coordinates), { padding: [50, 50] });
      }
    }
  }, [bins]);

  const fetchBins = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/bins");
      if (response.data.error) {
        addToast(response.data.error, "error");
      } else {
        setBins(response.data);
      }
    } catch (e) {
      addToast("Failed to fetch smart bin endpoints", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setBinId("");
    setName("");
    setLocation("");
    setLatitude(12.9716);
    setLongitude(77.5946);
    setStatus("Normal");
    setFillLevel(0.0);
    setModalOpen(true);
  };

  const openEditModal = (bin) => {
    setEditMode(true);
    setBinId(bin.id);
    setName(bin.name);
    setLocation(bin.location);
    setLatitude(bin.latitude);
    setLongitude(bin.longitude);
    setStatus(bin.status);
    setFillLevel(bin.fill_level);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status,
        fill_level: parseFloat(fillLevel)
      };

      if (editMode) {
        await axios.put(`http://127.0.0.1:8000/api/bins/${binId}`, payload);
        addToast("Smart bin updated successfully", "success");
      } else {
        const createPayload = { id: binId, ...payload };
        const response = await axios.post("http://127.0.0.1:8000/api/bins", createPayload);
        if (response.data.error) {
          addToast(response.data.error, "error");
          return;
        }
        addToast("Smart bin created successfully", "success");
      }
      setModalOpen(false);
      fetchBins();
    } catch (err) {
      addToast("Failed to save smart bin", "error");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this smart dustbin from grid?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/bins/${id}`);
        addToast("Smart bin successfully deleted", "success");
        fetchBins();
      } catch (e) {
        addToast("Failed to delete smart bin", "error");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Smart City Bin Monitoring
          </h1>
          <p className="text-slate-400 mt-2">
            Geospatial waste telemetry mapping and IoT register management
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBins}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <FiPlus /> Add Bin Node
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-4 right-4 z-[1000] bg-slate-950/80 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex flex-col gap-2 text-xs font-semibold">
          <span className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">LEGEND</span>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Normal (0-50%)
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></span>
            Warning (51-80%)
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            Full (81-100%)
          </div>
        </div>
        <div ref={mapRef} className="w-full h-[450px] rounded-2xl z-10" />
      </div>

      {/* Bins List Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
        <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
          <FiGrid className="text-cyan-400" /> Smart Dustbin Registers
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="py-4 font-semibold">Node ID</th>
                <th className="py-4 font-semibold">Name</th>
                <th className="py-4 font-semibold">Location</th>
                <th className="py-4 font-semibold">Coordinates</th>
                <th className="py-4 font-semibold text-center">Fill Capacity</th>
                <th className="py-4 font-semibold text-center">Status</th>
                <th className="py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {bins.length > 0 ? (
                bins.map((bin) => (
                  <tr key={bin.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-4 font-mono font-bold text-cyan-400">{bin.id}</td>
                    <td className="py-4 font-semibold text-slate-100">{bin.name}</td>
                    <td className="py-4 text-slate-400">{bin.location}</td>
                    <td className="py-4 text-slate-500 font-mono text-xs">
                      {bin.latitude.toFixed(4)}, {bin.longitude.toFixed(4)}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-24 bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 shadow-inner">
                          <div
                            className={`h-full rounded-full ${
                              bin.fill_level >= 80.0
                                ? "bg-red-500"
                                : bin.fill_level >= 50.0
                                ? "bg-yellow-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${bin.fill_level}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs w-8 text-right">{bin.fill_level}%</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        bin.status === "Full"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : bin.status === "Warning"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {bin.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(bin)}
                          className="p-2 bg-slate-950 hover:bg-slate-850 text-cyan-400 hover:text-cyan-300 rounded-lg border border-slate-800 transition-colors"
                          title="Edit Node Details"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bin.id)}
                          className="p-2 bg-slate-950 hover:bg-red-950/30 text-red-400 hover:text-red-350 rounded-lg border border-slate-800 transition-colors"
                          title="Delete Node"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500 font-semibold">
                    No active smart bins registered in coordinates map.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Overlay Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative animate-fadeIn">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent mb-6">
              {editMode ? `Edit Bin #${binId}` : "Add Smart Bin Node"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {!editMode && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bin Identifier (ID)
                  </label>
                  <input
                    type="text"
                    value={binId}
                    onChange={(e) => setBinId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 outline-none transition-all text-sm font-semibold"
                    placeholder="bin_4"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Name / Label
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 outline-none transition-all text-sm font-semibold"
                  placeholder="North Campus Cafeteria"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Location Address
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-700 outline-none transition-all text-sm font-semibold"
                  placeholder="Block B, 1st Floor Lobby"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 outline-none transition-all text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 outline-none transition-all text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              {editMode && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Fill Level %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={fillLevel}
                      onChange={(e) => setFillLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-4 text-slate-200 outline-none transition-all text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl py-3 px-3 text-slate-200 outline-none transition-all text-sm font-semibold cursor-pointer"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Warning">Warning</option>
                      <option value="Full">Full</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold py-3 rounded-xl border border-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 rounded-xl shadow-lg transition-colors"
                >
                  Save Bin Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
