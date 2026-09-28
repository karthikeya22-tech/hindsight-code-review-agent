import React from 'react';
import { 
  Brain, 
  FolderGit2, 
  Layers, 
  Cpu, 
  RefreshCw, 
  Sparkles, 
  PlusCircle, 
  History,
  Database,
  Code2,
  AlertTriangle
} from 'lucide-react';
import type { HealthResponse, ProjectContext, ActiveTab } from '../types/review';

interface HeaderProps {
  health: HealthResponse | null;
  project: ProjectContext | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenProjectModal: () => void;
  onOpenTeachModal: () => void;
  onRefreshHealth: () => void;
  memoriesCount: number;
  historyCount: number;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  project,
  activeTab,
  onTabChange,
  onOpenProjectModal,
  onOpenTeachModal,
  onRefreshHealth,
  memoriesCount,
  historyCount,
  isRefreshing = false,
}) => {
  const isHindsightOk = health?.hindsight_available ?? false;

  return (
    <header className="border-b border-edge/80 bg-ink/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      {/* Primary Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-glow-primary">
            <Brain className="w-5 h-5 animate-pulse-subtle" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-ink" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                CodeMind
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Memory Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Continuous code review with persistent Hindsight long-term memory
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-panel/90 border border-edge shadow-inner">
          <button
            onClick={() => onTabChange('workspace')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'workspace'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => onTabChange('memories')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'memories'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Memory Bank</span>
            {memoriesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeTab === 'memories' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-300'
              }`}>
                {memoriesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('project')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'project'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Project</span>
            {project && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeTab === 'history' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-300'
              }`}>
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Status & Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Hindsight Health Indicator */}
          <div
            title={health?.hindsight_message || (isHindsightOk ? 'Hindsight Memory is online' : 'Hindsight is offline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              isHindsightOk
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <span className={`relative flex h-2 w-2`}>
              {isHindsightOk && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isHindsightOk ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            </span>
            <span className="hidden md:inline">Hindsight</span>
            <span className="text-[11px] opacity-80">
              {health ? (isHindsightOk ? 'Connected' : 'Offline') : 'Checking…'}
            </span>
          </div>

          {/* Teach Button */}
          <button
            onClick={onOpenTeachModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600/90 hover:bg-violet-600 text-white shadow-sm transition-all hover:shadow-glow-violet active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="hidden sm:inline">Teach Convention</span>
            <span className="sm:hidden">Teach</span>
          </button>

          {/* Project Setup Button */}
          <button
            onClick={onOpenProjectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-edge bg-panel hover:bg-panel-subtle text-slate-200 hover:border-slate-600 transition-all active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{project ? 'Edit Project' : 'Project Setup'}</span>
          </button>

          {/* Refresh Health */}
          <button
            onClick={onRefreshHealth}
            disabled={isRefreshing}
            title="Refresh system status"
            className="p-1.5 rounded-lg border border-edge bg-panel hover:bg-panel-subtle text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Subheader Context Status Bar */}
      <div className="border-t border-edge/50 bg-[#080d17]/80 px-4 sm:px-6 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Active Project Pill */}
          <div className="flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Project:</span>
            {project ? (
              <span className="font-semibold text-slate-200 flex items-center gap-1">
                {project.project_name}
                <span className="text-[10px] font-normal text-slate-400">
                  ({project.technology_stack.slice(0, 2).join(', ')}{project.technology_stack.length > 2 ? '…' : ''})
                </span>
              </span>
            ) : (
              <button
                onClick={onOpenProjectModal}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                None configured (Click to setup)
              </button>
            )}
          </div>

          <span className="text-slate-600">•</span>

          {/* Memory Bank */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-slate-400">Bank:</span>
            <code className="text-violet-300 font-mono text-[11px] px-1.5 py-0.5 rounded bg-violet-950/40 border border-violet-800/40">
              {health?.hindsight_bank || 'codemind-team'}
            </code>
          </div>
        </div>

        {/* LLM Status Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Engine:</span>
            <span className={health?.llm_configured ? 'text-cyan-300 font-medium' : 'text-amber-400'}>
              {health?.llm_configured ? 'Configured' : 'Missing Key'}
            </span>
          </div>
        </div>
      </div>

      {/* Offline Alert Banner */}
      {health && !health.hindsight_available && (
        <div className="bg-rose-950/80 border-b border-rose-800/50 px-4 py-2 text-xs text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Hindsight Memory Service Unavailable:</strong> Reviews will continue without persistent team memory recall.
              {health.hindsight_message && <span className="opacity-80 ml-1">({health.hindsight_message})</span>}
            </span>
          </div>
          <button
            onClick={onRefreshHealth}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 text-xs font-medium border border-rose-700/60 shrink-0 transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}
    </header>
  );
};
