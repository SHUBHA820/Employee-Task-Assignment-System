import React, { useState } from 'react';
import { Task, User, SystemMetrics, TaskPriority, TaskStatus, NotificationItem } from '../types';
import { DashboardWidget } from './DashboardWidget';
import { ActivityFeed } from './ActivityFeed';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserPlus,
  Sparkles,
  Edit,
  Trash2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Users,
  CheckSquare,
  BarChart3,
  Calendar,
  Layers,
  Download,
  X,
  MessageSquare
} from 'lucide-react';

interface ManagerDashboardProps {
  tasks: Task[];
  users: User[];
  metrics: SystemMetrics;
  notifications?: NotificationItem[];
  onOpenCreateTask: () => void;
  onOpenAiTaskAssistant: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReviewTask: (task: Task) => void;
  onAddUser: (user: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  tasks,
  users,
  metrics,
  notifications = [],
  onOpenCreateTask,
  onOpenAiTaskAssistant,
  onEditTask,
  onDeleteTask,
  onReviewTask,
  onAddUser,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'TASKS' | 'USERS'>('TASKS');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE');
  const [newUserDept, setNewUserDept] = useState('Software Engineering');
  const [newUserTitle, setNewUserTitle] = useState('Software Engineer');

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      task.title.toLowerCase().includes(term) ||
      task.description.toLowerCase().includes(term) ||
      task.assignedToName.toLowerCase().includes(term) ||
      task.priority.toLowerCase().includes(term) ||
      task.status.toLowerCase().includes(term);

    const matchesAssignee = selectedAssignee === 'ALL' || task.assignedToId === selectedAssignee;
    const matchesPriority = selectedPriority === 'ALL' || task.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'ALL' || task.status === selectedStatus;

    return matchesSearch && matchesAssignee && matchesPriority && matchesStatus;
  });

  const isFilterActive = searchTerm || selectedAssignee !== 'ALL' || selectedPriority !== 'ALL' || selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAssignee('ALL');
    setSelectedPriority('ALL');
    setSelectedStatus('ALL');
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    onAddUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      department: newUserDept,
      title: newUserTitle,
    });
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUserModal(false);
  };

  const handleDownloadReport = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `task_management_report_${timestamp.slice(0, 19)}.csv`;

    const escapeCSV = (field: string | number | undefined | null) => {
      if (field === undefined || field === null) return '""';
      const str = String(field).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Filtered metrics calculation
    const filteredTotal = filteredTasks.length;
    const filteredPending = filteredTasks.filter((t) => t.status === 'PENDING').length;
    const filteredInProgress = filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const filteredSubmitted = filteredTasks.filter((t) => t.status === 'SUBMITTED').length;
    const filteredApproved = filteredTasks.filter((t) => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    const filteredRejected = filteredTasks.filter((t) => t.status === 'REJECTED').length;
    const filteredCompletionRate = filteredTotal > 0 ? ((filteredApproved / filteredTotal) * 100).toFixed(1) : '0.0';

    // Per-Employee productivity metrics (based on filtered tasks)
    const employeeMetricsRows = users
      .filter((u) => u.role === 'EMPLOYEE')
      .map((user) => {
        const empTasks = filteredTasks.filter((t) => t.assignedToId === user.id);
        const empTotal = empTasks.length;
        const empInProg = empTasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const empSub = empTasks.filter((t) => t.status === 'SUBMITTED').length;
        const empDone = empTasks.filter((t) => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
        const empRate = empTotal > 0 ? ((empDone / empTotal) * 100).toFixed(1) : '0.0';

        return [
          escapeCSV(user.name),
          escapeCSV(user.email),
          escapeCSV(user.department),
          escapeCSV(user.title),
          escapeCSV(empTotal),
          escapeCSV(empInProg),
          escapeCSV(empSub),
          escapeCSV(empDone),
          escapeCSV(`${empRate}%`),
        ].join(',');
      });

    const activeFilterSummary = [
      `Search Query: ${searchTerm || 'None'}`,
      `Assignee Filter: ${selectedAssignee === 'ALL' ? 'All Assignees' : users.find((u) => u.id === selectedAssignee)?.name || selectedAssignee}`,
      `Priority Filter: ${selectedPriority}`,
      `Status Filter: ${selectedStatus}`,
    ].join(' | ');

    const taskHeaders = [
      'Task ID',
      'Title',
      'Description',
      'Priority',
      'Status',
      'Assigned Employee Name',
      'Assigned Employee Email',
      'Category',
      'Due Date',
      'Created At',
      'Last Updated',
      'Submission Notes',
      'Manager Review Feedback',
    ];

    const taskRows = filteredTasks.map((t) =>
      [
        escapeCSV(t.id),
        escapeCSV(t.title),
        escapeCSV(t.description),
        escapeCSV(t.priority),
        escapeCSV(t.status),
        escapeCSV(t.assignedToName),
        escapeCSV(t.assignedToEmail || ''),
        escapeCSV(t.category || 'General'),
        escapeCSV(t.dueDate),
        escapeCSV(t.createdAt),
        escapeCSV(t.updatedAt),
        escapeCSV(t.submissionNotes || ''),
        escapeCSV(t.reviewFeedback || ''),
      ].join(',')
    );

    const csvLines = [
      '=== EMPLOYEE TASK ASSIGNMENT SYSTEM - MANAGER EXECUTIVE REPORT ===',
      `Generated Timestamp,${escapeCSV(new Date().toLocaleString())}`,
      `Active Filter Applied,${escapeCSV(activeFilterSummary)}`,
      '',
      '=== EXECUTIVE PRODUCTIVITY METRICS (FILTERED SCOPE) ===',
      `Total Tasks in Scope,${filteredTotal}`,
      `Pending Tasks,${filteredPending}`,
      `In Progress Tasks,${filteredInProgress}`,
      `Awaiting Manager Review (Submitted),${filteredSubmitted}`,
      `Approved & Completed Tasks,${filteredApproved}`,
      `Rejected / Returned Tasks,${filteredRejected}`,
      `Overall Completion Rate,${filteredCompletionRate}%`,
      '',
      '=== TEAM MEMBER WORKLOAD & PRODUCTIVITY BREAKDOWN ===',
      [
        'Employee Name',
        'Email',
        'Department',
        'Title',
        'Assigned Tasks',
        'In Progress',
        'Awaiting Review',
        'Completed/Approved',
        'Completion Rate',
      ].join(','),
      ...employeeMetricsRows,
      '',
      '=== DETAILED FILTERED TASK LIST ===',
      taskHeaders.join(','),
      ...taskRows,
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-500/10 text-rose-600 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-600 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-600 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'SUBMITTED':
        return 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40 animate-pulse';
      case 'IN_PROGRESS':
        return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card-static p-6 rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-md uppercase tracking-wider font-mono">
              Manager Control Center
            </span>
            <span className="text-xs text-slate-400 font-mono">User Service & Main Task Service</span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent mt-1.5">
            Task Delegation & Work Oversight
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Assign tasks, manage employee roles, review submitted work, and track real-time productivity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="download-report-btn"
            onClick={handleDownloadReport}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/20 shadow-sm transition-all flex items-center space-x-2 backdrop-blur-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Report</span>
          </button>

          <button
            id="ai-generate-task-btn"
            onClick={onOpenAiTaskAssistant}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/80 via-indigo-600/80 to-cyan-600/80 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center space-x-2 border border-white/20 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>AI Task Generator</span>
          </button>

          <button
            id="create-task-modal-btn"
            onClick={onOpenCreateTask}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all flex items-center space-x-2 border border-white/20 backdrop-blur-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Assign Task</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Total Tasks</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{metrics.totalTasks}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Pending</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-200 mt-2 font-mono">{metrics.pendingTasks}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">In Progress</span>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-cyan-300 mt-2 font-mono">{metrics.inProgressTasks}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-indigo-400/40 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-bold">Needs Review</span>
            <AlertTriangle className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 mt-2 font-mono">{metrics.submittedTasks}</p>
          {metrics.submittedTasks > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          )}
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 mt-2 font-mono">{metrics.completedTasks}</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/10 shadow-md">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Team Members</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-300 mt-2 font-mono">{metrics.activeEmployees}</p>
        </div>

      </div>

      {/* Visual Analytics Widget (Recharts) */}
      <DashboardWidget tasks={tasks} users={users} />

      {/* Real-time Employee Activity Feed */}
      <ActivityFeed
        tasks={tasks}
        users={users}
        notifications={notifications}
        onReviewTask={onReviewTask}
      />

      {/* Navigation Sub-Tabs: Task Delegation vs User Management */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('TASKS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSubTab === 'TASKS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task Assignments ({filteredTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('USERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
              activeSubTab === 'USERS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Employee Directory & User Service</span>
          </button>
        </div>

        {activeSubTab === 'USERS' && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: TASKS BOARD & TABLE */}
      {activeSubTab === 'TASKS' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="task-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, assignee, description, or priority (e.g. URGENT, High)..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Assignee Filter */}
            <select
              id="task-assignee-filter"
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              id="task-priority-filter"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              id="task-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted for Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected / Revision</option>
            </select>

            {/* Reset Filters Button */}
            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all flex items-center space-x-1"
                title="Reset search and filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>

          {/* Tasks Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Task ID</th>
                    <th className="px-4 py-3">Title & Category</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No tasks found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          {task.id}
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                          <span className="text-[10px] text-slate-500 font-medium">{task.category || 'General Operations'}</span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-700 dark:text-slate-300">
                              {task.assignedToName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{task.assignedToName}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-1">
                          {task.status === 'SUBMITTED' && (
                            <button
                              onClick={() => onReviewTask(task)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-bold transition-all shadow-sm"
                            >
                              Review Work
                            </button>
                          )}

                          <button
                            onClick={() => onEditTask(task)}
                            title="Task Discussion & Notes"
                            className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center space-x-1 rounded-md hover:bg-white/10"
                          >
                            <MessageSquare className="w-4 h-4 text-cyan-400" />
                            {(task.comments?.length ?? 0) > 0 && (
                              <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-400/30">
                                {task.comments?.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => onEditTask(task)}
                            title="Edit Task"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Delete Task"
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: USER DIRECTORY MANAGEMENT */}
      {activeSubTab === 'USERS' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Service Directory</h3>
              <p className="text-xs text-slate-500">Manage employee role-based access, departments, and task assignments.</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              Database: PostgreSQL user_service_db
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => {
              const activeCount = tasks.filter((t) => t.assignedToId === user.id && t.status !== 'APPROVED').length;
              const completedCount = tasks.filter((t) => t.assignedToId === user.id && t.status === 'APPROVED').length;

              return (
                <div key={user.id} className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</h4>
                        <p className="text-xs text-slate-500">{user.title}</p>
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.role === 'MANAGER' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'}`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                    <span className="text-slate-500">Department: <strong className="text-slate-700 dark:text-slate-300">{user.department}</strong></span>
                    <span className="text-slate-500">Tasks: <strong className="text-indigo-600 dark:text-indigo-400">{activeCount} active</strong></span>
                  </div>

                  {user.role !== 'MANAGER' && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-[11px] font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors"
                      >
                        Remove Employee
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Employee to User Service</h3>
            <p className="text-xs text-slate-500 mb-4">Creates a new employee profile in pgAdmin user_db and enables JWT login.</p>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g., Marcus Vance"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g., marcus.vance@enterprise.com"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="MANAGER">MANAGER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={newUserTitle}
                  onChange={(e) => setNewUserTitle(e.target.value)}
                  placeholder="e.g., Senior Full Stack Engineer"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
