import { FiLock, FiUnlock } from "react-icons/fi";
import { usePredictionContext } from "../context/PredictionContext";
import { achievements, getUnlockedAchievements, getAchievementProgress } from "../data/achievements";
import "../styles/Achievements.css";

export default function Achievements() {
  const { totalScans, recyclableCount } = usePredictionContext();

  const stats = {
    totalScans,
    recyclableCount,
    nonRecyclableCount: totalScans - recyclableCount,
    sessionPredictions: 0,
  };

  const unlockedAchievements = getUnlockedAchievements(stats);
  const progress = getAchievementProgress(stats);

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <h1>🏆 Achievements</h1>
        <p>Unlock badges by reaching milestones</p>
        <div className="progress-section">
          <div className="progress-bar-large">
            <div
              className="progress-fill-large"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="progress-text">
            {progress.unlockedCount} of {progress.totalCount} Unlocked
          </p>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedAchievements.some(
            (a) => a.id === achievement.id
          );

          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isUnlocked ? "unlocked" : "locked"}`}
            >
              <div className="achievement-badge">
                <span className="badge-icon">{achievement.icon}</span>
                {isUnlocked ? (
                  <FiUnlock className="unlock-icon" size={20} />
                ) : (
                  <FiLock className="lock-icon" size={20} />
                )}
              </div>

              <div className="achievement-content">
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
              </div>

              {isUnlocked && (
                <div className="achievement-unlocked">
                  <span>✓ Unlocked!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="achievements-tips">
        <h2>Next Milestones</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <span className="tip-icon">📊</span>
            <h3>Keep Classifying</h3>
            <p>You need {Math.max(0, 10 - totalScans)} more predictions to become an Eco Warrior!</p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">♻️</span>
            <h3>Focus on Recycling</h3>
            <p>
              {recyclableCount > 0
                ? `You're ${((recyclableCount / totalScans) * 100).toFixed(0)}% recyclable items`
                : "Identify recyclable items to boost your score!"}
            </p>
          </div>
          <div className="tip-card">
            <span className="tip-icon">⚡</span>
            <h3>Make It Faster</h3>
            <p>Try using the camera feature for quicker predictions!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
