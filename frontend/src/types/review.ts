export type Severity = 'critical' | 'important' | 'team_convention' | 'suggestion';

export interface ReviewIssue {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  reason: string;
  memory_based: boolean;
  memory_reference?: string | null;
}

export interface MemoryUsed {
  id?: string | null;
  text: string;
  type?: string | null;
  context?: string | null;
}

export interface ReviewResponse {
  review_id: string;
  summary: string;
  issues: ReviewIssue[];
  memories_used: MemoryUsed[];
  project_memories_used: MemoryUsed[];
  team_memories_used: MemoryUsed[];
  active_project?: ProjectContext | null;
  hindsight_available: boolean;
  hindsight_message?: string | null;
}

export interface HealthResponse {
  status: string;
  hindsight_available: boolean;
  hindsight_message: string;
  hindsight_bank: string;
  llm_configured: boolean;
  active_project?: string | null;
}

export interface ProjectContext {
  project_name: string;
  description: string;
  technology_stack: string[];
  architecture: string;
  team_guidelines: string[];
}

export interface ProjectResponse {
  success: boolean;
  message: string;
  hindsight_available: boolean;
  project?: ProjectContext | null;
}

export interface HistoryEntry {
  id: string;
  title: string;
  language: string;
  findings: number;
  at: string;
}

export type Phase = 'idle' | 'recalling' | 'reviewing' | 'done';
