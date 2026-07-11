import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
      checked ? 'bg-crimson-500' : 'bg-stone-300 dark:bg-white/15'
    }`}
  >
    <span
      className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
        checked ? 'left-[calc(100%-1.625rem)]' : 'left-0.5'
      }`}
    />
  </button>
);

const SettingsPage = () => {
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState(() => localStorage.getItem('notifications') !== 'off');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('notifications', notifications ? 'on' : 'off');
  }, [notifications]);

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <header className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="Back to profile"
          className="shrink-0 w-10 h-10 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-stone-700 dark:text-stone-300 flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Settings</h1>
      </header>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
        Preferences
      </h2>
      <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 divide-y divide-stone-100 dark:divide-white/5 mb-8">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-white">Dark mode</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Easier on the eyes at night</p>
          </div>
          <Toggle checked={isDark} onChange={setIsDark} label="Dark mode" />
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-white">Notifications</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">Checkpoint and badge alerts</p>
          </div>
          <Toggle checked={notifications} onChange={setNotifications} label="Notifications" />
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-3">
        About
      </h2>
      <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 divide-y divide-stone-100 dark:divide-white/5">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-medium text-stone-900 dark:text-white">Version</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">0.1.0</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/privacy-policy')}
          className="w-full flex items-center justify-between px-5 py-4 text-left active:scale-[0.99] transition-transform"
        >
          <p className="text-sm font-medium text-stone-900 dark:text-white">Privacy policy</p>
          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
