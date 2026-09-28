import React, { useState, useEffect } from 'react';
import { X, FolderGit2, Sparkles, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import type { ProjectContext } from '../types/review';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectContext | null;
  onSave: (payload: {
    project_name: string;
    description: string;
    technology_stack: string[];
    architecture: string;
    team_guidelines: string[];
  }) => Promise<void>;
  isSaving: boolean;
  message?: string;
}

const TEMPLATES = [
  {
    name: 'E-Commerce Platform',
    desc: 'High-throughput marketplace platform handling customer orders, payments, and product catalogs.',
    stack: 'React, TypeScript, FastAPI, PostgreSQL, Redis, Docker',
    arch: 'React frontend -> FastAPI backend -> PostgreSQL. Business logic encapsulated in service layer; API routes stay strictly thin. Async Celery workers for payment webhooks.',
    guides: `Prefer early returns instead of deeply nested conditionals.
Avoid unnecessary abstractions; prioritize clarity and maintainability.
Keep API routes thin and move business logic into the service layer.
Validate input schemas at service boundaries before database transactions.
Never expose raw database models or passwords in API responses.`
  },
  {
    name: 'FinTech Payment Service',
    desc: 'Mission-critical payment orchestration service processing multi-currency transactions and audit trails.',
    stack: 'Python, FastAPI, SQLAlchemy, PostgreSQL, Kafka',
    arch: 'Event-driven microservice communicating via Kafka events. Idempotent payment processors with distributed locks.',
    guides: `Always enforce idempotency keys on payment mutation endpoints.
Use decimal types for currency amounts; never use floating point.
Log all transaction attempts with structured event telemetry.
Handle timeouts gracefully with circuit breakers.`
  }
];

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
  isSaving,
  message,
}) => {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [stack, setStack] = useState('');
  const [arch, setArch] = useState('');
  const [guides, setGuides] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.project_name || '');
      setDesc(project.description || '');
      setStack((project.technology_stack || []).join(', '));
      setArch(project.architecture || '');
      setGuides((project.team_guidelines || []).join('\n'));
    } else {
      setName('');
      setDesc('');
      setStack('');
      setArch('');
      setGuides('');
    }
    setValidationError('');
  }, [project, isOpen]);

  if (!isOpen) return null;

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setName(tpl.name);
    setDesc(tpl.desc);
    setStack(tpl.stack);
    setArch(tpl.arch);
    setGuides(tpl.guides);
    setValidationError('');
  }

  function splitList(raw: string): string[] {
    const out: string[] = [];
    for (const chunk of raw.split('\n')) {
      for (const part of chunk.split(',')) {
        const t = part.trim().replace(/^[-•*]\s*/, '');
        if (t) out.push(t);
      }
    }
    return out;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    const cleanStack = splitList(stack);
    const cleanGuides = splitList(guides);

    if (!name.trim()) {
      setValidationError('Project name is required.');
      return;
    }
    if (!desc.trim()) {
      setValidationError('Project description is required.');
      return;
    }
    if (cleanStack.length === 0) {
      setValidationError('Technology stack is required (at least one technology).');
      return;
    }
    if (!arch.trim()) {
      setValidationError('Architecture description is required.');
      return;
    }
    if (cleanGuides.length === 0) {
      setValidationError('At least one team coding guideline is required.');
      return;
    }

    await onSave({
      project_name: name.trim(),
      description: desc.trim(),
      technology_stack: cleanStack,
      architecture: arch.trim(),
      team_guidelines: cleanGuides,
    });
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-edge bg-panel shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-edge/80 px-6 py-4 sticky top-0 bg-panel/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {project ? 'Edit Project Knowledge' : 'Project Knowledge Onboarding'}
              </h2>
              <p className="text-xs text-slate-400">
                Stored permanently in Hindsight to provide deep context during code reviews.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates Bar */}
        <div className="px-6 pt-4 pb-2 bg-slate-900/50 border-b border-edge/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Quick Fill Templates:
            </span>
            <span className="text-[11px] text-slate-500">Click to populate sample guidelines</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="px-2.5 py-1 text-xs rounded-lg border border-edge bg-panel hover:bg-indigo-950/40 hover:border-indigo-700/50 text-slate-300 hover:text-indigo-200 transition-all flex items-center gap-1"
              >
                <Layers className="w-3 h-3 text-indigo-400" />
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-Commerce Platform"
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-edge text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the overall scope and business logic of this repository..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-edge text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Technology Stack <span className="text-rose-400">*</span>
              <span className="font-normal text-slate-500 ml-1.5">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="React, TypeScript, FastAPI, PostgreSQL, Docker"
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-edge text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Architecture & Layering Rules <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              value={arch}
              onChange={(e) => setArch(e.target.value)}
              placeholder="e.g. FastAPI routes must stay thin; business logic belongs in the service layer; repository pattern for DB access."
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-edge text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Team Coding Guidelines & Conventions <span className="text-rose-400">*</span>
              <span className="font-normal text-slate-500 ml-1.5">(one per line or comma-separated)</span>
            </label>
            <textarea
              rows={4}
              value={guides}
              onChange={(e) => setGuides(e.target.value)}
              placeholder={`Prefer early returns instead of deeply nested conditionals.
Avoid unnecessary abstractions.
Validate input schemas at service boundaries.
Keep API routes thin.`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-edge text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-edge/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-glow-primary transition-all disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Retaining to Hindsight…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{project ? 'Update Project Knowledge' : 'Save & Onboard Project'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
