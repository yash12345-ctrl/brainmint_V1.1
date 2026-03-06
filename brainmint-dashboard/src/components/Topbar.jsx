import React from "react";
import { Search, Plus, Zap, Bell, LogOut } from "lucide-react";

export default function Topbar({ onNewTask, onQuickSprint, user, onLogout, onSearch, searchTerm }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1.5C12 1.5 3 6.75 3 12.75C3 18.75 12 22.5 12 22.5C12 22.5 21 18.75 21 12.75C21 6.75 12 1.5 12 1.5Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{user?.name || "Your Dashboard"}</span>
              <span className="block text-xs text-gray-500">Sprint Board</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, sprints..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onNewTask}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
          <button 
            onClick={onQuickSprint}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
          >
            <Zap className="w-4 h-4" />
            <span className="hidden lg:inline">Quick Sprint</span>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}