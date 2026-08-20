import './App.css';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './pages/shared/Layout';
import StaffRouteGuard from './components/auth/StaffRouteGuard';
import PaymentSuccessHost from './components/PaymentSuccessHost/PaymentSuccessHost';
import DashboardContentLoader from './components/loading/DashboardContentLoader';
import { syncLanguageWithUser } from './utils/languageSync';
import { useCurrentUser } from './hooks/useAuth';
import { STAFF_PORTAL_PREFIXES, PARKING_OFFICER_PORTAL_PREFIX } from './utils/rolePaths';
import {
  LegacyPaymentRedirect,
  LegacyPrefixRedirect,
  LegacyStaffRedirect,
  LegacyUsersRedirect,
  PublicRoute,
  RootRedirect,
} from './routes/AppRoutes';
import {
  StaffDashboardPage,
  StaffUsersPage,
  StaffParkingOfficersPage,
  StaffAttendancePage,
  StaffIncidentsPage,
  StaffIncidentReportsPage,
  StaffAttendanceReportsPage,
  StaffAuditLogsPage,
  StaffTransactionsPage,
  StaffFinanceAuditLogsPage,
} from './routes/staffPortalPages';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const ParkingOfficerDashboard = lazy(() => import('./pages/parkingOfficer/ParkingOfficerDashboard'));
const ParkingOfficerOverview = lazy(() => import('./pages/parkingOfficer/ParkingOfficerOverview'));
const RegisterCar = lazy(() => import('./pages/parkingOfficer/RegisterCar'));
const ParkedCarsList = lazy(() => import('./pages/parkingOfficer/ParkedCarsList'));
const Profile = lazy(() => import('./pages/parkingOfficer/Profile'));
const GroupChat = lazy(() => import('./pages/shared/GroupChat'));
const FlaggedCustomers = lazy(() => import('./pages/shared/FlaggedCustomers'));
const Register = lazy(() => import('./pages/shared/Register'));
const NoPage = lazy(() => import('./pages/shared/NoPage'));

const page = (element) => (
  <Suspense fallback={<DashboardContentLoader />}>
    {element}
  </Suspense>
);

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
    <Route path="users" element={<StaffUsersPage />} />
    <Route path="valets" element={<Navigate to="parking-officers" replace />} />
    <Route
      path="parking-officers"
      element={
        <StaffRouteGuard permission="parkingOfficers">
          <StaffParkingOfficersPage />
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
          {page(<Reports />)}
        </StaffRouteGuard>
      }
    />
    <Route
      path="incident-reports"
      element={
        <StaffRouteGuard permission="incidentReports">
          <StaffIncidentReportsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="attendance-reports"
      element={
        <StaffRouteGuard permission="attendanceReports">
          <StaffAttendanceReportsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="settings"
      element={
        <StaffRouteGuard permission="settings">
          {page(<Settings />)}
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
      path="finance-audit-logs"
      element={
        <StaffRouteGuard permission="financeAuditLogs">
          <StaffFinanceAuditLogsPage />
        </StaffRouteGuard>
      }
    />
    <Route
      path="chat"
      element={
        <StaffRouteGuard permission="chat">
          {page(<GroupChat />)}
        </StaffRouteGuard>
      }
    />
    <Route
      path="flagged-customers"
      element={
        <StaffRouteGuard permission="flagged">
          {page(<FlaggedCustomers />)}
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
          <Route path="profile" element={page(<Profile />)} />
          <Route path="users" element={<LegacyUsersRedirect />} />
        </Route>
        {STAFF_PORTAL_PREFIXES.map((prefix) => (
          <Route
            key={prefix}
            path={`/${prefix}`}
            element={page(<AdminDashboard />)}
          >
            {staffPortalRoutes(prefix)}
          </Route>
        ))}
        <Route path="/admin/*" element={<LegacyStaffRedirect />} />
        <Route
          path={`/${PARKING_OFFICER_PORTAL_PREFIX}`}
          element={page(<ParkingOfficerDashboard />)}
        >
          <Route index element={page(<ParkedCarsList />)} />
          <Route path="dashboard" element={page(<ParkedCarsList />)} />
          <Route path="register-car" element={page(<RegisterCar />)} />
          <Route path="cars" element={page(<ParkingOfficerOverview />)} />
          <Route path="profile" element={page(<Profile />)} />
          <Route path="chat" element={page(<GroupChat />)} />
          <Route path="flagged-customers" element={page(<FlaggedCustomers />)} />
        </Route>
        <Route path="/valet/*" element={<LegacyPrefixRedirect />} />
        <Route path="/director/*" element={<LegacyPrefixRedirect />} />
        <Route path="login" element={<Navigate to="/" replace />} />
        <Route
          path="register"
          element={
            <PublicRoute>
              {page(<Register />)}
            </PublicRoute>
          }
        />
        <Route path="payment/success" element={<LegacyPaymentRedirect />} />
        <Route path="payment/callback" element={<LegacyPaymentRedirect />} />
        <Route path="*" element={page(<NoPage />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
