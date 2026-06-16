export const achievements = [
  {
    id: "first_prediction",
    title: "Getting Started",
    description: "Make your first waste prediction",
    icon: "🚀",
    requirement: (stats) => stats.totalScans >= 1,
  },
  {
    id: "eco_warrior",
    title: "Eco Warrior",
    description: "Classify 10 items",
    icon: "♻️",
    requirement: (stats) => stats.totalScans >= 10,
  },
  {
    id: "recycling_master",
    title: "Recycling Master",
    description: "Classify 50 items",
    icon: "👑",
    requirement: (stats) => stats.totalScans >= 50,
  },
  {
    id: "green_legend",
    title: "Green Legend",
    description: "Classify 100 items",
    icon: "⭐",
    requirement: (stats) => stats.totalScans >= 100,
  },
  {
    id: "perfect_recycler",
    title: "Perfect Recycler",
    description: "Achieve 90%+ recyclable items",
    icon: "🎯",
    requirement: (stats) => {
      if (stats.totalScans === 0) return false;
      return (stats.recyclableCount / stats.totalScans) >= 0.9;
    },
  },
  {
    id: "conscious_consumer",
    title: "Conscious Consumer",
    description: "Identify 20 recyclable items",
    icon: "🌍",
    requirement: (stats) => stats.recyclableCount >= 20,
  },
  {
    id: "rapid_classifier",
    title: "Rapid Classifier",
    description: "Make 5 predictions in one session",
    icon: "⚡",
    requirement: (stats) => stats.sessionPredictions >= 5,
  },
  {
    id: "planet_protector",
    title: "Planet Protector",
    description: "Reach 200 predictions",
    icon: "🌎",
    requirement: (stats) => stats.totalScans >= 200,
  },
];

export function getUnlockedAchievements(stats) {
  return achievements.filter((achievement) =>
    achievement.requirement(stats)
  );
}

export function getNextAchievements(stats) {
  return achievements.filter((achievement) =>
    !achievement.requirement(stats)
  );
}

export function getAchievementProgress(stats) {
  const unlockedCount = getUnlockedAchievements(stats).length;
  const totalCount = achievements.length;
  return {
    unlockedCount,
    totalCount,
    percentage: (unlockedCount / totalCount) * 100,
  };
}
