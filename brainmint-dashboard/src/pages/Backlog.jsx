import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, Plus, Filter, ChevronDown, Calendar, 
  ArrowUp, ArrowDown, Trash2, Tag,
  CheckCircle2, Loader2, PlayCircle, X, Archive,
  Sparkles, MoreHorizontal
} from "lucide-react";

const API_BASE_URL = "https://brainmint-v1-1.onrender.com/api";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Geist+Mono:wght@400;500&display=swap');

  .bl-root {
    font-family: 'Bricolage Grotesque', sans-serif;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 24px 28px;
    background: var(--bg-base, #f8f8fb);
    color: var(--text-primary, #0f0f1a);
    box-sizing: border-box;
    min-height: 0;
  }

  /* ── PAGE HEADER ── */
  .bl-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-shrink: 0;
  }
  .bl-header-left {}
  .bl-page-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--text-primary, #0f0f1a);
    letter-spacing: -0.035em;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .bl-page-sub {
    font-size: 13px;
    color: var(--text-secondary, #6b7280);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .bl-task-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    font-weight: 700;
    font-family: 'Geist Mono', monospace;
    background: var(--accent-light, rgba(99,102,241,0.08));
    color: var(--accent, #6366f1);
    border: 1px solid var(--accent-ring, rgba(99,102,241,0.2));
    border-radius: 20px;
    padding: 2px 9px;
  }

  .bl-new-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    background: var(--accent, #6366f1);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13.5px;
    font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .bl-new-btn:hover {
    background: var(--accent-hover, #4f46e5);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(99,102,241,0.4);
  }

  /* ── BULK ACTION BAR ── */
  .bulk-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: var(--accent-light, rgba(99,102,241,0.08));
    border: 1px solid var(--accent-ring, rgba(99,102,241,0.2));
    border-radius: 12px;
    margin-bottom: 14px;
    flex-shrink: 0;
    animation: barSlide 0.18s ease;
  }
  @keyframes barSlide { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

  .bulk-count {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent, #6366f1);
    font-family: 'Geist Mono', monospace;
    margin-right: 4px;
  }
  .bulk-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif;
    border: none;
    cursor: pointer;
    transition: background 0.12s, transform 0.12s;
  }
  .bulk-btn:hover { transform: translateY(-1px); }
  .bulk-btn-indigo { background: var(--accent, #6366f1); color: white; }
  .bulk-btn-indigo:hover { background: var(--accent-hover, #4f46e5); }
  .bulk-btn-amber { background: #d97706; color: white; }
  .bulk-btn-amber:hover { background: #b45309; }
  .bulk-btn-red { background: var(--btn-red-bg, #fef2f2); color: var(--btn-red-color, #dc2626); border: 1px solid var(--btn-red-border, #fecaca); }
  .bulk-btn-red:hover { background: var(--btn-red-hover, #fee2e2); }
  .bulk-clear {
    margin-left: auto;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary, #6b7280);
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Bricolage Grotesque', sans-serif;
    padding: 4px 8px;
    border-radius: 6px;
    transition: color 0.12s, background 0.12s;
  }
  .bulk-clear:hover { color: var(--text-primary, #0f0f1a); background: var(--bg-hover, #f3f4f8); }

  /* ── FILTERS ── */
  .bl-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .bl-search-wrap {
    position: relative;
    flex: 1;
    min-width: 220px;
  }
  .bl-search-wrap svg {
    position: absolute;
    left: 11px; top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary, #9ca3af);
    pointer-events: none;
  }
  .bl-search-input {
    width: 100%;
    padding: 8px 14px 8px 36px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border, rgba(0,0,0,0.07));
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary, #0f0f1a);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
  }
  .bl-search-input::placeholder { color: var(--text-tertiary, #9ca3af); }
  .bl-search-input:focus {
    border-color: var(--accent, #6366f1);
    box-shadow: 0 0 0 3px var(--accent-ring, rgba(99,102,241,0.2));
  }

  .bl-filter-dropdown { position: relative; }
  .bl-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 13px;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border, rgba(0,0,0,0.07));
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary, #0f0f1a);
    cursor: pointer;
    white-space: nowrap;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
    transition: border-color 0.15s, background 0.15s;
  }
  .bl-filter-btn:hover {
    border-color: var(--border-strong, rgba(0,0,0,0.12));
    background: var(--bg-hover, #f3f4f8);
  }
  .bl-filter-btn.active {
    border-color: var(--accent, #6366f1);
    background: var(--accent-light, rgba(99,102,241,0.08));
    color: var(--accent, #6366f1);
  }
  .bl-filter-icon { color: var(--text-tertiary, #9ca3af); }

  .bl-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 180px;
    background: var(--bg-elevated, #ffffff);
    border: 1px solid var(--border-strong, rgba(0,0,0,0.12));
    border-radius: 12px;
    box-shadow: var(--shadow-lg, 0 12px 40px rgba(0,0,0,0.1));
    overflow: hidden;
    z-index: 50;
    animation: dropIn 0.12s ease;
  }
  @keyframes dropIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

  .bl-dropdown-menu button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px 14px;
    font-size: 13px;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary, #0f0f1a);
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.1s;
  }
  .bl-dropdown-menu button:hover { background: var(--bg-hover, #f3f4f8); }
  .bl-dropdown-menu button.selected {
    color: var(--accent, #6366f1);
    font-weight: 600;
    background: var(--accent-light, rgba(99,102,241,0.06));
  }

  /* ── TABLE WRAPPER ── */
  .bl-table-wrap {
    flex: 1;
    background: var(--bg-surface, #ffffff);
    border: 1px solid var(--border, rgba(0,0,0,0.07));
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.06));
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .bl-table-scroll {
    overflow: auto;
    flex: 1;
  }
  .bl-table {
    width: 100%;
    min-width: 860px;
    border-collapse: collapse;
  }

  /* ── TABLE HEAD ── */
  .bl-thead {
    background: var(--bg-hover, #f3f4f8);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .bl-thead th {
    padding: 10px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-secondary, #6b7280);
    border-bottom: 1px solid var(--border, rgba(0,0,0,0.07));
    white-space: nowrap;
  }
  .bl-thead th.sortable {
    cursor: pointer;
    user-select: none;
  }
  .bl-thead th.sortable:hover {
    color: var(--text-primary, #0f0f1a);
    background: var(--bg-active, #ede9fe);
  }
  .th-inner {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .th-sort-icon { color: var(--accent, #6366f1); }

  /* ── TABLE BODY ── */
  .bl-tbody tr {
    border-bottom: 1px solid var(--border, rgba(0,0,0,0.06));
    transition: background 0.1s;
  }
  .bl-tbody tr:last-child { border-bottom: none; }
  .bl-tbody tr:hover { background: var(--bg-hover, #f3f4f8); }

  .bl-tbody td {
    padding: 11px 16px;
    font-size: 13.5px;
    color: var(--text-primary, #0f0f1a);
    vertical-align: middle;
  }

  /* Checkbox column */
  .bl-cb {
    width: 44px;
    padding-left: 18px !important;
  }
  .bl-checkbox {
    width: 15px; height: 15px;
    border-radius: 4px;
    border: 1.5px solid var(--border-strong, rgba(0,0,0,0.15));
    accent-color: var(--accent, #6366f1);
    cursor: pointer;
  }

  /* Task name cell */
  .task-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .task-done-icon { color: #22c55e; flex-shrink: 0; }
  .task-name {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--text-primary, #0f0f1a);
  }

  /* Sprint select */
  .sprint-select {
    font-size: 11.5px;
    font-weight: 600;
    font-family: 'Bricolage Grotesque', sans-serif;
    padding: 3px 8px;
    border-radius: 7px;
    border: 1px solid var(--border-strong, rgba(0,0,0,0.12));
    background: var(--bg-hover, #f3f4f8);
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    outline: none;
    max-width: 160px;
    transition: border-color 0.15s;
  }
  .sprint-select:focus { border-color: var(--accent, #6366f1); }
  .sprint-select.has-sprint {
    background: var(--accent-light, rgba(99,102,241,0.07));
    color: var(--accent, #6366f1);
    border-color: var(--accent-ring, rgba(99,102,241,0.2));
  }

  /* Priority select */
  .priority-select {
    font-size: 11.5px;
    font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif;
    padding: 3px 8px;
    border-radius: 7px;
    border: 1.5px solid;
    cursor: pointer;
    outline: none;
    transition: opacity 0.15s;
  }
  .priority-select:hover { opacity: 0.85; }
  .priority-select.high {
    background: var(--priority-high-bg, #fef2f2);
    color: var(--priority-high-text, #dc2626);
    border-color: var(--priority-high-border, #fecaca);
  }
  .priority-select.medium {
    background: var(--priority-med-bg, #fffbeb);
    color: var(--priority-med-text, #d97706);
    border-color: var(--priority-med-border, #fde68a);
  }
  .priority-select.low {
    background: var(--priority-low-bg, #f0fdf4);
    color: var(--priority-low-text, #16a34a);
    border-color: var(--priority-low-border, #bbf7d0);
  }

  /* Status select */
  .status-select {
    font-size: 11.5px;
    font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif;
    padding: 3px 8px;
    border-radius: 7px;
    border: none;
    cursor: pointer;
    outline: none;
    transition: opacity 0.15s;
  }
  .status-select:hover { opacity: 0.85; }
  .status-select.todo     { background: var(--status-todo-bg,  #f1f5f9); color: var(--status-todo-color,  #64748b); }
  .status-select.progress { background: var(--status-prog-bg,  #eff6ff); color: var(--status-prog-color,  #2563eb); }
  .status-select.review   { background: var(--status-rev-bg,   #faf5ff); color: var(--status-rev-color,   #7c3aed); }
  .status-select.done     { background: var(--status-done-bg,  #f0fdf4); color: var(--status-done-color,  #16a34a); }

  /* Progress cell */
  .progress-cell {
    font-size: 12px;
    font-weight: 600;
    font-family: 'Geist Mono', monospace;
    color: var(--text-secondary, #6b7280);
  }

  /* Due date cell */
  .due-cell {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12.5px;
    color: var(--text-secondary, #6b7280);
    font-weight: 500;
  }

  /* Action icons */
  .action-cell {
    text-align: right;
  }
  .action-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .bl-tbody tr:hover .action-group { opacity: 1; }
  .action-btn {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: none;
    border: none;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
  }
  .action-btn-indigo { color: var(--accent, #6366f1); }
  .action-btn-indigo:hover { background: var(--accent-light, rgba(99,102,241,0.1)); }
  .action-btn-amber  { color: #d97706; }
  .action-btn-amber:hover  { background: rgba(217,119,6,0.1); }
  .action-btn-red    { color: var(--btn-red-color, #dc2626); }
  .action-btn-red:hover    { background: var(--btn-red-bg, #fef2f2); }

  /* Empty state */
  .empty-row td {
    padding: 60px 24px;
    text-align: center;
  }
  .empty-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--text-tertiary, #9ca3af);
  }
  .empty-icon {
    width: 44px; height: 44px;
    background: var(--bg-hover, #f3f4f8);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }
  .empty-title { font-size: 14px; font-weight: 600; color: var(--text-secondary, #6b7280); }
  .empty-sub { font-size: 13px; }

  /* ── MODAL ── */
  .modal-backdrop {
    position: fixed; inset: 0;
    background: var(--modal-bg, rgba(0,0,0,0.4));
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 16px;
    animation: backdropIn 0.15s ease;
  }
  @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-box {
    background: var(--bg-elevated, #ffffff);
    border: 1px solid var(--border-strong, rgba(0,0,0,0.12));
    border-radius: 16px;
    box-shadow: var(--shadow-lg, 0 12px 40px rgba(0,0,0,0.1));
    width: 100%; max-width: 450px;
    overflow: hidden;
    animation: modalIn 0.2s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border, rgba(0,0,0,0.07));
  }
  .modal-title {
    font-size: 15px; font-weight: 700;
    color: var(--text-primary, #0f0f1a);
  }
  .modal-close {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-hover, #f3f4f8);
    border: none; border-radius: 7px;
    color: var(--text-secondary, #6b7280);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .modal-close:hover { background: var(--bg-active, #ede9fe); color: var(--text-primary, #0f0f1a); }

  .modal-body {
    padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label {
    font-size: 12px; font-weight: 600;
    color: var(--text-secondary, #6b7280);
    letter-spacing: 0.02em;
  }
  .form-input, .form-select {
    padding: 10px 13px;
    background: var(--bg-hover, #f3f4f8);
    border: 1px solid var(--border-strong, rgba(0,0,0,0.12));
    border-radius: 9px;
    font-size: 13.5px;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary, #0f0f1a);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    -webkit-appearance: none;
  }
  .form-input::placeholder { color: var(--text-tertiary, #9ca3af); }
  .form-input:focus, .form-select:focus {
    border-color: var(--accent, #6366f1);
    background: var(--bg-surface, #fff);
    box-shadow: 0 0 0 3px var(--accent-ring, rgba(99,102,241,0.2));
  }
  .form-select { cursor: pointer; }

  .modal-footer {
    padding: 14px 20px;
    background: var(--bg-hover, #f3f4f8);
    border-top: 1px solid var(--border, rgba(0,0,0,0.07));
    display: flex; justify-content: flex-end; gap: 8px;
  }
  .btn-cancel {
    padding: 8px 16px;
    background: var(--bg-surface, #fff);
    border: 1px solid var(--border-strong, rgba(0,0,0,0.12));
    border-radius: 9px; font-size: 13px; font-weight: 600;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-secondary, #6b7280); cursor: pointer;
    transition: background 0.15s;
  }
  .btn-cancel:hover { background: var(--bg-hover, #f3f4f8); }
  .btn-submit {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 18px;
    background: var(--accent, #6366f1); color: white; border: none;
    border-radius: 9px; font-size: 13px; font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif; cursor: pointer;
    box-shadow: 0 2px 8px rgba(99,102,241,0.28);
    transition: background 0.15s, transform 0.15s;
  }
  .btn-submit:hover:not(:disabled) { background: var(--accent-hover, #4f46e5); transform: translateY(-1px); }
  .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  /* Loading */
  .bl-loading {
    display: flex; align-items: center; justify-content: center;
    height: 280px; gap: 12px; flex-direction: column;
    color: var(--text-secondary, #6b7280);
    font-size: 13.5px; font-weight: 500;
  }
  .bl-spinner {
    width: 32px; height: 32px; border-radius: 50%;
    border: 2.5px solid var(--border-strong, rgba(0,0,0,0.12));
    border-top-color: var(--accent, #6366f1);
    animation: blSpin 0.75s linear infinite;
  }
  @keyframes blSpin { to { transform: rotate(360deg); } }
  @keyframes spinIcon { from { transform: rotate(0); } to { transform: rotate(360deg); } }
  .spin { animation: spinIcon 1s linear infinite; }
`;

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
const TaskModal = ({ isOpen, onClose, onAddTask, userId, defaultStatus = "todo", sprints = [] }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [subtaskCount, setSubtaskCount] = useState("");
  const [sprintId, setSprintId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || isSubmitting) return;
    if (!userId) { alert("User ID is missing. Please log in again."); return; }
    setIsSubmitting(true);
    try {
      const formattedDate = dueDate
        ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : "";
      await onAddTask({
        user_id: userId, title, priority,
        status: defaultStatus, due_date: formattedDate,
        subtasks_total: parseInt(subtaskCount) || 0,
        sprint_id: sprintId ? parseInt(sprintId) : null,
      });
      setTitle(""); setPriority("Medium"); setDueDate(""); setSubtaskCount(""); setSprintId("");
      onClose();
    } catch { alert("Failed to create task."); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">✦ New Task</span>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}><X size={13} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input className="form-input" type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Implement new feature" disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)} disabled={isSubmitting}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sprint (optional)</label>
              <select className="form-select" value={sprintId} onChange={e => setSprintId(e.target.value)} disabled={isSubmitting}>
                <option value="">No Sprint (Backlog)</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Number of Subtasks</label>
              <input className="form-input" type="number" value={subtaskCount}
                onChange={e => setSubtaskCount(e.target.value)} placeholder="e.g., 5" min="0" disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={dueDate}
                onChange={e => setDueDate(e.target.value)} disabled={isSubmitting} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={13} className="spin" /> Adding…</> : <><Sparkles size={13} /> Add Task</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── MAIN BACKLOG ─────────────────────────────────────────────────────────────
export default function Backlog({ user }) {
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sprintFilter, setSprintFilter] = useState("All");
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showSprintMenu, setShowSprintMenu] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { if (user?.id) loadAll(); }, [user?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => { setShowPriorityMenu(false); setShowStatusMenu(false); setShowSprintMenu(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, sprintsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tasks/?user_id=${user.id}`),
        fetch(`${API_BASE_URL}/sprints/?user_id=${user.id}`).catch(() => ({ ok: false }))
      ]);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        const allTasks = [
          ...data.todo.map(t => ({ ...t, status: "todo" })),
          ...data.progress.map(t => ({ ...t, status: "progress" })),
          ...data.review.map(t => ({ ...t, status: "review" })),
          ...data.done.map(t => ({ ...t, status: "done" })),
        ];
        setTasks(allTasks);
      }
      if (sprintsRes.ok) {
        const sData = await sprintsRes.json();
        setSprints(sData.sprints || []);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const createTask = async (taskData) => {
    await fetch(`${API_BASE_URL}/tasks/create/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(taskData) });
    await loadAll();
  };
  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try { await fetch(`${API_BASE_URL}/tasks/delete/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: taskId }) }); await loadAll(); }
    catch { alert("Failed to delete task"); }
  };
  const archiveTask = async (taskId) => {
    try { await fetch(`${API_BASE_URL}/tasks/archive/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: taskId }) }); await loadAll(); }
    catch { alert("Failed to archive task"); }
  };
  const bulkArchive = async () => {
    if (!confirm(`Archive ${selectedTasks.length} tasks?`)) return;
    try { await Promise.all(selectedTasks.map(id => fetch(`${API_BASE_URL}/tasks/archive/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: id }) }))); setSelectedTasks([]); await loadAll(); }
    catch { alert("Failed to archive tasks"); }
  };
  const updateStatus = async (taskId, newStatus) => {
    try { await fetch(`${API_BASE_URL}/tasks/update-status/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: taskId, status: newStatus }) }); await loadAll(); }
    catch { alert("Failed to update status"); }
  };
  const updatePriority = async (taskId, newPriority) => {
    try { await fetch(`${API_BASE_URL}/tasks/update-priority/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: taskId, priority: newPriority }) }); await loadAll(); }
    catch { alert("Failed to update priority"); }
  };
  const assignSprint = async (taskId, sprintIdValue) => {
    const sprint_id = sprintIdValue ? parseInt(sprintIdValue) : null;
    try { await fetch(`${API_BASE_URL}/tasks/assign-sprint/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: taskId, sprint_id }) }); await loadAll(); }
    catch { alert("Failed to assign sprint"); }
  };
  const bulkMoveToSprint = async () => {
    if (!confirm(`Move ${selectedTasks.length} tasks to active sprint?`)) return;
    try { await Promise.all(selectedTasks.map(id => fetch(`${API_BASE_URL}/tasks/update-status/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: id, status: "progress" }) }))); setSelectedTasks([]); await loadAll(); }
    catch { alert("Failed to move tasks"); }
  };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedTasks.length} tasks?`)) return;
    try { await Promise.all(selectedTasks.map(id => fetch(`${API_BASE_URL}/tasks/delete/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task_id: id }) }))); setSelectedTasks([]); await loadAll(); }
    catch { alert("Failed to delete tasks"); }
  };

  const filteredTasks = useMemo(() => tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    const matchesSprint = sprintFilter === "All" || (sprintFilter === "none" ? !task.sprint_id : task.sprint_id === Number(sprintFilter));
    return matchesSearch && matchesPriority && matchesStatus && matchesSprint;
  }), [tasks, searchTerm, priorityFilter, statusFilter, sprintFilter]);

  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    list.sort((a, b) => {
      let aVal = sortBy === "due_date" ? a.dueDate : a[sortBy];
      let bVal = sortBy === "due_date" ? b.dueDate : b[sortBy];
      if (sortBy === "priority") { const o = { High: 1, Medium: 2, Low: 3 }; aVal = o[a.priority] ?? 999; bVal = o[b.priority] ?? 999; }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredTasks, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortOrder("asc"); }
  };

  const SortTh = ({ field, children }) => (
    <th className="sortable" onClick={() => handleSort(field)}>
      <div className="th-inner">
        {children}
        {sortBy === field && (
          <span className="th-sort-icon">
            {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          </span>
        )}
      </div>
    </th>
  );

  const priorityClass = { High: 'high', Medium: 'medium', Low: 'low' };
  const statusClass   = { todo: 'todo', progress: 'progress', review: 'review', done: 'done' };

  const sprintFilterLabel =
    sprintFilter === "All" ? "Sprint" :
    sprintFilter === "none" ? "No Sprint" :
    sprints.find(s => s.id === Number(sprintFilter))?.title || "Sprint";

  if (isLoading) return (
    <>
      <style>{STYLES}</style>
      <div className="bl-loading">
        <div className="bl-spinner" />
        Loading backlog…
      </div>
    </>
  );

  return (
    <>
      <style>{STYLES}</style>
      <div className="bl-root">

        {/* ── PAGE HEADER ── */}
        <div className="bl-header">
          <div className="bl-header-left">
            <h1 className="bl-page-title">Product Backlog</h1>
            <div className="bl-page-sub">
              All tasks across sprints
              <span className="bl-task-pill">{sortedTasks.length} tasks</span>
            </div>
          </div>
          <button className="bl-new-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> New Task
          </button>
        </div>

        {/* ── BULK BAR ── */}
        {selectedTasks.length > 0 && (
          <div className="bulk-bar">
            <span className="bulk-count">{selectedTasks.length} selected</span>
            <button className="bulk-btn bulk-btn-indigo" onClick={bulkMoveToSprint}>
              <PlayCircle size={13} /> Move to Sprint
            </button>
            <button className="bulk-btn bulk-btn-amber" onClick={bulkArchive}>
              <Archive size={13} /> Archive
            </button>
            <button className="bulk-btn bulk-btn-red" onClick={bulkDelete}>
              <Trash2 size={13} /> Delete
            </button>
            <button className="bulk-clear" onClick={() => setSelectedTasks([])}>✕ Clear</button>
          </div>
        )}

        {/* ── FILTERS ── */}
        <div className="bl-filters">
          {/* Search */}
          <div className="bl-search-wrap">
            <Search size={14} />
            <input className="bl-search-input" type="text" placeholder="Search tasks…"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          {/* Priority */}
          <div className="bl-filter-dropdown" onClick={e => e.stopPropagation()}>
            <button
              className={`bl-filter-btn ${priorityFilter !== 'All' ? 'active' : ''}`}
              onClick={() => { setShowPriorityMenu(p => !p); setShowStatusMenu(false); setShowSprintMenu(false); }}
            >
              <Filter size={13} className="bl-filter-icon" />
              {priorityFilter === "All" ? "Priority" : priorityFilter}
              <ChevronDown size={12} style={{ transform: showPriorityMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {showPriorityMenu && (
              <div className="bl-dropdown-menu">
                {["All","High","Medium","Low"].map(p => (
                  <button key={p} className={priorityFilter === p ? 'selected' : ''} onClick={() => { setPriorityFilter(p); setShowPriorityMenu(false); }}>
                    {p === "All" ? "All Priorities" : p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bl-filter-dropdown" onClick={e => e.stopPropagation()}>
            <button
              className={`bl-filter-btn ${statusFilter !== 'All' ? 'active' : ''}`}
              onClick={() => { setShowStatusMenu(p => !p); setShowPriorityMenu(false); setShowSprintMenu(false); }}
            >
              {statusFilter === "All" ? "Status" : statusFilter.replace(/^\w/, c => c.toUpperCase())}
              <ChevronDown size={12} style={{ transform: showStatusMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {showStatusMenu && (
              <div className="bl-dropdown-menu">
                {["All","todo","progress","review","done"].map(s => (
                  <button key={s} className={statusFilter === s ? 'selected' : ''} onClick={() => { setStatusFilter(s); setShowStatusMenu(false); }}>
                    {s === "All" ? "All Statuses" : { todo: "To Do", progress: "In Progress", review: "Review", done: "Done" }[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sprint */}
          {sprints.length > 0 && (
            <div className="bl-filter-dropdown" onClick={e => e.stopPropagation()}>
              <button
                className={`bl-filter-btn ${sprintFilter !== 'All' ? 'active' : ''}`}
                onClick={() => { setShowSprintMenu(p => !p); setShowPriorityMenu(false); setShowStatusMenu(false); }}
              >
                <Tag size={13} className="bl-filter-icon" />
                {sprintFilterLabel}
                <ChevronDown size={12} style={{ transform: showSprintMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {showSprintMenu && (
                <div className="bl-dropdown-menu" style={{ minWidth: 200, maxHeight: 280, overflowY: 'auto' }}>
                  <button className={sprintFilter === 'All' ? 'selected' : ''} onClick={() => { setSprintFilter("All"); setShowSprintMenu(false); }}>All Sprints</button>
                  <button className={sprintFilter === 'none' ? 'selected' : ''} onClick={() => { setSprintFilter("none"); setShowSprintMenu(false); }}>No Sprint (Backlog)</button>
                  {sprints.map(s => (
                    <button key={s.id} className={sprintFilter === String(s.id) ? 'selected' : ''} onClick={() => { setSprintFilter(String(s.id)); setShowSprintMenu(false); }}>
                      {s.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── TABLE ── */}
        <div className="bl-table-wrap">
          <div className="bl-table-scroll">
            <table className="bl-table">
              <thead className="bl-thead">
                <tr>
                  <th className="bl-cb">
                    <input type="checkbox" className="bl-checkbox"
                      checked={sortedTasks.length > 0 && selectedTasks.length === sortedTasks.length}
                      onChange={e => setSelectedTasks(e.target.checked ? sortedTasks.map(t => t.id) : [])} />
                  </th>
                  <SortTh field="title">Task</SortTh>
                  <th>Sprint</th>
                  <SortTh field="priority">Priority</SortTh>
                  <th>Status</th>
                  <th>Progress</th>
                  <SortTh field="due_date">Due Date</SortTh>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody className="bl-tbody">
                {sortedTasks.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={8}>
                      <div className="empty-inner">
                        <div className="empty-icon"><Filter size={20} /></div>
                        <div className="empty-title">No tasks found</div>
                        <div className="empty-sub">Try adjusting your filters or create a new task</div>
                      </div>
                    </td>
                  </tr>
                ) : sortedTasks.map(task => (
                  <tr key={task.id}>
                    <td className="bl-cb">
                      <input type="checkbox" className="bl-checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={e => setSelectedTasks(prev => e.target.checked ? [...prev, task.id] : prev.filter(id => id !== task.id))} />
                    </td>
                    <td>
                      <div className="task-name-cell">
                        {task.progress === 100 && <CheckCircle2 size={14} className="task-done-icon" />}
                        <span className="task-name">{task.title}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className={`sprint-select ${task.sprint_id ? 'has-sprint' : ''}`}
                        value={task.sprint_id || ""}
                        onChange={e => assignSprint(task.id, e.target.value)}
                      >
                        <option value="">No Sprint</option>
                        {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className={`priority-select ${priorityClass[task.priority] || ''}`}
                        value={task.priority}
                        onChange={e => updatePriority(task.id, e.target.value)}
                      >
                        <option>High</option><option>Medium</option><option>Low</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className={`status-select ${statusClass[task.status] || ''}`}
                        value={task.status}
                        onChange={e => updateStatus(task.id, e.target.value)}
                      >
                        <option value="todo">To Do</option>
                        <option value="progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td>
                      <span className="progress-cell">
                        {task.subtasks?.total > 0
                          ? `${task.subtasks.completed}/${task.subtasks.total}`
                          : task.progress != null ? `${task.progress}%` : "—"}
                      </span>
                    </td>
                    <td>
                      <div className="due-cell">
                        <Calendar size={12} />
                        {task.dueDate || "—"}
                      </div>
                    </td>
                    <td className="action-cell">
                      <div className="action-group">
                        {task.status !== "progress" && (
                          <button className="action-btn action-btn-indigo" title="Start task" onClick={() => updateStatus(task.id, "progress")}>
                            <PlayCircle size={14} />
                          </button>
                        )}
                        <button className="action-btn action-btn-amber" title="Archive" onClick={() => archiveTask(task.id)}>
                          <Archive size={14} />
                        </button>
                        <button className="action-btn action-btn-red" title="Delete" onClick={() => deleteTask(task.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onAddTask={createTask}
          userId={user?.id}
          sprints={sprints}
        />
      </div>
    </>
  );
}