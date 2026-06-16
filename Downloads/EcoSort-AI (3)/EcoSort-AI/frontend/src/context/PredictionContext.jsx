import { createContext, useState, useContext } from "react";

const PredictionContext = createContext();

export function PredictionProvider({ children }) {
  const [recyclableCount, setRecyclableCount] = useState(0);
  const [nonRecyclableCount, setNonRecyclableCount] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [history, setHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState(0);

  const addToPredictionHistory = (name, result, confidence) => {
    setHistory((prev) => [{ name, result, confidence }, ...prev]);

    if (result === "Recyclable") {
      setRecyclableCount((prev) => prev + 1);
    } else {
      setNonRecyclableCount((prev) => prev + 1);
    }

    setTotalScans((prev) => prev + 1);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setPrediction("");
    setConfidence(0);
  };

  const value = {
    recyclableCount,
    setRecyclableCount,
    nonRecyclableCount,
    setNonRecyclableCount,
    totalScans,
    setTotalScans,
    history,
    setHistory,
    selectedFile,
    setSelectedFile,
    preview,
    setPreview,
    prediction,
    setPrediction,
    confidence,
    setConfidence,
    addToPredictionHistory,
    clearSelectedFile,
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePredictionContext() {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error("usePredictionContext must be used within PredictionProvider");
  }
  return context;
}
