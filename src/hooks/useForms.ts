import { useState, useEffect, useCallback } from 'react';
import { Form, FormStatus } from '../types';
import { apiService } from '../services/apiService';

export function useForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getForms(searchQuery, statusFilter);
      setForms(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const updateStatus = async (id: string, newStatus: FormStatus) => {
    await apiService.updateFormStatus(id, newStatus);
    await fetchForms();
  };

  const deleteForm = async (id: string) => {
    await apiService.deleteForm(id);
    await fetchForms();
  };

  return {
    forms,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refresh: fetchForms,
    updateStatus,
    deleteForm,
  };
}
