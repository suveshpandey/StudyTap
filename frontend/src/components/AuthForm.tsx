// -----------------------------------------------------------------------------
// File: AuthForm.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Reusable authentication form component for login and signup
// -----------------------------------------------------------------------------

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User } from "lucide-react";

interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (data: { name?: string; email: string; password: string }) => void;
  isLoading?: boolean;
}

const AuthForm = ({ isLogin, onSubmit, isLoading = false }: AuthFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const inputClasses =
    "w-full px-4 py-3 bg-white/90 backdrop-blur-lg border border-gray-300 rounded-xl text-gray-800 " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  const labelClasses =
    "block text-sm font-medium text-gray-600 mb-1 tracking-wide";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const buttonLabel = isLogin ? "Sign In" : "Create Account";
  const loadingLabel = isLogin ? "Signing you in..." : "Creating your account...";

  return (
    <motion.form
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {!isLogin && (
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="name" className={labelClasses}>
            Full Name
          </label>
          <div className="relative">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/80 pointer-events-none z-10"
            />
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`${inputClasses} pl-12 relative z-0`}
              placeholder="Your full name"
            />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18 }}
      >
        <label htmlFor="email" className={labelClasses}>
          Email Address
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/80 pointer-events-none z-10"
          />
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={`${inputClasses} pl-12 relative z-0`}
            placeholder="student@example.com"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label htmlFor="password" className={labelClasses}>
          Password
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/80 pointer-events-none z-10"
          />
          <input
            id="password"
            type="password"
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={`${inputClasses} pl-12 relative z-0`}
            placeholder="Enter your password"
          />
        </div>
      </motion.div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 
        text-white font-semibold text-lg rounded-xl shadow-md
        hover:from-blue-700 hover:to-indigo-700
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-2"
      >
        {isLoading && (
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        )}
        <span>{isLoading ? loadingLabel : buttonLabel}</span>
      </button>
    </motion.form>
  );
};

export default AuthForm;
