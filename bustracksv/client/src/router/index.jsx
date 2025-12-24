import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/protected/ProtectedRoute';

// Page Components
import IndexPage from '../components/pages/index/IndexPage';
import AboutPage from '../components/pages/about/AboutPage';
import FeaturesPage from '../components/pages/features/FeaturesPage';
import LoginPage from '../components/pages/login/LoginPage';
import RegisterPage from '../components/pages/register/RegisterPage';
import DashboardPage from '../components/pages/dashboard/DashboardPage';
import MapPage from '../components/pages/map/MapPage';
import ProfilePage from '../components/pages/profile/ProfilePage';

// Admin Components
import AdminLoginPage from '../components/pages/admin/AdminLoginPage';
import AdminDashboardPage from '../components/pages/admin/AdminDashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <IndexPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/features',
    element: <FeaturesPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
    ),
  },
  {
    path: '/map',
    element: (
      <ProtectedRoute>
        <MapPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/perfil',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboardPage />,
  },
  {
    path: '*',
    element: <IndexPage />, // Fallback to home page
  },
]);
