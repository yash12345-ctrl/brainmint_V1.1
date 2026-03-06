import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  Search, Plus, Zap, Bell, LayoutDashboard, Calendar, 
  X, ChevronDown, List, ArrowUp, ArrowDown, Minus,
  CheckCircle2, CheckSquare, LogOut, Loader2, Trash2, Tag,
  SlidersHorizontal, MoreHorizontal, Sparkles
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

// --- API Helper Functions ---
const api = {
  async getTasks(userId) {
    const response = await fetch(`${API_BASE_URL}/tasks/?user_id=${userId}`);
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },
  async getSprints(userId) {
    const response = await fetch(`${API_BASE_URL}/sprints/?user_id=${userId}`);
    if (!response.ok) throw new Error("Failed to fetch sprints");
    return response.json();
  },
  async createTask(taskData) {
    const response = await fetch(`${API_BASE_URL}/tasks/create/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create task");
    }
    return response.json();
  },
  async updateTaskStatus(taskId, newStatus) {
    const response = await fetch(`${API_BASE_URL}/tasks/update-status/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, status: newStatus }),
    });
    if (!response.ok) throw new Error("Failed to update task status");
    return response.json();
  },
  async incrementSubtask(taskId, currentCompleted, currentTotal) {
    const response = await fetch(`${API_BASE_URL}/tasks/increment-subtask/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, subtasks_completed: Math.min(currentCompleted + 1, currentTotal) }),
    });
    if (!response.ok) throw new Error("Failed to increment subtask");
    return response.json();
  },
  async deleteTask(taskId) {
    const response = await fetch(`${API_BASE_URL}/tasks/delete/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    });
    if (!response.ok) throw new Error("Failed to delete task");
    return response.json();
  },
  async updatePriority(taskId, priority) {
    const response = await fetch(`${API_BASE_URL}/tasks/update-priority/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, priority }),
    });
    if (!response.ok) throw new Error("Failed to update priority");
    return response.json();
  },
  async assignTaskToSprint(taskId, sprintId) {
    const response = await fetch(`${API_BASE_URL}/tasks/assign-sprint/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, sprint_id: sprintId }),
    });
    if (!response.ok) throw new Error("Failed to assign sprint");
    return response.json();
  }
};

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── THEME STYLES ─────────────────────────────────────────────────────────────
const getThemeStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Geist+Mono:wght@400;500&display=swap');

  :root {
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --accent-light: rgba(99,102,241,0.08);
    --accent-ring: rgba(99,102,241,0.25);

    --bg-base: #f8f8fb;
    --bg-surface: #ffffff;
    --bg-elevated: #ffffff;
    --bg-hover: #f3f4f8;
    --bg-active: #ede9fe;

    --border: rgba(0,0,0,0.07);
    --border-strong: rgba(0,0,0,0.12);

    --text-primary: #0f0f1a;
    --text-secondary: #6b7280;
    --text-tertiary: #9ca3af;

    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.1);

    --priority-high-bg: #fef2f2;
    --priority-high-text: #dc2626;
    --priority-high-border: #fecaca;
    --priority-med-bg: #fffbeb;
    --priority-med-text: #d97706;
    --priority-med-border: #fde68a;
    --priority-low-bg: #f0fdf4;
    --priority-low-text: #16a34a;
    --priority-low-border: #bbf7d0;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    font-family: 'Bricolage Grotesque', sans-serif;
    background: var(--bg-base);
    color: var(--text-primary);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: background 0.25s, color 0.25s;
  }

  /* ── TOPBAR ── */
  .db-topbar {
    height: 58px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    gap: 16px;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
    z-index: 40;
  }

  .topbar-left { display: flex; align-items: center; gap: 14px; }

  .brand-mark {
    display: flex; align-items: center; gap: 9px;
    text-decoration: none; cursor: pointer;
    flex-shrink: 0;
  }
  .brand-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #6366f1, #a78bfa);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(99,102,241,0.35);
    flex-shrink: 0;
  }
  .brand-name {
    font-size: 15px; font-weight: 800;
    color: var(--text-primary); letter-spacing: -0.03em;
  }

  .topbar-divider {
    width: 1px; height: 22px;
    background: var(--border-strong);
    flex-shrink: 0;
  }

  .topbar-user-info {}
  .topbar-user-name {
    font-size: 13px; font-weight: 600;
    color: var(--text-primary); line-height: 1.2;
  }
  .topbar-user-sub {
    font-size: 11px; color: var(--text-secondary);
    display: flex; align-items: center; gap: 4px;
  }
  .online-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #22c55e;
    display: inline-block;
    box-shadow: 0 0 4px #22c55e;
  }

  .topbar-search {
    flex: 1; max-width: 420px;
    position: relative;
  }
  .topbar-search svg {
    position: absolute; left: 12px; top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary);
    pointer-events: none;
  }
  .topbar-search input {
    width: 100%;
    padding: 8px 14px 8px 38px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 13.5px;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .topbar-search input::placeholder { color: var(--text-tertiary); }
  .topbar-search input:focus {
    border-color: var(--accent);
    background: var(--bg-surface);
    box-shadow: 0 0 0 3px var(--accent-ring);
  }
  .search-kbd {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%);
    font-size: 10px; font-family: 'Geist Mono', monospace;
    color: var(--text-tertiary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-strong);
    border-radius: 4px; padding: 2px 5px;
  }

  .topbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .btn-new-task {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    background: var(--accent);
    color: white; border: none;
    border-radius: 9px; font-size: 13.5px; font-weight: 600;
    font-family: 'Bricolage Grotesque', sans-serif;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(99,102,241,0.35);
    transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }
  .btn-new-task:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(99,102,241,0.45);
  }

  .btn-quick-sprint {
    display: flex; align-items: center; gap: 5px;
    padding: 7px 12px;
    background: var(--accent-light);
    color: var(--accent);
    border: 1px solid var(--accent-ring);
    border-radius: 9px; font-size: 13px; font-weight: 600;
    font-family: 'Bricolage Grotesque', sans-serif;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;
    white-space: nowrap;
  }
  .btn-quick-sprint:hover { background: rgba(99,102,241,0.18); transform: translateY(-1px); }

  .icon-btn {
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    position: relative;
  }
  .icon-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-strong);
  }
  .notif-badge {
    position: absolute; top: 6px; right: 6px;
    width: 6px; height: 6px;
    background: #ef4444; border-radius: 50%;
    border: 1.5px solid var(--bg-surface);
  }

  .btn-logout {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid #fecaca;
    border-radius: 9px;
    font-size: 12.5px; font-weight: 600;
    color: #dc2626;
    font-family: 'Bricolage Grotesque', sans-serif;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
    white-space: nowrap;
  }
  .btn-logout:hover {
    background: #fef2f2;
    border-color: #fca5a5;
    transform: translateY(-1px);
  }

  .avatar {
    width: 32px; height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, #6366f1, #a78bfa);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 13px; font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
  }

  /* ── FILTER BAR ── */
  .db-filterbar {
    padding: 10px 20px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-shrink: 0;
  }
  .filterbar-left { display: flex; align-items: center; gap: 8px; }

  .filter-input-wrap { position: relative; }
  .filter-input-wrap svg {
    position: absolute; left: 10px; top: 50%;
    transform: translateY(-50%);
    color: var(--text-tertiary); pointer-events: none;
  }
  .filter-input {
    padding: 7px 12px 7px 34px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px; font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary); outline: none; width: 200px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .filter-input::placeholder { color: var(--text-tertiary); }
  .filter-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }

  .priority-dropdown { position: relative; }
  .priority-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 12px;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px; font-weight: 500; font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary);
    cursor: pointer; white-space: nowrap;
    transition: border-color 0.15s, background 0.15s;
  }
  .priority-btn:hover { border-color: var(--border-strong); background: var(--bg-elevated); }
  .priority-menu {
    position: absolute; top: calc(100% + 6px); left: 0;
    min-width: 160px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    z-index: 50;
    animation: menuFade 0.12s ease;
  }
  @keyframes menuFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  .priority-menu button {
    display: block; width: 100%;
    padding: 8px 14px; text-align: left;
    font-size: 13px; font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary); background: none; border: none;
    cursor: pointer; transition: background 0.1s;
  }
  .priority-menu button:hover { background: var(--bg-hover); }

  .filterbar-right { display: flex; align-items: center; gap: 10px; }
  .task-count-badge {
    font-size: 12px; font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 10px;
    font-family: 'Geist Mono', monospace;
  }
  .view-toggle {
    display: flex;
    background: var(--bg-hover);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    padding: 2px;
    gap: 2px;
  }
  .view-btn {
    padding: 5px 8px;
    background: none; border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: background 0.15s, color 0.15s;
    display: flex; align-items: center; justify-content: center;
  }
  .view-btn.active { background: var(--bg-surface); color: var(--accent); box-shadow: var(--shadow-sm); }
  .view-btn:not(.active):hover { color: var(--text-primary); }

  /* ── BOARD AREA ── */
  .db-board { flex: 1; overflow-y: auto; padding: 20px; }

  /* ── KANBAN ── */
  .kanban-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    min-height: 100%;
  }
  @media (max-width: 1100px) { .kanban-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px)  { .kanban-grid { grid-template-columns: 1fr; } }

  .kanban-col {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    min-height: 280px;
    display: flex; flex-direction: column;
    transition: border-color 0.15s;
  }
  .kanban-col.drop-active { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-ring); }

  .col-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .col-header-left { display: flex; align-items: center; gap: 8px; }
  .col-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
  }
  .col-title {
    font-size: 11.5px; font-weight: 700;
    letter-spacing: 0.07em; text-transform: uppercase;
    color: var(--text-secondary);
  }
  .col-count {
    font-size: 11px; font-weight: 700;
    font-family: 'Geist Mono', monospace;
    background: var(--bg-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: 20px; padding: 1px 8px;
  }
  .col-add-btn {
    width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center;
    background: none; border: 1px dashed var(--border-strong);
    border-radius: 6px; color: var(--text-tertiary);
    cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .col-add-btn:hover { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }

  .col-tasks { display: flex; flex-direction: column; gap: 10px; flex: 1; }

  /* ── TASK CARD ── */
  .task-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 11px;
    padding: 13px;
    cursor: pointer;
    position: relative;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    box-shadow: var(--shadow-sm);
  }
  .task-card:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }
  .task-card:active { cursor: grabbing; }

  .card-top-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 8px; gap: 8px;
  }
  .card-title {
    font-size: 13.5px; font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4; flex: 1;
  }

  .wip-ring {
    width: 22px; height: 22px; flex-shrink: 0;
  }
  .done-icon { color: #22c55e; flex-shrink: 0; }

  .sprint-badge {
    display: inline-flex; align-items: center; gap: 4px;
    margin-bottom: 8px;
    font-size: 11px; font-weight: 600;
    color: var(--accent);
    background: var(--accent-light);
    border: 1px solid var(--accent-ring);
    border-radius: 6px; padding: 2px 7px;
  }

  .subtask-bar { margin-bottom: 10px; }
  .subtask-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 5px;
  }
  .subtask-label { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
  .subtask-count { font-size: 11px; font-weight: 600; font-family: 'Geist Mono', monospace; color: var(--text-secondary); }
  .progress-track {
    height: 4px; background: var(--bg-hover);
    border-radius: 4px; overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #a78bfa);
    border-radius: 4px; transition: width 0.3s ease;
  }

  .card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 9px;
    border-top: 1px solid var(--border);
    margin-top: 2px;
  }
  .card-meta { display: flex; align-items: center; gap: 6px; }

  .priority-chip {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 11px; font-weight: 600;
    padding: 2px 7px; border-radius: 6px;
    border: 1px solid;
  }
  .priority-high { background: var(--priority-high-bg); color: var(--priority-high-text); border-color: var(--priority-high-border); }
  .priority-medium { background: var(--priority-med-bg); color: var(--priority-med-text); border-color: var(--priority-med-border); }
  .priority-low { background: var(--priority-low-bg); color: var(--priority-low-text); border-color: var(--priority-low-border); }

  .date-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; color: var(--text-tertiary); font-weight: 500;
  }

  .card-assignee {
    width: 24px; height: 24px;
    border-radius: 7px;
    background: linear-gradient(135deg, #6366f1, #a78bfa);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: white;
  }

  /* ── LIST VIEW ── */
  .list-table-wrap {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .list-table { width: 100%; border-collapse: collapse; }
  .list-thead { background: var(--bg-hover); }
  .list-thead th {
    padding: 10px 16px; text-align: left;
    font-size: 11px; font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase; letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border);
  }
  .list-row {
    cursor: pointer;
    transition: background 0.1s;
    border-bottom: 1px solid var(--border);
  }
  .list-row:last-child { border-bottom: none; }
  .list-row:hover { background: var(--bg-hover); }
  .list-row td { padding: 11px 16px; font-size: 13.5px; color: var(--text-primary); white-space: nowrap; }
  .list-task-name { font-weight: 600; }

  .status-chip {
    display: inline-flex; align-items: center;
    font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 6px;
  }
  .status-todo    { background: #f1f5f9; color: #64748b; }
  .status-progress{ background: #eff6ff; color: #2563eb; }
  .status-review  { background: #faf5ff; color: #7c3aed; }
  .status-done    { background: #f0fdf4; color: #16a34a; }

  /* ── MODALS ── */
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 16px;
    animation: backdropIn 0.15s ease;
  }
  @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-box {
    background: var(--bg-elevated);
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    box-shadow: var(--shadow-lg);
    width: 100%; max-width: 460px;
    animation: modalIn 0.2s var(--ease, cubic-bezier(0.16,1,0.3,1));
    overflow: hidden;
  }
  .modal-box-lg { max-width: 520px; }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border);
  }
  .modal-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
  .modal-close {
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-hover); border: none; border-radius: 7px;
    color: var(--text-secondary); cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .modal-close:hover { background: var(--bg-active); color: var(--text-primary); }

  .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }

  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label {
    font-size: 12px; font-weight: 600;
    color: var(--text-secondary); letter-spacing: 0.02em;
  }
  .form-input, .form-select {
    padding: 10px 13px;
    background: var(--bg-hover);
    border: 1px solid var(--border-strong);
    border-radius: 9px;
    font-size: 13.5px; font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    -webkit-appearance: none;
  }
  .form-input::placeholder { color: var(--text-tertiary); }
  .form-input:focus, .form-select:focus {
    border-color: var(--accent);
    background: var(--bg-surface);
    box-shadow: 0 0 0 3px var(--accent-ring);
  }
  .form-select { cursor: pointer; }

  .modal-footer {
    padding: 14px 20px;
    background: var(--bg-hover);
    border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end; gap: 8px;
  }
  .btn-cancel {
    padding: 8px 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: 9px; font-size: 13px; font-weight: 600;
    font-family: 'Bricolage Grotesque', sans-serif;
    color: var(--text-secondary); cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .btn-cancel:hover { background: var(--bg-active); color: var(--text-primary); }
  .btn-submit {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 18px;
    background: var(--accent); color: white; border: none;
    border-radius: 9px; font-size: 13px; font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif; cursor: pointer;
    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
    transition: background 0.15s, transform 0.15s;
  }
  .btn-submit:hover { background: var(--accent-hover); transform: translateY(-1px); }
  .btn-submit:disabled { background: var(--text-tertiary); cursor: not-allowed; transform: none; box-shadow: none; }

  /* Detail modal grid */
  .detail-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .detail-field { display: flex; flex-direction: column; gap: 5px; }
  .detail-label { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-tertiary); }
  .detail-value { font-size: 13.5px; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }

  .subtask-progress-block {}
  .subtask-numbers {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 6px;
  }
  .subtask-text { font-size: 13px; font-weight: 500; color: var(--text-primary); }
  .subtask-pct { font-size: 12px; font-weight: 700; font-family: 'Geist Mono', monospace; color: var(--accent); }

  .all-done-note {
    margin-top: 8px; font-size: 11.5px; font-weight: 600;
    color: #22c55e; display: flex; align-items: center; gap: 5px;
  }

  .modal-footer-detail {
    padding: 14px 20px;
    background: var(--bg-hover);
    border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .footer-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .btn-action {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border: none; border-radius: 9px;
    font-size: 12.5px; font-weight: 700;
    font-family: 'Bricolage Grotesque', sans-serif;
    cursor: pointer; transition: background 0.15s, transform 0.15s;
  }
  .btn-action:hover { transform: translateY(-1px); }
  .btn-action:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-action-indigo { background: var(--accent); color: white; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
  .btn-action-indigo:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-action-green { background: #16a34a; color: white; }
  .btn-action-green:hover:not(:disabled) { background: #15803d; }
  .btn-action-red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .btn-action-red:hover:not(:disabled) { background: #fee2e2; }

  /* Loading */
  .loading-screen {
    height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg-base); flex-direction: column; gap: 12px;
  }
  .loading-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid var(--border-strong);
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 13.5px; color: var(--text-secondary); font-weight: 500; }

  @keyframes spin-icon { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  .spin { animation: spin-icon 1s linear infinite; }
`;

// ─── COLUMN CONFIG ─────────────────────────────────────────────────────────────
const COL_CONFIG = {
  todo:     { dot: '#94a3b8', statusClass: 'status-todo' },
  progress: { dot: '#3b82f6', statusClass: 'status-progress' },
  review:   { dot: '#a855f7', statusClass: 'status-review' },
  done:     { dot: '#22c55e', statusClass: 'status-done' },
};

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
const Topbar = ({ onNewTask, onQuickSprint, user, onLogout, onSearch, searchTerm }) => (
  <header className="db-topbar">
    <div className="topbar-left">
      <div className="brand-mark">
        <div className="brand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6.5V12.5C4 17 7.5 21.2 12 22.5C16.5 21.2 20 17 20 12.5V6.5L12 2Z" fill="white"/>
          </svg>
        </div>
        <span className="brand-name">BrainMint</span>
      </div>
      <div className="topbar-divider" />
      <div className="topbar-user-info">
        <div className="topbar-user-name">{user?.name || "Dashboard"}</div>
        <div className="topbar-user-sub"><span className="online-dot" /> Sprint Board</div>
      </div>
    </div>

    <div className="topbar-search">
      <Search size={14} />
      <input
        type="text" placeholder="Search tasks, sprints..."
        value={searchTerm} onChange={(e) => onSearch(e.target.value)}
      />
      <span className="search-kbd">⌘K</span>
    </div>

    <div className="topbar-right">
      <button className="btn-new-task" onClick={onNewTask}>
        <Plus size={14} /> New Task
      </button>
      <button className="btn-quick-sprint" onClick={onQuickSprint}>
        <Zap size={13} /> <span>Sprint</span>
      </button>
      <button className="icon-btn" title="Notifications">
        <Bell size={15} />
        <span className="notif-badge" />
      </button>
      <button className="btn-logout" onClick={onLogout}>
        <LogOut size={13} /> Logout
      </button>
      <div className="avatar">{user?.name?.charAt(0).toUpperCase() || "U"}</div>
    </div>
  </header>
);

// ─── FILTER BAR ───────────────────────────────────────────────────────────────
const FilterBar = ({ searchTerm, onSearch, priority, onPriorityChange, viewMode, onSetViewMode, taskCount }) => {
  const [open, setOpen] = useState(false);
  const priorities = ["All", "High", "Medium", "Low"];
  return (
    <div className="db-filterbar">
      <div className="filterbar-left">
        <div className="filter-input-wrap">
          <SlidersHorizontal size={13} />
          <input className="filter-input" type="text" placeholder="Filter tasks..."
            value={searchTerm} onChange={(e) => onSearch(e.target.value)} />
        </div>
        <div className="priority-dropdown">
          <button className="priority-btn" onClick={() => setOpen(!open)}>
            {priority === "All" ? "All Priority" : `${priority} Priority`}
            <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {open && (
            <div className="priority-menu">
              {priorities.map(p => (
                <button key={p} onClick={() => { onPriorityChange(p); setOpen(false); }}>
                  {p === "All" ? "All Priority" : `${p} Priority`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="filterbar-right">
        <span className="task-count-badge">{taskCount} tasks</span>
        <div className="view-toggle">
          <button className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => onSetViewMode('kanban')}>
            <LayoutDashboard size={14} />
          </button>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => onSetViewMode('list')}>
            <List size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── TASK CARD ────────────────────────────────────────────────────────────────
const TaskCard = ({ task, onDragStart, onViewTask }) => {
  const progress = task.subtasks.total > 0
    ? (task.subtasks.completed / task.subtasks.total) * 100
    : task.progress;
  const priorityClass = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' }[task.priority];
  const priorityIcon = { High: <ArrowUp size={10} />, Medium: <Minus size={10} />, Low: <ArrowDown size={10} /> }[task.priority];

  return (
    <div className="task-card" draggable onDragStart={onDragStart} onClick={onViewTask}>
      <div className="card-top-row">
        <span className="card-title">{task.title}</span>
        {task.isWIP && (
          <svg className="wip-ring" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="8" fill="none" stroke="var(--border-strong)" strokeWidth="2"/>
            <circle cx="11" cy="11" r="8" fill="none" stroke="#6366f1" strokeWidth="2"
              strokeDasharray={`${progress * 0.503} 100`} strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
          </svg>
        )}
        {progress === 100 && !task.isWIP && <CheckCircle2 size={16} className="done-icon" />}
      </div>

      {task.sprint_name && (
        <div className="sprint-badge">
          <Tag size={9} /> {task.sprint_name}
        </div>
      )}

      {task.subtasks.total > 0 && (
        <div className="subtask-bar">
          <div className="subtask-row">
            <span className="subtask-label">Subtasks</span>
            <span className="subtask-count">{task.subtasks.completed}/{task.subtasks.total}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="card-footer">
        <div className="card-meta">
          <span className={`priority-chip ${priorityClass}`}>{priorityIcon} {task.priority}</span>
          <span className="date-chip"><Calendar size={10} /> {task.dueDate}</span>
        </div>
        <div className="card-assignee">{task.title.charAt(0).toUpperCase()}</div>
      </div>
    </div>
  );
};

// ─── KANBAN COLUMN ────────────────────────────────────────────────────────────
const KanbanColumn = ({ column, tasks, onDragOver, onDrop, onDragStart, onViewTask, onAddTask }) => {
  const [isOver, setIsOver] = useState(false);
  const cfg = COL_CONFIG[column.id] || {};
  return (
    <div
      className={`kanban-col ${isOver ? 'drop-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); onDragOver(e); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { setIsOver(false); onDrop(e); }}
    >
      <div className="col-header">
        <div className="col-header-left">
          <span className="col-dot" style={{ background: cfg.dot }} />
          <span className="col-title">{column.title}</span>
          <span className="col-count">{tasks.length}</span>
        </div>
        <button className="col-add-btn" onClick={onAddTask} title="Add task">
          <Plus size={12} />
        </button>
      </div>
      <div className="col-tasks">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task}
            onDragStart={(e) => onDragStart(e, task.id, column.id)}
            onViewTask={() => onViewTask(task)}
          />
        ))}
      </div>
    </div>
  );
};

