import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Standalone Form Runtime */}
        <Route path="/f/:publicFormId" element={<PublicFormPage />} />
        <Route path="/p/:publicFormId" element={<PublicFormPage />} />

        {/* Fullscreen Form Builder Canvas */}
        <Route path="/forms/:id/builder" element={<FormBuilderPage />} />

        {/* Standard Dashboard Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forms" element={<FormsPage />} />
          <Route path="/forms/new" element={<FormNewPage />} />
          <Route path="/forms/:id/versions" element={<FormVersionsPage />} />
          <Route path="/forms/:id/submissions" element={<SubmissionsPage />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
