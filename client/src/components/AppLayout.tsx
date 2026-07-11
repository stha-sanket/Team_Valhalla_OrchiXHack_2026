import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useGetMeQuery, useLogoutMutation } from '../store/api/authApi';
import Dock from './Dock';
import { HomeIcon, CompassIcon, UserIcon, LogoutIcon, MapPinIcon } from './icons';

const AppLayout = () => {
  const { data } = useGetMeQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowSignOutConfirm(false);
    navigate('/login', { replace: true });
  };

  const isAdmin = data?.user.role === 'admin';
  const roleItem = isAdmin
    ? { icon: <MapPinIcon />, label: 'Waypoint Logger', path: '/admin/waypoint-logger' }
    : { icon: <CompassIcon />, label: 'Explore', path: '/explore' };

  const isExplore = location.pathname === '/explore';
  // The pathfinder switches to ?ar=1 while the AR camera view is active — it
  // renders its own back button there, so the dock stays out of the way.
  const inAR = isExplore && new URLSearchParams(location.search).get('ar') === '1';

  return (
    <div className={`min-h-screen ${isExplore ? '' : 'bg-stone-50 dark:bg-[#17140F]'}`}>
      <Outlet />
      {!inAR && <Dock
        items={[
          { icon: <HomeIcon />, label: 'Home', active: location.pathname === '/dashboard', onClick: () => navigate('/dashboard') },
          { icon: roleItem.icon, label: roleItem.label, active: location.pathname === roleItem.path, onClick: () => navigate(roleItem.path) },
          { icon: <UserIcon />, label: 'Profile', active: location.pathname === '/profile', onClick: () => navigate('/profile') },
          { icon: <LogoutIcon />, label: 'Sign out', onClick: () => setShowSignOutConfirm(true), disabled: isLoading },
        ]}
      />}

      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            className="w-full max-w-md bg-white/95 dark:bg-[#1E1A14]/95 backdrop-blur-2xl rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.3)] border-t border-white/50 dark:border-white/10 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-5" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Sign out?</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-5">
              You'll need to log in again to see your trips and badges.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-full border border-stone-300 dark:border-white/15 text-stone-700 dark:text-stone-300 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-60"
              >
                {isLoading ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
