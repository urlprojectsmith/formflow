import { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics, Form, FormSubmission, Integration } from '../types';
import { apiService } from '../services/apiService';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<FormSubmission[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, formsData, submissionsData, integrationsData] = await Promise.all([
        apiService.getDashboardMetrics(),
        apiService.getForms(),
        apiService.getSubmissions(),
        apiService.getIntegrations(),
      ]);

      setMetrics(metricsData);
      setRecentForms(formsData.slice(0, 5));
      setRecentSubmissions(submissionsData.slice(0, 5));
      setIntegrations(integrationsData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const toggleFormStatus = async (formId: string, currentStatus: 'published' | 'draft' | 'archived') => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    await apiService.updateFormStatus(formId, nextStatus);
    await fetchDashboardData();
  };

  return {
    metrics,
    recentForms,
    recentSubmissions,
    integrations,
    loading,
    error,
    refresh: fetchDashboardData,
    toggleFormStatus,
  };
}
