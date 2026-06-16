import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import {
  FiUpload,
  FiCamera,
  FiZap,
  FiCheck,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { usePredictionContext } from "../context/PredictionContext";
import "../styles/Predict.css";

export default function Predict() {
  const {
    selectedFile,
    setSelectedFile,
    preview,
    setPreview,
    prediction,
    setPrediction,
    confidence,
    setConfidence,
    addToPredictionHistory,
  } = usePredictionContext();

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        setPrediction("");
        setConfidence(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraOn(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Camera error:", error);
      alert("Could not access camera");
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraOn(false);
  };

  const captureImage = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], "camera_capture.jpg", {
        type: "image/jpeg",
      });
      setSelectedFile(file);
      setPreview(canvasRef.current.toDataURL());
      setPrediction("");
      setConfidence(0);
    });
  };

  const predictWaste = async (fileToPredict = selectedFile) => {
    if (!fileToPredict) {
      alert("Please select a file or capture an image first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", fileToPredict);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/predict",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.error) {
        console.error("Prediction error:", response.data.error);
        alert(`Error: ${response.data.error}`);
        return;
      }

      const { prediction: pred, confidence: conf } = response.data;
      setPrediction(pred);
      setConfidence(conf);
      addToPredictionHistory(
        fileToPredict.name,
        pred,
        conf
      );
    } catch (error) {
      console.error("Prediction error:", error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.detail || error.message || "Error making prediction. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setPrediction("");
    setConfidence(0);
  };

  return (
    <div className="predict-container">
      <div className="predict-card">
        <h1>Predict Waste Classification</h1>
        <p className="predict-subtitle">
          Upload an image or use your camera to classify waste items
        </p>

        <div className="predict-content">
          {/* Upload Section */}
          {!cameraOn && !preview && (
            <label className="upload-box">
              <div className="upload-content">
                <FiUpload size={32} />
                <span className="upload-text">Choose or Drag File</span>
                <span className="upload-hint">Supported: JPG, PNG, GIF</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
            </label>
          )}

          {/* Preview */}
          {preview && (
            <div className="preview-section">
              <img src={preview} alt="preview" className="preview-image" />
            </div>
          )}

          {/* Webcam */}
          {cameraOn && (
            <div className="camera-section">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="video-stream"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ display: "none" }}
              />
              <button
                className="btn btn-capture"
                onClick={captureImage}
              >
                <FiCamera size={20} />
                Capture Photo
              </button>
            </div>
          )}

          {/* Buttons */}
          <div className="button-group">
            {!cameraOn && !preview && (
              <button className="btn btn-camera" onClick={startCamera}>
                <FiCamera size={20} />
                Start Camera
              </button>
            )}

            {cameraOn && (
              <button className="btn btn-danger" onClick={stopCamera}>
                <FiX size={20} />
                Stop Camera
              </button>
            )}

            {preview && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => predictWaste()}
                  disabled={loading}
                >
                  <FiZap size={20} />
                  {loading ? "Analyzing..." : "Predict"}
                </button>
                <button className="btn btn-secondary" onClick={handleReset}>
                  <FiRefreshCw size={20} />
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Prediction Result */}
          {prediction && (
            <div
              className={`result-card ${
                prediction === "Recyclable"
                  ? "result-recyclable"
                  : "result-non-recyclable"
              }`}
            >
              <div className="result-header">
                {prediction === "Recyclable" ? (
                  <FiCheck size={32} className="result-icon" />
                ) : (
                  <FiX size={32} className="result-icon" />
                )}
                <h2>{prediction}</h2>
              </div>

              <div className="result-confidence">
                <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="result-tip">
                {prediction === "Recyclable" ? (
                  <p>
                    ♻️ This item can be recycled. Please place it in the
                    appropriate recycling bin.
                  </p>
                ) : (
                  <p>
                    🚫 This item cannot be recycled. Please dispose of it in
                    the regular trash.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
