import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    const success = await login({
      email,
      password,
    });
    if (!success) {
      setError('Please enter valid email and password.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen theme-app-shell flex items-center justify-center p-6">
      <div className="w-full max-w-md theme-surface-card border border-theme rounded-2xl p-6 shadow-sm">
        <h1 className="text-center text-2xl font-black tracking-tight">FormFlow Agency Console</h1>
        <p className="text-center text-sm theme-text-muted mt-1">Sign in with your credentials.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide theme-text-muted mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2.5 text-sm theme-input rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide theme-text-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2.5 text-sm theme-input rounded-lg focus:outline-none"
            />
          </div>

          <button
            className="w-full mt-2 px-4 py-2.5 text-sm font-bold theme-button-primary rounded-lg disabled:opacity-50"
            disabled={isSubmitting}
          >
            Sign In
          </button>
        </form>

        {error && <p className="text-xs mt-4 theme-danger text-center">{error}</p>}

        <p className="text-[11px] mt-4 theme-text-muted text-center">
          Role and tenant are resolved from your authenticated account credentials.
        </p>
      </div>
    </div>
  );
};
