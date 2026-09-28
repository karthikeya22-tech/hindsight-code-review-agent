import React, { useRef, useState, useEffect } from 'react';
import { 
  Code2, 
  Play, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Brain, 
  Layers, 
  Info, 
  FileCode,
  Zap,
  ChevronDown
} from 'lucide-react';
import type { Phase, ProjectContext } from '../types/review';

interface CodeWorkspaceProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  context: string;
  onContextChange: (ctx: string) => void;
  onRunReview: () => void;
  phase: Phase;
  phaseMsg: string;
  error?: string;
  project: ProjectContext | null;
}

const SAMPLE_A = `def process_user(user):
    if user:
        if user.is_active:
            if user.has_permission:
                process(user)`;

const SAMPLE_B = `def process_order(order):
    if order:
        if order.is_valid:
            if order.is_paid:
                ship(order)`;

const SAMPLE_C = `@router.post("/orders")
def create_order(order: Order):
    db.add(order)
    db.commit()
    return order`;

const LANGUAGES = [
  { id: 'python', label: 'Python', ext: '.py' },
  { id: 'javascript', label: 'JavaScript', ext: '.js' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts' },
  { id: 'java', label: 'Java', ext: '.java' },
  { id: 'cpp', label: 'C++', ext: '.cpp' },
];

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  context,
  onContextChange,
  onRunReview,
  phase,
  phaseMsg,
  error,
  project,
}) => {
  const [copied, setCopied] = useState(false);
  const [showContextInput, setShowContextInput] = useState(Boolean(context));
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = Math.max(1, code.split('\n').length);
  const linesArray = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isReviewing = phase === 'recalling' || phase === 'reviewing';

  return (
    <div className="flex flex-col h-full rounded-2xl border border-edge bg-panel overflow-hidden shadow-xl">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/80 border-b border-edge">
        {/* Language selector & file indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-ink border border-edge/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label} ({l.ext})
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-edge hidden sm:block" />

          {/* Quick Sample Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 hidden lg:inline">Samples:</span>
            <button
              onClick={() => {
                onCodeChange(SAMPLE_A);
                onLanguageChange('python');
              }}
              className="px-2 py-1 rounded text-[11px] font-medium border border-edge/80 bg-ink/60 hover:bg-white/5 text-slate-300 hover:text-white transition-all"
              title="Nested conditionals anti-pattern"
            >
              Sample 1
            </button>
            <button
              onClick={() => {
                onCodeChange(SAMPLE_B);
                onLanguageChange('python');
              }}
              className="px-2 py-1 rounded text-[11px] font-medium border border-edge/80 bg-ink/60 hover:bg-white/5 text-slate-300 hover:text-white transition-all"
              title="Nested order validation"
            >
              Sample 2
            </button>
            <button
              onClick={() => {
                onCodeChange(SAMPLE_C);
                onLanguageChange('python');
              }}
              className="px-2 py-1 rounded text-[11px] font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all flex items-center gap-1"
              title="FastAPI Route doing DB commit (demonstrates architecture violation)"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Route ⚡
            </button>
          </div>
        </div>

        {/* Editor controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            disabled={!code}
            title="Copy code"
            className="p-1.5 rounded-lg border border-edge/60 bg-ink/50 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onCodeChange('')}
            disabled={!code}
            title="Clear editor"
            className="p-1.5 rounded-lg border border-edge/60 bg-ink/50 text-slate-400 hover:text-rose-400 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Textarea with Line Numbers */}
      <div className="relative flex-1 min-h-[380px] bg-[#070b12] flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="select-none py-3 px-3 bg-[#090e18] border-r border-edge/60 text-right font-mono text-xs text-slate-600 overflow-hidden shrink-0 min-w-[3rem]"
        >
          {linesArray.map((line) => (
            <div key={line} className="leading-6">
              {line}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="Paste or write code here to review..."
          spellCheck={false}
          className="w-full h-full py-3 px-4 bg-transparent font-mono text-sm leading-6 text-slate-200 placeholder-slate-600 resize-none outline-none focus:ring-0 selection:bg-indigo-600/30 selection:text-indigo-200 overflow-y-auto"
        />
      </div>

      {/* Code Stats Footer */}
      <div className="px-4 py-1.5 bg-[#090e18] border-t border-edge/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{code.length} characters</span>
          {project && (
            <>
              <span>•</span>
              <span className="text-indigo-400 flex items-center gap-1 font-sans">
                <Layers className="w-3 h-3" />
                Targeting: {project.project_name}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowContextInput(!showContextInput)}
          className="text-xs font-sans text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
        >
          <span>{showContextInput ? 'Hide Context' : '+ Add Context'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showContextInput ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Optional Context Field */}
      {showContextInput && (
        <div className="p-3 bg-panel-subtle border-t border-edge/60 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium text-slate-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Optional Review Context:
            </span>
            <span className="text-[10px] text-slate-500">e.g. file path, pull request intent, or business constraints</span>
          </div>
          <input
            type="text"
            value={context}
            onChange={(e) => onContextChange(e.target.value)}
            placeholder="e.g. Payment webhook verification handler in service layer"
            className="w-full px-3 py-1.5 rounded-lg bg-ink border border-edge text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
          />
        </div>
      )}

      {/* Review Execution & Progress Widget */}
      <div className="p-4 bg-slate-900/90 border-t border-edge">
        {/* Multi-Step Phase Progression Display */}
        {isReviewing && (
          <div className="mb-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-indigo-200 font-semibold mb-2">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
              </div>
              <span className="capitalize font-mono">{phase}</span>
              <span className="text-slate-400 font-normal ml-auto font-sans">{phaseMsg}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className={`p-2 rounded-lg border transition-all ${
                phase === 'recalling'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                  : 'bg-panel/50 border-edge text-slate-400'
              }`}>
                <div className="flex items-center gap-1.5 font-medium">
                  <Brain className="w-3.5 h-3.5 text-violet-400" />
                  <span>1. Memory Recall</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Searching Hindsight conventions</p>
              </div>

              <div className={`p-2 rounded-lg border transition-all ${
                phase === 'reviewing'
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                  : 'bg-panel/50 border-edge text-slate-400'
              }`}>
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. LLM Analysis</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Applying rules & structuring issues</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* Main Action CTA */}
        <button
          onClick={onRunReview}
          disabled={isReviewing || !code.trim()}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] shadow-glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isReviewing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Code with Hindsight Memory…</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Memory-Aware Review</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
