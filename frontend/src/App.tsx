import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { CodeWorkspace } from './components/CodeWorkspace';
import { ReviewDisplay } from './components/ReviewDisplay';
import { MemoryBankView } from './components/MemoryBankView';
import { ProjectView } from './components/ProjectView';
import { HistoryView } from './components/HistoryView';
import { ProjectModal } from './components/ProjectModal';
import { TeachModal } from './components/TeachModal';
import { api } from './services/api';
import type { 
  HealthResponse, 
  HistoryEntry, 
  MemoryUsed, 
  Phase, 
  ProjectContext, 
  ReviewResponse,
  ActiveTab 
} from './types/review';

const SAMPLE_A = `def process_user(user):
    if user:
        if user.is_active:
            if user.has_permission:
                process(user)`;

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');

  // System & Health
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Project Context
  const [project, setProject] = useState<ProjectContext | null>(null);
  const [projectMsg, setProjectMsg] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);

  // Code & Review Workspace
  const [code, setCode] = useState(SAMPLE_A);
  const [language, setLanguage] = useState('python');
  const [context, setContext] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [phaseMsg, setPhaseMsg] = useState('');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState('');

  // Hindsight Memories & Teaching
  const [learned, setLearned] = useState<MemoryUsed[]>([]);
  const [learnedMsg, setLearnedMsg] = useState('');
  const [showTeachModal, setShowTeachModal] = useState(false);
  const [teachBusy, setTeachBusy] = useState(false);
  const [teachMsg, setTeachMsg] = useState('');

  // Feedback & History
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Refresh health
  const refreshHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.health();
      setHealth(res);
    } catch {
      setHealth(null);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refresh memories from Hindsight
  const refreshLearned = useCallback(async () => {
    try {
      const m = await api.memories();
      setLearned(m.memories);
      setLearnedMsg(m.message || '');
    } catch {
      setLearnedMsg('Could not load memories from Hindsight.');
    }
  }, []);

  // Refresh active project context
  const refreshProject = useCallback(async () => {
    try {
      const p = await api.getProject();
      setProject(p.project || null);
      if (p.message) setProjectMsg(p.message);
    } catch {
      setProjectMsg('Could not load active project context.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshHealth();
    refreshLearned();
    refreshProject();
  }, [refreshHealth, refreshLearned, refreshProject]);

  // Run Code Review
  async function handleReview() {
    if (!code.trim()) {
      setError('Please paste or type some code first.');
      return;
    }
    setError('');
    setReview(null);
    setPhase('recalling');
    setPhaseMsg(
      project 
        ? `Recalling project & team conventions for ${project.project_name}…` 
        : 'Recalling team conventions from Hindsight…'
    );

    // Visible beat for smoother UX transition
    await new Promise((r) => setTimeout(r, 450));
    setPhase('reviewing');
    setPhaseMsg('Synthesizing context & generating review…');

    try {
      const res = await api.review(code, language, context || undefined);
      setReview(res);
      setPhase('done');
      setPhaseMsg('Review complete');

      // Create history entry with snapshot
      const titleMatch = code.match(/def\s+(\w+)|function\s+(\w+)|class\s+(\w+)/);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3]) : 'Code snippet';
      
      const newEntry: HistoryEntry = {
        id: res.review_id,
        title,
        language,
        findings: res.issues.length,
        at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        code,
        review: res,
      };

      setHistory((prev) => [newEntry, ...prev].slice(0, 15));
      refreshLearned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed.');
      setPhase('idle');
      setPhaseMsg('');
    }
  }

  // Handle Teach Convention
  async function handleTeach(content: string): Promise<boolean> {
    setTeachBusy(true);
    setTeachMsg('Saving team convention to Hindsight…');
    try {
      const res = await api.teach(content);
      if (res.success) {
        setTeachMsg('✓ CodeMind learned this convention permanently.');
        refreshLearned();
        return true;
      } else {
        setTeachMsg(`✕ ${res.message}`);
        return false;
      }
    } catch (e) {
      setTeachMsg(`✕ ${e instanceof Error ? e.message : 'Failed to save convention.'}`);
      return false;
    } finally {
      setTeachBusy(false);
    }
  }

  // Handle Feedback Submission (Accept / Reject)
  async function handleFeedback(
    issueId: string, 
    decision: 'accepted' | 'rejected', 
    issue: { title: string; recommendation: string },
    comment?: string
  ) {
    if (!review) return;
    setFeedbackState((prev) => ({ ...prev, [issueId]: 'saving' }));
    try {
      const res = await api.feedback({
        review_id: review.review_id,
        issue_id: issueId,
        decision,
        comment: comment || '',
        issue_title: issue.title,
        issue_recommendation: issue.recommendation,
        language,
      });

      setFeedbackState((prev) => ({
        ...prev,
        [issueId]: res.success
          ? (decision === 'accepted' ? '✓ Accepted — learned' : '✕ Rejected — learned')
          : `! ${res.message}`,
      }));
      refreshLearned();
    } catch (e) {
      setFeedbackState((prev) => ({ 
        ...prev, 
        [issueId]: `! ${e instanceof Error ? e.message : 'Failed to save feedback'}` 
      }));
    }
  }

  // Save Project Onboarding
  async function handleSaveProject(payload: {
    project_name: string;
    description: string;
    technology_stack: string[];
    architecture: string;
    team_guidelines: string[];
  }) {
    setProjectBusy(true);
    setProjectMsg('Retaining project knowledge in Hindsight…');
    try {
      const res = await api.saveProject(payload);
      if (res.project) setProject(res.project);
      setProjectMsg(res.success ? `✓ ${res.message}` : `! ${res.message}`);
      if (res.success) {
        setShowProjectModal(false);
      }
      refreshLearned();
    } catch (e) {
      setProjectMsg(`✕ ${e instanceof Error ? e.message : 'Failed to save project.'}`);
    } finally {
      setProjectBusy(false);
    }
  }

  // Select item from history to restore
  function handleSelectHistoryEntry(entry: HistoryEntry) {
    if (entry.code) setCode(entry.code);
    if (entry.language) setLanguage(entry.language);
    if (entry.review) setReview(entry.review);
    setActiveTab('workspace');
  }

  return (
    <div className="min-h-screen bg-mesh-pattern flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        health={health}
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProjectModal={() => setShowProjectModal(true)}
        onOpenTeachModal={() => {
          setTeachMsg('');
          setShowTeachModal(true);
        }}
        onRefreshHealth={refreshHealth}
        memoriesCount={learned.length}
        historyCount={history.length}
        isRefreshing={isRefreshing}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Workspace Tab: Split Code Editor + Review Results */}
        {activeTab === 'workspace' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Code Workspace */}
            <div className="lg:col-span-5 flex flex-col h-full min-h-[580px]">
              <CodeWorkspace
                code={code}
                onCodeChange={setCode}
                language={language}
                onLanguageChange={setLanguage}
                context={context}
                onContextChange={setContext}
                onRunReview={handleReview}
                phase={phase}
                phaseMsg={phaseMsg}
                error={error}
                project={project}
              />
            </div>

            {/* Right Column: Review Findings */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[580px]">
              <ReviewDisplay
                review={review}
                feedbackState={feedbackState}
                onFeedback={handleFeedback}
                onOpenTeach={() => {
                  setTeachMsg('');
                  setShowTeachModal(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Memory Bank Tab */}
        {activeTab === 'memories' && (
          <MemoryBankView
            memories={learned}
            onOpenTeach={() => {
              setTeachMsg('');
              setShowTeachModal(true);
            }}
            onRefreshMemories={refreshLearned}
            statusMessage={learnedMsg}
            bankId={health?.hindsight_bank}
          />
        )}

        {/* Project Knowledge Tab */}
        {activeTab === 'project' && (
          <ProjectView
            project={project}
            onOpenProjectModal={() => setShowProjectModal(true)}
            statusMessage={projectMsg}
          />
        )}

        {/* Review History Tab */}
        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectReview={handleSelectHistoryEntry}
          />
        )}
      </main>

      {/* Project Setup / Edit Modal */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        project={project}
        onSave={handleSaveProject}
        isSaving={projectBusy}
        message={projectMsg}
      />

      {/* Teach Convention Modal */}
      <TeachModal
        isOpen={showTeachModal}
        onClose={() => setShowTeachModal(false)}
        onTeach={handleTeach}
        isTeaching={teachBusy}
        message={teachMsg}
      />
    </div>
  );
}
