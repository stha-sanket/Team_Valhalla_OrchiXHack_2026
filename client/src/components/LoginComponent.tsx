import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLoginMutation } from "../store/api/authApi";

interface ApiErrorResponse {
  data?: { error?: string };
}

const LoginComponent = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const errorMessage = error ? (error as ApiErrorResponse).data?.error ?? "Something went wrong" : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password }).unwrap();
      navigate("/dashboard");
    } catch {
      // errorMessage above already reflects the failure
    }
  };

  return (
    <div className="relative bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md border border-white/50 dark:border-white/10 overflow-hidden transform transition-all hover:scale-[1.01] duration-500">
      {/* Decorative gradient orb inside the card */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-highlight1/30 dark:bg-highlight1/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-highlight4/20 dark:bg-highlight4/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative flex flex-col items-center mb-6 z-10">
        <img
          src="/full_logo.png"
          alt="ARadhana"
          className="w-48 object-contain"
        />
      </div>

      <form className="relative space-y-4 z-10" onSubmit={handleSubmit}>
        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md px-3 py-2">
            {errorMessage}
          </p>
        )}
        <div className="space-y-1.5">
          <label
            className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-stone-400 dark:placeholder-stone-500 shadow-sm group-hover:border-highlight1/50 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label
            className="block text-stone-700 dark:text-stone-300 text-sm font-semibold ml-1"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-md px-3 py-2 pr-10 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-stone-400 dark:placeholder-stone-500 shadow-sm group-hover:border-highlight1/50 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-highlight1 transition-colors"
            >
              {showPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full bg-highlight1 text-white font-medium text-sm py-2 rounded-md shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 hover:-translate-y-0.5 transition-all duration-300 mt-2 overflow-hidden group disabled:opacity-60 disabled:pointer-events-none"
        >
          <span className="relative z-10">{isLoading ? "Signing in..." : "Sign in"}</span>
          <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
        </button>
      </form>

      <div className="relative flex items-center my-5 z-10">
        <div className="flex-1 border-t border-stone-300 dark:border-stone-700"></div>
        <span className="px-4 text-stone-500 dark:text-stone-400 text-xs font-bold tracking-widest uppercase">
          Or
        </span>
        <div className="flex-1 border-t border-stone-300 dark:border-stone-700"></div>
      </div>

      <button
        type="button"
        className="relative w-full flex items-center justify-center space-x-3 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-white py-2 text-sm rounded-md hover:bg-stone-50 dark:hover:bg-white/10 transition-all duration-300 mb-4 shadow-sm group z-10"
      >
        <svg
          className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="font-semibold">Continue with Google</span>
      </button>

      <p className="relative text-center text-sm text-stone-600 dark:text-stone-400 font-medium z-10">
        Don't have an account?{" "}
        <Link
          to="/register"
          className="text-highlight3 dark:text-highlight1 font-bold hover:text-highlight1/80 transition-colors ml-1 underline decoration-transparent hover:decoration-current underline-offset-4"
        >
          Join ARadhana
        </Link>
      </p>
    </div>
  );
};

export default LoginComponent;
