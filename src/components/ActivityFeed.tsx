import React, { useState, useMemo } from 'react';
import { Task, User, NotificationItem, KafkaEvent, TaskStatus } from '../types';
import {
  Activity,
  Play,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  User as UserIcon,
  Filter,
  Search,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckSquare
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'STARTED_WORK' | 'SUBMITTED_WORK' | 'APPROVED' | 'REJECTED' | 'ASSIGNED' | 'UPDATED';
  user: {
    id: string;
    name: string;
    avatar: string;
    role: string;
    title: string;
  };
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    category?: string;
  };
  details?: string;
  timestamp: string;
  submissionLinks?: string[];
  reviewFeedback?: string;
}

interface ActivityFeedProps {
  tasks: Task[];
  users: User[];
  notifications?: NotificationItem[];
  kafkaEvents?: KafkaEvent[];
  onReviewTask?: (task: Task) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  tasks,
  users,
  notifications = [],
  kafkaEvents = [],
  onReviewTask,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Derive real-time activity feed from tasks and notifications
  const activities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    tasks.forEach((task) => {
      const assignedUser = users.find((u) => u.id === task.assignedToId) || {
        id: task.assignedToId,
        name: task.assignedToName,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'EMPLOYEE',
        title: 'Team Member',
      };

      // Work Submitted
      if (task.status === 'SUBMITTED') {
        list.push({
          id: `act-sub-${task.id}-${task.updatedAt}`,
          type: 'SUBMITTED_WORK',
          user: {
            id: assignedUser.id,
            name: assignedUser.name,
            avatar: assignedUser.avatar,
            role: assignedUser.role,
            title: assignedUser.title,
          },
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            category: task.category,
          },
          details: task.submissionNotes || 'Submitted deliverable for manager review.',
          timestamp: task.updatedAt || task.createdAt,
          submissionLinks: task.submissionLinks,
        });
      }

      // Work In Progress
      if (task.status === 'IN_PROGRESS') {
        list.push({
          id: `act-prog-${task.id}-${task.updatedAt}`,
          type: 'STARTED_WORK',
          user: {
            id: assignedUser.id,
            name: assignedUser.name,
            avatar: assignedUser.avatar,
            role: assignedUser.role,
            title: assignedUser.title,
          },
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            category: task.category,
          },
          details: `Started actively working on task "${task.title}".`,
          timestamp: task.updatedAt || task.createdAt,
        });
      }

