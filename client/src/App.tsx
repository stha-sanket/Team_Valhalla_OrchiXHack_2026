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
import PeoplePage from "./pages/PeoplePage";
import QuizPage from "./pages/QuizPage";
import RedeemPage from "./pages/RedeemPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import WaypointLoggerPage from "./pages/admin/WaypointLoggerPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
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
      // User features — admins are bounced to /admin by ProtectedRoute.
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute roles={["user"]}>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute roles={["user"]}>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/explore",
        element: (
          <ProtectedRoute roles={["user"]}>
            <PathfinderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/redeem",
        element: (
          <ProtectedRoute roles={["user"]}>
            <RedeemPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/quiz/:placeId",
        element: (
          <ProtectedRoute roles={["user"]}>
            <QuizPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/people",
        element: (
          <ProtectedRoute roles={["user"]}>
            <PeoplePage />
          </ProtectedRoute>
        ),
      },
      // Public profiles are viewable by everyone who is signed in, admins included.
      { path: "/people/:id", element: <PublicProfilePage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/privacy-policy", element: <PrivacyPolicyPage /> },
      // Admin features
      {
        path: "/admin",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/admin/users",
        element: (
          <ProtectedRoute roles={["admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
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
