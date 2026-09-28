import React, { useState } from 'react';
import { X, Sparkles, Brain, CheckCircle2, AlertCircle, BookmarkPlus } from 'lucide-react';

interface TeachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeach: (content: string) => Promise<boolean>;
  isTeaching: boolean;
  message?: string;
}

const PRESET_CONVENTIONS = [
  'Our team prefers early returns instead of deeply nested conditionals.',
  'Always use Pydantic v2 model_dump() instead of the deprecated .dict() method.',
  'Do not perform raw database queries or transaction commits inside FastAPI route functions.',
  'Use custom domain exception classes instead of raising generic HTTPException in service code.',
  'All public API functions must include type annotations and docstrings with parameter descriptions.',
  'Prefer composition over deep inheritance hierarchies.'
];

export const TeachModal: React.FC<TeachModalProps> = ({
  isOpen,
  onClose,
  onTeach,
  isTeaching,
  message,
}) => {
  const [content, setContent] = useState('');
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setLocalError('Please enter at least 3 characters for the coding convention.');
      return;
    }
    setLocalError('');
    const success = await onTeach(content.trim());
    if (success) {
      setContent('');
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl rounded-2xl border border-edge bg-panel shadow-2xl transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-edge/80 px-6 py-4 bg-panel/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Brain className="w-5 h-5 animate-pulse-subtle" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Teach CodeMind a Convention
              </h2>
              <p className="text-xs text-slate-400">
                Instantly stored in Hindsight memory and applied to all future code reviews.
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

        {/* Preset Suggestions */}
        <div className="px-6 pt-4 pb-3 bg-slate-900/40 border-b border-edge/50">
          <p className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
            <BookmarkPlus className="w-3.5 h-3.5 text-violet-400" />
            Common Team Conventions (click to use):
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {PRESET_CONVENTIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setContent(preset);
                  setLocalError('');
                }}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg border border-edge bg-panel hover:bg-violet-950/40 hover:border-violet-700/50 text-slate-300 hover:text-violet-200 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {localError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{localError}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Rule / Guideline Description
              </label>
              <span className="text-[11px] text-slate-500">
                {content.length} / 2000 chars
              </span>
            </div>
            <textarea
              rows={4}
              value={content}
              maxLength={2000}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. In our Python codebase, always prefer early return statements over deeply nested if statements to keep cyclomatic complexity low."
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink border border-edge text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              Categorized as: <code className="text-slate-400">team coding convention</code>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Done
              </button>
              <button
                type="submit"
                disabled={isTeaching || !content.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-glow-violet transition-all disabled:opacity-50 active:scale-95"
              >
                {isTeaching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Learning to Hindsight…</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-3.5 h-3.5" />
                    <span>Teach Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