      // Approved Work
      if (task.status === 'APPROVED' || task.status === 'COMPLETED') {
        list.push({
          id: `act-app-${task.id}-${task.updatedAt}`,
          type: 'APPROVED',
          user: {
            id: assignedUser.id,
            name: assignedUser.name,
            avatar: assignedUser.avatar,
            role: assignedUser.role,
            title: assignedUser.title,
          },
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            category: task.category,
          },
          details: task.reviewFeedback || 'Deliverables verified and marked as completed.',
          timestamp: task.updatedAt || task.createdAt,
          reviewFeedback: task.reviewFeedback,
        });
      }

      // Rejected / Returned Work
      if (task.status === 'REJECTED') {
        list.push({
          id: `act-rej-${task.id}-${task.updatedAt}`,
          type: 'REJECTED',
          user: {
            id: assignedUser.id,
            name: assignedUser.name,
            avatar: assignedUser.avatar,
            role: assignedUser.role,
            title: assignedUser.title,
          },
          task: {
            id: task.id,
            title: task.title,
            status: task.status,
            category: task.category,
          },
          details: task.reviewFeedback || 'Task was returned to employee with feedback notes.',
          timestamp: task.updatedAt || task.createdAt,
          reviewFeedback: task.reviewFeedback,
        });
      }

      // Task Created / Assigned
      list.push({
        id: `act-assign-${task.id}-${task.createdAt}`,
        type: 'ASSIGNED',
        user: {
          id: task.createdById || 'user-mgr-1',
          name: task.createdByName || 'Manager',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'MANAGER',
          title: 'Lead Architect',
        },
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          category: task.category,
        },
        details: `Assigned task to ${task.assignedToName} (Due: ${new Date(task.dueDate).toLocaleDateString()}).`,
        timestamp: task.createdAt,
      });
    });

    // Merge notification events if any
    notifications.forEach((notif) => {
      const isSub = notif.type === 'TASK_SUBMITTED';
      if (isSub) {
        const notifTask = tasks.find((t) => t.id === notif.taskId);
        if (notifTask) {
          const emp = users.find((u) => u.id === notifTask.assignedToId);
          list.push({
            id: `act-notif-${notif.id}`,
            type: 'SUBMITTED_WORK',
            user: {
              id: emp?.id || notifTask.assignedToId,
              name: emp?.name || notifTask.assignedToName,
              avatar: emp?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
              role: 'EMPLOYEE',
              title: emp?.title || 'Software Engineer',
            },
            task: {
              id: notifTask.id,
              title: notifTask.title,
              status: notifTask.status,
              category: notifTask.category,
            },
            details: notif.message,
            timestamp: notif.timestamp,
          });
        }
      }
    });

    // Deduplicate by ID and sort descending by timestamp
    const uniqueMap = new Map<string, ActivityItem>();
    list.forEach((item) => uniqueMap.set(item.id, item));

    return Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [tasks, users, notifications]);

  // Filtered Activities
  const filteredActivities = activities.filter((act) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      act.user.name.toLowerCase().includes(query) ||
      act.task.title.toLowerCase().includes(query) ||
      act.task.id.toLowerCase().includes(query) ||
      (act.details && act.details.toLowerCase().includes(query));

    const matchesType = filterType === 'ALL' || act.type === filterType;
    const matchesUser = selectedUserFilter === 'ALL' || act.user.id === selectedUserFilter;

    return matchesQuery && matchesType && matchesUser;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'SUBMITTED_WORK':
        return {
          icon: Upload,
          label: 'Work Submitted',
          bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.3)]',
          dot: 'bg-indigo-400',
        };
      case 'STARTED_WORK':
        return {
          icon: Play,
          label: 'In Progress',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]',
          dot: 'bg-cyan-400',
        };
      case 'APPROVED':
        return {
          icon: CheckCircle2,
          label: 'Task Approved',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
          dot: 'bg-emerald-400',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          label: 'Revision Requested',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-400/30 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          dot: 'bg-rose-400',
        };
      case 'ASSIGNED':
      default:
        return {
          icon: CheckSquare,
          label: 'Task Assigned',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.3)]',
          dot: 'bg-purple-400',
        };
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="glass-card-static p-6 rounded-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)] space-y-5">
      
      {/* Top Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/30 via-indigo-500/30 to-purple-500/30 border border-cyan-400/30 text-cyan-300">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">Employee Live Activity Feed</h3>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-400/30 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
                  LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time stream of task status updates, code submissions, and manager approvals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className={`px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold border border-white/20 transition-all flex items-center space-x-1.5 backdrop-blur-md ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Sync latest employee events"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sync Events</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/10 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activity by employee name, task ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          />
        </div>

        {/* Action Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          >
            <option value="ALL">All Action Types</option>
            <option value="SUBMITTED_WORK">Submitted Work</option>
            <option value="STARTED_WORK">Started Work</option>
            <option value="APPROVED">Approved Tasks</option>
            <option value="REJECTED">Revisions Requested</option>
            <option value="ASSIGNED">New Assignments</option>
          </select>

          {/* User Filter */}
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          >
            <option value="ALL">All Team Members</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          {(filterType !== 'ALL' || selectedUserFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setFilterType('ALL');
                setSelectedUserFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[11px] text-cyan-300 font-bold hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl text-slate-400">
            <Zap className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No recent employee activities found matching filters.</p>
            <p className="text-[11px] text-slate-500 mt-1">Actions performed by employees will appear here in real time.</p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const badge = getActivityBadge(act.type);
            const Icon = badge.icon;
            const fullTask = tasks.find((t) => t.id === act.task.id);

            return (
              <div
                key={act.id}
                className="bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-cyan-400/30 rounded-xl p-4 transition-all duration-200 backdrop-blur-md shadow-sm group"
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* User Avatar & Info */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <img
                      src={act.user.avatar}
                      alt={act.user.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/20 mt-0.5 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {act.user.name}
                        </span>
                        
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {act.user.title}
                        </span>

                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Task Link / Title */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                          {act.task.id}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{act.task.title}</span>
                      </div>

                      {/* Details / Submission Notes */}
                      {act.details && (
                        <p className="mt-2 text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-white/5 line-clamp-3 leading-relaxed">
                          {act.details}
                        </p>
                      )}

                      {/* Links if submitted */}
                      {act.submissionLinks && act.submissionLinks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {act.submissionLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-[10px] text-indigo-300 hover:text-indigo-200 font-mono bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-400/30"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[200px]">{link}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Timestamp & Action Button */}
                  <div className="flex flex-col items-end justify-between self-stretch space-y-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      <Clock className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{formatTimeAgo(act.timestamp)}</span>
                    </span>

                    {/* Quick Review Button for Manager if task is awaiting review */}
                    {act.task.status === 'SUBMITTED' && fullTask && onReviewTask && (
                      <button
                        onClick={() => onReviewTask(fullTask)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-[11px] font-bold shadow-md transition-all flex items-center space-x-1 border border-white/20"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review Work</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Feed Footer Summary */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>Showing {filteredActivities.length} event records</span>
        <span className="flex items-center space-x-1 text-cyan-300">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Microservices Kafka Event Bus Connected</span>
        </span>
      </div>

    </div>
  );
};
