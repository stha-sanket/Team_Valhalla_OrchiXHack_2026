import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useGetMeQuery, useLogoutMutation } from '../store/api/authApi';
import Dock from './Dock';
import { HomeIcon, CompassIcon, UserIcon, LogoutIcon, MapPinIcon } from './icons';

const AppLayout = () => {
  const { data } = useGetMeQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const isAdmin = data?.user.role === 'admin';
  const roleItem = isAdmin
    ? { icon: <MapPinIcon />, label: 'Waypoint Logger', path: '/admin/waypoint-logger' }
    : { icon: <CompassIcon />, label: 'Explore', path: '/explore' };

  const isExplore = location.pathname === '/explore';

  return (
    <div className={`min-h-screen ${isExplore ? '' : 'bg-stone-50 dark:bg-[#17140F]'}`}>
      <Outlet />
      <Dock
        items={[
          { icon: <HomeIcon />, label: 'Home', active: location.pathname === '/dashboard', onClick: () => navigate('/dashboard') },
          { icon: roleItem.icon, label: roleItem.label, active: location.pathname === roleItem.path, onClick: () => navigate(roleItem.path) },
          { icon: <UserIcon />, label: 'Profile', active: location.pathname === '/profile', onClick: () => navigate('/profile') },
          { icon: <LogoutIcon />, label: 'Sign out', onClick: handleLogout, disabled: isLoading },
        ]}
      />
    </div>
  );
};

export default AppLayout;
