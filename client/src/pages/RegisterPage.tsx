import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 selection:bg-highlight1 selection:text-black overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tl from-highlight1/20 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '9s' }}></div>
        <div className="absolute top-[10%] -left-[10%] w-[35%] h-[45%] rounded-full bg-gradient-to-br from-highlight5/20 to-transparent blur-[110px] animate-pulse" style={{ animationDuration: '11s' }}></div>
      </div>

      <ThemeToggle />

      <div className="z-10 relative bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-10 rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md border border-white/50 dark:border-white/10 overflow-hidden transform transition-all hover:scale-[1.01] duration-500 my-8">
        
        {/* Decorative gradient orb inside the card */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-highlight2/30 dark:bg-highlight2/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col items-center mb-8 z-10">
          <div className="w-16 h-16 bg-highlight1 rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-highlight1/20 border border-white/20">
              <svg className="w-8 h-8 text-black drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-4.5l-1.5-3h-2l-1.5 3H5a2 2 0 0 1-2-2v-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14h6" opacity="0.5"/>
              </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">ARadhana</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Enter the AR dimension. Create an account.</p>
        </div>

        <form className="relative space-y-4 z-10">
          <div className="space-y-1.5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="name">
              Full Name
            </label>
            <input 
              type="text" 
              id="name"
              placeholder="John Doe"
              className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="username">
                Username
              </label>
              <input 
                type="text" 
                id="username"
                placeholder="johndoe88"
                className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="phone">
                Phone Number
              </label>
              <input 
                type="tel" 
                id="phone"
                placeholder="+1 234 567 890"
                className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="email">
              Email Address
            </label>
            <input 
              type="email" 
              id="email"
              placeholder="name@example.com"
              className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-highlight1 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="confirmPassword">
              Confirm
            </label>
            <div className="relative group">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                placeholder="••••••••"
                className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-highlight1 transition-colors"
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className="relative w-full bg-highlight1 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 hover:-translate-y-0.5 transition-all duration-300 mt-6 overflow-hidden group"
          >
            <span className="relative z-10">Submit Application</span>
            <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></div>
          </button>
        </form>

        <div className="relative flex items-center my-6 z-10">
          <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
          <span className="px-4 text-gray-500 dark:text-gray-400 text-xs font-bold tracking-widest uppercase">Or</span>
          <div className="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
        </div>

        <button type="button" onClick={() => setShowGoogleModal(true)} className="relative w-full flex items-center justify-center space-x-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 mb-6 shadow-sm group z-10">
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="font-semibold">Sign up with Google</span>
        </button>

        <p className="relative text-center text-sm text-gray-600 dark:text-gray-400 font-medium z-10">
          Already a member? <Link to="/login" className="text-highlight3 dark:text-highlight1 font-bold hover:text-highlight1/80 transition-colors ml-1 underline decoration-transparent hover:decoration-current underline-offset-4">Sign in</Link>
        </p>
      </div>

      {/* Google Signup Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white/90 dark:bg-black/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/20 dark:border-white/10 transform transition-all scale-100">
            <button 
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Almost there!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">We just need a bit more info to set up your ARadhana profile.</p>
            </div>

            <form className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="modal-username">
                  Username
                </label>
                <input 
                  type="text" 
                  id="modal-username"
                  placeholder="johndoe88"
                  className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold ml-1" htmlFor="modal-phone">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  id="modal-phone"
                  placeholder="+1 234 567 890"
                  className="w-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-highlight1 focus:ring-2 focus:ring-highlight1/50 transition-all placeholder-gray-400 shadow-sm"
                />
              </div>

              <button 
                type="button" 
                className="w-full bg-highlight1 text-black font-bold py-3.5 rounded-xl shadow-lg hover:shadow-highlight1/40 hover:-translate-y-0.5 transition-all duration-300 mt-6"
                onClick={() => setShowGoogleModal(false)}
              >
                Complete Registration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
