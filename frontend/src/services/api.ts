import type { HealthResponse, MemoryUsed, ProjectContext, ProjectResponse, ReviewResponse } from '../types/review';

const BASE = '';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((body as { detail?: string }).detail || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => req<HealthResponse>('/api/health'),
  review: (code: string, language: string, context?: string) =>
    req<ReviewResponse>('/api/review', {
      method: 'POST',
      body: JSON.stringify({ code, language, context: context || null }),
    }),
  teach: (content: string) =>
    req<{ success: boolean; message: string; hindsight_available: boolean }>('/api/memory/teach', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  feedback: (payload: {
    review_id: string;
    issue_id: string;
    decision: 'accepted' | 'rejected';
    comment?: string;
    issue_title?: string;
    issue_recommendation?: string;
    language?: string;
  }) =>
    req<{ success: boolean; message: string; hindsight_available: boolean }>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  memories: () =>
    req<{ memories: MemoryUsed[]; hindsight_available: boolean; message?: string | null }>(
      '/api/memory',
    ),
  getProject: () =>
    req<{ project?: ProjectContext | null; hindsight_available: boolean; message?: string | null }>(
      '/api/project',
    ),
  saveProject: (payload: {
    project_name: string;
    description: string;
    technology_stack: string[];
    architecture: string;
    team_guidelines: string[];
  }) =>
    req<ProjectResponse>('/api/project', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
