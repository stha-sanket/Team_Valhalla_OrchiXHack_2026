import LoginComponent from '../components/LoginComponent';
import ThemeToggle from '../components/ThemeToggle';

const LoginPage = () => {
  return (
    <div className="relative min-h-screen bg-stone-50 dark:bg-[#17140F] flex items-center justify-center p-4 selection:bg-highlight1 selection:text-black overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-linear-to-br from-highlight1/20 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-linear-to-bl from-highlight4/20 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[40%] rounded-full bg-linear-to-tr from-highlight2/10 to-transparent blur-[100px] animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      <ThemeToggle />
      <div className="z-10 w-full flex justify-center">
        <LoginComponent />
      </div>
    </div>
  );
};

export default LoginPage;
