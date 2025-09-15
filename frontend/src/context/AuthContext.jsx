import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { email, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check auth from localStorage when app loads
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      try {
        const decoded = jwtDecode(storedToken);
        setUser({ email: decoded.email, role: decoded.role });
        setToken(storedToken);
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
      }
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    console.log(email, "+" , password)
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      console.log(res.data)

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);

        const decoded = jwtDecode(res.data.token);
        setUser({ email: decoded.email, role: decoded.role });
        return { success: true, role: decoded.role };
      }
    } catch (err) {
      console.error("Login failed", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
