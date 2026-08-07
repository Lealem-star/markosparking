import './App.css';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout, NoPage, Register, GroupChat, FlaggedCustomers } from './pages/shared';
import AdminDashboard from './pages/admin/AdminDashboard';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';
import ValetDashboard from './pages/valet/ValetDashboard';
import ValetOverview from './pages/valet/ValetOverview';
import RegisterCar from './pages/valet/RegisterCar';
import ParkedCarsList from './pages/valet/ParkedCarsList';
import Profile from './pages/valet/Profile';
import PaymentSuccessHost from './components/PaymentSuccessHost/PaymentSuccessHost';
import StaffRouteGuard from './components/auth/StaffRouteGuard';
import { syncLanguageWithUser } from './utils/languageSync';
import { useCurrentUser } from './hooks/useAuth';
import { STAFF_PORTAL_PREFIXES } from './utils/rolePaths';
import {
  LegacyPaymentRedirect,
  LegacyStaffRedirect,
  LegacyUsersRedirect,
  PublicRoute,
  RootRedirect,
} from './routes/AppRoutes';
import {
  StaffDashboardPage,
  StaffUsersPage,
  StaffValetsPage,
  StaffAttendancePage,
  StaffIncidentsPage,
  StaffAuditLogsPage,
  StaffTransactionsPage,
  StaffFinanceAuditLogsPage,
  StaffReconciliationsPage,
  StaffShiftClosePage,
} from './routes/staffPortalPages';

const staffPortalRoutes = (prefix) => (
  <>
    <Route index element={<Navigate to={`/${prefix}/dashboard`} replace />} />
    <Route
      path="dashboard"
      element={
        <StaffRouteGuard permission="dashboard">
          <StaffDashboardPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="dashboard/profile"
      element={
        <StaffRouteGuard permission="dashboard">
          <StaffDashboardPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="users"
      element={<StaffUsersPage />}
    />
    <Route
      path="valets"
      element={
        <StaffRouteGuard permission="valets">
          <StaffValetsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="attendance"
      element={
        <StaffRouteGuard permission="attendance">
          <StaffAttendancePage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="incidents"
      element={
        <StaffRouteGuard permission="incidents">
          <StaffIncidentsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="reports"
      element={
        <StaffRouteGuard permission="reports">
          <Reports />
        </StaffRouteGuard>
      }
    />
    <Route
      path="settings"
      element={
        <StaffRouteGuard permission="settings">
          <Settings />
        </StaffRouteGuard>
      }
    />
    <Route
      path="audit-logs"
      element={
        <StaffRouteGuard permission="auditLogs">
          <StaffAuditLogsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="transactions"
      element={
        <StaffRouteGuard permission="transactions">
          <StaffTransactionsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="reconciliations"
      element={
        <StaffRouteGuard permission="reconciliations">
          <StaffReconciliationsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="finance-audit-logs"
      element={
        <StaffRouteGuard permission="financeAuditLogs">
          <StaffFinanceAuditLogsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="shift-close"
      element={
        <StaffRouteGuard permission="shiftClose">
          <StaffShiftClosePage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="chat"
      element={
        <StaffRouteGuard permission="chat">
          <GroupChat />
        </StaffRouteGuard>
      }
    />
    <Route
      path="flagged-customers"
      element={
        <StaffRouteGuard permission="flagged">
          <FlaggedCustomers />
        </StaffRouteGuard>
      }
    />
  </>
);

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
          <Route path="users" element={<LegacyUsersRedirect />} />
        </Route>
        {STAFF_PORTAL_PREFIXES.map((prefix) => (
          <Route key={prefix} path={`/${prefix}`} element={<AdminDashboard />}>
            {staffPortalRoutes(prefix)}
          </Route>
        ))}
        <Route path="/admin/*" element={<LegacyStaffRedirect />} />
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
