import { useCallback, useEffect, useState } from 'react';
import { api } from './services/api';
import type { HealthResponse, HistoryEntry, MemoryUsed, Phase, ProjectContext, ReviewResponse } from './types/review';

const SEV_META: Record<string, { label: string; dot: string; chip: string }> = {
  critical: { label: 'Critical', dot: 'bg-red-500', chip: 'text-red-300 border-red-500/40 bg-red-500/10' },
  important: { label: 'Important', dot: 'bg-orange-400', chip: 'text-orange-300 border-orange-400/40 bg-orange-400/10' },
  team_convention: { label: 'Team Convention', dot: 'bg-yellow-300', chip: 'text-yellow-200 border-yellow-300/40 bg-yellow-300/10' },
  suggestion: { label: 'Suggestion', dot: 'bg-sky-400', chip: 'text-sky-300 border-sky-400/40 bg-sky-400/10' },
};

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

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [code, setCode] = useState(SAMPLE_A);
  const [language, setLanguage] = useState('python');
  const [context, setContext] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseMsg, setPhaseMsg] = useState('');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState('');
  const [teachText, setTeachText] = useState('Our team prefers early returns instead of deeply nested conditionals.');
  const [teachMsg, setTeachMsg] = useState('');
  const [teachBusy, setTeachBusy] = useState(false);
  const [learned, setLearned] = useState<MemoryUsed[]>([]);
  const [learnedMsg, setLearnedMsg] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  // Project onboarding
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [projectMsg, setProjectMsg] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fStack, setFStack] = useState('');
  const [fArch, setFArch] = useState('');
  const [fGuides, setFGuides] = useState('');

  const refreshHealth = useCallback(async () => {
    try {
      setHealth(await api.health());
    } catch {
      setHealth(null);
    }
  }, []);

  const refreshLearned = useCallback(async () => {
    try {
      const m = await api.memories();
      setLearned(m.memories);
      setLearnedMsg(m.message || '');
    } catch {
      setLearnedMsg('Could not load learned memories.');
    }
  }, []);

  const refreshProject = useCallback(async () => {
    try {
      const p = await api.getProject();
      setProject(p.project || null);
      if (p.message) setProjectMsg(p.message);
    } catch {
      setProjectMsg('Could not load project context.');
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshLearned();
    refreshProject();
  }, [refreshHealth, refreshLearned, refreshProject]);

  function openProjectModal() {
    setFName(project?.project_name || '');
    setFDesc(project?.description || '');
    setFStack((project?.technology_stack || []).join(', '));
    setFArch(project?.architecture || '');
    setFGuides((project?.team_guidelines || []).join('\n'));
    setShowProjectModal(true);
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

  async function handleSaveProject() {
    const payload = {
      project_name: fName.trim(),
      description: fDesc.trim(),
      technology_stack: splitList(fStack),
      architecture: fArch.trim(),
      team_guidelines: splitList(fGuides),
    };
    if (!payload.project_name || !payload.description || !payload.architecture ||
        payload.technology_stack.length === 0 || payload.team_guidelines.length === 0) {
      setProjectMsg('Please fill in all project fields (stack/guidelines accept comma- or line-separated values).');
      return;
    }
    setProjectBusy(true);
    setProjectMsg('Saving project knowledge to Hindsight…');
    try {
      const res = await api.saveProject(payload);
      if (res.project) setProject(res.project);
      setProjectMsg(res.success ? `✓ ${res.message}` : `! ${res.message}`);
      if (res.success) setShowProjectModal(false);
      refreshLearned();
    } catch (e) {
      setProjectMsg(`✕ ${e instanceof Error ? e.message : 'Project save failed.'}`);
    } finally {
      setProjectBusy(false);
    }
  }

  async function handleReview() {
    if (!code.trim()) {
      setError('Paste some code first.');
      return;
    }
    setError('');
    setReview(null);
    setPhase('recalling');
    setPhaseMsg(project ? `Recalling project + team knowledge from Hindsight (${project.project_name})…` : 'Recalling team knowledge from Hindsight…');
    await new Promise((r) => setTimeout(r, 500)); // visible demo beat
    setPhase('reviewing');
    setPhaseMsg('Generating review…');
    try {
      const res = await api.review(code, language, context || undefined);
      setReview(res);
      setPhase('done');
      setPhaseMsg('Review complete');
      const title = (code.match(/def\s+(\w+)/) || [, 'snippet'])[1];
      setHistory((h) =>
        [{ id: res.review_id, title, language, findings: res.issues.length, at: new Date().toLocaleTimeString() }, ...h].slice(0, 8),
      );
      refreshLearned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed.');
      setPhase('idle');
      setPhaseMsg('');
    }
  }

  async function handleTeach() {
    if (!teachText.trim()) return;
    setTeachBusy(true);
    setTeachMsg('Saving team preference…');
    try {
      const res = await api.teach(teachText.trim());
      setTeachMsg(res.success ? '✓ CodeMind learned this preference.' : `✕ ${res.message}`);
      if (res.success) {
        setTeachText('');
        refreshLearned();
      }
    } catch (e) {
      setTeachMsg(`✕ ${e instanceof Error ? e.message : 'Teach failed.'}`);
    } finally {
      setTeachBusy(false);
    }
  }

  async function handleFeedback(issueId: string, decision: 'accepted' | 'rejected', issue: { title: string; recommendation: string }) {
    if (!review) return;
    setFeedbackState((s) => ({ ...s, [issueId]: 'saving' }));
    try {
      const res = await api.feedback({
        review_id: review.review_id,
        issue_id: issueId,
        decision,
        comment: comments[issueId] || '',
        issue_title: issue.title,
        issue_recommendation: issue.recommendation,
        language,
      });
      setFeedbackState((s) => ({
        ...s,
        [issueId]: res.success
          ? (decision === 'accepted' ? '✓ Accepted — learned' : '✕ Rejected — learned')
          : `! ${res.message}`,
      }));
      refreshLearned();
    } catch (e) {
      setFeedbackState((s) => ({ ...s, [issueId]: `! ${e instanceof Error ? e.message : 'failed'}` }));
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-edge bg-panel/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🧠 CodeMind <span className="text-sm font-normal text-slate-400 ml-1">AI Code Review Agent</span></h1>
            <p className="text-xs text-slate-500">CodeMind doesn't just review code. It remembers how our team reviews code.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${health?.hindsight_available ? 'bg-emerald-400' : 'bg-red-500'}`} />
            <span className="text-slate-300">Hindsight {health ? (health.hindsight_available ? '●' : '○') : '…'}</span>
            {!health && <button onClick={refreshHealth} className="text-xs underline text-slate-400">retry</button>}
          </div>
        </div>
        {health && !health.hindsight_available && (
          <div className="bg-red-950/60 text-red-200 text-sm px-4 py-2 text-center">
            Hindsight unavailable — memory-based review is temporarily unavailable. ({health.hindsight_message})
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current project panel */}
        <section className="bg-panel border border-edge rounded-xl p-4 lg:col-span-1">
          <h2 className="font-semibold mb-2">CURRENT PROJECT</h2>
          {project ? (
            <>
              <p className="font-semibold">📁 {project.project_name}</p>
              <p className="text-sm text-slate-300 mt-1">{project.description}</p>
              <p className="text-xs text-slate-500 mt-2 font-semibold">Stack</p>
              <p className="text-sm text-slate-200">{project.technology_stack.join(' • ')}</p>
              <p className="text-xs text-slate-500 mt-2 font-semibold">Architecture</p>
              <p className="text-sm text-slate-200">{project.architecture}</p>
              <p className="text-xs text-slate-500 mt-2 font-semibold">Guidelines</p>
              <ul className="text-sm text-slate-200 list-disc ml-4">
                {project.team_guidelines.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
              <p className="text-xs mt-2 text-emerald-300">🧠 Project Memory: Connected</p>
              <div className="flex gap-2 mt-2">
                <button onClick={openProjectModal} className="text-xs px-2 py-1 border border-edge rounded hover:bg-ink">Edit Project</button>
                <button onClick={openProjectModal} className="text-xs px-2 py-1 border border-edge rounded hover:bg-ink">Change Project</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">No active project. Reviews will be generic until CodeMind knows your project.</p>
              <button onClick={openProjectModal} className="mt-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold">Project Setup</button>
            </>
          )}
          {projectMsg && <p className="text-xs mt-2 text-slate-300">{projectMsg}</p>}
        </section>

        {/* Code input */}
        <section className="bg-panel border border-edge rounded-xl p-4 lg:col-span-1">
          <h2 className="font-semibold mb-2">CODE INPUT {project && <span className="text-xs font-normal text-violet-300">· {project.project_name}</span>}</h2>
          <div className="flex gap-2 mb-2">
            <label className="text-sm text-slate-400">Language:
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ml-2 bg-ink border border-edge rounded px-2 py-1 text-slate-200">
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </label>
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setCode(SAMPLE_A)} className="text-xs px-2 py-1 border border-edge rounded hover:bg-ink">Sample 1</button>
              <button onClick={() => setCode(SAMPLE_B)} className="text-xs px-2 py-1 border border-edge rounded hover:bg-ink">Sample 2</button>
              <button onClick={() => setCode(SAMPLE_C)} title="FastAPI route doing DB work (project-awareness demo)" className="text-xs px-2 py-1 border border-edge rounded hover:bg-ink">Route ⚡</button>
              <button onClick={() => { setCode(''); setReview(null); setError(''); }} className="text-xs px-2 py-1 border border-edge rounded hover:bg-ink">Clear</button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full bg-ink border border-edge rounded-lg p-3 text-sm leading-relaxed outline-none focus:border-sky-500"
            placeholder="Paste code here…"
          />
          <input
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional context (e.g. order validation logic)"
            className="w-full mt-2 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500"
          />
          <button
            onClick={handleReview}
            disabled={phase === 'recalling' || phase === 'reviewing'}
            className="mt-3 w-full py-2.5 rounded-lg font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
          >
            {phase === 'recalling' || phase === 'reviewing' ? '🔍 Analyzing code…' : 'Review Code'}
          </button>
          {(phase === 'recalling' || phase === 'reviewing') && (
            <p className="text-sm text-yellow-200 mt-2">🧠 {phaseMsg}</p>
          )}
          {phase === 'done' && review && <p className="text-sm text-emerald-300 mt-2">✓ {phaseMsg}</p>}
          {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
        </section>

        {/* Review */}
        <section className="bg-panel border border-edge rounded-xl p-4">
          <h2 className="font-semibold mb-2">AI CODE REVIEW {review?.active_project && <span className="text-xs font-normal text-violet-300">· 📁 {review.active_project.project_name}</span>}</h2>
          {!review && <p className="text-slate-500 text-sm">Submit code to see the review. The learning loop is: Recall → Review → Feedback → Retain → Improved Review.</p>}
          {review && (
            <>
              <p className="text-sm text-slate-200 mb-3">{review.summary}</p>
              {!review.hindsight_available && (
                <p className="text-xs text-red-300 mb-2">Hindsight unavailable. {review.hindsight_message}</p>
              )}
              <div className="space-y-3">
                {review.issues.map((iss) => {
                  const meta = SEV_META[iss.severity] || SEV_META.suggestion;
                  return (
                    <div key={iss.id} className={`border rounded-lg p-3 ${meta.chip} border`}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        {meta.label}: {iss.title}
                      </div>
                      <p className="text-sm text-slate-200 mt-1">{iss.description}</p>
                      <p className="text-sm mt-1"><span className="text-slate-400">Recommendation:</span> {iss.recommendation}</p>
                      {iss.memory_based && iss.memory_reference ? (
                        <p className="text-xs mt-2 text-yellow-200">🧠 Why? This matches a team preference retrieved from Hindsight: “{iss.memory_reference}”</p>
                      ) : (
                        <p className="text-xs mt-2 text-slate-500">General best practice (not from team memory).</p>
                      )}
                      <div className="flex gap-2 mt-2 items-center">
                        <button onClick={() => handleFeedback(iss.id, 'accepted', iss)} className="text-xs px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600">✓ Accept</button>
                        <button onClick={() => handleFeedback(iss.id, 'rejected', iss)} className="text-xs px-2 py-1 rounded bg-red-800 hover:bg-red-700">✕ Reject</button>
                        <input
                          value={comments[iss.id] || ''}
                          onChange={(e) => setComments((c) => ({ ...c, [iss.id]: e.target.value }))}
                          placeholder="optional note (e.g. unnecessary abstraction)"
                          className="flex-1 text-xs bg-ink border border-edge rounded px-2 py-1 outline-none"
                        />
                      </div>
                      {feedbackState[iss.id] && (
                        <p className="text-xs mt-1 text-slate-300">
                          {feedbackState[iss.id] === 'saving' ? '🧠 Learning from your decision…' : feedbackState[iss.id]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Memory used — split into project vs team knowledge */}
              <div className="mt-4 border-t border-edge pt-3">
                <h3 className="font-semibold text-sm">🧠 MEMORY USED</h3>
                {(() => {
                  const projM = review.project_memories_used ?? [];
                  const teamM = review.team_memories_used ?? [];
                  const none = projM.length === 0 && teamM.length === 0;
                  if (none) {
                    return (
                      <p className="text-sm text-slate-400 mt-1">
                        No relevant project knowledge found.<br />
                        No relevant team memory found.<br />
                        This review was generated without prior team-specific knowledge.
                      </p>
                    );
                  }
                  return (
                    <>
                      <p className="text-xs font-semibold mt-2">📁 Project Knowledge</p>
                      {projM.length === 0 ? (
                        <p className="text-sm text-slate-500">No relevant project knowledge found.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {projM.map((m, i) => (
                            <li key={`p${i}`} className="text-sm text-slate-200">✓ {m.text}
                              {m.type && <span className="text-xs text-slate-500 ml-1">[{m.type}{m.context ? ` · ${m.context}` : ''}]</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-xs font-semibold mt-2">🧠 Team Memory</p>
                      {teamM.length === 0 ? (
                        <p className="text-sm text-slate-500">No relevant team memory found.</p>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {teamM.map((m, i) => (
                            <li key={`t${i}`} className="text-sm text-slate-200">✓ {m.text}
                              {m.type && <span className="text-xs text-slate-500 ml-1">[{m.type}{m.context ? ` · ${m.context}` : ''}]</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Teach */}
      <div className="max-w-7xl mx-auto px-4">
        <section className="bg-panel border border-edge rounded-xl p-4 mt-1">
          <h2 className="font-semibold">🧠 Teach CodeMind</h2>
          <p className="text-xs text-slate-500 mb-2">Tell CodeMind something it should remember for future code reviews.</p>
          <div className="flex gap-2">
            <input
              value={teachText}
              onChange={(e) => setTeachText(e.target.value)}
              placeholder="Enter team coding preference…"
              className="flex-1 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <button onClick={handleTeach} disabled={teachBusy} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold disabled:opacity-50">
              {teachBusy ? '🧠 Saving…' : 'Remember'}
            </button>
          </div>
          {teachMsg && <p className="text-sm mt-2 text-slate-200">{teachBusy ? '🧠 Saving team preference…' : teachMsg}</p>}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 pb-8">
          {/* Learned */}
          <section className="bg-panel border border-edge rounded-xl p-4">
            <h2 className="font-semibold">🧠 WHAT CODEMIND LEARNED</h2>
            <p className="text-xs text-slate-500">Live from Hindsight — never hard-coded. {learnedMsg}</p>
            {learned.length === 0 ? (
              <p className="text-sm text-slate-400 mt-2">No team memories yet. Teach CodeMind above, then re-run a review.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {learned.map((m, i) => (
                  <li key={i} className="text-sm text-slate-200">• {m.text}
                    {m.type && <span className="text-xs text-slate-500 ml-1">[{m.type}{m.context ? ` · ${m.context}` : ''}]</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* History */}
          <section className="bg-panel border border-edge rounded-xl p-4">
            <h2 className="font-semibold">RECENT REVIEWS</h2>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 mt-1">No reviews yet this session.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {history.map((h) => (
                  <li key={h.id} className="text-sm text-slate-300">{h.title} · {h.language} · {h.findings} findings · <span className="text-slate-500">{h.at}</span></li>
                ))}
              </ul>
            )}
            <div className="mt-3 text-xs text-slate-500 border-t border-edge pt-2">
              Demo flow: ① Project Setup (E-Commerce) → ② Review “Route ⚡” sample (architecture issue) → ③ Review Sample 1 (generic) → ④ Teach “early returns” → ⑤ Review Sample 2 (team-specific) → ⑥ Accept → ⑦ Review again.
            </div>
          </section>
        </div>
      </div>

      {/* Project Setup modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-20 p-4" onClick={() => setShowProjectModal(false)}>
          <div className="bg-panel border border-edge rounded-xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold text-lg">📁 {project ? 'Edit Project' : 'Project Setup'}</h2>
            <p className="text-xs text-slate-500 mb-3">CodeMind stores this in Hindsight and uses it in every review.</p>
            <label className="text-xs text-slate-400">Project Name
              <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="E-Commerce Platform"
                className="w-full mt-1 mb-2 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="text-xs text-slate-400">Project Description
              <textarea value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={2} placeholder="Online marketplace where customers browse products and place orders."
                className="w-full mt-1 mb-2 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="text-xs text-slate-400">Technology Stack (comma- or line-separated)
              <input value={fStack} onChange={(e) => setFStack(e.target.value)} placeholder="React, TypeScript, FastAPI, PostgreSQL"
                className="w-full mt-1 mb-2 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="text-xs text-slate-400">Architecture
              <textarea value={fArch} onChange={(e) => setFArch(e.target.value)} rows={2} placeholder="React frontend → FastAPI backend → PostgreSQL. Business logic in the service layer; API routes stay thin."
                className="w-full mt-1 mb-2 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="text-xs text-slate-400">Team Coding Guidelines (one per line)
              <textarea value={fGuides} onChange={(e) => setFGuides(e.target.value)} rows={4} placeholder={"Prefer early returns.\nAvoid unnecessary abstractions.\nKeep API routes thin.\nValidate input at service boundaries."}
                className="w-full mt-1 mb-2 bg-ink border border-edge rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-500" />
            </label>
            <div className="flex gap-2 mt-1">
              <button onClick={handleSaveProject} disabled={projectBusy}
                className="flex-1 py-2 rounded-lg font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50">
                {projectBusy ? '🧠 Saving to Hindsight…' : 'Create Project'}
              </button>
              <button onClick={() => setShowProjectModal(false)} className="px-4 py-2 rounded-lg border border-edge hover:bg-ink">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
