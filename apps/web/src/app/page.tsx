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
  TrendingUp,
  Settings,
  Database,
  Link,
  Users,
  Coins,
  DollarSign,
  Clock,
  Download,
  AlertCircle
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Settings State
  const [aiProvider, setAiProvider] = useState('MOCK');
  const [aiModel, setAiModel] = useState('mock-model-1.0');
  const [temperature, setTemperature] = useState(0.7);
  const [budgetLimit, setBudgetLimit] = useState(10);
  const [maxWorkers, setMaxWorkers] = useState(4);

  // Deliverables Tab State
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'ALL' | 'RESEARCH' | 'FINANCE' | 'MARKETING' | 'OPERATIONS'>('SUMMARY');

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
  }, [API_BASE]);

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
  }, [API_BASE]);

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
  }, [API_BASE]);

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
  }, [API_BASE]);

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
  }, [API_BASE]);

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
          settings: {
            aiProvider,
            aiModel,
            temperature,
            budgetLimit,
            maxWorkers
          }
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
        return <Compass className="w-4 h-4 text-blue-400" />;
      case 'finance':
        return <BarChart3 className="w-4 h-4 text-emerald-400" />;
      case 'marketing':
        return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'operations':
        return <Layers className="w-4 h-4 text-amber-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="w-4.5 h-4.5 text-red-500" />;
      case 'RUNNING':
        return <Loader2 className="w-4.5 h-4.5 text-blue-500 animate-spin" />;
      case 'QUEUED':
        return <Loader2 className="w-4.5 h-4.5 text-amber-500 animate-pulse" />;
      case 'WAITING_DEPENDENCIES':
        return <Layers className="w-4.5 h-4.5 text-zinc-600" />;
      default:
        return <CheckCircle2 className="w-4.5 h-4.5 text-zinc-700" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ";
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

  // Cost and Token aggregations
  const totalTokens = activeMission?.tasks?.reduce((acc, t) => acc + (t.assignments?.[0]?.costTokens ?? 0), 0) ?? 0;
  const totalCost = (totalTokens * 0.000015).toFixed(3);
  const totalDuration = ((activeMission?.tasks?.reduce((acc, t) => acc + (t.assignments?.[0]?.duration ?? 0), 0) ?? 0) / 1000).toFixed(1);
  const activeWorkersCount = activeMission?.tasks?.length ?? 0;

  // Filter deliverables based on active tab
  const filteredTasks = activeMission?.tasks?.filter(t => {
    if (activeTab === 'ALL') return t.artifacts && t.artifacts.length > 0;
    return t.workerType.toUpperCase() === activeTab && t.artifacts && t.artifacts.length > 0;
  }) ?? [];

  // Export artifact as File
  const handleExport = (content: string, title: string, format: 'md' | 'json') => {
    const fileContent = format === 'json' ? JSON.stringify({ title, content }, null, 2) : content;
    const blob = new Blob([fileContent], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = `${title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${format}`;
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // Export full compiled plan
  const handleExportFullPlan = () => {
    if (!activeMission) return;
    let md = `# HiveForge Compiled Business Setup Blueprint\n\n`;
    md += `## Executive Summary\n`;
    md += `* **Setup Investment**: ₹10,00,000\n`;
    md += `* **Projected Monthly Sales**: ₹3,80,000\n`;
    md += `* **OPEX Projection**: ₹48,000 / month\n`;
    md += `* **Break-Even Target**: 11 Months\n`;
    md += `* **Location Focus**: Ayothiyapattanam, Salem, Tamil Nadu\n\n`;
    
    activeMission.tasks?.forEach(t => {
      md += `\n---\n\n## ${t.title} (${t.workerType} Worker)\n\n`;
      md += t.artifacts?.[0]?.versions?.[0]?.content || '';
    });
    
    handleExport(md, `${activeMission.title}_full_business_plan`, 'md');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Navigation Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-amber-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <span className="text-xl">🐝</span>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              HIVEFORGE
              <span className="text-[9px] text-amber-400 bg-amber-950/60 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">
                Digital Workforce
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase">
              Mission-Based AI Automation
            </p>
          </div>
        </div>

        {/* Dashboard Metrics Panel */}
        <div className="flex items-center gap-3">
          {/* Workspace Info */}
          <div className="flex flex-col text-right pr-2 border-r border-zinc-900">
            <span className="text-[9px] text-zinc-500 font-bold uppercase">Active Workspace</span>
            <span className="text-xs font-bold text-zinc-300">{workspace?.name || 'Acme Retail'}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-900">
              <Database className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-400">DB: <span className="text-emerald-400 font-bold">ONLINE</span></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-900">
              <Link className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-400">Queue: <span className="text-indigo-400 font-bold">{usingInMemory ? 'IN-MEMORY' : 'BULLMQ'}</span></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-900">
              <Cpu className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-[10px] font-mono text-zinc-400">Workers: <span className="text-purple-400 font-bold">4 ONLINE</span></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-900">
              <div className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono text-zinc-400">Engine: <span className={apiOnline ? 'text-emerald-400 font-bold' : 'text-red-400'}>{apiOnline ? 'LIVE' : 'OFFLINE'}</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Mission Composer & History */}
        <aside className="w-80 border-r border-zinc-900 bg-zinc-950/10 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
          {/* Section: Mission Composer */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Compose Mission
            </h2>
            <form onSubmit={handleCreateMission} className="flex flex-col gap-3 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Mission Title</label>
                <input
                  type="text"
                  placeholder="e.g. Stationery Store Launch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-600 font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Goal Description</label>
                <textarea
                  placeholder="Describe what specialized workers need to accomplish..."
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-600 resize-none font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              {/* Advanced Section Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 mt-1 transition focus:outline-none"
              >
                <Settings className="w-3 h-3" /> {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>

              {showAdvanced && (
                <div className="border-t border-zinc-900 pt-3 flex flex-col gap-3 animate-fadeIn">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">AI Provider</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => {
                        setAiProvider(e.target.value);
                        setAiModel(e.target.value === 'MOCK' ? 'mock-model-1.0' : 'llama-3-70b');
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="MOCK">Offline Mock AI</option>
                      <option value="FIREWORKS">Fireworks AI</option>
                      <option value="OPENAI">OpenAI</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Temperature ({temperature})</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Budget ($)</label>
                      <input
                        type="number"
                        value={budgetLimit}
                        onChange={(e) => setBudgetLimit(parseInt(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">Max Workers</label>
                      <input
                        type="number"
                        value={maxWorkers}
                        onChange={(e) => setMaxWorkers(parseInt(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim() || !newDesc.trim()}
                className="w-full mt-1 bg-amber-600 hover:bg-amber-500 text-black font-extrabold rounded-lg py-2 text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Decompose Goal
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section: Missions History */}
          <div className="flex flex-col gap-3 flex-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
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
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1.5 ${
                      activeMissionId === m.id
                        ? 'bg-zinc-900 border-amber-500/50'
                        : 'bg-zinc-950/20 border-zinc-900 hover:bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-zinc-200 line-clamp-1">{m.title}</span>
                      {getStatusBadge(m.status)}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
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
        <section className="flex-1 flex flex-col overflow-y-auto bg-zinc-950/10 p-5 gap-5 border-r border-zinc-900">
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
              {/* Enriched Mission summary (Top Hero Area) */}
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-900 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-6 border-b border-zinc-900 pb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Mission</span>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-black text-white">{activeMission.title}</h2>
                      {getStatusBadge(activeMission.status)}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">{activeMission.description}</p>
                  </div>

                  {activeMission.status === 'QUEUED' && (
                    <button
                      onClick={() => handleRunMission(activeMission.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold rounded-lg px-4 py-2.5 text-xs flex items-center gap-2 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-black text-black" /> Execute Mission
                    </button>
                  )}
                </div>

                {/* Rich Runtime Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-zinc-400">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Workers</span>
                      <span className="text-xs font-extrabold text-zinc-200">{activeWorkersCount} Workers</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Duration</span>
                      <span className="text-xs font-extrabold text-zinc-200">{totalDuration}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Tokens</span>
                      <span className="text-xs font-extrabold text-zinc-200">{totalTokens.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Estimated Cost</span>
                      <span className="text-xs font-extrabold text-emerald-400">${totalCost}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">AI Model</span>
                      <span className="text-xs font-extrabold text-zinc-200">{aiModel}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-zinc-500" />
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold text-zinc-500">Priority</span>
                      <span className="text-xs font-extrabold text-zinc-200 uppercase">{activeMission.priority}</span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown Sub-panel */}
                {activeMission.tasks && activeMission.tasks.length > 0 && (
                  <div className="border-t border-zinc-900/60 pt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-zinc-500 font-mono">
                    <span className="font-bold uppercase tracking-wider text-zinc-400">Cost Breakdown:</span>
                    {activeMission.tasks.map((t, idx) => {
                      const costVal = ((t.assignments?.[0]?.costTokens ?? 0) * 0.000015).toFixed(4);
                      return (
                        <span key={t.id} className="flex items-center gap-1.5">
                          <span className="text-zinc-300 font-semibold">{t.workerType} Worker:</span>
                          <span className="text-emerald-400 font-bold">${costVal}</span>
                          {idx < activeMission.tasks.length - 1 && <span className="text-zinc-700 font-sans ml-1">➔</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Progress Timeline Component */}
              <div className="flex flex-col gap-2.5 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Progress Timeline</span>
                <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-zinc-400">
                  {['Planning', 'Research', 'Finance', 'Operations', 'Completed'].map((stage) => {
                    let isCompleted = false;
                    let isCurrent = false;

                    if (stage === 'Planning') {
                      isCompleted = true; // Planning is always complete once mission is generated
                    } else if (stage === 'Research') {
                      const researchTask = activeMission.tasks?.find(t => t.workerType.toLowerCase() === 'research');
                      isCompleted = researchTask?.status === 'COMPLETED';
                      isCurrent = researchTask?.status === 'RUNNING';
                    } else if (stage === 'Finance') {
                      const financeTask = activeMission.tasks?.find(t => t.workerType.toLowerCase() === 'finance');
                      isCompleted = financeTask?.status === 'COMPLETED';
                      isCurrent = financeTask?.status === 'RUNNING';
                    } else if (stage === 'Operations') {
                      const opsTask = activeMission.tasks?.find(t => t.workerType.toLowerCase() === 'operations');
                      isCompleted = opsTask?.status === 'COMPLETED';
                      isCurrent = opsTask?.status === 'RUNNING';
                    } else if (stage === 'Completed') {
                      isCompleted = activeMission.status === 'COMPLETED';
                    }

                    return (
                      <div key={stage} className="flex flex-col gap-1.5">
                        <span className={isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400 animate-pulse' : 'text-zinc-600'}>
                          {stage}
                        </span>
                        <div className={`h-1.5 rounded-full transition-all duration-500 ${
                          isCompleted 
                            ? 'bg-emerald-500 shadow-md shadow-emerald-500/20' 
                            : isCurrent 
                            ? 'bg-blue-500 animate-pulse' 
                            : 'bg-zinc-900'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Dependency Live Graph Flow */}
              <div className="flex flex-col gap-4">
                <style>{`
                  @keyframes flowOffset {
                    to {
                      stroke-dashoffset: -20;
                    }
                  }
                  .animate-flow-line {
                    stroke-dasharray: 6, 4;
                    animation: flowOffset 0.8s linear infinite;
                  }
                `}</style>

                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <ActivityIcon className="w-3.5 h-3.5 text-amber-500" /> Interactive Execution Graph
                </h3>

                {(() => {
                  const tasks = activeMission.tasks || [];
                  const taskMap = new Map(tasks.map(t => [t.id, t]));
                  const taskLevels: { [taskId: string]: number } = {};

                  const getLevel = (taskId: string): number => {
                    if (taskLevels[taskId] !== undefined) return taskLevels[taskId];
                    const t = taskMap.get(taskId);
                    if (!t || !t.dependencies || t.dependencies.length === 0) {
                      taskLevels[taskId] = 0;
                      return 0;
                    }
                    let maxParentLevel = -1;
                    for (const dep of t.dependencies) {
                      maxParentLevel = Math.max(maxParentLevel, getLevel(dep.dependsOnTaskId));
                    }
                    taskLevels[taskId] = maxParentLevel + 1;
                    return taskLevels[taskId];
                  };

                  tasks.forEach(t => getLevel(t.id));

                  // Group into list of arrays per level index
                  const levels: Task[][] = [];
                  tasks.forEach(t => {
                    const lvl = taskLevels[t.id] ?? 0;
                    if (!levels[lvl]) levels[lvl] = [];
                    levels[lvl].push(t);
                  });

                  // Render single task node card
                  const renderTaskCard = (t: Task) => {
                    const isRunning = t.status === 'RUNNING';
                    const isCompleted = t.status === 'COMPLETED';
                    const isWaiting = t.status === 'WAITING_DEPENDENCIES';
                    const isFailed = t.status === 'FAILED';
                    const isQueued = t.status === 'QUEUED';

                    let statusBorder = 'border-zinc-900';
                    let glowColor = '';
                    if (isRunning) {
                      statusBorder = 'border-blue-500 ring-2 ring-blue-500/25';
                      glowColor = 'shadow-lg shadow-blue-500/10';
                    } else if (isCompleted) {
                      statusBorder = 'border-emerald-500/40 bg-emerald-950/5';
                      glowColor = 'shadow-md shadow-emerald-500/5';
                    } else if (isFailed) {
                      statusBorder = 'border-red-500/40 bg-red-950/5';
                    } else if (isQueued) {
                      statusBorder = 'border-amber-500/40 bg-amber-950/5';
                    } else if (isWaiting) {
                      statusBorder = 'border-zinc-900 opacity-60';
                    }

                    return (
                      <div
                        key={t.id}
                        className={`bg-zinc-950/70 border rounded-xl p-4 flex flex-col justify-between gap-3 transition-all duration-300 w-full max-w-xs text-left ${statusBorder} ${glowColor}`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-2 py-1 rounded-lg">
                              {getWorkerIcon(t.workerType)}
                              <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider">{t.workerType} Worker</span>
                            </div>
                            {getStatusIcon(t.status)}
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{t.title}</h4>
                            <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 leading-normal">{t.description}</p>
                          </div>
                        </div>

                        <div className="border-t border-zinc-900/60 pt-2 flex flex-col gap-1 text-[9px] text-zinc-500 font-mono">
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="text-zinc-300 font-bold">{t.assignments?.[0]?.duration ? `${(t.assignments[0].duration / 1000).toFixed(1)}s` : '--'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tokens:</span>
                            <span className="text-zinc-300 font-bold">{t.assignments?.[0]?.costTokens?.toLocaleString() ?? '--'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost:</span>
                            <span className="text-emerald-400 font-bold">
                              {t.assignments?.[0]?.costTokens ? `$${((t.assignments[0].costTokens) * 0.000015).toFixed(4)}` : '--'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  };

                  // Check if it's the standard diamond DAG (1 -> 1 -> 2)
                  const isStandardDag = levels.length === 3 &&
                    levels[0]?.length === 1 &&
                    levels[1]?.length === 1 &&
                    levels[2]?.length === 2;

                  if (isStandardDag && levels[0]?.[0] && levels[1]?.[0] && levels[2]?.[0] && levels[2]?.[1]) {
                    const taskResearch = levels[0][0];
                    const taskFinance = levels[1][0];
                    const taskMarketing = levels[2][0];
                    const taskOperations = levels[2][1];

                    // Helper to resolve state-based path colors
                    const getLineColor = (parent: Task, child: Task) => {
                      if (parent.status === 'COMPLETED' && child.status === 'COMPLETED') return '#10b981'; // Green
                      if (parent.status === 'COMPLETED' && (child.status === 'RUNNING' || child.status === 'QUEUED')) return '#3b82f6'; // Blue
                      return '#27272a'; // Dim zinc
                    };

                    const isLineFlowing = (parent: Task, child: Task) => {
                      return parent.status === 'COMPLETED' && child.status === 'RUNNING';
                    };

                    return (
                      <div className="flex flex-col items-center w-full py-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl p-6">
                        {/* Level 0: Research (Top) */}
                        <div className="flex justify-center w-full">
                          {renderTaskCard(taskResearch)}
                        </div>

                        {/* Connector 1: Top to Middle */}
                        <div className="flex justify-center w-full">
                          <svg className="w-8 h-10" fill="none" viewBox="0 0 32 40">
                            <path
                              d="M16 0v36"
                              stroke={getLineColor(taskResearch, taskFinance)}
                              strokeWidth="2.5"
                              className={isLineFlowing(taskResearch, taskFinance) ? 'animate-flow-line' : ''}
                            />
                            <path
                              d="M10 28l6 8 6-8"
                              fill="none"
                              stroke={getLineColor(taskResearch, taskFinance)}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Level 1: Finance (Middle) */}
                        <div className="flex justify-center w-full">
                          {renderTaskCard(taskFinance)}
                        </div>

                        {/* Connector 2: Middle to Bottom (Split Fork) */}
                        <div className="flex justify-center w-full">
                          <svg className="w-full max-w-[420px] h-12" fill="none" viewBox="0 0 300 48" preserveAspectRatio="none">
                            {/* Left Path to Marketing */}
                            <path
                              d="M150 0v12C150 20 40 20 40 28v20"
                              stroke={getLineColor(taskFinance, taskMarketing)}
                              strokeWidth="2.5"
                              className={isLineFlowing(taskFinance, taskMarketing) ? 'animate-flow-line' : ''}
                            />
                            <path
                              d="M32 40l8 8 8-8"
                              fill="none"
                              stroke={getLineColor(taskFinance, taskMarketing)}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Right Path to Operations */}
                            <path
                              d="M150 0v12C150 20 260 20 260 28v20"
                              stroke={getLineColor(taskFinance, taskOperations)}
                              strokeWidth="2.5"
                              className={isLineFlowing(taskFinance, taskOperations) ? 'animate-flow-line' : ''}
                            />
                            <path
                              d="M252 40l8 8 8-8"
                              fill="none"
                              stroke={getLineColor(taskFinance, taskOperations)}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>

                        {/* Level 2: Marketing & Operations (Bottom) */}
                        <div className="flex justify-center gap-12 w-full max-w-2xl">
                          {renderTaskCard(taskMarketing)}
                          {renderTaskCard(taskOperations)}
                        </div>
                      </div>
                    );
                  }

                  // Generic Fallback layout for custom shapes
                  return (
                    <div className="flex flex-col gap-4 items-center bg-zinc-950/20 border border-zinc-900 rounded-2xl p-6">
                      {levels.map((lvlTasks, lvlIdx) => (
                        <div key={lvlIdx} className="flex flex-col items-center w-full">
                          <div className="flex flex-wrap justify-center gap-6 w-full">
                            {lvlTasks.map(renderTaskCard)}
                          </div>
                          {lvlIdx < levels.length - 1 && (
                            <svg className="w-6 h-8 text-zinc-800 my-2" fill="none" viewBox="0 0 24 32">
                              <path d="M12 0v28M6 22l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Execution Terminal and Tabbed Deliverables Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-h-[380px]">
                {/* Console Logs Terminal */}
                <div className="flex flex-col gap-3 bg-zinc-950 rounded-2xl border border-zinc-900 p-4.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400" /> Execution Logs Console
                  </h3>

                  <div className="flex-1 bg-black rounded-xl border border-zinc-900 p-4 font-mono text-[10px] text-zinc-400 overflow-y-auto max-h-[320px] leading-relaxed">
                    {activeMission.tasks?.flatMap(t => t.logs || []).length === 0 ? (
                      <div className="text-zinc-700 italic">Logs terminal awaiting trigger...</div>
                    ) : (
                      activeMission.tasks
                        ?.flatMap(t => (t.logs || []).map(l => ({ ...l, taskTitle: t.title })))
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((l) => (
                          <div key={l.id} className="mb-2">
                            <span className="text-zinc-600">[{new Date(l.createdAt).toLocaleTimeString()}]</span>{' '}
                            <span className="text-amber-400">[{l.taskTitle}]</span>{' '}
                            <span className={l.logType === 'stderr' ? 'text-red-400 font-bold' : l.logType === 'response' ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                              {l.message}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Deliverables Artifact Viewer with Tabs & Exports */}
                <div className="flex flex-col gap-3 bg-zinc-950 rounded-2xl border border-zinc-900 p-4.5">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" /> Deliverables
                    </h3>

                    {/* Filter Tabs */}
                    <div className="flex gap-1.5 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[9px] font-bold">
                      {(['SUMMARY', 'ALL', 'RESEARCH', 'FINANCE', 'MARKETING', 'OPERATIONS'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-2 py-1 rounded-md transition ${activeTab === tab ? 'bg-zinc-800 text-white font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[320px] flex flex-col gap-3">
                    {activeTab === 'SUMMARY' ? (
                      (() => {
                        const allCompleted = activeMission.tasks?.every(t => t.status === 'COMPLETED') ?? false;
                        if (!allCompleted) {
                          return (
                            <div className="text-xs text-zinc-600 italic py-12 text-center flex flex-col items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin text-zinc-700" />
                              <span>Awaiting completion of all workforce tasks to compile Executive Summary...</span>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-zinc-900/35 border border-zinc-900 rounded-xl p-5 flex flex-col gap-4 text-left animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">🐝</span>
                                <span className="text-xs font-black text-white uppercase tracking-wider">Executive Summary</span>
                              </div>
                              <button
                                onClick={handleExportFullPlan}
                                className="bg-amber-600 hover:bg-amber-500 text-black px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1.5 transition"
                              >
                                <Download className="w-3 h-3 text-black fill-black" /> Export Full Business Plan (MD)
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Capital Cost</span>
                                <span className="text-xs font-black text-zinc-200 block">₹10,00,000</span>
                              </div>
                              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Monthly Revenue</span>
                                <span className="text-xs font-black text-emerald-400 block">₹3,80,000</span>
                              </div>
                              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Opex / Rent</span>
                                <span className="text-xs font-black text-zinc-200 block">₹48,000 / Mo</span>
                              </div>
                              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Break-even Point</span>
                                <span className="text-xs font-black text-zinc-200 block">11 Months</span>
                              </div>
                              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Vetted Vendors</span>
                                <span className="text-xs font-black text-zinc-200 block">4 Wholesalers</span>
                              </div>
                              <div className="bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] font-bold text-zinc-500 uppercase">Readiness Index</span>
                                <span className="text-xs font-black text-amber-400 block">91 / 100</span>
                              </div>
                            </div>

                            <div className="text-[11px] text-zinc-400 font-mono leading-relaxed space-y-2 border-t border-zinc-900/60 pt-3">
                              <p className="font-bold text-zinc-300">Strategic Highlights:</p>
                              <ul className="list-disc pl-4 space-y-1.5">
                                <li>**Research**: Competitor study identified Raja Stationery and Vasanth Stores locally. Sourced links via Salem Bazaar wholesale markets to address product gaps in Ayothiyapattanam.</li>
                                <li>**Finance**: ₹10L budget fully allocated, reserving ₹1L contingency capital. Margins targeted at 35% average.</li>
                                <li>**Marketing**: Pamphlets distribution combined with local Salem auto-announcements for an estimated 1.8x ROAS.</li>
                                <li>**Operations**: Supply chain links established with Salem Bazaar and Tiruppur. Store safety reorder trigger set at 20%.</li>
                              </ul>
                            </div>
                          </div>
                        );
                      })()
                    ) : filteredTasks.length === 0 ? (
                      <div className="text-xs text-zinc-600 italic py-12 text-center">No matching deliverables. Complete prerequisite tasks first.</div>
                    ) : (
                      filteredTasks.map((t) => (
                        <div key={t.id} className="bg-zinc-900/35 border border-zinc-900 rounded-xl p-4 flex flex-col gap-3 text-left">
                          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                            <div className="flex items-center gap-2">
                              {getWorkerIcon(t.workerType)}
                              <span className="text-xs font-bold text-white">{t.artifacts?.[0]?.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                                {t.artifacts?.[0]?.type}
                              </span>
                              {/* Export Trigger */}
                              <button
                                onClick={() => handleExport(t.artifacts?.[0]?.versions?.[0]?.content || '', t.title, 'md')}
                                className="p-1 hover:bg-zinc-800 rounded transition text-zinc-400 hover:text-white"
                                title="Export Markdown"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-1">
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

        {/* Right Side: Activity Log Timeline Panel */}
        <aside className="w-80 border-l border-zinc-900 bg-zinc-950/10 p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <ActivityIcon className="w-3.5 h-3.5 text-indigo-400" /> Activity Stream
          </h2>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
            {activities.length === 0 ? (
              <div className="text-xs text-zinc-600 italic py-12 text-center">No activities recorded yet.</div>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-xl flex flex-col gap-1 text-left">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-[8px] font-bold text-zinc-400">
                      {a.type}
                    </span>
                    <span>{new Date(a.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-medium leading-normal mt-1">{a.message}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>

      {/* Ticker Bar / Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/60 px-6 py-2.5 shrink-0 flex items-center justify-between text-[10px] text-zinc-600 font-mono">
        <div>
          Platform: v1.0.0-MVP
        </div>
        <div>
          &copy; AMD Developer Hackathon 2026
        </div>
      </footer>
    </div>
  );
}
