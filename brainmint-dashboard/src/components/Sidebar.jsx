import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ListTodo, Activity, PieChart, Settings, Hexagon } from "lucide-react";

// 1. Removed Settings from the main navigation array
const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Backlog", path: "/backlog", icon: ListTodo },
  { label: "Active Sprints", path: "/sprints", icon: Activity },
  { label: "Report", path: "/report", icon: PieChart },
];

export default function Sidebar() {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const checkIsActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Helper variable to check if settings is active
  const isSettingsActive = checkIsActive("/settings");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');

        .sidebar-root {
          font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #fafafa;
          border-right: 1px solid #ebebeb;
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: width 280ms cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 50;
          overflow: hidden;
        }

        .sidebar-root.collapsed { width: 56px; }
        .sidebar-root.expanded  { width: 220px; box-shadow: 4px 0 32px rgba(0,0,0,0.04); }

        /* Brand */
        .sidebar-brand {
          display: flex;
          align-items: center;
          height: 56px;
          padding: 0 14px;
          border-bottom: 1px solid #ebebeb;
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar-brand-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(109,40,217,0.28);
        }

        .sidebar-brand-name {
          font-size: 14px;
          font-weight: 700;
          color: #18181b;
          letter-spacing: -0.3px;
          white-space: nowrap;
          transition: opacity 240ms ease, transform 240ms ease, width 240ms ease;
          margin-left: 0;
          overflow: hidden;
        }
        .collapsed .sidebar-brand-name { width: 0; opacity: 0; transform: translateX(-6px); }
        .expanded  .sidebar-brand-name { width: 120px; opacity: 1; transform: translateX(0); margin-left: 10px; }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 8px;
          overflow: hidden;
        }

        .nav-item {
          display: flex;
          align-items: center;
          border-radius: 8px;
          text-decoration: none;
          transition: background 160ms ease, color 160ms ease;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
        }
        .collapsed .nav-item { justify-content: center; padding: 10px 0; }
        .expanded  .nav-item { padding: 9px 10px; }

        .nav-item.active {
          background: #f0eaff;
        }
        .nav-item:not(.active):hover {
          background: #f4f4f5;
        }

        /* Active left accent bar */
        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: #7c3aed;
          transition: opacity 160ms ease;
        }
        .collapsed .nav-item.active::before { opacity: 0; }
        .expanded  .nav-item.active::before { opacity: 1; }

        .nav-icon {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          transition: color 160ms ease;
        }
        .nav-item.active .nav-icon { color: #7c3aed; }
        .nav-item:not(.active) .nav-icon { color: #a1a1aa; }
        .nav-item:not(.active):hover .nav-icon { color: #52525b; }

        .nav-label {
          font-size: 13px;
          font-weight: 500;
          transition: opacity 200ms ease, transform 200ms ease, width 200ms ease, margin 200ms ease;
          overflow: hidden;
          color: #3f3f46;
        }
        .nav-item.active .nav-label { color: #5b21b6; font-weight: 600; }
        .collapsed .nav-label { width: 0; opacity: 0; transform: translateX(-4px); margin-left: 0; }
        .expanded  .nav-label { width: 120px; opacity: 1; transform: translateX(0); margin-left: 10px; }

        /* Tooltip for collapsed state */
        .nav-item[data-tooltip]:not(.no-tooltip)::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: #18181b;
          color: #fafafa;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 140ms ease;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.18);
        }
        .collapsed .nav-item[data-tooltip]:hover::after { opacity: 1; }

        /* Bottom settings section */
        .sidebar-bottom {
          flex-shrink: 0;
          border-top: 1px solid #ebebeb;
          padding: 8px;
          overflow: hidden;
        }
      `}</style>

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`sidebar-root ${isHovered ? "expanded" : "collapsed"}`}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Hexagon style={{ width: 15, height: 15, color: "#fff", fill: "rgba(255,255,255,0.2)" }} />
          </div>
          <span className="sidebar-brand-name">Brainmint</span>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = checkIsActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-tooltip={item.label}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 2. Bottom Section: Settings */}
        {/* mt-auto pushes this to the absolute bottom. The border-t gives it a clean separation */}
        <div className="sidebar-bottom">
          <Link
            to="/settings"
            data-tooltip="Settings"
            className={`nav-item ${isSettingsActive ? "active" : ""}`}
          >
            <Settings className="nav-icon" />
            <span className="nav-label">Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}