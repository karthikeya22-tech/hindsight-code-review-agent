import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lightbulb, 
  Brain, 
  Layers, 
  Send, 
  Sparkles, 
  Filter, 
  FolderGit2, 
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { ReviewResponse, ReviewIssue, Severity } from '../types/review';

interface ReviewDisplayProps {
  review: ReviewResponse | null;
  feedbackState: Record<string, string>;
  onFeedback: (
    issueId: string, 
    decision: 'accepted' | 'rejected', 
    issue: { title: string; recommendation: string },
    comment?: string
  ) => void;
  onOpenTeach: () => void;
}

const SEVERITY_CONFIG: Record<Severity, {
  label: string;
  badge: string;
  cardBorder: string;
  icon: React.ElementType;
}> = {
  critical: {
    label: 'Critical',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    cardBorder: 'border-rose-500/30 bg-rose-950/10',
    icon: ShieldAlert,
  },
  important: {
    label: 'Important',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    cardBorder: 'border-amber-500/30 bg-amber-950/10',
    icon: AlertTriangle,
  },
  team_convention: {
    label: 'Team Convention',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    cardBorder: 'border-purple-500/30 bg-purple-950/10',
    icon: Brain,
  },
  suggestion: {
    label: 'Suggestion',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    cardBorder: 'border-sky-500/30 bg-sky-950/10',
    icon: Lightbulb,
  },
};

