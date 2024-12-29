"use client";

import React, { useState, createContext, useContext, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Clipboard, Check } from "lucide-react";

// Username generation function
const generateUsername = () => {
  const adjectives = [
    "Happy",
    "Brave",
    "Clever",
    "Daring",
    "Eager",
    "Funny",
    "Gentle",
    "Heroic",
    "Innovative",
    "Jolly",
    "Kind",
    "Lively",
    "Merry",
    "Noble",
    "Optimistic",
    "Playful",
    "Quirky",
    "Radiant",
    "Sunny",
    "Terrific",
    "Unique",
    "Vibrant",
    "Witty",
    "Zesty",
  ];

  const nouns = [
    "Panda",
    "Dragon",
    "Ninja",
    "Rocket",
    "Wizard",
    "Shark",
    "Phoenix",
    "Unicorn",
    "Robot",
    "Pirate",
    "Astronaut",
    "Tiger",
    "Eagle",
    "Wolf",
    "Dolphin",
    "Falcon",
    "Warrior",
    "Explorer",
    "Genius",
    "Hero",
    "Guardian",
    "Champion",
    "Maverick",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

// Auth Context Type Definition
interface AuthContextType {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Create Authentication Context
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoading: true,
});

// Custom hook to use Auth Context
export const useAuth = () => useContext(AuthContext);

// Authentication Provider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("username");
    if (token && storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  // Login method
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

  // Registration method
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

  // Logout method
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

// Main Authentication Component
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameCopied, setUsernameCopied] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    username: false,
    password: false,
  });
  const { user, login, register, logout } = useAuth();

  // Username validation
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

  // Password validation
  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return null;
  };

  // Username change handler
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (touchedFields.username) {
      setError(validateUsername(value) || "");
    }
  };

  // Password change handler
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touchedFields.password) {
      setError(validatePassword(value) || "");
    }
  };

  // Field blur handler
  const handleBlur = (field: "username" | "password") => {
    setTouchedFields({ ...touchedFields, [field]: true });
    if (field === "username") {
      setError(validateUsername(username) || "");
    } else {
      setError(validatePassword(password) || "");
    }
  };

  // Generate username handler
  const handleGenerateUsername = () => {
    const newUsername = generateUsername();
    setUsername(newUsername);
    setTouchedFields((prev) => ({ ...prev, username: true }));
  };

  // Copy username handler
  const handleCopyUsername = () => {
    navigator.clipboard.writeText(username);
    setUsernameCopied(true);
    setTimeout(() => setUsernameCopied(false), 2000);
  };

  // Form submission handler
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
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Logged in view
  if (user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center bg-gray-800 p-8 rounded-lg shadow-2xl"
        >
          <p className="mb-4 text-gray-100 text-lg">👋 Logged in as {user}</p>
          <Button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 transition-colors duration-300"
          >
            🚪 Sign Out
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Authentication form view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm overflow-y-auto py-8"
    >
      <div className="flex flex-col lg:flex-row items-center justify-center w-full max-w-5xl px-4 gap-8">
        {/* Authentication Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "signup"}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="w-full lg:w-1/2"
          >
            <Card className="w-full bg-gray-800 border-gray-700 shadow-2xl">
              <CardContent className="p-6">
                <motion.h2
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl font-bold mb-6 text-gray-100 text-center"
                >
                  {isLogin ? "Welcome Back 👋" : "Create Account 🚀"}
                </motion.h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={handleUsernameChange}
                        onBlur={() => handleBlur("username")}
                        className={`bg-gray-700 text-gray-100 border-gray-600 transition-all duration-300 ${
                          touchedFields.username && validateUsername(username)
                            ? "border-red-500"
                            : "focus:border-blue-500"
                        }`}
                      />
                      {!isLogin && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="text-gray-400 hover:text-gray-100 transition-colors"
                            onClick={handleGenerateUsername}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={`text-gray-400 hover:text-gray-100 transition-colors ${
                              usernameCopied ? "text-green-500" : ""
                            }`}
                            onClick={handleCopyUsername}
                          >
                            {usernameCopied ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Clipboard className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    {touchedFields.username && validateUsername(username) && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {validateUsername(username)}
                      </motion.p>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur("password")}
                      className={`bg-gray-700 text-gray-100 border-gray-600 transition-all duration-300 ${
                        touchedFields.password && validatePassword(password)
                          ? "border-red-500"
                          : "focus:border-blue-500"
                      }`}
                    />
                    {touchedFields.password && validatePassword(password) && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm mt-1"
                      >
                        {validatePassword(password)}
                      </motion.p>
                    )}
                  </motion.div>
                  {error &&
                    !validateUsername(username) &&
                    !validatePassword(password) && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
                      disabled={
                        !!validateUsername(username) ||
                        !!validatePassword(password)
                      }
                    >
                      {isLogin ? "Login 🔐" : "Sign Up 🎉"}
                    </Button>
                  </motion.div>
                </form>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 text-center text-gray-400"
                >
                  {isLogin
                    ? "Don't have an account? 🤔"
                    : "Already have an account? 😊"}{" "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setUsername("");
                      setPassword("");
                      setTouchedFields({ username: false, password: false });
                    }}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                  >
                    {isLogin ? "Sign Up 📝" : "Login 🚪"}
                  </button>
                </motion.p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
        {/* FlashCards Information Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full lg:w-1/2"
        >
          <div className="bg-gray-800 rounded-lg p-4 md:p-8 shadow-2xl">
            <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4 text-white flex items-center">
              🎯 FlashCards
            </h1>
            <p className="text-sm md:text-lg text-gray-300 mb-3 md:mb-6">
              A free flashcard app that just works. No ads, no accounts, no
              nonsense.
            </p>

            <div className="space-y-2 md:space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg md:text-2xl">✨</span>
                <h2 className="text-base md:text-xl font-semibold text-white">
                  Features
                </h2>
              </div>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-300">
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>Make unlimited cards & groups</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>Quiz yourself</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>Track your progress</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>Dark mode</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>Works on phone & desktop</span>
                </li>
              </ul>

              <div className="flex items-center space-x-2 mt-3 md:mt-6">
                <span className="text-lg md:text-2xl">❤️</span>
                <h2 className="text-base md:text-xl font-semibold text-white">
                  Free Forever
                </h2>
              </div>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-300">
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>No premium features</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>No ads</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>No account needed</span>
                </li>
                <li className="flex items-center space-x-1">
                  <Check className="text-green-500 w-4 h-4" />
                  <span>Just free, simple learning</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Auth;
