import React from 'react';
import { 
  History, 
  FileCode, 
  Calendar, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import type { HistoryEntry } from '../types/review';

interface HistoryViewProps {
  history: HistoryEntry[];
  onSelectReview: (entry: HistoryEntry) => void;
  onClearHistory?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectReview,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-edge bg-gradient-to-r from-panel via-panel-subtle to-panel shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-primary">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Review Session History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse reviews run during this session. Click any entry to inspect findings or reload its code into the workspace.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-400 px-3 py-1 rounded-xl bg-ink border border-edge">
          {history.length} reviews
        </span>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-edge bg-panel/40">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Reviews in Session</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              When you run code reviews, they will appear here so you can compare outputs before and after teaching Hindsight.
            </p>
          </div>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-xl border border-edge bg-panel hover:border-indigo-500/40 transition-all flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-ink border border-edge text-indigo-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {entry.title}
                    </h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300">
                      {entry.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {entry.at}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-amber-300">
                      <ShieldAlert className="w-3 h-3 text-amber-400" />
                      {entry.findings} findings
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectReview(entry)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-sm transition-all active:scale-95"
              >
                <span>Inspect in Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Demo Flow Guide Card */}
      <div className="p-5 rounded-2xl border border-edge/80 bg-slate-950/60 text-xs text-slate-300 space-y-3">
        <div className="flex items-center gap-2 font-bold text-indigo-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Recommended Interactive Demo Walkthrough</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-ink/70 border border-edge/60">
            <span className="font-semibold text-white block mb-1">① Onboard Context</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open <strong>Project Setup</strong> and create or verify the E-Commerce Platform project with guidelines.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-ink/70 border border-edge/60">
            <span className="font-semibold text-white block mb-1">② Review “Route ⚡”</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Load the FastAPI Route sample. CodeMind flags direct DB commits as an architectural boundary violation.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-ink/70 border border-edge/60">
            <span className="font-semibold text-white block mb-1">③ Teach New Rule</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click <strong>Teach Convention</strong> to teach “early returns instead of nested ifs”.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-ink/70 border border-edge/60">
            <span className="font-semibold text-white block mb-1">④ Review Sample 2</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Run review on Sample 2. CodeMind flags it based on your newly learned Hindsight memory!
            </p>
          </div>

          <div className="p-3 rounded-xl bg-ink/70 border border-edge/60">
            <span className="font-semibold text-white block mb-1">⑤ Submit Feedback</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Click <strong>Accept</strong> or <strong>Reject</strong> with an optional note to reinforce team preferences.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-ink/70 border border-edge/60">
            <span className="font-semibold text-white block mb-1">⑥ Check Memory Bank</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Switch to <strong>Memory Bank</strong> to see all retained decisions live in Hindsight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