export const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  review,
  feedbackState,
  onFeedback,
  onOpenTeach,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [memoryOnlyFilter, setMemoryOnlyFilter] = useState<boolean>(false);
  const [activeMemoryTab, setActiveMemoryTab] = useState<'project' | 'team'>('project');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[480px] p-8 text-center rounded-2xl border border-edge bg-panel/70">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-glow-primary">
          <Brain className="w-8 h-8 animate-pulse-subtle" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">No Review Output Yet</h3>
        <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
          Write or select a code sample on the left, then click <strong>Run Memory-Aware Review</strong>. 
          CodeMind will query Hindsight for your team’s established rules and previous review feedback.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-400 p-3 rounded-xl bg-slate-900/60 border border-edge/60">
          <span className="font-semibold text-indigo-300">Continuous Learning Loop:</span>
          <span>Recall Memories → LLM Review → Submit Feedback → Hindsight Learns</span>
        </div>
      </div>
    );
  }

  // Calculate severity metrics
  const criticalCount = review.issues.filter((i) => i.severity === 'critical').length;
  const importantCount = review.issues.filter((i) => i.severity === 'important').length;
  const conventionCount = review.issues.filter((i) => i.severity === 'team_convention').length;
  const suggestionCount = review.issues.filter((i) => i.severity === 'suggestion').length;
  const memoryBasedCount = review.issues.filter((i) => i.memory_based).length;

  // Filter issues
  const filteredIssues = review.issues.filter((issue) => {
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (memoryOnlyFilter && !issue.memory_based) return false;
    return true;
  });

  const projMemories = review.project_memories_used || [];
  const teamMemories = review.team_memories_used || [];
  const totalMemoriesCount = projMemories.length + teamMemories.length;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-edge bg-panel overflow-hidden shadow-xl">
      {/* Review Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900 via-panel to-panel border-b border-edge">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Brain className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Code Review Report
            </h2>
            {review.active_project && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <FolderGit2 className="w-3 h-3" />
                {review.active_project.project_name}
              </span>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-400 bg-ink px-2.5 py-1 rounded-lg border border-edge">
            ID: {review.review_id}
          </div>
        </div>

        {/* Summary text */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-ink/50 p-3 rounded-xl border border-edge/80 mb-3">
          {review.summary}
        </p>

        {/* Severity Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
            className={`p-2 rounded-xl border text-left transition-all ${
              severityFilter === 'critical'
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-200'
                : 'bg-ink/40 border-edge hover:border-rose-500/40 text-slate-300'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Critical</div>
            <div className="text-lg font-bold text-rose-400">{criticalCount}</div>
          </button>

          <button
            onClick={() => setSeverityFilter(severityFilter === 'important' ? 'all' : 'important')}
            className={`p-2 rounded-xl border text-left transition-all ${
              severityFilter === 'important'
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                : 'bg-ink/40 border-edge hover:border-amber-500/40 text-slate-300'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Important</div>
            <div className="text-lg font-bold text-amber-400">{importantCount}</div>
          </button>

          <button
            onClick={() => setSeverityFilter(severityFilter === 'team_convention' ? 'all' : 'team_convention')}
            className={`p-2 rounded-xl border text-left transition-all ${
              severityFilter === 'team_convention'
                ? 'bg-purple-500/20 border-purple-500/60 text-purple-200'
                : 'bg-ink/40 border-edge hover:border-purple-500/40 text-slate-300'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Conventions</div>
            <div className="text-lg font-bold text-purple-400">{conventionCount}</div>
          </button>

          <button
            onClick={() => setSeverityFilter(severityFilter === 'suggestion' ? 'all' : 'suggestion')}
            className={`p-2 rounded-xl border text-left transition-all ${
              severityFilter === 'suggestion'
                ? 'bg-sky-500/20 border-sky-500/60 text-sky-200'
                : 'bg-ink/40 border-edge hover:border-sky-500/40 text-slate-300'
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Suggestions</div>
            <div className="text-lg font-bold text-sky-400">{suggestionCount}</div>
          </button>
        </div>
      </div>

      {/* Filter and Controls Sub-bar */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-edge flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Filter:</span>
          {severityFilter !== 'all' && (
            <button
              onClick={() => setSeverityFilter('all')}
              className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium"
            >
              Reset severity
            </button>
          )}
        </div>

        {/* Memory-Based Only Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
          <input
            type="checkbox"
            checked={memoryOnlyFilter}
            onChange={(e) => setMemoryOnlyFilter(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-indigo-600 bg-ink border-edge focus:ring-indigo-500 cursor-pointer"
          />
          <Brain className="w-3.5 h-3.5 text-violet-400" />
          <span>Memory-Based Only ({memoryBasedCount})</span>
        </label>
      </div>

      {/* Issues List Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-edge rounded-xl">
            <p className="text-sm font-medium">No findings match the selected filters.</p>
            <button
              onClick={() => {
                setSeverityFilter('all');
                setMemoryOnlyFilter(false);
              }}
              className="mt-2 text-xs text-indigo-400 hover:underline"
            >
              Show all findings
            </button>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const sev = SEVERITY_CONFIG[issue.severity] || SEVERITY_CONFIG.suggestion;
            const SevIcon = sev.icon;
            const status = feedbackState[issue.id];
            const isSavingFeedback = status === 'saving';
            const isCommentExpanded = expandedComments[issue.id] || Boolean(commentInputs[issue.id]);

            return (
              <div
                key={issue.id}
                className={`p-4 rounded-xl border transition-all ${sev.cardBorder}`}
              >
                {/* Issue Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sev.badge}`}>
                      <SevIcon className="w-3 h-3" />
                      {sev.label}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {issue.title}
                    </h4>
                  </div>
                </div>

                {/* Issue Description */}
                <p className="text-xs text-slate-200 leading-relaxed mb-3">
                  {issue.description}
                </p>

                {/* Recommendation box */}
                <div className="p-3 rounded-lg bg-ink/70 border border-edge/80 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Recommendation:</span>
                  </div>
                  <div className="text-cyan-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {issue.recommendation}
                  </div>
                </div>

                {/* Memory Attribution Callout */}
                {issue.memory_based && issue.memory_reference ? (
                  <div className="p-2.5 rounded-lg bg-violet-950/30 border border-violet-800/40 text-xs text-violet-200 mb-3 flex items-start gap-2">
                    <Brain className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-violet-300">
                        Flagged via Hindsight Team Memory:
                      </div>
                      <p className="text-violet-200/90 italic mt-0.5">
                        “{issue.memory_reference}”
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
                    <span>Standard best practice (not derived from custom team memory).</span>
                  </div>
                )}

                {/* Feedback Action Bar */}
                <div className="pt-2 border-t border-edge/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onFeedback(issue.id, 'accepted', issue, commentInputs[issue.id])}
                        disabled={isSavingFeedback}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-600 text-white shadow-sm transition-all disabled:opacity-50 active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Finding</span>
                      </button>

                      <button
                        onClick={() => onFeedback(issue.id, 'rejected', issue, commentInputs[issue.id])}
                        disabled={isSavingFeedback}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm transition-all disabled:opacity-50 active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Finding</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedComments((prev) => ({
                            ...prev,
                            [issue.id]: !prev[issue.id],
                          }))
                        }
                        className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-white/5 transition-all"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>{isCommentExpanded ? 'Hide Note' : '+ Add Note'}</span>
                      </button>
                    </div>

                    {/* Feedback Status Pill */}
                    {status && (
                      <div className="text-xs font-medium">
                        {status === 'saving' ? (
                          <span className="text-indigo-400 flex items-center gap-1">
                            <Brain className="w-3 h-3 animate-spin" />
                            Retaining feedback to Hindsight…
                          </span>
                        ) : status.includes('Accepted') ? (
                          <span className="text-emerald-400 font-semibold">{status}</span>
                        ) : status.includes('Rejected') ? (
                          <span className="text-rose-400 font-semibold">{status}</span>
                        ) : (
                          <span className="text-amber-400">{status}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expandable Developer Note Field */}
                  {isCommentExpanded && (
                    <div className="mt-2.5 animate-in fade-in duration-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[issue.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [issue.id]: e.target.value }))
                          }
                          placeholder="Optional explanation for Hindsight (e.g. Valid architectural exception because...)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-ink border border-edge text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recalled Memory Bottom Inspector */}
      <div className="border-t border-edge bg-slate-950/70 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Recalled Context ({totalMemoriesCount})
            </h3>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveMemoryTab('project')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMemoryTab === 'project'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Project Knowledge ({projMemories.length})
            </button>
            <button
              onClick={() => setActiveMemoryTab('team')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeMemoryTab === 'team'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Team Memory ({teamMemories.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-h-36 overflow-y-auto pr-1">
          {activeMemoryTab === 'project' && (
            <div>
              {projMemories.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 bg-ink/40 rounded-lg border border-edge/60">
                  No project architecture memories retrieved for this snippet.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {projMemories.map((m, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 p-2 rounded-lg bg-ink/60 border border-edge/60 flex items-start gap-2"
                    >
                      <span className="text-indigo-400 shrink-0">✓</span>
                      <div>
                        <span>{m.text}</span>
                        {m.type && (
                          <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                            [{m.type}{m.context ? ` · ${m.context}` : ''}]
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeMemoryTab === 'team' && (
            <div>
              {teamMemories.length === 0 ? (
                <div className="p-3 text-xs text-slate-500 bg-ink/40 rounded-lg border border-edge/60 flex items-center justify-between">
                  <span>No relevant team conventions found for this code snippet.</span>
                  <button
                    onClick={onOpenTeach}
                    className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Teach a convention</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {teamMemories.map((m, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 p-2 rounded-lg bg-ink/60 border border-edge/60 flex items-start gap-2"
                    >
                      <span className="text-violet-400 shrink-0">✓</span>
                      <div>
                        <span>{m.text}</span>
                        {m.type && (
                          <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                            [{m.type}{m.context ? ` · ${m.context}` : ''}]
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
