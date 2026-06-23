import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout, NoPage, Register, GroupChat, FlaggedCustomers } from './pages/shared';
import AdminDashboard from './pages/admin/AdminDashboard';
import DashboardOverview from './pages/admin/DashboardOverview';
import UserManagement from './pages/admin/UserManagement';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';
import ValetDashboard from './pages/valet/ValetDashboard';
import ValetOverview from './pages/valet/ValetOverview';
import RegisterCar from './pages/valet/RegisterCar';
import ParkedCarsList from './pages/valet/ParkedCarsList';
import Profile from './pages/valet/Profile';
import PaymentSuccessHost from './components/PaymentSuccessHost/PaymentSuccessHost';
import { syncLanguageWithUser } from './utils/languageSync';
import { useCurrentUser } from './hooks/useAuth';
import { LegacyPaymentRedirect, PublicRoute, RootRedirect } from './routes/AppRoutes';

function App() {
  const user = useCurrentUser();

  useEffect(() => {
    if (user?.language) {
      syncLanguageWithUser(user.language);
    }
  }, [user?.language]);

  return (
    <BrowserRouter>
      <PaymentSuccessHost />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RootRedirect />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users" element={<Navigate to="/admin/users" replace />} />
        </Route>
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<DashboardOverview />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="dashboard/profile" element={<DashboardOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="chat" element={<GroupChat />} />
          <Route path="flagged-customers" element={<FlaggedCustomers />} />
        </Route>
        <Route path="/valet" element={<ValetDashboard />}>
          <Route index element={<ParkedCarsList />} />
          <Route path="dashboard" element={<ParkedCarsList />} />
          <Route path="register-car" element={<RegisterCar />} />
          <Route path="cars" element={<ValetOverview />} />
          <Route path="profile" element={<Profile />} />
          <Route path="chat" element={<GroupChat />} />
          <Route path="flagged-customers" element={<FlaggedCustomers />} />
        </Route>
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route
          path="register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="payment/success" element={<LegacyPaymentRedirect />} />
        <Route path="payment/callback" element={<LegacyPaymentRedirect />} />
        <Route path="*" element={<NoPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
