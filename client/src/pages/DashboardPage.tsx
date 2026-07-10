import { useNavigate } from 'react-router-dom';
import { useGetMeQuery, useLogoutMutation } from '../store/api/authApi';

const DashboardPage = () => {
  const { data } = useGetMeQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#17140F] flex items-center justify-center p-4">
      <div className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] w-full max-w-md border border-white/50 dark:border-white/10 text-center">
        <img src="/logo_icon.png" alt="ARadhana" className="w-16 h-16 object-contain mx-auto mb-4" />
        <h1 className="text-xl font-bold text-stone-900 dark:text-white mb-1">Welcome back</h1>
        <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{data?.user.email}</p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full bg-highlight1 text-white font-medium text-sm py-2 rounded-md shadow-lg shadow-highlight1/30 hover:shadow-highlight1/50 transition-all duration-300 disabled:opacity-60"
        >
          {isLoading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
