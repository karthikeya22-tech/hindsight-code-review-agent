import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Sparkles, 
  Brain, 
  Copy, 
  Check, 
  Filter, 
  RefreshCw,
  PlusCircle,
  Tag,
  Info
} from 'lucide-react';
import type { MemoryUsed } from '../types/review';

interface MemoryBankViewProps {
  memories: MemoryUsed[];
  onOpenTeach: () => void;
  onRefreshMemories: () => void;
  isRefreshing?: boolean;
  statusMessage?: string;
  bankId?: string;
}

export const MemoryBankView: React.FC<MemoryBankViewProps> = ({
  memories,
  onOpenTeach,
  onRefreshMemories,
  isRefreshing = false,
  statusMessage,
  bankId = 'codemind-team',
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Filter memories
  const filtered = memories.filter((m) => {
    const textMatch = m.text.toLowerCase().includes(search.toLowerCase()) ||
      (m.type && m.type.toLowerCase().includes(search.toLowerCase())) ||
      (m.context && m.context.toLowerCase().includes(search.toLowerCase()));

    if (!textMatch) return false;

    if (filterType === 'convention') {
      return (m.context || '').includes('convention') || (m.type || '').includes('convention');
    }
    if (filterType === 'feedback') {
      return (m.context || '').includes('decision') || (m.text || '').includes('accepted') || (m.text || '').includes('rejected');
    }
    if (filterType === 'project') {
      return (m.context || '').includes('project') || (m.type || '').includes('project');
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl border border-edge bg-gradient-to-r from-panel via-panel-subtle to-panel shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-glow-violet">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Hindsight Memory Bank
              </h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-800/40">
                {bankId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent long-term memory retained from team teachings, architecture guidelines, and review feedback.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshMemories}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-edge bg-ink hover:bg-white/5 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenTeach}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-glow-violet transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Teach Convention</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-edge/60 text-xs text-slate-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-violet-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-edge bg-panel/80">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learned memories by keyword, rule, or tag..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-ink border border-edge text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All ({memories.length})
          </button>
          <button
            onClick={() => setFilterType('convention')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'convention'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Conventions
          </button>
          <button
            onClick={() => setFilterType('feedback')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'feedback'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Review Decisions
          </button>
          <button
            onClick={() => setFilterType('project')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterType === 'project'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Project Knowledge
          </button>
        </div>
      </div>

      {/* Memory Items List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-edge bg-panel/40">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Memories Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {search 
                ? 'No retained memories match your search filter.' 
                : 'Your Hindsight memory bank is currently empty. Teach CodeMind a preference to get started!'}
            </p>
            <button
              onClick={onOpenTeach}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Teach CodeMind Now</span>
            </button>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl border border-edge bg-panel hover:border-violet-500/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0 mt-0.5">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {item.text}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.context && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                          <Tag className="w-3 h-3" />
                          {item.context}
                        </span>
                      )}
                      {item.type && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                          type: {item.type}
                        </span>
                      )}
                      {item.id && (
                        <span className="text-[10px] text-slate-600 font-mono">
                          #{item.id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(item.text, idx)}
                  className="p-2 rounded-lg border border-edge/60 bg-ink/60 text-slate-400 hover:text-white transition-all shrink-0 opacity-80 group-hover:opacity-100"
                  title="Copy memory text"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
