import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  active: boolean;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setIsLoading(false); return; }

    apiRequest<User>("GET", "/api/auth/me")
      .then(setUser)
      .catch(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ user: User; token: string }>("POST", "/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    queryClient.clear();
  };

  const register = async (formData: Record<string, string>) => {
    const data = await apiRequest<{ user: User; token: string }>("POST", "/api/auth/register", formData);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    queryClient.clear();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
