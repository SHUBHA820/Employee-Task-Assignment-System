import React, { useState, useMemo } from 'react';
import { Task, User } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, Users, AlertCircle } from 'lucide-react';

interface DashboardWidgetProps {
  tasks: Task[];
  users: User[];
}

const STATUS_COLORS: Record<string, { bg: string; fill: string; label: string }> = {
  PENDING: { bg: 'bg-slate-500', fill: '#64748b', label: 'Pending' },
  IN_PROGRESS: { bg: 'bg-cyan-500', fill: '#06b6d4', label: 'In Progress' },
  SUBMITTED: { bg: 'bg-indigo-500', fill: '#6366f1', label: 'Submitted' },
  APPROVED: { bg: 'bg-emerald-500', fill: '#10b981', label: 'Approved' },
  REJECTED: { bg: 'bg-rose-500', fill: '#f43f5e', label: 'Rejected' },
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ tasks, users }) => {
  const [workloadFilter, setWorkloadFilter] = useState<'ALL' | 'EMPLOYEE_ONLY'>('ALL');

  // 1. Task Distribution across statuses data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      } else {
        counts[t.status] = 1;
      }
    });

    return Object.entries(counts)
      .map(([status, value]) => ({
        name: STATUS_COLORS[status]?.label || status,
        rawStatus: status,
        value,
        color: STATUS_COLORS[status]?.fill || '#8884d8',
      }))
      .filter((item) => item.value > 0 || tasks.length === 0);
  }, [tasks]);

  // 2. Team Member Workloads data
  const workloadData = useMemo(() => {
    const filteredUsers = workloadFilter === 'EMPLOYEE_ONLY'
      ? users.filter((u) => u.role === 'EMPLOYEE')
      : users;

    return filteredUsers.map((user) => {
      const userTasks = tasks.filter((t) => t.assignedToId === user.id);
      const pending = userTasks.filter((t) => t.status === 'PENDING').length;
      const inProgress = userTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const submitted = userTasks.filter((t) => t.status === 'SUBMITTED').length;
      const approved = userTasks.filter((t) => t.status === 'APPROVED').length;
      const rejected = userTasks.filter((t) => t.status === 'REJECTED').length;
      const activeTotal = pending + inProgress + submitted + rejected;

      return {
        id: user.id,
        name: user.name.split(' ')[0] || user.name, // First name for bar chart tick label
        fullName: user.name,
        role: user.role,
        department: user.department,
        Pending: pending,
        'In Progress': inProgress,
        Submitted: submitted,
        Approved: approved,
        Rejected: rejected,
        'Active Tasks': activeTotal,
        'Total Tasks': userTasks.length,
      };
    });
  }, [tasks, users, workloadFilter]);

  // Priority Distribution
  const priorityData = useMemo(() => {
    const pCounts: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    tasks.forEach((t) => {
      if (pCounts[t.priority] !== undefined) pCounts[t.priority]++;
    });
    return [
      { priority: 'Urgent', count: pCounts.URGENT, color: PRIORITY_COLORS.URGENT },
      { priority: 'High', count: pCounts.HIGH, color: PRIORITY_COLORS.HIGH },
      { priority: 'Medium', count: pCounts.MEDIUM, color: PRIORITY_COLORS.MEDIUM },
      { priority: 'Low', count: pCounts.LOW, color: PRIORITY_COLORS.LOW },
    ];
  }, [tasks]);

  const totalTaskCount = tasks.length;
  const completedTaskCount = tasks.filter((t) => t.status === 'APPROVED').length;
  const completionPercent = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;

  return (
    <div id="manager-dashboard-widget" className="space-y-6">
      
      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart 1: Task Status Distribution (Pie / Donut) */}
        <div className="lg:col-span-5 glass-card-static p-6 rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 backdrop-blur-md">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Task Status Breakdown</h3>
                  <p className="text-xs text-slate-300">Distribution across current pipeline statuses</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-slate-200 font-mono border border-white/15 backdrop-blur-md">
                {totalTaskCount} Total
              </span>
            </div>

            {/* Recharts Donut Chart */}
            <div className="h-64 w-full relative mt-4">
              {statusData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No task data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(16px)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.6)',
                      }}
                      itemStyle={{ color: '#38bdf8' }}
                      formatter={(value: any, name: any) => [`${value} tasks`, `${name}`]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#cbd5e1' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}

              {/* Center Stat Badge inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl font-black text-white">{completionPercent}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Approved</span>
              </div>
            </div>
          </div>

          {/* Status Quick Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
            {Object.entries(STATUS_COLORS).map(([statusKey, info]) => {
              const count = tasks.filter((t) => t.status === statusKey).length;
              return (
                <div key={statusKey} className="flex items-center space-x-2 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: info.fill }} />
                  <div className="truncate">
                    <p className="text-[10px] text-slate-300 font-medium truncate">{info.label}</p>
                    <p className="text-xs font-bold text-white">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Team Member Workloads (Stacked / Grouped Bar Chart) */}
        <div className="lg:col-span-7 glass-card-static p-6 rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Team Workload & Capacity</h3>
                  <p className="text-xs text-slate-500">Active vs. Completed tasks assigned per team member</p>
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
                <button
                  onClick={() => setWorkloadFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    workloadFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setWorkloadFilter('EMPLOYEE_ONLY')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    workloadFilter === 'EMPLOYEE_ONLY'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Employees Only
                </button>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-72 w-full mt-2">
              {workloadData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No user workload data found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                      }}
                      cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      formatter={(value: any, name: any) => [`${value} tasks`, `${name}`]}
                      labelFormatter={(label, items) => {
                        const item = items && items[0]?.payload;
                        return item ? `${item.fullName} (${item.department})` : label;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                    />
                    <Bar dataKey="Pending" stackId="a" fill="#64748b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="In Progress" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Submitted" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Rejected" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Approved" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Team Workload Summary Footer Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2 text-slate-500">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Showing {workloadData.length} team members</span>
            </div>
            <div className="flex items-center space-x-4 font-mono text-[11px]">
              <span className="text-cyan-600 dark:text-cyan-400">
                Avg Load: {(totalTaskCount / (users.length || 1)).toFixed(1)} tasks/user
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Total Approved: {completedTaskCount}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Secondary Row: Task Priority Bar Chart & Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Priority Breakdown */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Task Priority Distribution</h4>
            </div>
            <span className="text-xs text-slate-500 font-mono">Urgent to Low ratio</span>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="priority" stroke="#94a3b8" fontSize={11} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`${value} tasks`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Health Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400 font-mono">
                System Health
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Queue & Service Pulse</h4>
            <p className="text-xs text-slate-300">
              Kafka events & Microservice DB state are synchronized with high task throughput.
            </p>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-indigo-500/20 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Submitted for Review:</span>
              <span className="font-bold text-indigo-300">{tasks.filter((t) => t.status === 'SUBMITTED').length}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Urgent Tasks Active:</span>
              <span className="font-bold text-rose-400">{tasks.filter((t) => t.priority === 'URGENT' && t.status !== 'APPROVED').length}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Completion Velocity:</span>
              <span className="font-bold text-emerald-400">{completionPercent}% Target</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
