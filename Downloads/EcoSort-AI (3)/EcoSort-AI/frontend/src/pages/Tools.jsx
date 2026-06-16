import { FiDownload, FiUploadCloud, FiFilter } from "react-icons/fi";
import { usePredictionContext } from "../context/PredictionContext";
import { useToast } from "../context/ToastContext";
// import "../styles/Tools.css";

export default function Tools() {
  const { history } = usePredictionContext();
  const { addToast } = useToast();

  const exportToCSV = () => {
    if (history.length === 0) {
      addToast("No predictions to export", "info");
      return;
    }

    const headers = ["File Name", "Result", "Confidence", "Date"];
    const csvContent = [
      headers.join(","),
      ...history.map((item) => [
        `"${item.name}"`,
        item.result,
        `${(item.confidence * 100).toFixed(2)}%`,
        new Date().toLocaleDateString(),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `predictions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Exported ${history.length} predictions!`, "success");
  };

  const exportToJSON = () => {
    if (history.length === 0) {
      addToast("No predictions to export", "info");
      return;
    }

    const data = {
      exportDate: new Date().toISOString(),
      totalPredictions: history.length,
      predictions: history,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `predictions_${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`Exported ${history.length} predictions as JSON!`, "success");
  };

  const generateReport = () => {
    if (history.length === 0) {
      addToast("No data for report", "info");
      return;
    }

    const recyclableCount = history.filter((h) => h.result === "Recyclable").length;
    const nonRecyclableCount = history.length - recyclableCount;

    const reportContent = `
WASTE CLASSIFICATION REPORT
============================
Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

SUMMARY
-------
Total Predictions: ${history.length}
Recyclable Items: ${recyclableCount} (${((recyclableCount / history.length) * 100).toFixed(1)}%)
Non-Recyclable Items: ${nonRecyclableCount} (${((nonRecyclableCount / history.length) * 100).toFixed(1)}%)

AVERAGE CONFIDENCE
------------------
${(history.reduce((acc, h) => acc + h.confidence, 0) / history.length * 100).toFixed(2)}%

DETAILED PREDICTIONS
--------------------
${history.map((item, idx) => `${idx + 1}. ${item.name} - ${item.result} (${(item.confidence * 100).toFixed(2)}%)`).join("\n")}

============================
Thank you for recycling responsibly!
    `;

    const blob = new Blob([reportContent], { type: "text/plain" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `report_${new Date().toISOString().split("T")[0]}.txt`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Report generated successfully!", "success");
  };

  return (
    <div className="tools-container">
      <div className="tools-header">
        <h1>🛠️ Tools & Utilities</h1>
        <p>Export, analyze, and manage your predictions</p>
      </div>

      <div className="tools-grid">
        {/* Export Section */}
        <div className="tools-section">
          <h2><FiDownload size={24} style={{ marginRight: "10px" }} />Export Data</h2>
          <div className="export-buttons">
            <button className="btn btn-export" onClick={exportToCSV}>
              <span>📊</span>
              Export as CSV
            </button>
            <button className="btn btn-export" onClick={exportToJSON}>
              <span>📋</span>
              Export as JSON
            </button>
            <button className="btn btn-export" onClick={generateReport}>
              <span>📄</span>
              Generate Report
            </button>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="tools-section">
          <h2><FiFilter size={24} style={{ marginRight: "10px" }} />Statistics</h2>
          <div className="stats-cards">
            <div className="stat-box">
              <span className="stat-number">{history.length}</span>
              <span className="stat-label">Total Predictions</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {history.length > 0
                  ? ((history.filter((h) => h.result === "Recyclable").length / history.length) * 100).toFixed(1)
                  : 0}
                %
              </span>
              <span className="stat-label">Recycling Rate</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {history.length > 0
                  ? (history.reduce((acc, h) => acc + h.confidence, 0) / history.length * 100).toFixed(0)
                  : 0}
                %
              </span>
              <span className="stat-label">Avg Confidence</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="tools-section">
          <h2><FiUploadCloud size={24} style={{ marginRight: "10px" }} />Bulk Processing</h2>
          <div className="info-text">
            <p>📸 Upload multiple images at once for batch processing</p>
            <p>✨ Get instant results for all images</p>
            <p>📊 View aggregate statistics</p>
            <a href="/predict" className="info-link">Try Batch Upload →</a>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="features-highlight">
        <h2>Available Features</h2>
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <div className="feature-info">
              <h3>CSV Export</h3>
              <p>Export your predictions in CSV format for analysis in Excel or other tools</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <div className="feature-info">
              <h3>JSON Export</h3>
              <p>Export structured data in JSON format for integration with other systems</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📄</span>
            <div className="feature-info">
              <h3>Report Generation</h3>
              <p>Create comprehensive reports of your waste classification activities</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔄</span>
            <div className="feature-info">
              <h3>Data Sync</h3>
              <p>Your data is automatically saved and synced across sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
