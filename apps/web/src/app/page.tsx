'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Plus, 
  Activity as ActivityIcon, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  HelpCircle, 
  Terminal, 
  FileText, 
  BarChart3, 
  Compass, 
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  workerType: string;
  status: 'PENDING' | 'WAITING_DEPENDENCIES' | 'QUEUED' | 'RUNNING' | 'RETRYING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  output: string | null;
  dependencies: { dependsOnTaskId: string }[];
  assignments: { duration: number | null; costTokens: number | null }[];
  logs?: { id: string; logType: string; message: string; createdAt: string }[];
  artifacts?: { id: string; type: string; title: string; versions: { content: string }[] }[];
}

interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PLANNING' | 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  priority: string;
  createdAt: string;
  tasks: Task[];
  activities: Activity[];
}

export default function CommandCenter() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [usingInMemory, setUsingInMemory] = useState<boolean>(true);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:4000` : 'http://localhost:4000';

  // Check API health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}`);
      if (res.ok) {
        const data = await res.json();
        setApiOnline(true);
        setUsingInMemory(data.usingInMemoryQueue ?? true);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  }, []);

  // Fetch initial workspace details
  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workspace`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
      }
    } catch (e) {
      console.error('Failed to fetch workspace', e);
    }
  }, []);

  // Fetch list of missions
  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/missions`);
      if (res.ok) {
        const data = await res.json();
        setMissions(data);
      }
    } catch (e) {
      console.error('Failed to fetch missions list', e);
    }
  }, []);

  // Fetch recent activity stream
  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (e) {
      console.error('Failed to fetch activities stream', e);
    }
  }, []);

  // Fetch detailed active mission state
  const fetchActiveMission = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/missions/${id}`);
      if (res.ok) {
        const data = (await res.json()) as Mission;
        setActiveMission(data);
      }
    } catch (e) {
      console.error('Failed to fetch active mission details', e);
    }
  }, []);

  // Initial loads
  useEffect(() => {
    checkHealth();
    fetchWorkspace();
    fetchMissions();
    fetchActivities();

    const interval = setInterval(() => {
      checkHealth();
      fetchActivities();
      if (activeMissionId) {
        fetchActiveMission(activeMissionId);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeMissionId, checkHealth, fetchWorkspace, fetchMissions, fetchActivities, fetchActiveMission]);

  // Handle active mission selection
  const handleSelectMission = (id: string) => {
    setActiveMissionId(id);
    fetchActiveMission(id);
  };

  // Submit new mission composer form
  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          priority: newPriority,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewTitle('');
        setNewDesc('');
        setNewPriority('MEDIUM');
        fetchMissions();
        handleSelectMission(data.mission.id);
      }
    } catch (e) {
      console.error('Failed to create mission', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run the planned mission
  const handleRunMission = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/missions/${id}/run`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchActiveMission(id);
        fetchMissions();
      }
    } catch (e) {
      console.error('Failed to run mission', e);
    }
  };

  // Utility icons for specialized AI Workers
  const getWorkerIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'research':
        return <Compass className="w-5 h-5 text-blue-400" />;
      case 'finance':
        return <BarChart3 className="w-5 h-5 text-emerald-400" />;
      case 'marketing':
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'operations':
        return <Layers className="w-5 h-5 text-amber-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'QUEUED':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'WAITING_DEPENDENCIES':
        return <Layers className="w-5 h-5 text-zinc-600 animate-pulse" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-zinc-700" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ";
    switch (status) {
      case 'COMPLETED':
        return <span className={base + "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20"}>Completed</span>;
      case 'FAILED':
        return <span className={base + "bg-red-950/40 text-red-400 border border-red-500/20"}>Failed</span>;
      case 'RUNNING':
        return <span className={base + "bg-blue-950/40 text-blue-400 border border-blue-500/20 animate-pulse"}>Running</span>;
      case 'QUEUED':
        return <span className={base + "bg-amber-950/40 text-amber-400 border border-amber-500/20"}>Queued</span>;
      case 'WAITING_DEPENDENCIES':
        return <span className={base + "bg-zinc-800 text-zinc-400 border border-zinc-700"}>Waiting</span>;
      default:
        return <span className={base + "bg-zinc-900 text-zinc-500 border border-zinc-800"}>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              HIVEFORGE <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-500/25 px-2 py-0.5 rounded-full font-mono uppercase">Platform</span>
            </h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              Active Workspace: <span className="text-zinc-300 font-semibold">{workspace?.name || 'Loading...'}</span>
            </p>
          </div>
        </div>

        {/* Engine Status Indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-900">
            <div className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-mono text-zinc-400">
              API Server: {apiOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-900">
            <div className={`w-2.5 h-2.5 rounded-full ${usingInMemory ? 'bg-amber-500' : 'bg-indigo-500'}`} />
            <span className="text-xs font-mono text-zinc-400">
              Queue: {usingInMemory ? 'IN-MEMORY' : 'BULLMQ (REDIS)'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Mission Composer & History */}
        <aside className="w-80 border-r border-zinc-900 bg-zinc-950/10 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
          {/* Section: Mission Composer */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Compose Mission
            </h2>
            <form onSubmit={handleCreateMission} className="flex flex-col gap-3.5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Mission Title</label>
                <input
                  type="text"
                  placeholder="e.g. Stationery Store Launch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Goal Description</label>
                <textarea
                  placeholder="Describe what specialized workers need to accomplish..."
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Execution Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim() || !newDesc.trim()}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Decompose Goal
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section: Missions History */}
          <div className="flex flex-col gap-3 flex-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Missions List
            </h2>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-96 pr-1">
              {missions.length === 0 ? (
                <div className="text-xs text-zinc-600 italic py-6 text-center">No missions created yet.</div>
              ) : (
                missions.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMission(m.id)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition flex flex-col gap-1.5 ${
                      activeMissionId === m.id
                        ? 'bg-zinc-900 border-indigo-500/50'
                        : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200 line-clamp-1">{m.title}</span>
                      {getStatusBadge(m.status)}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Tasks: {m.tasks?.length || 0}</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Center Area: Current Executing Graph & Outputs */}
        <section className="flex-1 flex flex-col overflow-y-auto bg-zinc-950/10 p-6 gap-6">
          {!activeMission ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500 py-12">
              <Cpu className="w-12 h-12 text-zinc-800" />
              <div className="text-center">
                <h3 className="text-sm font-semibold text-zinc-400">No Active Mission</h3>
                <p className="text-xs text-zinc-600 max-w-xs mt-1">Compose a new mission or select one from the history panel to view live logs.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mission Heading */}
              <div className="flex items-start justify-between gap-6 bg-zinc-950/40 p-5 rounded-xl border border-zinc-900">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{activeMission.title}</h2>
                    {getStatusBadge(activeMission.status)}
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                      Priority: {activeMission.priority}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{activeMission.description}</p>
                </div>

                {activeMission.status === 'QUEUED' && (
                  <button
                    onClick={() => handleRunMission(activeMission.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 fill-white" /> Execute Mission
                  </button>
                )}
              </div>

              {/* Task Dependency Live Graph Flow */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <ActivityIcon className="w-4 h-4 text-indigo-400" /> Live Execution Graph
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeMission.tasks?.map((t, idx) => (
                    <div
                      key={t.id}
                      className={`bg-zinc-950/50 border rounded-xl p-4.5 flex flex-col justify-between gap-4 transition relative ${
                        t.status === 'RUNNING'
                          ? 'border-indigo-500 ring-1 ring-indigo-500/20 bg-indigo-950/5'
                          : t.status === 'COMPLETED'
                          ? 'border-emerald-500/30'
                          : 'border-zinc-900'
                      }`}
                    >
                      {/* Connection Indicator */}
                      {idx < activeMission.tasks.length - 1 && (
                        <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10">
                          <ChevronRight className="w-5 h-5 text-zinc-800" />
                        </div>
                      )}

                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-2 py-1 rounded-lg">
                            {getWorkerIcon(t.workerType)}
                            <span className="text-[10px] font-bold text-zinc-300">{t.workerType} Worker</span>
                          </div>
                          {getStatusIcon(t.status)}
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">{t.title}</h4>
                          <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-normal">{t.description}</p>
                        </div>
                      </div>

                      <div className="border-t border-zinc-900/60 pt-2.5 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                        <span>Duration: {t.assignments?.[0]?.duration ? `${(t.assignments[0].duration / 1000).toFixed(1)}s` : '--'}</span>
                        <span>Tokens: {t.assignments?.[0]?.costTokens ?? '--'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Terminal and Generated Deliverables Tabbed Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[400px]">
                {/* Console Logs Terminal */}
                <div className="flex flex-col gap-3 bg-zinc-950 rounded-xl border border-zinc-900 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-zinc-400" /> Execution Logs Console
                  </h3>

                  <div className="flex-1 bg-black rounded-lg border border-zinc-900 p-4 font-mono text-[11px] text-zinc-400 overflow-y-auto max-h-[350px] leading-relaxed">
                    {activeMission.tasks?.flatMap(t => t.logs || []).length === 0 ? (
                      <div className="text-zinc-700 italic">Logs terminal awaiting trigger...</div>
                    ) : (
                      activeMission.tasks
                        ?.flatMap(t => (t.logs || []).map(l => ({ ...l, taskTitle: t.title })))
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((l) => (
                          <div key={l.id} className="mb-2">
                            <span className="text-zinc-600">[{new Date(l.createdAt).toLocaleTimeString()}]</span>{' '}
                            <span className="text-indigo-400">[{l.taskTitle}]</span>{' '}
                            <span className={l.logType === 'stderr' ? 'text-red-400' : l.logType === 'response' ? 'text-emerald-400' : 'text-zinc-300'}>
                              {l.message}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Deliverables Artifact Viewer */}
                <div className="flex flex-col gap-3 bg-zinc-950 rounded-xl border border-zinc-900 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" /> Deliverables / Artifacts
                  </h3>

                  <div className="flex-1 overflow-y-auto max-h-[350px] flex flex-col gap-3">
                    {activeMission.tasks?.filter(t => t.artifacts && t.artifacts.length > 0).length === 0 ? (
                      <div className="text-xs text-zinc-600 italic py-12 text-center">No deliverables generated yet. Prerequisite tasks must complete first.</div>
                    ) : (
                      activeMission.tasks
                        ?.filter(t => t.artifacts && t.artifacts.length > 0)
                        .map((t) => (
                          <div key={t.id} className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-4 flex flex-col gap-2 text-left">
                            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                              <span className="text-xs font-bold text-white">{t.artifacts?.[0]?.title}</span>
                              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                                {t.artifacts?.[0]?.type}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1">
                              {t.artifacts?.[0]?.versions?.[0]?.content}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Bottom Status Ticker & Live Activities Stream */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 px-6 py-3 shrink-0 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-400 shrink-0 flex items-center gap-1">
            <ActivityIcon className="w-3.5 h-3.5" /> Activity Stream:
          </span>
          <div className="overflow-hidden relative flex-1 h-5">
            {activities.length === 0 ? (
              <span className="italic text-zinc-700">Awaiting activities...</span>
            ) : (
              <span className="animate-pulse text-zinc-300 font-medium truncate block">
                {activities[0]?.message}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-[10px] font-mono text-zinc-600">
          &copy; AMD Developer Hackathon 2026
        </div>
      </footer>
    </div>
  );
}
