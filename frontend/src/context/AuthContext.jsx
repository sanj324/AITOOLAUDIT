import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser().finally(() => {
      setLoading(false);
    });
  }, []);

  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    const { token, user: authUser } = response.data.data;

    localStorage.setItem("auth_token", token);
    setUser(authUser);
    toast.success("Login successful");
    return authUser;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    toast.info("Logged out successfully");
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      localStorage.removeItem("auth_token");
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        fetchCurrentUser,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
