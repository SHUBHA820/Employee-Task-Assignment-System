import React, { useState } from 'react';
import { Task, User, TaskStatus, TaskPriority } from '../types';
import {
  CheckSquare,
  Clock,
  Play,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  MessageSquare,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ArrowUpDown,
  AlertTriangle,
  History,
  SlidersHorizontal
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onOpenSubmitWorkModal: (task: Task) => void;
  onOpenDiscussion?: (task: Task) => void;
}

type SortOption = 'DEADLINE' | 'PRIORITY' | 'RECENT_ACTIVITY';

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  tasks,
  onUpdateTaskStatus,
  onOpenSubmitWorkModal,
  onOpenDiscussion,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEADLINE');
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);

  // My Tasks filter
  const myTasks = tasks.filter((t) => t.assignedToId === currentUser.id);

  const pendingTasks = myTasks.filter((t) => t.status === 'PENDING');
  const inProgressTasks = myTasks.filter((t) => t.status === 'IN_PROGRESS');
  const submittedTasks = myTasks.filter((t) => t.status === 'SUBMITTED');
  const completedTasks = myTasks.filter((t) => t.status === 'APPROVED');
  const rejectedTasks = myTasks.filter((t) => t.status === 'REJECTED');

  const filteredTasks = myTasks.filter((t) => {
    if (activeFilter === 'ALL') return true;
    return t.status === activeFilter;
  });

  const priorityWeight: Record<TaskPriority, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const sortedFilteredTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'DEADLINE') {
      const timeA = new Date(a.dueDate).getTime() || 0;
      const timeB = new Date(b.dueDate).getTime() || 0;
      return timeA - timeB;
    }
    if (sortBy === 'PRIORITY') {
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      return (new Date(a.dueDate).getTime() || 0) - (new Date(b.dueDate).getTime() || 0);
    }
    if (sortBy === 'RECENT_ACTIVITY') {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime() || 0;
      const timeB = new Date(b.updatedAt || b.createdAt).getTime() || 0;
      return timeB - timeA;
    }
    return 0;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/40';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-400/40';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 shadow-md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                  Employee Dashboard
                </span>
                <span className="text-xs text-slate-400 font-mono">{currentUser.department}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                Welcome back, {currentUser.name}!
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                You have <strong className="text-indigo-400">{inProgressTasks.length + pendingTasks.length} active tasks</strong> assigned to you sorted by priority.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 backdrop-blur-sm">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div className="text-xs">
              <p className="text-slate-400 font-medium">Completion Rate</p>
              <p className="text-sm font-bold text-emerald-400">
                {myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0}% Done
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Task State Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`p-4 rounded-2xl border transition-all text-left backdrop-blur-md ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-bold">Pending Tasks</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{pendingTasks.length}</p>
        </button>

        <button
          onClick={() => setActiveFilter('IN_PROGRESS')}
          className={`p-4 rounded-2xl border transition-all text-left backdrop-blur-md ${
            activeFilter === 'IN_PROGRESS'
              ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-cyan-300">
            <span className="text-xs font-bold">In Progress</span>
            <Play className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-cyan-300 mt-2 font-mono">{inProgressTasks.length}</p>
        </button>

        <button
          onClick={() => setActiveFilter('SUBMITTED')}
          className={`p-4 rounded-2xl border transition-all text-left backdrop-blur-md ${
            activeFilter === 'SUBMITTED'
              ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-bold">Awaiting Review</span>
            <Upload className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-2 font-mono">{submittedTasks.length}</p>
        </button>

        <button
          onClick={() => setActiveFilter('APPROVED')}
          className={`p-4 rounded-2xl border transition-all text-left backdrop-blur-md ${
            activeFilter === 'APPROVED'
              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              : 'glass-card border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-xs font-bold">Approved & Done</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">{completedTasks.length}</p>
        </button>

      </div>

      {/* Task List / Kanban Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Assigned Tasks</span>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-400/30">
                  {sortedFilteredTasks.length}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Filtered by <strong className="text-cyan-300">{activeFilter === 'ALL' ? 'All Tasks' : activeFilter.replace('_', ' ')}</strong> • Sorted by <strong className="text-cyan-300">{sortBy.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sorting Toggle Toolbar */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs backdrop-blur-md">
              <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1 font-mono">
                <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                <span className="hidden lg:inline">Sort:</span>
              </span>

              <button
                id="sort-deadline-btn"
                onClick={() => setSortBy('DEADLINE')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  sortBy === 'DEADLINE'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Sort by earliest deadline"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Deadline</span>
              </button>

              <button
                id="sort-priority-btn"
                onClick={() => setSortBy('PRIORITY')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  sortBy === 'PRIORITY'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Sort by highest priority status"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>High Priority</span>
              </button>

              <button
                id="sort-activity-btn"
                onClick={() => setSortBy('RECENT_ACTIVITY')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  sortBy === 'RECENT_ACTIVITY'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md border border-white/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="Sort by most recent update"
              >
                <History className="w-3.5 h-3.5" />
                <span>Recent Activity</span>
              </button>
            </div>

            {/* Filter Reset */}
            {activeFilter !== 'ALL' && (
              <button
                id="reset-filter-btn"
                onClick={() => setActiveFilter('ALL')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-white/10 text-slate-200 border border-white/20 hover:bg-white/20"
              >
                Show All
              </button>
            )}
          </div>
        </div>

        {sortedFilteredTasks.length === 0 ? (
          <div className="glass-card-static p-8 text-center rounded-2xl border border-white/10 text-slate-300">
            No tasks found in this section.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedFilteredTasks.map((task) => (
              <div
                key={task.id}
                className="glass-card rounded-2xl border border-white/15 p-5 shadow-lg hover:shadow-cyan-500/10 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-300">{task.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-300">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                      {sortBy === 'RECENT_ACTIVITY' && task.updatedAt && (
                        <span className="text-[10px] text-slate-400 font-mono border-l border-white/10 pl-2">
                          Updated: {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1.5">{task.title}</h4>
                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">{task.description}</p>

                  <div className="mt-3 text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Manager: <strong className="text-white">{task.createdByName}</strong></span>
                    <span className="text-cyan-300 font-semibold">{task.category || 'General'}</span>
                  </div>
                </div>

                {/* Manager Feedback box if REJECTED or APPROVED with feedback */}
                {task.reviewFeedback && (
                  <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-xs backdrop-blur-md">
                    <div className="flex items-center space-x-1.5 text-indigo-300 font-bold mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Manager Feedback Note</span>
                    </div>
                    <p className="text-slate-200 italic">{task.reviewFeedback}</p>
                  </div>
                )}

                {/* Action Controls */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-300">
                      Status: <strong className="text-white">{task.status.replace('_', ' ')}</strong>
                    </span>

                    {onOpenDiscussion && (
                      <button
                        onClick={() => onOpenDiscussion(task)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white font-bold text-xs flex items-center space-x-1 border border-white/15 transition-all"
                        title="Open task discussion & notes"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{task.comments?.length || 0} Notes</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {task.status === 'PENDING' && (
                      <button
                        onClick={() => onUpdateTaskStatus(task.id, 'IN_PROGRESS')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1 border border-white/20 backdrop-blur-md"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Work</span>
                      </button>
                    )}

                    {(task.status === 'IN_PROGRESS' || task.status === 'REJECTED') && (
                      <button
                        onClick={() => onOpenSubmitWorkModal(task)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1 border border-white/20 backdrop-blur-md"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Submit Work</span>
                      </button>
                    )}

                    {task.status === 'SUBMITTED' && (
                      <span className="text-xs font-semibold text-cyan-300 italic bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-400/30 backdrop-blur-md">
                        Awaiting Manager Review
                      </span>
                    )}

                    {task.status === 'APPROVED' && (
                      <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-400/30 backdrop-blur-md">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approved</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
