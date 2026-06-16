import "./App.css";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  FiUpload,
  FiCamera,
  FiZap,
  FiCheck,
  FiX,
  FiTrendingUp,
  FiRefreshCw,
  FiBarChart2,
  FiPieChart,
  FiClock,
} from "react-icons/fi";
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

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);

  const [cameraOn, setCameraOn] = useState(false);

  const [recyclableCount, setRecyclableCount] = useState(0);
  const [nonRecyclableCount, setNonRecyclableCount] = useState(0);
  const [totalScans, setTotalScans] = useState(0);

  const [history, setHistory] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup webcam stream
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();

        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // File Upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setCameraOn(false);
  };

  // Predict Function
  const predictWaste = async (fileToPredict = selectedFile) => {
    if (!fileToPredict) {
      alert("Please upload or capture an image");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileToPredict);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        formData
      );

      const result = response.data.prediction;
      const conf = response.data.confidence;

      setPrediction(result);
      setConfidence(conf);

      setTotalScans((prev) => prev + 1);

      if (result === "Recyclable") {
        setRecyclableCount((prev) => prev + 1);
      } else {
        setNonRecyclableCount((prev) => prev + 1);
      }

      setHistory((prev) => [
        {
          name: fileToPredict.name || "capture.jpg",
          result,
        },
        ...prev,
      ]);
    } catch (error) {
      console.log(error);
      alert("Prediction Failed");
    }
  };

  // Start Webcam
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
        },
        audio: false,
      });

      setCameraOn(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current.play();
            } catch (err) {
              console.log("Play Error:", err);
            }
          };
        }
      }, 100);
    } catch (error) {
      console.log("Camera Error:", error);

      if (error.name === "NotAllowedError") {
        alert("Camera permission denied");
      } else if (error.name === "NotFoundError") {
        alert("No camera detected");
      } else {
        alert("Unable to access camera");
      }
    }
  };

  // Capture Image
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "capture.jpg", {
          type: "image/jpeg",
        });

        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));

        predictWaste(file);
      },
      "image/jpeg",
      1
    );
  };

  // Pie Chart Data
  const pieData = [
    { name: "Recyclable", value: recyclableCount },
    { name: "Non-Recyclable", value: nonRecyclableCount },
  ];

  // Bar Chart Data
  const barData = [
    {
      name: "Waste",
      recyclable: recyclableCount,
      nonRecyclable: nonRecyclableCount,
    },
  ];

  return (
    <div className="app">
      {/* LEFT SIDEBAR */}
      <div className="sidebar">
        <h1>EcoSort-AI</h1>

        <p className="subtitle">
          Smart Waste Classification using Artificial Intelligence
        </p>

        {/* Upload */}
        {!cameraOn && (
          <label className="upload-box">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "column" }}>
              <FiUpload size={24} />
              <span>Choose File</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </label>
        )}

        {/* Webcam */}
        {cameraOn ? (
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="preview-image"
            />

            <button className="predict-btn" onClick={captureImage}>
              <FiCamera size={20} />
              Capture & Predict
            </button>
          </div>
        ) : (
          preview && (
            <img
              src={preview}
              alt="preview"
              className="preview-image"
            />
          )
        )}

        {/* Buttons */}
        <div className="button-group">
          {!cameraOn && (
            <>
              <button
                className="predict-btn"
                onClick={() => predictWaste()}
              >
                <FiZap size={20} />
                Predict Waste
              </button>

              <button
                className="camera-btn"
                onClick={startCamera}
              >
                <FiCamera size={20} />
                Start Camera
              </button>
            </>
          )}
        </div>

        {/* Prediction Result */}
        {prediction && (
          <div
            className={
              prediction === "Recyclable"
                ? "result-card recyclable"
                : "result-card non-recyclable"
            }
          >
            <h3>{prediction}</h3>

            <p>
              Confidence: {(confidence * 100).toFixed(2)}%
            </p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${confidence * 100}%`,
                }}
              ></div>
            </div>

            <p className="tip">
              {prediction === "Recyclable"
                ? "♻ Clean before recycling"
                : "⚠ Dispose safely in general waste"}
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
        />
      </div>

      {/* RIGHT DASHBOARD */}
      <div className="dashboard">
        <h2><FiBarChart2 size={28} style={{ display: "inline-block", marginRight: "12px", verticalAlign: "middle" }} />Waste Analytics Dashboard</h2>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h1>{totalScans}</h1>
            <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><FiTrendingUp size={18} /> Total Scans</p>
          </div>

          <div className="stat-card recyclable-border">
            <h1>{recyclableCount}</h1>
            <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><FiCheck size={18} /> Recyclable</p>
          </div>

          <div className="stat-card non-border">
            <h1>{nonRecyclableCount}</h1>
            <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><FiX size={18} /> Non-Recyclable</p>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="chart-card">
          <h3><FiPieChart size={20} style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />Waste Distribution</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={90}
                label
              >
                <Cell fill="#00ff88" />
                <Cell fill="#ff4d4d" />
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="chart-card">
          <h3><FiBarChart2 size={20} style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />Waste Comparison</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="recyclable"
                fill="#00ff88"
              />

              <Bar
                dataKey="nonRecyclable"
                fill="#ff4d4d"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* History */}
        <div className="history-card">
          <h3><FiClock size={20} style={{ display: "inline-block", marginRight: "8px", verticalAlign: "middle" }} />Recent Predictions</h3>

          {history.map((item, index) => (
            <div key={index} className="history-item">
              <span>{item.name}</span>

              <span
                className={
                  item.result === "Recyclable"
                    ? "green-text"
                    : "red-text"
                }
              >
                {item.result === "Recyclable" ? <FiCheck size={18} style={{ display: "inline-block", marginRight: "4px" }} /> : <FiX size={18} style={{ display: "inline-block", marginRight: "4px" }} />}
                {item.result}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
