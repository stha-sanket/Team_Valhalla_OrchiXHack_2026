import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import PathfinderPage from "./pages/PathfinderPage";
import WaypointLoggerPage from "./pages/admin/WaypointLoggerPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
      {
        path: "/explore",
        element: (
          // <ProtectedRoute roles={["user", "admin"]}>
          //   <PathfinderPage />
          // </ProtectedRoute>
          <PathfinderPage />
        ),
      },
      {
        path: "/admin/waypoint-logger",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <WaypointLoggerPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
