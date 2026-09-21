import React, { useState, useEffect } from 'react';
import { User, Task, NotificationItem, SystemMetrics, TaskStatus, TaskPriority } from './types';
import { Navbar } from './components/Navbar';
import { ManagerDashboard } from './components/ManagerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { TaskFormModal } from './components/TaskFormModal';
import { SubmissionModal } from './components/SubmissionModal';
import { ReviewModal } from './components/ReviewModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { KafkaLogViewer } from './components/KafkaLogViewer';
import { SemgrepAuditModal } from './components/SemgrepAuditModal';
import { initialUsers, initialTasks, initialNotifications, computeMetrics } from './mockData';

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    submittedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    activeEmployees: 0,
    kafkaEventsProcessed: 0,
  });

  const [activeTab, setActiveTab] = useState<'MANAGER' | 'EMPLOYEE' | 'KAFKA' | 'ARCHITECTURE'>('MANAGER');

  // Modal Visibility States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<Task | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingTask, setReviewingTask] = useState<Task | null>(null);

  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isKafkaLogOpen, setIsKafkaLogOpen] = useState(false);
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);

  const syncLocalStorage = (u: User[], t: Task[], n: NotificationItem[]) => {
    try {
      localStorage.setItem('etas_users', JSON.stringify(u));
      localStorage.setItem('etas_tasks', JSON.stringify(t));
      localStorage.setItem('etas_notifs', JSON.stringify(n));
    } catch (_) {}
  };

  const loadLocalMockData = () => {
    try {
      const storedUsers = localStorage.getItem('etas_users');
      const loadedUsers: User[] = storedUsers ? JSON.parse(storedUsers) : initialUsers;
      const storedTasks = localStorage.getItem('etas_tasks');
      const loadedTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : initialTasks;
      const storedNotifs = localStorage.getItem('etas_notifs');
      const loadedNotifs: NotificationItem[] = storedNotifs ? JSON.parse(storedNotifs) : initialNotifications;

      setUsers(loadedUsers);
      setTasks(loadedTasks);
      setNotifications(loadedNotifs);
      setMetrics(computeMetrics(loadedTasks, loadedUsers, 3));
      if (!currentUser) {
        setCurrentUser(loadedUsers[0]);
      }
    } catch (_) {
      setUsers(initialUsers);
      setTasks(initialTasks);
      setNotifications(initialNotifications);
      setMetrics(computeMetrics(initialTasks, initialUsers, 3));
      if (!currentUser) {
        setCurrentUser(initialUsers[0]);
      }
    }
  };

  // Initial Data Fetch
  const fetchAllData = async () => {
    try {
      const [usersRes, tasksRes, notifsRes, metricsRes] = await Promise.all([
        fetch('/api/users').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/tasks').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/notifications').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
        fetch('/api/metrics').then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      ]);

      if (usersRes.users) {
        setUsers(usersRes.users);
        if (!currentUser) {
          setCurrentUser(usersRes.users[0]); // Default to Lead Architect / Manager
        }
      }

      if (tasksRes.tasks) setTasks(tasksRes.tasks);
      if (notifsRes.notifications) setNotifications(notifsRes.notifications);
      if (metricsRes.metrics) setMetrics(metricsRes.metrics);

      if (usersRes.users && tasksRes.tasks && notifsRes.notifications) {
        syncLocalStorage(usersRes.users, tasksRes.tasks, notifsRes.notifications);
      }
    } catch (err) {
      console.warn('Backend API offline or warming up. Falling back to resilient local storage mode.');
      loadLocalMockData();
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-pulse font-mono text-sm">Initializing Microservice Gateway & Database Connections...</div>
      </div>
    );
  }

  // Action Handlers
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
  };

  const handleCreateOrUpdateTask = async (taskData: Partial<Task>) => {
    let apiSuccess = false;
    try {
      if (taskData.id) {
        const res = await fetch(`/api/tasks/${taskData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
        apiSuccess = res.ok;
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...taskData,
            createdById: currentUser.id,
          }),
        });
        apiSuccess = res.ok;
      }
    } catch (err) {
      console.warn('API save error, using local fallback:', err);
    }

    if (apiSuccess) {
      fetchAllData();
    } else {
      if (taskData.id) {
        const updated = tasks.map((t) => (t.id === taskData.id ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t));
        setTasks(updated);
        setMetrics(computeMetrics(updated, users, 3));
        syncLocalStorage(users, updated, notifications);
      } else {
        const assignee = users.find((u) => u.id === taskData.assignedToId) || users[0];
        const newTask: Task = {
          id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
          title: taskData.title || 'New Task',
          description: taskData.description || '',
          assignedToId: assignee.id,
          assignedToName: assignee.name,
          assignedToEmail: assignee.email,
          createdById: currentUser.id,
          createdByName: currentUser.name,
          priority: (taskData.priority as TaskPriority) || 'MEDIUM',
          status: 'PENDING',
          dueDate: taskData.dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: taskData.category || 'General Operations',
        };
        const updated = [newTask, ...tasks];
        setTasks(updated);
        setMetrics(computeMetrics(updated, users, 3));
        syncLocalStorage(users, updated, notifications);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete error, deleting locally:', err);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    setMetrics(computeMetrics(updated, users, 3));
    syncLocalStorage(users, updated, notifications);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedByUserId: currentUser.id }),
      });
    } catch (err) {
      console.warn('API status error, updating locally:', err);
    }
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    setTasks(updated);
    setMetrics(computeMetrics(updated, users, 3));
    syncLocalStorage(users, updated, notifications);
  };

  const handleSubmitWork = async (taskId: string, notes: string, links: string[]) => {
    try {
      await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionNotes: notes, submissionLinks: links }),
      });
    } catch (err) {
      console.warn('API submit error, updating locally:', err);
    }
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'SUBMITTED' as TaskStatus, submissionNotes: notes, submissionLinks: links, updatedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    setMetrics(computeMetrics(updated, users, 3));
    syncLocalStorage(users, updated, notifications);
  };

  const handleReviewTask = async (taskId: string, decision: 'APPROVE' | 'REJECT', feedback: string) => {
    const newStatus: TaskStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    try {
      await fetch(`/api/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, reviewFeedback: feedback }),
      });
    } catch (err) {
      console.warn('API review error, updating locally:', err);
    }
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus, reviewFeedback: feedback, updatedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    setMetrics(computeMetrics(updated, users, 3));
    syncLocalStorage(users, updated, notifications);
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      fetchAllData();
    } catch (err) {
      console.warn('API user create error, updating locally:', err);
      const newUser: User = {
        id: `user-${(userData.role || 'EMP').toLowerCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
        name: userData.name || 'New Member',
        email: userData.email || 'member@enterprise.com',
        role: userData.role || 'EMPLOYEE',
        department: userData.department || 'Engineering',
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        title: userData.title || 'Team Member',
        status: 'ACTIVE',
      };
      const updated = [...users, newUser];
      setUsers(updated);
      syncLocalStorage(updated, tasks, notifications);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API user delete error, updating locally:', err);
    }
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    syncLocalStorage(updated, tasks, notifications);
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (err) {
      console.warn('API notif read error, updating locally:', err);
    }
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    syncLocalStorage(users, tasks, updated);
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch (err) {
      console.warn('API mark all read error, updating locally:', err);
    }
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    syncLocalStorage(users, tasks, updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Frozen Liquid Glass Ambient iOS Control Center Aurora & Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-indigo-500/40 rounded-full blur-[110px] animate-orb-1" />
        <div className="absolute top-1/4 -right-24 w-[30rem] h-[30rem] bg-cyan-400/35 rounded-full blur-[120px] animate-orb-2" />
        <div className="absolute top-2/3 left-1/4 w-[28rem] h-[28rem] bg-fuchsia-500/30 rounded-full blur-[115px] animate-orb-3" />
        <div className="absolute bottom-10 right-1/3 w-[26rem] h-[26rem] bg-blue-600/35 rounded-full blur-[100px] animate-orb-1" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950/75 to-slate-950 opacity-95" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Header Navigation */}
        <Navbar
          currentUser={currentUser}
          allUsers={users}
          onSelectUser={handleSelectUser}
          notifications={notifications.filter((n) => n.userId === currentUser.id)}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
          onOpenArchitecture={() => setIsArchitectureOpen(true)}
          onOpenKafkaLog={() => setIsKafkaLogOpen(true)}
          onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content Workspace */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          {activeTab === 'MANAGER' && (
            <ManagerDashboard
              tasks={tasks}
              users={users}
              metrics={metrics}
              notifications={notifications}
              onOpenCreateTask={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onOpenAiTaskAssistant={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onReviewTask={(task) => {
                setReviewingTask(task);
                setIsReviewModalOpen(true);
              }}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'EMPLOYEE' && (
            <EmployeeDashboard
              currentUser={currentUser}
              tasks={tasks}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onOpenSubmitWorkModal={(task) => {
                setSubmittingTask(task);
                setIsSubmissionModalOpen(true);
              }}
              onOpenDiscussion={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 glass-panel-light backdrop-blur-xl py-6 text-center text-xs text-slate-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Employee Task Assignment System • Enterprise Microservices Architecture</span>
            </p>
            <p className="font-semibold text-slate-300">
              Author: <span className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">YARAMALA SHUBHAROOP AKUL</span>
            </p>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateOrUpdateTask}
        users={users}
        currentUser={currentUser}
        editingTask={editingTask}
      />

      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        onSubmitWork={handleSubmitWork}
        task={submittingTask}
      />

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewTask={handleReviewTask}
        task={reviewingTask}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <KafkaLogViewer
        isOpen={isKafkaLogOpen}
        onClose={() => setIsKafkaLogOpen(false)}
      />

      <SemgrepAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
      />

    </div>
  );
}
