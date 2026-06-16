import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { PredictionProvider } from "./context/PredictionContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Navigation from "./components/Navigation";
import ToastContainer from "./components/ToastContainer";

import Home from "./pages/Home";
import Predict from "./pages/Predict";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Achievements from "./pages/Achievements";
import Tools from "./pages/Tools";

// New Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import BinMonitoring from "./pages/BinMonitoring";
import CollectionRequests from "./pages/CollectionRequests";
import RecyclingTips from "./pages/RecyclingTips";
import Reports from "./pages/Reports";

import "./App.css";

// Protected Route Guard
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-cyan-400 font-mono">
        <div className="animate-pulse">Loading Authentication State...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PredictionProvider>
          <Router>
            {/* Wrap the whole layout in a div with the "app" class – this matches the CSS rules
                defined in App.css (grid layout, sidebar width, etc.) */}
            <div className="app">
              <Navigation />
              {/* Adjust left margin to exactly match the sidebar width (340px) for medium+ screens */}
              <main className="flex-1 p-6 lg:p-10 ml-0 transition-all duration-300">
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Protected Common / User Routes */}
                  <Route path="/predict" element={
                    <ProtectedRoute>
                      <Predict />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  } />
                  <Route path="/achievements" element={
                    <ProtectedRoute>
                      <Achievements />
                    </ProtectedRoute>
                  } />
                  <Route path="/recycling-tips" element={
                    <ProtectedRoute>
                      <RecyclingTips />
                    </ProtectedRoute>
                  } />
                  <Route path="/tools" element={
                    <ProtectedRoute>
                      <Tools />
                    </ProtectedRoute>
                  } />
                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  } />

                  {/* Admin Only Routes */}
                  <Route path="/admin-dashboard" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/bin-monitoring" element={
                    <ProtectedRoute adminOnly>
                      <BinMonitoring />
                    </ProtectedRoute>
                  } />
                  <Route path="/collection-requests" element={
                    <ProtectedRoute adminOnly>
                      <CollectionRequests />
                    </ProtectedRoute>
                  } />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <ToastContainer />
            </div>
          </Router>
        </PredictionProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;