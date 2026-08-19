const DEFAULT_API_BASE = '/api';

function normalizeCandidate(value: string): string | null {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      const pathname = (parsed.pathname || '/').replace(/\/+$/, '');
      if (!pathname || pathname === '/' || pathname === '/api') {
        return `${parsed.origin}/api`;
      }
      return `${parsed.origin}${pathname}/api`;
    } catch {
      return null;
    }
  }

  const path = raw.replace(/\/+$/, '');
  if (!path || path === '/') {
    return DEFAULT_API_BASE;
  }
  if (path === '/api') {
    return '/api';
  }
  return path.startsWith('/') ? `${path}/api` : `/${path}/api`;
}

function addCandidate(set: Set<string>, candidate: string | null) {
  if (!candidate) return;
  const normalized = candidate.trim().replace(/\/+$/, '');
  if (!normalized) return;
  set.add(normalized);
}

export function getApiBaseCandidates(): string[] {
  const candidates = new Set<string>();

  addCandidate(candidates, normalizeCandidate(String((import.meta.env as Record<string, unknown>).VITE_API_BASE_URL || '/api')));
  addCandidate(candidates, '/api');

  if (typeof window !== 'undefined') {
    const { origin, hostname, protocol, port } = window.location;
    addCandidate(candidates, `${origin}/api`);

    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '4450') {
      addCandidate(candidates, `${protocol}//${hostname}:4450/api`);
    }
  }

  return Array.from(candidates);
}

