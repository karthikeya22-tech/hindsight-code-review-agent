import React from 'react';
import { 
  FolderGit2, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Edit3, 
  PlusCircle, 
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import type { ProjectContext } from '../types/review';

interface ProjectViewProps {
  project: ProjectContext | null;
  onOpenProjectModal: () => void;
  statusMessage?: string;
}

export const ProjectView: React.FC<ProjectViewProps> = ({
  project,
  onOpenProjectModal,
  statusMessage,
}) => {
  if (!project) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center rounded-2xl border border-edge bg-panel/70 shadow-2xl animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-glow-primary">
          <FolderGit2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          No Active Project Onboarded
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed mb-6">
          CodeMind provides generic reviews until it understands your project’s architecture,
          technology stack, and team conventions. Once onboarded, Hindsight retains this knowledge permanently.
        </p>
        <button
          onClick={onOpenProjectModal}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-glow-primary transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Onboard Project Context Now</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Project Banner Card */}
      <div className="p-6 rounded-2xl border border-edge bg-gradient-to-r from-panel via-panel-subtle to-panel shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-primary">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {project.project_name}
              </h2>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Active Knowledge
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenProjectModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-panel border border-edge hover:border-slate-500 text-slate-200 hover:text-white transition-all shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Edit Project Knowledge</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-edge/60 text-xs text-indigo-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid: Architecture & Tech Stack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Technology Stack Card */}
        <div className="md:col-span-1 p-5 rounded-2xl border border-edge bg-panel space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-edge/80 pb-3">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h3>Technology Stack</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.technology_stack.map((tech, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-ink border border-edge text-indigo-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Architecture & Layering Card */}
        <div className="md:col-span-2 p-5 rounded-2xl border border-edge bg-panel space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-edge/80 pb-3">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3>Architecture & Boundary Rules</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-ink/60 p-4 rounded-xl border border-edge/60 font-mono">
            {project.architecture}
          </p>
        </div>
      </div>

      {/* Team Guidelines Card */}
      <div className="p-6 rounded-2xl border border-edge bg-panel space-y-4">
        <div className="flex items-center justify-between border-b border-edge/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3>Enforced Team Coding Guidelines</h3>
          </div>
          <span className="text-xs text-slate-400">
            {project.team_guidelines.length} active rules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {project.team_guidelines.map((rule, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-ink/60 border border-edge/60 flex items-start gap-2.5 text-xs text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{rule}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
