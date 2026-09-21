export type UserRole = 'MANAGER' | 'EMPLOYEE' | 'ADMIN';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar: string;
  title: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedToEmail: string;
  createdById: string;
  createdByName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  submissionNotes?: string;
  submissionLinks?: string[];
  reviewFeedback?: string;
  category?: string;
  comments?: TaskComment[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_SUBMITTED' | 'TASK_REVIEWED' | 'SYSTEM';
}

export interface KafkaEvent {
  eventId: string;
  topic: 'task-assignments' | 'task-status-updates' | 'notification-pushes' | 'user-activity';
  partition: number;
  offset: number;
  key: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface EurekaServiceInstance {
  id: string;
  name: string;
  status: 'UP' | 'DOWN' | 'MAINTENANCE';
  host: string;
  port: number;
  database: string;
  dbType: string;
  uptime: string;
  lastHeartbeat: string;
  endpoints: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SystemMetrics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  submittedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  activeEmployees: number;
  kafkaEventsProcessed: number;
}
