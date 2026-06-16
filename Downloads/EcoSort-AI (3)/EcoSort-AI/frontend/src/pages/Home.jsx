import { Link } from "react-router-dom";
import { FiArrowRight, FiZap, FiTrendingUp, FiShield } from "react-icons/fi";
import { usePredictionContext } from "../context/PredictionContext";
import "../styles/Home.css";

export default function Home() {
  const { totalScans, recyclableCount, nonRecyclableCount } = usePredictionContext();

  return (
    <div className="home-container">
      <div className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Smart Waste Classification
          </h1>
          <p className="hero-subtitle">
            Using Artificial Intelligence to help you classify waste correctly
          </p>
          <div className="hero-buttons">
            <Link to="/predict" className="btn btn-primary">
              <FiZap size={20} />
              Start Predicting
              <FiArrowRight size={20} />
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              <FiTrendingUp size={20} />
              View Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="home-stats">
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <h3>Total Scans</h3>
          <p className="stat-number">{totalScans}</p>
        </div>
        <div className="stat-box">
          <div className="stat-icon">♻️</div>
          <h3>Recyclable</h3>
          <p className="stat-number">{recyclableCount}</p>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🚫</div>
          <h3>Non-Recyclable</h3>
          <p className="stat-number">{nonRecyclableCount}</p>
        </div>
      </div>

      <div className="home-features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>File Upload</h3>
            <p>Upload images of waste items and get instant classification</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📷</div>
            <h3>Live Camera</h3>
            <p>Capture waste items in real-time using your device camera</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Track your waste classification history and statistics</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Powered</h3>
            <p>Advanced machine learning model trained on thousands of items</p>
          </div>
        </div>
      </div>

      <div className="home-cta">
        <h2>Ready to get started?</h2>
        <p>Classify waste items and help the environment</p>
        <Link to="/predict" className="btn btn-primary btn-large">
          <FiZap size={24} />
          Start Now
          <FiArrowRight size={24} />
        </Link>
      </div>
    </div>
  );
}