// ─── KANBAN VIEW ──────────────────────────────────────────────────────────────
const KanbanView = ({ columns, onDragStart, onDragOver, onDrop, onViewTask, onAddTask }) => (
  <div className="kanban-grid">
    {Object.values(columns).map(col => (
      <KanbanColumn key={col.id} column={col} tasks={col.tasks}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, col.id)}
        onDragStart={onDragStart}
        onViewTask={onViewTask}
        onAddTask={() => onAddTask(col.id)}
      />
    ))}
  </div>
);

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
const ListView = ({ columns, onViewTask }) => {
  const allTasks = Object.values(columns).flatMap(col =>
    col.tasks.map(task => ({ ...task, colId: col.id, colTitle: col.title }))
  );
  const priorityClass = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' };
  const statusMap = { todo: 'status-todo', progress: 'status-progress', review: 'status-review', done: 'status-done' };

  return (
    <div className="list-table-wrap">
      <table className="list-table">
        <thead className="list-thead">
          <tr>
            <th>Task</th><th>Sprint</th><th>Status</th>
            <th>Priority</th><th>Progress</th><th>Due</th><th>Assignee</th>
          </tr>
        </thead>
        <tbody>
          {allTasks.map(task => (
            <tr key={task.id} className="list-row" onClick={() => onViewTask(task)}>
              <td><span className="list-task-name">{task.title}</span></td>
              <td>
                {task.sprint_name
                  ? <span className="sprint-badge"><Tag size={9} />{task.sprint_name}</span>
                  : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
              </td>
              <td><span className={`status-chip ${statusMap[task.colId]}`}>{task.colTitle}</span></td>
              <td><span className={`priority-chip ${priorityClass[task.priority]}`}>{task.priority}</span></td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px', fontFamily: "'Geist Mono', monospace" }}>
                {task.subtasks.total > 0 ? `${task.subtasks.completed}/${task.subtasks.total}` : `${task.progress}%`}
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>{task.dueDate}</td>
              <td><div className="card-assignee">{task.title.charAt(0).toUpperCase()}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
    if (!userId) { alert("User ID is missing."); return; }
    setIsSubmitting(true);
    try {
      const newDate = dueDate
        ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : "N/A";
      await onAddTask({ user_id: userId, title, priority, status: defaultStatus, due_date: newDate, subtasks_total: parseInt(subtaskCount) || 0, sprint_id: sprintId ? parseInt(sprintId) : null });
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
          <span className="modal-title">{defaultStatus === "progress" ? "⚡ Quick Sprint Task" : "✦ New Task"}</span>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}><X size={14} /></button>
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
              <input className="form-input" type="number" value={subtaskCount} onChange={e => setSubtaskCount(e.target.value)}
                placeholder="e.g., 5" min="0" disabled={isSubmitting} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={isSubmitting} />
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

// ─── TASK DETAIL MODAL ────────────────────────────────────────────────────────
const TaskDetailModal = ({ task, onClose, onIncrementSubtask, onDeleteTask, onUpdatePriority, onAssignSprint, sprints = [] }) => {
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  if (!task) return null;

  const progress = task.subtasks.total > 0
    ? (task.subtasks.completed / task.subtasks.total) * 100 : task.progress;
  const canIncrement = task.subtasks.total > 0 && task.subtasks.completed < task.subtasks.total;
  const priorityClass = { High: 'priority-high', Medium: 'priority-medium', Low: 'priority-low' }[task.priority];

  const handleIncrement = async () => {
    setIsIncrementing(true);
    try { await onIncrementSubtask(task.id); }
    catch { alert("Failed to update subtask."); }
    finally { setIsIncrementing(false); }
  };

  const handleComplete = async () => {
    setIsIncrementing(true);
    try { await api.updateTaskStatus(task.id, 'done'); onClose(); }
    catch { alert("Failed to complete task."); }
    finally { setIsIncrementing(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setIsDeleting(true);
    try { await onDeleteTask(task.id); onClose(); }
    catch { alert("Failed to delete task."); setIsDeleting(false); }
  };

  const handleSprintChange = async (e) => {
    const newSprintId = e.target.value ? parseInt(e.target.value) : null;
    setIsAssigning(true);
    try { await onAssignSprint(task.id, newSprintId); }
    catch { alert("Failed to assign sprint."); }
    finally { setIsAssigning(false); }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-box modal-box-lg">
        <div className="modal-header">
          <span className="modal-title">{task.title}</span>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">Assignee</span>
              <div className="detail-value">
                <div className="card-assignee">{task.title.charAt(0).toUpperCase()}</div>
                You
              </div>
            </div>
            <div className="detail-field">
              <span className="detail-label">Due Date</span>
              <div className="detail-value"><Calendar size={13} /> {task.dueDate}</div>
            </div>
            <div className="detail-field">
              <span className="detail-label">Priority</span>
              <select value={task.priority} onChange={e => onUpdatePriority(task.id, e.target.value)}
                className={`priority-chip ${priorityClass}`}
                style={{ border: '1px solid', cursor: 'pointer', background: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: '11px' }}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="detail-field">
              <span className="detail-label">Sprint</span>
              <select value={task.sprint_id || ""} onChange={handleSprintChange}
                disabled={isAssigning} className="form-select" style={{ padding: '5px 9px', fontSize: '12.5px' }}>
                <option value="">No Sprint</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>

          {task.subtasks.total > 0 && (
            <div className="subtask-progress-block">
              <div className="subtask-numbers">
                <span className="subtask-text">{task.subtasks.completed} of {task.subtasks.total} subtasks</span>
                <span className="subtask-pct">{Math.round(progress)}%</span>
              </div>
              <div className="progress-track" style={{ height: '6px' }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              {progress === 100 && (
                <div className="all-done-note"><CheckCircle2 size={13} /> All subtasks complete — task moving to Done</div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer-detail">
          <div className="footer-actions">
            {task.subtasks.total > 0 ? (
              <button className="btn-action btn-action-indigo" onClick={handleIncrement}
                disabled={!canIncrement || isIncrementing || isDeleting}>
                {isIncrementing ? <Loader2 size={13} className="spin" /> : <CheckSquare size={13} />}
                {isIncrementing ? "Updating…" : "Complete Subtask"}
              </button>
            ) : (
              <button className="btn-action btn-action-green" onClick={handleComplete}
                disabled={isIncrementing || isDeleting}>
                {isIncrementing ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
                {isIncrementing ? "Completing…" : "Mark Complete"}
              </button>
            )}
            <button className="btn-action btn-action-red" onClick={handleDelete}
              disabled={isDeleting || isIncrementing}>
              {isDeleting ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
          <button className="btn-cancel" onClick={onClose} disabled={isDeleting || isIncrementing}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  if (!user || !user.id) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8fb' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400 }}>
          <h2 style={{ color: '#dc2626', marginBottom: 12 }}>⚠️ Session Error</h2>
          <p style={{ color: '#6b7280', marginBottom: 20 }}>User information is missing. Please log in again.</p>
          <button onClick={onLogout} style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const [columns, setColumns] = useState({
    todo:     { id: "todo",     title: "TO DO",       tasks: [] },
    progress: { id: "progress", title: "IN PROGRESS", tasks: [] },
    review:   { id: "review",   title: "REVIEW",      tasks: [] },
    done:     { id: "done",     title: "DONE",        tasks: [] },
  });
  const [sprints, setSprints] = useState([]);
  const [modalTargetColumn, setModalTargetColumn] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [headerSearch, setHeaderSearch] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [viewMode, setViewMode] = useState("kanban");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedHeaderSearch = useDebounce(headerSearch, 300);
  const debouncedFilterSearch = useDebounce(filterSearch, 300);

  useEffect(() => { loadAll(); }, [user?.id]);

  const loadAll = async () => {
    try {
      setIsLoading(true); setError(null);
      const [tasksData, sprintsData] = await Promise.all([
        api.getTasks(user.id),
        api.getSprints(user.id).catch(() => ({ sprints: [] }))
      ]);
      setColumns({
        todo:     { id: "todo",     title: "TO DO",       tasks: tasksData.todo     || [] },
        progress: { id: "progress", title: "IN PROGRESS", tasks: tasksData.progress || [] },
        review:   { id: "review",   title: "REVIEW",      tasks: tasksData.review   || [] },
        done:     { id: "done",     title: "DONE",        tasks: tasksData.done     || [] },
      });
      setSprints(sprintsData.sprints || []);
    } catch { setError("Failed to load tasks. Please refresh."); }
    finally { setIsLoading(false); }
  };

  const filteredColumns = useMemo(() => {
    const newCols = JSON.parse(JSON.stringify(columns));
    let total = 0;
    const q = (debouncedHeaderSearch || debouncedFilterSearch).toLowerCase();
    for (const id in newCols) {
      newCols[id].tasks = newCols[id].tasks.filter(t => {
        const ms = !q || t.title.toLowerCase().includes(q);
        const mp = priorityFilter === 'All' || t.priority === priorityFilter;
        return ms && mp;
      });
      total += newCols[id].tasks.length;
    }
    return { filteredData: newCols, totalTasks: total };
  }, [columns, debouncedHeaderSearch, debouncedFilterSearch, priorityFilter]);

  const handleDragStart = (e, taskId, sourceColumnId) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceColumnId", sourceColumnId);
  };
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");
    if (sourceColumnId === targetColumnId) return;
    setColumns(prev => {
      const nc = JSON.parse(JSON.stringify(prev));
      const task = nc[sourceColumnId].tasks.find(t => t.id === taskId);
      if (task) {
        nc[sourceColumnId].tasks = nc[sourceColumnId].tasks.filter(t => t.id !== taskId);
        task.isWIP = targetColumnId === "progress";
        nc[targetColumnId].tasks.push(task);
      }
      return nc;
    });
    try { await api.updateTaskStatus(taskId, targetColumnId); }
    catch { alert("Failed to move task. Reloading..."); loadAll(); }
  };

  const handleModalSave = async (taskData) => {
    try {
      const result = await api.createTask(taskData);
      if (result.task) {
        setColumns(prev => {
          const nc = JSON.parse(JSON.stringify(prev));
          nc[taskData.status].tasks.push(result.task);
          return nc;
        });
      } else { await loadAll(); }
    } catch { alert("Failed to create task."); }
  };

  const handleIncrementSubtask = async (taskId) => {
    let currentTask = null, sourceCol = null;
    for (const col of Object.values(columns)) {
      currentTask = col.tasks.find(t => t.id === taskId);
      if (currentTask) { sourceCol = col.id; break; }
    }
    if (!currentTask) return;
    const newCompleted = currentTask.subtasks.completed + 1;
    const willComplete = newCompleted === currentTask.subtasks.total;
    setColumns(prev => {
      const nc = JSON.parse(JSON.stringify(prev));
      const task = nc[sourceCol].tasks.find(t => t.id === taskId);
      if (task) {
        task.subtasks.completed = newCompleted;
        task.progress = (newCompleted / task.subtasks.total) * 100;
        if (willComplete) {
          nc[sourceCol].tasks = nc[sourceCol].tasks.filter(t => t.id !== taskId);
          task.isWIP = false; nc.done.tasks.push(task); setSelectedTask(task);
        } else { setSelectedTask(task); }
      }
      return nc;
    });
    try {
      await api.incrementSubtask(taskId, currentTask.subtasks.completed, currentTask.subtasks.total);
      if (willComplete) await api.updateTaskStatus(taskId, "done");
    } catch { alert("Failed to update. Reloading..."); loadAll(); }
  };

  const handleDeleteTask = async (taskId) => {
    let sourceCol = null;
    for (const col of Object.values(columns)) {
      if (col.tasks.find(t => t.id === taskId)) { sourceCol = col.id; break; }
    }
    if (!sourceCol) return;
    setColumns(prev => {
      const nc = JSON.parse(JSON.stringify(prev));
      nc[sourceCol].tasks = nc[sourceCol].tasks.filter(t => t.id !== taskId);
      return nc;
    });
    setSelectedTask(null);
    try { await api.deleteTask(taskId); }
    catch { alert("Failed to delete. Reloading..."); loadAll(); }
  };

  const handleUpdatePriority = async (taskId, newPriority) => {
    let sourceCol = null;
    for (const col of Object.values(columns)) {
      if (col.tasks.find(t => t.id === taskId)) { sourceCol = col.id; break; }
    }
    if (!sourceCol) return;
    setColumns(prev => {
      const nc = JSON.parse(JSON.stringify(prev));
      const task = nc[sourceCol].tasks.find(t => t.id === taskId);
      if (task) { task.priority = newPriority; setSelectedTask(task); }
      return nc;
    });
    try { await api.updatePriority(taskId, newPriority); }
    catch { alert("Failed to update priority. Reloading..."); loadAll(); }
  };

  const handleAssignSprint = async (taskId, sprintId) => {
    let sourceCol = null;
    for (const col of Object.values(columns)) {
      if (col.tasks.find(t => t.id === taskId)) { sourceCol = col.id; break; }
    }
    if (!sourceCol) return;
    const sprintName = sprintId ? sprints.find(s => s.id === sprintId)?.title : null;
    setColumns(prev => {
      const nc = JSON.parse(JSON.stringify(prev));
      const task = nc[sourceCol].tasks.find(t => t.id === taskId);
      if (task) { task.sprint_id = sprintId; task.sprint_name = sprintName; setSelectedTask(task); }
      return nc;
    });
    try { await api.assignTaskToSprint(taskId, sprintId); }
    catch { alert("Failed to assign sprint. Reloading..."); loadAll(); }
  };

  if (isLoading) return (
    <>
      <style>{getThemeStyles()}</style>
      <div className="db-root">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <span className="loading-text">Loading your workspace…</span>
        </div>
      </div>
    </>
  );

  if (error) return (
    <>
      <style>{getThemeStyles()}</style>
      <div className="db-root">
        <div className="loading-screen">
          <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>
          <button className="btn-new-task" onClick={loadAll}>Retry</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{getThemeStyles()}</style>
      <div className="db-root">
        <Topbar
          onNewTask={() => setModalTargetColumn('todo')}
          onQuickSprint={() => setModalTargetColumn('progress')}
          user={user} onLogout={onLogout}
          onSearch={setHeaderSearch} searchTerm={headerSearch}
        />
        <FilterBar
          searchTerm={filterSearch} onSearch={setFilterSearch}
          priority={priorityFilter} onPriorityChange={setPriorityFilter}
          viewMode={viewMode} onSetViewMode={setViewMode}
          taskCount={filteredColumns.totalTasks}
        />
        <div className="db-board">
          {viewMode === 'kanban' ? (
            <KanbanView
              columns={filteredColumns.filteredData}
              onDragStart={handleDragStart} onDragOver={handleDragOver}
              onDrop={handleDrop} onViewTask={task => setSelectedTask(task)}
              onAddTask={colId => setModalTargetColumn(colId)}
            />
          ) : (
            <ListView columns={filteredColumns.filteredData} onViewTask={task => setSelectedTask(task)} />
          )}
        </div>

        <TaskModal
          isOpen={modalTargetColumn !== null}
          onClose={() => setModalTargetColumn(null)}
          onAddTask={handleModalSave}
          userId={user?.id}
          defaultStatus={modalTargetColumn || "todo"}
          sprints={sprints}
        />
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onIncrementSubtask={handleIncrementSubtask}
          onDeleteTask={handleDeleteTask}
          onUpdatePriority={handleUpdatePriority}
          onAssignSprint={handleAssignSprint}
          sprints={sprints}
        />
      </div>
    </>
  );
}