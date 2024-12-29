// app/components/Auth.tsx
"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("username");
    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", username);
    setUser(username);
  };

  const register = async (username: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("username", username);
    setUser(username);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [touchedFields, setTouchedFields] = useState({
    username: false,
    password: false,
  });
  const { user, login, register, logout } = useAuth();

  const validateUsername = (username: string): string | null => {
    if (!username) return "Username is required";
    if (username.length < 3 || username.length > 20) {
      return "Username must be between 3 and 20 characters";
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return "Username can only contain letters and numbers";
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (touchedFields.username) {
      setError(validateUsername(value) || "");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touchedFields.password) {
      setError(validatePassword(value) || "");
    }
  };

  const handleBlur = (field: "username" | "password") => {
    setTouchedFields({ ...touchedFields, [field]: true });
    if (field === "username") {
      setError(validateUsername(username) || "");
    } else {
      setError(validatePassword(password) || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all fields before submission
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setError(usernameError || passwordError || "");
      setTouchedFields({ username: true, password: true });
      return;
    }

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div className="text-center">
        <p className="mb-4 text-gray-100">Logged in as {user}</p>
        <Button onClick={logout} className="bg-red-600 hover:bg-red-700">
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-100">
          {isLogin ? "Login" : "Sign Up"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={handleUsernameChange}
              onBlur={() => handleBlur("username")}
              className={`bg-gray-700 text-gray-100 border-gray-600 ${
                touchedFields.username && validateUsername(username)
                  ? "border-red-500"
                  : ""
              }`}
            />
            {touchedFields.username && validateUsername(username) && (
              <p className="text-red-400 text-sm mt-1">
                {validateUsername(username)}
              </p>
            )}
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password")}
              className={`bg-gray-700 text-gray-100 border-gray-600 ${
                touchedFields.password && validatePassword(password)
                  ? "border-red-500"
                  : ""
              }`}
            />
            {touchedFields.password && validatePassword(password) && (
              <p className="text-red-400 text-sm mt-1">
                {validatePassword(password)}
              </p>
            )}
          </div>
          {error &&
            !validateUsername(username) &&
            !validatePassword(password) && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={
              !!validateUsername(username) || !!validatePassword(password)
            }
          >
            {isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setTouchedFields({ username: false, password: false });
            }}
            className="text-blue-400 hover:text-blue-300"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default Auth;
