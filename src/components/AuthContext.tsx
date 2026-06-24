import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserProfile, AuthState } from "../types";

interface AuthContextType extends AuthState {
  register: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (email: string, name: string, googleId: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("ch_token"),
    loading: true,
    error: null,
  });

  // Verify token on mount or token change
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("ch_token");
      if (!token) {
        setState(prev => ({ ...prev, user: null, token: null, loading: false }));
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const userData = await res.json();
          setState({
            user: userData,
            token,
            loading: false,
            error: null
          });
        } else {
          // Token expired or invalid
          localStorage.removeItem("ch_token");
          setState({
            user: null,
            token: null,
            loading: false,
            error: "Session expired. Please log in again."
          });
        }
      } catch (err) {
        // Network error, keep existing token but stop loading
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    verifyToken();
  }, [state.token]);

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ch_token", data.token);
        setState({
          user: data.user,
          token: data.token,
          loading: false,
          error: null
        });
        return true;
      } else {
        setState(prev => ({ ...prev, loading: false, error: data.error || "Registration failed" }));
        return false;
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: "Network connection error" }));
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ch_token", data.token);
        setState({
          user: data.user,
          token: data.token,
          loading: false,
          error: null
        });
        return true;
      } else {
        setState(prev => ({ ...prev, loading: false, error: data.error || "Login failed" }));
        return false;
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: "Network connection error" }));
      return false;
    }
  };

  const loginWithGoogle = async (email: string, name: string, googleId: string): Promise<boolean> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, googleId })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ch_token", data.token);
        setState({
          user: data.user,
          token: data.token,
          loading: false,
          error: null
        });
        return true;
      } else {
        setState(prev => ({ ...prev, loading: false, error: data.error || "Google login failed" }));
        return false;
      }
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: "Network connection error" }));
      return false;
    }
  };

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      return data.message || "Reset link generated.";
    } catch (err) {
      return "Unable to process password reset. Please try again.";
    }
  };

  const logout = () => {
    localStorage.removeItem("ch_token");
    setState({
      user: null,
      token: null,
      loading: false,
      error: null
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, register, login, loginWithGoogle, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
