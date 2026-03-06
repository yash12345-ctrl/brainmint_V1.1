import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowLeft, Check, List, Calendar, RefreshCw,
  LayoutDashboard, Clock, BarChart3, Loader2, CheckCircle2,
  Inbox, Zap, Target, TrendingUp, Layers,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const API_BASE_URL = "http://localhost:8000/api";

export default function ActiveSprints({ user }) {
  const [page, setPage] = useState("loading");
  const [projectTitle, setProjectTitle] = useState("");
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [backlogTasks, setBacklogTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    loadAllData();
    intervalRef.current = setInterval(() => {
      if (page === "sprintList") loadAllData();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [user?.id, page]);

  const loadAllData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const sprintsRes = await fetch(`${API_BASE_URL}/sprints/?user_id=${user.id}`);
      let sprintData = { sprints: [], project_title: "My Project", current_sprint: null };
      if (sprintsRes.ok) sprintData = await sprintsRes.json();
      setSprints(sprintData.sprints || []);
      setProjectTitle(sprintData.project_title || "My Project");
      setCurrentSprint(sprintData.current_sprint || null);

      const tasksRes = await fetch(`${API_BASE_URL}/tasks/?user_id=${user.id}`);
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const allTasks = [
          ...(tasksData.todo || []), ...(tasksData.progress || []),
          ...(tasksData.review || []), ...(tasksData.done || []),
        ];
        setTotalTasks(allTasks.length);
        setBacklogTasks(allTasks.filter((t) => !t.sprint_id).length);
      }
      setPage(sprintData.sprints?.length > 0 ? "sprintList" : "setup");
    } catch (error) {
      console.error("Error loading data:", error);
      if (sprints.length === 0) setPage("setup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = async (title, sprintList) => {
    try {
      clearInterval(intervalRef.current);
      const res = await fetch(`${API_BASE_URL}/sprints/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, project_title: title, sprints: sprintList }),
      });
      if (res.ok) { setProjectTitle(title); await loadAllData(); }
      else { const err = await res.json(); alert("Failed to save sprints: " + (err.error || "Unknown error")); }
    } catch (err) { alert("Failed to save sprints: " + err.message); }
  };

  const handleReset = async () => {
    if (!window.confirm("Delete all sprints and start over?")) return;
    try {
      clearInterval(intervalRef.current);
      await fetch(`${API_BASE_URL}/sprints/delete/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      setProjectTitle(""); setSprints([]); setCurrentSprint(null);
      setBacklogTasks(0); setTotalTasks(0); setPage("setup");
    } catch (err) { console.error(err); alert("Failed to reset sprints"); }
  };

  if (page === "loading" || (isLoading && sprints.length === 0 && totalTasks === 0)) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/25">
              <Zap size={28} className="text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            <span>Loading your workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full font-sans">
      {page === "setup" && <SetupWizard onSetupComplete={handleSetupComplete} />}
      {page === "sprintList" && (
        <SprintList
          projectTitle={projectTitle} sprints={sprints} currentSprint={currentSprint}
          backlogCount={backlogTasks} totalTasksCount={totalTasks}
          onReset={handleReset} onRefresh={loadAllData} isRefreshing={isLoading}
        />
      )}
    </div>
  );
}

// ── Setup Wizard ──────────────────────────────────────
function SetupWizard({ onSetupComplete }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [sprintCount, setSprintCount] = useState(4);
  const [sprintDetails, setSprintDetails] = useState(
    Array.from({ length: 4 }, (_, i) => ({ title: `Sprint ${i + 1}`, startDate: "", endDate: "" }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCountChange = (e) => {
    const val = e.target.value.trim();
    if (val === "") { setSprintCount(""); return; }
    let count = Math.max(1, Math.min(20, parseInt(val, 10) || 1));
    setSprintCount(count);
    setSprintDetails((prev) => {
      const newList = [...prev];
      while (newList.length < count) newList.push({ title: `Sprint ${newList.length + 1}`, startDate: "", endDate: "" });
      while (newList.length > count) newList.pop();
      return newList;
    });
  };

  const handleDetailChange = (index, field, value) => {
    setSprintDetails((prev) => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await onSetupComplete(
        title.trim() || "My Project",
        sprintDetails.map((s, i) => ({ title: s.title.trim() || `Sprint ${i + 1}`, start_date: s.startDate || "", end_date: s.endDate || "" }))
      );
    } catch (err) { alert("Failed to create sprints: " + err.message); }
    finally { setIsSubmitting(false); }
  };

  const steps = [
    { num: 1, label: "Name", title: "Project Initialization", desc: "Give your project a name to get started." },
    { num: 2, label: "Sprints", title: "Sprint Configuration", desc: "How many sprints does your project need?" },
    { num: 3, label: "Timeline", title: "Timeline Planning", desc: "Set start and end dates for each sprint." },
  ];
  const current = steps[step - 1];

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-white border-r border-slate-100 p-12 relative overflow-hidden">
        {/* Subtle background accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60 translate-x-1/4 translate-y-1/4" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={18} className="text-white" />
            </div>
          </div>
          <span className="text-slate-800 font-bold text-lg">SprintBoard</span>
        </div>

        {/* Middle */}
        <div className="relative z-10 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 text-xs font-medium mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Setup Wizard
            </div>
            <h2 className="text-4xl font-bold text-slate-800 leading-tight mb-4">
              Plan sprints.<br />
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">Ship faster.</span>
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Set up your project structure in minutes and get a clear view of your team's velocity from day one.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Target, text: "Track sprint progress in real-time" },
              { icon: TrendingUp, text: "Visualise velocity and burndown" },
              { icon: Layers, text: "Manage backlog with smart insights" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-violet-600" />
                </div>
                <span className="text-slate-600 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Step tracker */}
          <div className="space-y-2">
            {steps.map((s) => (
              <div key={s.num} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                s.num === step ? "bg-violet-50 border border-violet-200" : s.num < step ? "opacity-70" : "opacity-30"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  s.num < step ? "bg-emerald-500 text-white" : s.num === step ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  {s.num < step ? <Check size={12} /> : s.num}
                </div>
                <span className={`text-sm font-medium ${s.num === step ? "text-slate-800" : "text-slate-400"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-300 text-xs">© 2025 SprintBoard</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-10 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-slate-800 font-bold text-sm">SprintBoard</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`h-1 rounded-full transition-all duration-500 ${
                n === step ? "w-8 bg-violet-600" : n < step ? "w-4 bg-violet-300" : "w-4 bg-slate-200"
              }`} />
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <span className="text-violet-500 text-xs font-semibold uppercase tracking-widest">Step {step} of 3</span>
              <h1 className="text-3xl font-bold text-slate-800 mt-2 mb-2">{current.title}</h1>
              <p className="text-slate-500 text-sm">{current.desc}</p>
            </div>

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Project Name</label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Phoenix Redesign 2025" autoFocus disabled={isSubmitting}
                    onKeyDown={(e) => e.key === "Enter" && title.trim() && setStep(2)}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition text-base shadow-sm"
                  />
                </div>
                <button onClick={() => title.trim() && setStep(2)} disabled={!title.trim() || isSubmitting}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 active:translate-y-0">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Number of Sprints</label>
                  <input
                    type="number" value={sprintCount} onChange={handleCountChange} min={1} max={20} disabled={isSubmitting}
                    onKeyDown={(e) => e.key === "Enter" && sprintCount >= 1 && setStep(3)}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition text-base shadow-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Between 1 and 20 sprints</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(Number(sprintCount) || 0, 8) }).map((_, i) => (
                    <div key={i} className="px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-violet-600 text-xs font-medium">Sprint {i + 1}</div>
                  ))}
                  {Number(sprintCount) > 8 && <div className="px-3 py-1 bg-slate-100 rounded-full text-slate-400 text-xs">+{Number(sprintCount) - 8} more</div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} disabled={isSubmitting} className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl disabled:opacity-40 transition font-medium shadow-sm">
                    <ArrowLeft size={16} className="inline mr-2" />Back
                  </button>
                  <button onClick={() => sprintCount >= 1 && setStep(3)} disabled={isSubmitting || sprintCount < 1}
                    className="flex-[2] py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:-translate-y-0.5">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  {sprintDetails.map((sprint, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-xl hover:border-violet-300 transition-colors shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-xs font-bold border border-violet-200">{i + 1}</div>
                        <input type="text" value={sprint.title} onChange={(e) => handleDetailChange(i, "title", e.target.value)}
                          placeholder={`Sprint ${i + 1}`} disabled={isSubmitting}
                          className="flex-1 bg-transparent border-none text-sm font-semibold focus:outline-none text-slate-700 placeholder-slate-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {["startDate", "endDate"].map((field, fi) => (
                          <div key={field}>
                            <label className="block text-xs text-slate-400 mb-1.5">{fi === 0 ? "Start" : "End"}</label>
                            <input type="date" value={sprint[field]} onChange={(e) => handleDetailChange(i, field, e.target.value)} disabled={isSubmitting}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-violet-400 focus:ring-1 focus:ring-violet-300 focus:outline-none transition" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep(2)} disabled={isSubmitting} className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl disabled:opacity-40 transition font-medium shadow-sm">
                    <ArrowLeft size={16} className="inline mr-2" />Back
                  </button>
                  <button onClick={handleFinish} disabled={isSubmitting}
                    className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5">
                    {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <>Launch Project <Check size={16} /></>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(139,92,246,.25);border-radius:10px}
      `}</style>
    </div>
  );
}

// ── Sprint List Dashboard ─────────────────────────────
function SprintList({ projectTitle, sprints, currentSprint, backlogCount, totalTasksCount, onReset, onRefresh, isRefreshing }) {
  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return "Invalid"; }
  };

  const sprintStats = useMemo(() => {
    let totalDays = 0, earliest = null, latest = null;
    const chartData = sprints.map((s) => {
      let duration = 0;
      if (s.start_date && s.end_date) {
        const start = new Date(s.start_date), end = new Date(s.end_date);
        if (end >= start) {
          duration = Math.ceil((end - start) / 86400000) + 1; totalDays += duration;
          if (!earliest || start < earliest) earliest = start;
          if (!latest || end > latest) latest = end;
        }
      }
      return { name: s.title, Duration: duration, Tasks: s.task_count || 0, Done: s.completed_count || 0 };
    });
    const totalProjectDays = earliest && latest && latest >= earliest ? Math.ceil((latest - earliest) / 86400000) + 1 : 0;
    const totalSprintTasks = sprints.reduce((s, sp) => s + (sp.task_count || 0), 0);
    const completedSprintTasks = sprints.reduce((s, sp) => s + (sp.completed_count || 0), 0);
    return {
      chartData, totalProjectDays,
      avgSprintDays: sprints.length ? (totalDays / sprints.length).toFixed(1) : "0",
      sprintCompletion: totalSprintTasks > 0 ? Math.round((completedSprintTasks / totalSprintTasks) * 100) : 0,
      totalSprintTasks, completedSprintTasks, backlogCount,
      backlogPct: totalTasksCount > 0 ? Math.round((backlogCount / totalTasksCount) * 100) : 0,
      totalTasksCount,
    };
  }, [sprints, currentSprint, backlogCount, totalTasksCount]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="bg-white text-slate-800 px-3 py-2.5 rounded-xl text-xs shadow-xl border border-slate-100">
        <p className="font-semibold mb-1 text-slate-700">{label}</p>
        <p className="text-violet-600">{p.Duration} days</p>
        {p.Tasks > 0 && <p className="text-emerald-600 mt-0.5">{p.Done} / {p.Tasks} done</p>}
      </div>
    );
  };

  const bpct = sprintStats.backlogPct;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="flex-shrink-0 flex justify-between items-center px-8 py-4 bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 leading-tight">{projectTitle}</h1>
            <p className="text-xs text-slate-400">{currentSprint ? `Active: ${currentSprint.title}` : "Sprint Overview"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 disabled:opacity-50 transition shadow-sm">
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-violet-500" : "text-slate-400"} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-xl text-sm font-medium transition">
            <RefreshCw size={14} />Reset
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6 max-w-screen-2xl mx-auto w-full">

        {/* Active Sprint Banner */}
        {currentSprint && (
          <div className="relative rounded-2xl overflow-hidden border border-violet-200 bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/15">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="relative p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-violet-200">Active Sprint</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{currentSprint.title}</h3>
                <p className="text-violet-200 text-sm">{formatDate(currentSprint.start_date)} — {formatDate(currentSprint.end_date)}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-white mb-1">
                  {currentSprint.task_count > 0 ? Math.round((currentSprint.completed_count / currentSprint.task_count) * 100) : 0}
                  <span className="text-2xl text-violet-300">%</span>
                </div>
                <div className="text-sm text-violet-200 mb-3">{currentSprint.completed_count} / {currentSprint.task_count} tasks</div>
                <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-700 rounded-full"
                    style={{ width: `${currentSprint.task_count > 0 ? (currentSprint.completed_count / currentSprint.task_count) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: "Project Timeline", val: sprintStats.totalProjectDays, unit: "days", c: "violet" },
            { icon: BarChart3, label: "Avg Sprint", val: sprintStats.avgSprintDays, unit: "days", c: "indigo" },
            { icon: CheckCircle2, label: "Sprint Progress", val: `${sprintStats.sprintCompletion}%`, unit: "", sub: `${sprintStats.completedSprintTasks} / ${sprintStats.totalSprintTasks} tasks`, c: "emerald" },
            { icon: Inbox, label: "Backlog", val: sprintStats.backlogCount, unit: "tasks", sub: `${bpct}% of all tasks`, c: bpct > 25 ? "amber" : bpct > 10 ? "yellow" : "green" },
          ].map(({ icon: Icon, label, val, unit, sub, c }) => {
            const colors = {
              violet: ["bg-violet-50", "border-violet-100", "text-violet-600", "text-violet-500"],
              indigo: ["bg-indigo-50", "border-indigo-100", "text-indigo-600", "text-indigo-500"],
              emerald: ["bg-emerald-50", "border-emerald-100", "text-emerald-600", "text-emerald-500"],
              amber: ["bg-amber-50", "border-amber-100", "text-amber-600", "text-amber-500"],
              yellow: ["bg-yellow-50", "border-yellow-100", "text-yellow-600", "text-yellow-500"],
              green: ["bg-green-50", "border-green-100", "text-green-600", "text-green-500"],
            }[c];
            return (
              <div key={label} className={`relative p-6 rounded-2xl bg-white border ${colors[1]} group overflow-hidden hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md`}>
                <div className={`absolute top-0 right-0 w-24 h-24 ${colors[0]} rounded-full blur-2xl opacity-80 group-hover:opacity-100 transition-opacity -translate-x-2 -translate-y-2`} />
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${colors[0]} border ${colors[1]} flex items-center justify-center mb-4`}>
                    <Icon size={18} className={colors[2]} />
                  </div>
                  <div className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">{label}</div>
                  <div className="text-3xl font-bold text-slate-800">{val}{unit && <span className="text-lg font-normal text-slate-400 ml-1.5">{unit}</span>}</div>
                  {sub && <div className={`text-xs mt-1.5 ${colors[3]}`}>{sub}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <h3 className="text-sm font-semibold text-slate-700">Sprint Duration Overview</h3>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sprintStats.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Duration" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradV)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#8b5cf6" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Inbox size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Backlog Overview</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className={`text-6xl font-bold mb-2 ${bpct > 25 ? "text-amber-500" : bpct > 10 ? "text-yellow-500" : "text-emerald-500"}`}>{sprintStats.backlogCount}</div>
              <p className="text-slate-600 font-medium mb-1 text-sm">Unassigned Tasks</p>
              <p className="text-xs text-slate-400 mb-5">{bpct}% of {sprintStats.totalTasksCount} total</p>
              <div className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${
                bpct > 25 ? "bg-amber-50 border-amber-200 text-amber-600"
                : bpct > 10 ? "bg-yellow-50 border-yellow-200 text-yellow-600"
                : "bg-emerald-50 border-emerald-200 text-emerald-600"
              }`}>
                {bpct > 25 ? "High – Consider grooming" : bpct > 10 ? "Moderate" : "Healthy – Well planned"}
              </div>
            </div>
          </div>
        </div>

        {/* All Sprints */}
        <section className="pb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-800">All Sprints</h2>
            <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium rounded-full">{sprints.length} sprints</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sprints.map((sprint) => {
              const isActive = currentSprint?.id === sprint.id;
              const pct = sprint.task_count > 0 ? Math.round((sprint.completed_count / sprint.task_count) * 100) : 0;
              return (
                <div key={sprint.id} className={`flex flex-col rounded-2xl border bg-white overflow-hidden hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md ${
                  isActive ? "border-violet-300 shadow-violet-100" : "border-slate-100 hover:border-slate-200"
                }`}>
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-xl border ${isActive ? "bg-violet-50 border-violet-200 text-violet-600" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                        <List size={15} />
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 border border-violet-200 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                          <span className="text-xs font-semibold text-violet-600">Active</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-700 text-sm mb-3 line-clamp-2">{sprint.title}</h3>
                    {sprint.task_count > 0 ? (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                          <span>{sprint.completed_count} / {sprint.task_count}</span>
                          <span className={isActive ? "text-violet-500" : ""}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-700 rounded-full ${isActive ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-slate-300"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ) : <p className="text-xs text-slate-300 italic mb-4">No tasks assigned</p>}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                      <Calendar size={11} className="text-slate-300" />
                      <span>{formatDate(sprint.start_date)}</span>
                      <ArrowRight size={10} className="text-slate-300 mx-0.5" />
                      <span>{formatDate(sprint.end_date)}</span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <button className={`w-full py-2 text-xs font-medium rounded-xl transition border ${
                      isActive ? "bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-200" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100"
                    }`}>
                      View Sprint Details
                    </button>
                  </div>
                </div>
              );
            })}

            {backlogCount > 0 && (
              <div className="flex flex-col rounded-2xl border border-amber-200 bg-white overflow-hidden hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-500"><Inbox size={15} /></div>
                    <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full"><span className="text-xs font-semibold text-amber-600">Backlog</span></div>
                  </div>
                  <h3 className="font-semibold text-slate-700 text-sm mb-3">Unassigned Tasks</h3>
                  <div className="mb-4">
                    <div className="text-3xl font-bold text-amber-500 mb-1">{backlogCount}</div>
                    <p className="text-xs text-slate-400">{sprintStats.backlogPct}% of all tasks</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                    <Clock size={11} /><span>Needs planning</span>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button className="w-full py-2 text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-xl transition">
                    View Backlog Tasks
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(139,92,246,.2);border-radius:10px}
      `}</style>
    </div>
  );
}