import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { FormsPage } from './pages/FormsPage';
import { FormNewPage } from './pages/FormNewPage';
import { FormBuilderPage } from './pages/FormBuilderPage';
import { FormVersionsPage } from './pages/FormVersionsPage';
import { PublicFormPage } from './pages/PublicFormPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { DomainsPage } from './pages/DomainsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth, AppRole } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SuperAgencyDashboardPage } from './pages/SuperAgencyDashboardPage';
import { AgencyDashboardPage } from './pages/AgencyDashboardPage';

function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles?: AppRole[];
  children: React.ReactElement;
}) {
  const { isAuthenticated, canAccess } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(allowedRoles)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}

function DashboardHomeRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'Super Admin') {
    return <Navigate to="/super-agency-dashboard" replace />;
  }

  if (user.role === 'User') {
    return <Navigate to="/dashboard/workspace" replace />;
  }

  return <Navigate to="/agency-dashboard" replace />;
}

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function AccessDeniedPage() {
  return (
    <div className="theme-app-shell min-h-screen flex items-center justify-center p-6">
      <div className="theme-card-title theme-surface-card border border-theme px-6 py-6 rounded-2xl shadow-sm text-center space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-theme-secondary">Access Denied</p>
        <h2 className="text-2xl font-black">You do not have permission to open this dashboard.</h2>
        <p className="text-sm theme-text-secondary">
          This area is restricted to your assigned role. Please log in with a permitted role or return to your dashboard.
        </p>
        <a href="/dashboard" className="inline-block mt-2 px-4 py-2 theme-button-primary rounded-lg text-sm font-bold">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Public Standalone Form Runtime */}
        <Route path="/f/:publicFormId" element={<PublicFormPage />} />
        <Route path="/p/:publicFormId" element={<PublicFormPage />} />

        {/* Fullscreen Form Builder Canvas */}
        <Route
          path="/forms/:id/builder"
          element={
            <RoleGuard children={<FormBuilderPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />
          }
        />

        {/* Standard Dashboard Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dashboard" element={<RoleGuard children={<DashboardHomeRoute />} allowedRoles={['Super Admin', 'Admin', 'Developer', 'User']} />} />
          <Route path="/dashboard/workspace" element={<RoleGuard children={<DashboardPage />} allowedRoles={['User']} />} />
          <Route
            path="/super-agency-dashboard"
            element={<RoleGuard children={<SuperAgencyDashboardPage />} allowedRoles={['Super Admin']} />}
          />
          <Route
            path="/agency-dashboard"
            element={<RoleGuard children={<AgencyDashboardPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />}
          />
          <Route path="/forms" element={<RoleGuard children={<FormsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer', 'User']} />} />
          <Route path="/forms/new" element={<RoleGuard children={<FormNewPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />} />
          <Route path="/forms/:id/versions" element={<RoleGuard children={<FormVersionsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />} />
          <Route path="/forms/:id/submissions" element={<RoleGuard children={<SubmissionsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer', 'User']} />} />
          <Route path="/submissions" element={<RoleGuard children={<SubmissionsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer', 'User']} />} />
          <Route path="/integrations" element={<RoleGuard children={<IntegrationsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />} />
          <Route path="/settings/integrations" element={<RoleGuard children={<IntegrationsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />} />
          <Route path="/domains" element={<RoleGuard children={<DomainsPage />} allowedRoles={['Super Admin', 'Admin']} />} />
          <Route path="/analytics" element={<RoleGuard children={<AnalyticsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer']} />} />
          <Route path="/settings" element={<RoleGuard children={<SettingsPage />} allowedRoles={['Super Admin', 'Admin', 'Developer', 'User']} />} />
          <Route path="*" element={<RoleGuard allowedRoles={['Super Admin', 'Admin', 'Developer', 'User']} children={<Navigate to="/dashboard" replace />} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
