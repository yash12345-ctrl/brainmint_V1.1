import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingUp, CheckCircle2, AlertCircle, LayoutDashboard,
  ArrowUpRight, ArrowDownRight, Download, Filter, ChevronDown, Clock,
  Inbox, ChevronUp, Search, Calendar, Flag, Activity
} from "lucide-react";

const API_BASE_URL = "https://brainmint-v1-1.onrender.com/api";

const PRIORITY_STYLES = {
  High:   { bg: "bg-red-50",   text: "text-red-600",   border: "border-red-100",   dot: "bg-red-500" },
  Medium: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", dot: "bg-amber-400" },
  Low:    { bg: "bg-green-50", text: "text-green-600", border: "border-green-100", dot: "bg-green-500" },
};
const STATUS_STYLES = {
  todo:     { label: "To Do",       bg: "bg-slate-100",  text: "text-slate-600" },
  progress: { label: "In Progress", bg: "bg-blue-50",    text: "text-blue-600" },
  review:   { label: "Review",      bg: "bg-violet-50",  text: "text-violet-600" },
  done:     { label: "Done",        bg: "bg-emerald-50", text: "text-emerald-600" },
};

// ── Stat Card ────────────────────────────────────────────────────
const StatCard = ({ title, value, subValue, trend, trendUp, icon: Icon, accent = "violet" }) => {
  const accents = {
    violet:  { iconBg: "bg-violet-50",  iconText: "text-violet-600",  border: "border-violet-100",  glow: "bg-violet-100",  bar: "bg-violet-500" },
    blue:    { iconBg: "bg-blue-50",    iconText: "text-blue-600",    border: "border-blue-100",    glow: "bg-blue-100",    bar: "bg-blue-500" },
    amber:   { iconBg: "bg-amber-50",   iconText: "text-amber-600",   border: "border-amber-100",   glow: "bg-amber-100",   bar: "bg-amber-500" },
    red:     { iconBg: "bg-red-50",     iconText: "text-red-600",     border: "border-red-100",     glow: "bg-red-100",     bar: "bg-red-500" },
    emerald: { iconBg: "bg-emerald-50", iconText: "text-emerald-600", border: "border-emerald-100", glow: "bg-emerald-100", bar: "bg-emerald-500" },
  };
  const a = accents[accent] || accents.violet;
  return (
    <div className={`relative bg-white rounded-2xl border ${a.border} p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group flex flex-col justify-between h-full`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${a.glow} rounded-full blur-2xl opacity-50 group-hover:opacity-90 transition-opacity -translate-x-3 -translate-y-3`} />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 ${a.iconBg} rounded-xl border ${a.border}`}>
            <Icon className={`w-4 h-4 ${a.iconText}`} />
          </div>
          {trend && (
            <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
              {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{trend}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{title}</p>
        <div className="text-3xl font-bold text-slate-800 leading-none mb-1">{value}</div>
        {subValue && <p className="text-xs text-slate-400 mt-auto pt-2">{subValue}</p>}
        <div className={`h-0.5 w-8 ${a.bar} rounded-full mt-3 opacity-40 group-hover:opacity-100 group-hover:w-full transition-all duration-500`} />
      </div>
    </div>
  );
};

// ── Backlog Table ────────────────────────────────────────────────
function BacklogTable({ tasks }) {
  const [search, setSearch]     = useState("");
  const [priority, setPriority] = useState("All");
  const [status, setStatus]     = useState("All");
  const [sortKey, setSortKey]   = useState("id");
  const [sortDir, setSortDir]   = useState("desc");
  const [page, setPage]         = useState(1);
  const PER_PAGE = 8;

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronDown size={11} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={11} className="text-violet-500" /> : <ChevronDown size={11} className="text-violet-500" />;
  };

  const filtered = tasks
    .filter(t => {
      if (priority !== "All" && t.priority !== priority) return false;
      if (status !== "All" && t.status !== status) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "priority") { const o = { High: 0, Medium: 1, Low: 2 }; av = o[a.priority] ?? 3; bv = o[b.priority] ?? 3; }
      if (sortKey === "dueDate") { av = a.dueDate ? new Date(a.dueDate) : new Date("9999"); bv = b.dueDate ? new Date(b.dueDate) : new Date("9999"); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const isOverdue = (d) => d && new Date(d) < today;
  const highCount    = tasks.filter(t => t.priority === "High").length;
  const mediumCount  = tasks.filter(t => t.priority === "Medium").length;
  const lowCount     = tasks.filter(t => t.priority === "Low").length;
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate)).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col w-full">
      <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <Inbox className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Backlog</h3>
              <p className="text-xs text-slate-400">Tasks not assigned to any sprint</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {highCount > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />{highCount} High</span>}
            {mediumCount > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{mediumCount} Med</span>}
            {lowCount > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />{lowCount} Low</span>}
            {overdueCount > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold"><AlertCircle size={11} />{overdueCount} Overdue</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input type="text" placeholder="Search tasks…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl w-52 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-slate-50 placeholder-slate-300 transition" />
          </div>
          <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400 bg-slate-50 text-slate-600">
            <option value="All">All Priorities</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-violet-400 bg-slate-50 text-slate-600">
            <option value="All">All Statuses</option>
            <option value="todo">To Do</option><option value="progress">In Progress</option><option value="review">Review</option>
          </select>
          <span className="ml-auto text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {paged.length > 0 ? (
        <>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("title")}><span className="flex items-center gap-1">Task <SortIcon col="title" /></span></th>
                  <th className="px-6 py-3 text-center cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("priority")}><span className="flex items-center justify-center gap-1">Priority <SortIcon col="priority" /></span></th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center cursor-pointer hover:text-slate-600 select-none" onClick={() => toggleSort("dueDate")}><span className="flex items-center justify-center gap-1">Due Date <SortIcon col="dueDate" /></span></th>
                  <th className="px-6 py-3 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map(task => {
                  const p = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;
                  const s = STATUS_STYLES[task.status] || STATUS_STYLES.todo;
                  const ov = isOverdue(task.dueDate) && task.status !== "done";
                  const prog = task.progress || 0;
                  return (
                    <tr key={task.id} className={`hover:bg-violet-50/20 transition-colors group/row ${ov ? "bg-red-50/20" : ""}`}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          {ov && <AlertCircle size={13} className="text-red-400 flex-shrink-0" />}
                          <span className="font-semibold text-slate-700 group-hover/row:text-violet-700 transition-colors">{task.title}</span>
                        </div>
                        {task.subtasks?.total > 0 && <span className="text-xs text-slate-400 mt-0.5 block">{task.subtasks.completed}/{task.subtasks.total} subtasks</span>}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${p.bg} ${p.text} ${p.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />{task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        {task.dueDate ? (
                          <span className={`flex items-center justify-center gap-1.5 text-xs font-medium ${ov ? "text-red-500" : "text-slate-500"}`}>
                            <Calendar size={11} />{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        ) : <span className="text-slate-200 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex-1 max-w-[80px] bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${prog}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 w-7 text-right font-medium">{prog}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
              <span className="text-xs text-slate-400">Page {page} of {totalPages} · {filtered.length} tasks</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-white transition">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition ${page === p ? "bg-violet-600 border-violet-600 text-white shadow-sm" : "border-slate-200 text-slate-600 hover:bg-white"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-white transition">Next</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
            <Flag className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            {search || priority !== "All" || status !== "All" ? "No tasks match your filters" : "No backlog tasks — everything is assigned!"}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function SprintReportDashboard({ user }) {
  const [report, setReport] = useState({
    historical: [], current_burndown: [], task_distribution: [],
    summary: { avg_velocity: 0, completion_rate: 0, total_tasks: 0, bug_ratio: 0 }
  });
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [totalTasks,   setTotalTasks]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    const userId = user?.[0] || user?.id;
    if (!userId) { setLoading(false); return; }
    (async () => {
      setLoading(true); setError(null);
      try {
        const [reportRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/sprint-report/?user_id=${userId}`),
          fetch(`${API_BASE_URL}/tasks/?user_id=${userId}`),
        ]);
        if (!reportRes.ok) throw new Error((await reportRes.json()).error || "Failed to load sprint report");
        if (!tasksRes.ok)  throw new Error("Failed to load tasks");
        const reportData = await reportRes.json();
        const tasksData  = await tasksRes.json();
        setReport(reportData);
        const allTasks = [
          ...(tasksData.todo     || []).map(t => ({ ...t, status: "todo" })),
          ...(tasksData.progress || []).map(t => ({ ...t, status: "progress" })),
          ...(tasksData.review   || []).map(t => ({ ...t, status: "review" })),
          ...(tasksData.done     || []).map(t => ({ ...t, status: "done" })),
        ];
        setTotalTasks(allTasks.length);
        setBacklogTasks(allTasks.filter(t => !t.sprint_id && t.status !== "done"));
      } catch (err) { console.error(err); setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [user]);

  const { historical, current_burndown, task_distribution, summary } = report;
  const backlogCount      = backlogTasks.length;
  const backlogPercentage = totalTasks > 0 ? Math.round((backlogCount / totalTasks) * 100) : 0;

  if (loading) return (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Activity size={24} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 blur-xl opacity-30 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Loading sprint retrospective...
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-full w-full flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg border border-red-100">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 font-semibold text-sm shadow-md shadow-violet-500/20 transition">Retry</button>
      </div>
    </div>
  );

  if (historical.length === 0) return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-8 py-3.5 shadow-sm z-20">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Sprint Retrospective</h1>
              <p className="text-xs text-slate-400">Insights from 0 sprints</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-400 cursor-not-allowed shadow-sm">
              <Filter size={13} className="text-slate-300" /> Filter <ChevronDown size={13} className="text-slate-200" />
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 bg-violet-400 text-white/90 rounded-xl text-xs font-bold cursor-not-allowed">
              <Download size={13} /> Export Report
            </button>
          </div>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 min-h-full w-full max-w-screen-2xl mx-auto flex flex-col">
          
          {/* ── Full-width Empty State Hero ── */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[450px] p-8">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-violet-50/80 to-transparent pointer-events-none" />
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 -left-24 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-violet-200/50 border border-violet-100/50">
                <LayoutDashboard className="w-12 h-12 text-violet-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">No Sprint History Yet</h2>
              <p className="text-slate-500 text-base mb-10 leading-relaxed">
                Your retrospective dashboard will come to life here. Complete your first sprint to unlock velocity trends, burndown charts, and powerful team insights.
              </p>
              <button className="px-8 py-3.5 bg-violet-600 text-white rounded-2xl hover:bg-violet-500 hover:-translate-y-0.5 font-bold text-sm shadow-xl shadow-violet-600/30 transition-all duration-200 flex items-center gap-2">
                Go to Active Sprints <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          {/* ── Backlog Table ── */}
          <div className="w-full">
            <BacklogTable tasks={backlogTasks} />
          </div>

        </div>
      </div>
    </div>
  );

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white px-3 py-2.5 rounded-xl text-xs shadow-xl border border-slate-100">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>)}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-8 py-3.5 shadow-sm z-20">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/20">
              <Activity size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight">Sprint Retrospective</h1>
              <p className="text-xs text-slate-400">Insights from {historical.length} sprint{historical.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm">
              <Filter size={13} className="text-slate-400" /> Filter <ChevronDown size={13} className="text-slate-300" />
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition">
              <Download size={13} /> Export Report
            </button>
          </div>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 min-h-full w-full max-w-screen-2xl mx-auto">

          {/* ── Row 1: KPI Cards — fixed height ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 h-36">
            <StatCard title="Avg Velocity"    value={`${summary.avg_velocity || 0}`}       subValue="points / sprint"       trend="+8%"   trendUp={true}  icon={TrendingUp}    accent="violet"  />
            <StatCard title="Completion Rate" value={`${summary.completion_rate || 0}%`}   subValue="of committed work"     trend="-2%"   trendUp={false} icon={CheckCircle2}  accent="emerald" />
            <StatCard title="Total Tasks"     value={totalTasks || summary.total_tasks || 0} subValue="across all sprints"  icon={LayoutDashboard} accent="blue" />
            <StatCard title="Backlog"          value={backlogCount}  subValue={`${backlogPercentage}% unassigned`}           icon={Inbox}   accent="amber"  />
            <StatCard title="Bug Ratio"        value={`${summary.bug_ratio || 0}%`}         subValue="of total effort"      trend="-1.5%" trendUp={true}  icon={AlertCircle}   accent="red"     />
          </div>

          {/* ── Row 2: Velocity (2/3) + Burndown (1/3) — tall ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: "320px" }}>
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
              <div className="flex items-start justify-between mb-4 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Velocity Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Committed vs Delivered per sprint</p>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-violet-200" />Committed</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-violet-600" />Completed</div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historical} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="committed" fill="#ede9fe" radius={[5,5,0,0]} name="Committed" />
                    <Bar dataKey="completed"  fill="#7c3aed" radius={[5,5,0,0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
              <div className="flex-shrink-0 mb-4">
                <h3 className="text-sm font-bold text-slate-800">Current Burndown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ideal vs Actual remaining</p>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={current_burndown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="redFade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="ideal"     stroke="#cbd5e1" strokeDasharray="5 5" fill="none"           strokeWidth={1.5} name="Ideal" />
                    <Area type="monotone" dataKey="remaining" stroke="#ef4444"                       fill="url(#redFade)"  strokeWidth={2}   name="Actual" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Row 3: Pie (1/3) + Sprint History (2/3) — tall ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: "360px" }}>
            {/* Pie */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex-shrink-0">Work Distribution</h3>
              <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={task_distribution} cx="50%" cy="45%" innerRadius="35%" outerRadius="60%" paddingAngle={3} dataKey="value">
                      {task_distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none" style={{ paddingBottom: "10%" }}>
                  <span className="text-2xl font-bold text-slate-800">100%</span>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Effort</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50 flex-shrink-0">
                {task_distribution.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprint History */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Sprint History</h3>
                  <p className="text-xs text-slate-400 mt-0.5">All completed and active sprints</p>
                </div>
                <span className="text-xs text-slate-400 font-semibold px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">{historical.length} sprints</span>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left">Sprint</th>
                      <th className="px-6 py-3 text-center">Velocity</th>
                      <th className="px-6 py-3 text-center">Bugs</th>
                      <th className="px-6 py-3 text-center">Tech Debt</th>
                      <th className="px-6 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historical.map((s, i) => (
                      <tr key={`${s.name}-${i}`} className="hover:bg-violet-50/20 transition-colors">
                        <td className="px-6 py-3 font-semibold text-slate-700">{s.name}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-slate-700">{s.completed}</span>
                            <span className="text-slate-300 text-xs">/</span>
                            <span className="text-slate-400">{s.committed}</span>
                            <div className="w-12 bg-slate-100 rounded-full h-1 ml-1 overflow-hidden">
                              <div className="bg-violet-500 h-1 rounded-full" style={{ width: `${s.committed > 0 ? (s.completed / s.committed) * 100 : 0}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${s.bugs > 3 ? "bg-red-50 text-red-600 border border-red-100" : "bg-slate-50 text-slate-600 border border-slate-100"}`}>{s.bugs}</span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${s.techDebt}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 font-medium">{s.techDebt}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          {s.is_current ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                              <CheckCircle2 size={11} />Done
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Row 4: Backlog full width ── */}
          <BacklogTable tasks={backlogTasks} />

        </div>
      </div>
    </div>
  );
}