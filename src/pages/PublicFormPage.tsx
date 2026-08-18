import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FormDefinition } from '../types';
import { apiService } from '../services/apiService';
import { submissionService } from '../services/submissionService';
import { FormRenderer } from '../components/builder/FormRenderer';
import {
  AlertTriangle,
  Loader2,
  Lock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileQuestion,
  ShieldCheck,
  X,
} from 'lucide-react';

export const PublicFormPage: React.FC = () => {
  const { publicFormId } = useParams<{ publicFormId: string }>();
  const [searchParams] = useSearchParams();

  const isEmbed = searchParams.get('embed') === 'true';
  const embedMode = searchParams.get('mode') || 'inline';
  const instanceId = searchParams.get('instanceId') || '';

  const [form, setForm] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // PostMessage Helper for parent host window
  const postToParent = (payload: Record<string, any>) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ ...payload, instanceId, formId: publicFormId }, '*');
    }
  };

  // Resize Observer for dynamic iframe height adaptation
  useEffect(() => {
    if (!isEmbed || !containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.ceil(entry.contentRect.height);
        if (height > 0) {
          postToParent({ type: 'formflow:height', height: height + 40 });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isEmbed, form, submitted]);

  // Extract UTM parameters and referrer metadata safely without invasive tracking
  const utmParameters = {
    utm_source: searchParams.get('utm_source') || undefined,
    utm_medium: searchParams.get('utm_medium') || undefined,
    utm_campaign: searchParams.get('utm_campaign') || undefined,
    utm_term: searchParams.get('utm_term') || undefined,
    utm_content: searchParams.get('utm_content') || undefined,
  };

  const referrer = typeof document !== 'undefined' ? document.referrer : '';
  const sourceUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    let isMounted = true;

    async function loadPublicForm() {
      if (!publicFormId) {
        setError('No form ID provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const formDef = await apiService.getPublishedFormDefinition(publicFormId);
        if (!isMounted) return;

        if (!formDef) {
          setError('This form has not been published yet or is currently unavailable.');
          postToParent({ type: 'formflow:error', error: 'Form not published' });
        } else {
          setForm(formDef);
          // Record view event for metric tracking
          apiService.recordFormView(publicFormId).catch(() => {});
          // Dispatch loaded event to host
          postToParent({ type: 'formflow:loaded' });
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err?.message || 'Unable to load public form definition.';
        setError(msg);
        postToParent({ type: 'formflow:error', error: msg });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPublicForm();

    return () => {
      isMounted = false;
    };
  }, [publicFormId]);

  const handleSubmitResponse = async (submittedData: Record<string, any>) => {
    if (!publicFormId || !form) return;

    setSubmitting(true);
    try {
      const res = await submissionService.submitForm({
        formId: publicFormId,
        fields: submittedData,
        formVersionId: form.version || 1,
        metadata: {
          referrer,
          sourceUrl,
          utmParameters,
        },
      });
      setSubmitted(true);
      postToParent({ type: 'formflow:submitted', submissionId: res.submissionId });
    } catch (err: any) {
      const msg = err?.message || 'Submission failed. Please check inputs and try again.';
      postToParent({ type: 'formflow:error', error: msg });
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEmbed = () => {
    postToParent({ type: 'formflow:close' });
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <h2 className="text-sm font-bold text-slate-800">Loading Form...</h2>
          <p className="text-xs text-slate-500">Preparing secure interactive runtime</p>
        </div>
      </div>
    );
  }

  // 2. Error State (Not Found, Archived, or Fetch Failure)
  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Form Unavailable</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {error || 'The form you are looking for does not exist or has been unpublished.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Determine dynamic container styling based on theme
  const bgColor = form.theme?.backgroundColor || '#f8fafc';
  const primaryColor = form.theme?.primaryColor || '#2563eb';

  // If embedded in iframe
  if (isEmbed) {
    return (
      <div
        ref={containerRef}
        className="w-full bg-white p-4 sm:p-6 rounded-2xl font-sans antialiased relative space-y-4 shadow-sm border border-slate-100"
      >
        {embedMode !== 'inline' && (
          <button
            onClick={handleCloseEmbed}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition-colors z-10"
            title="Close Form"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-1 border-b border-slate-100 pb-3 pr-8">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {form.name}
          </h1>
          {form.description && (
            <p className="text-xs text-slate-500 leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        <FormRenderer
          definition={form}
          onSubmitSubmit={handleSubmitResponse}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 font-sans antialiased transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      {/* Lightweight Top Header Branding */}
      <header className="w-full max-w-2xl flex items-center justify-between pb-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs">
            F
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight">
            FormFlow
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure Submission</span>
        </div>
      </header>

      {/* Main Standalone Form Card */}
      <main className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8 md:p-10 space-y-6">
        {/* Form Title & Description Header */}
        <div className="space-y-2 border-b border-slate-100 pb-5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {form.name}
          </h1>
          {form.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {form.description}
            </p>
          )}
        </div>

        {/* Dynamic Form Renderer */}
        <FormRenderer
          definition={form}
          onSubmitSubmit={handleSubmitResponse}
        />
      </main>

      {/* Footer Powered By FormFlow */}
      <footer className="w-full max-w-2xl pt-8 pb-4 text-center space-y-2">
        <p className="text-[11px] text-slate-500 font-medium">
          Powered by{' '}
          <a
            href="/"
            className="font-bold text-slate-800 hover:text-blue-600 transition-colors"
          >
            FormFlow Engine
          </a>{' '}
          • High Performance Public Runtime
        </p>
      </footer>
    </div>
  );
};
