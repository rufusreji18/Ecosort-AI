import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default axios authorization headers
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }

  // Load user from token storage on startup
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing stored user details:", e);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/login", {
        email,
        password,
      });

      if (response.data.error) {
        return { success: false, error: response.data.error };
      }

      const { token: jwtToken, user_id, username, role } = response.data;
      
      const userData = { id: user_id, username, role };
      setToken(jwtToken);
      setUser(userData);
      
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(userData));
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
      return { success: true, role };
    } catch (error) {
      console.error("Login API error:", error);
      return { success: false, error: "Unable to connect to the authentication server." };
    }
  };

  const register = async (username, email, password, role = "user") => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/auth/register", {
        username,
        email,
        password,
        role,
      });

      if (response.data.error) {
        return { success: false, error: response.data.error };
      }

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Registration API error:", error);
      return { success: false, error: "Unable to register at this time. Please try again." };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    token,
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
