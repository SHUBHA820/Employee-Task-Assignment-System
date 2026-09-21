import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { User, Task, NotificationItem, KafkaEvent, TaskStatus, TaskPriority } from './types';
import { initialUsers, initialTasks, initialNotifications, initialKafkaEvents, getEurekaRegistry, computeMetrics } from './mockData';

const app = express();
app.use(express.json());

// In-Memory state for the microservices simulation
let users: User[] = [...initialUsers];
let tasks: Task[] = [...initialTasks];
let notifications: NotificationItem[] = [...initialNotifications];
let kafkaEvents: KafkaEvent[] = [...initialKafkaEvents];

function publishKafkaEvent(topic: KafkaEvent['topic'], key: string, payload: Record<string, any>) {
  const newEvt: KafkaEvent = {
    eventId: `evt-kfk-${Date.now().toString().slice(-6)}`,
    topic,
    partition: Math.floor(Math.random() * 3),
    offset: kafkaEvents.length + 1000,
    key,
    payload,
    timestamp: new Date().toISOString(),
  };
  kafkaEvents.unshift(newEvt);
  if (kafkaEvents.length > 50) kafkaEvents.pop();
  return newEvt;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Router to handle all API endpoints
const router = express.Router();

// 1. Auth & Users API
router.get('/auth/users', (req, res) => {
  res.json({ success: true, users });
});

router.post('/auth/login', (req, res) => {
  const { userId } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const mockJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  ).toString('base64')}.signature_hash_verify`;

  res.json({
    success: true,
    user,
    token: mockJwtToken,
  });
});

router.get('/users', (req, res) => {
  res.json({ success: true, users });
});

router.post('/users', (req, res) => {
  const { name, email, role, department, title } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const newUser: User = {
    id: `user-${role.toLowerCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
    name,
    email,
    role: role as any,
    department: department || 'Engineering',
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
    title: title || 'Team Member',
    status: 'ACTIVE',
  };

  users.push(newUser);

  publishKafkaEvent('user-activity', newUser.id, {
    action: 'USER_CREATED',
    user: newUser,
  });

  res.status(201).json({ success: true, user: newUser });
});

router.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  users[index] = { ...users[index], ...req.body };
  res.json({ success: true, user: users[index] });
});

router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  users = users.filter((u) => u.id !== id);
  res.json({ success: true, message: 'User removed successfully' });
});

// 2. Task Management API
router.get('/tasks', (req, res) => {
  const { assignedToId, status, priority, search } = req.query;
  let filtered = [...tasks];

  if (assignedToId) {
    filtered = filtered.filter((t) => t.assignedToId === assignedToId);
  }
  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (priority) {
    filtered = filtered.filter((t) => t.priority === priority);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignedToName.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, tasks: filtered });
});

router.post('/tasks', (req, res) => {
  const { title, description, assignedToId, priority, dueDate, createdById, category } = req.body;
  if (!title || !assignedToId || !priority) {
    return res.status(400).json({ success: false, message: 'Title, assignee, and priority are required' });
  }

  const assignee = users.find((u) => u.id === assignedToId);
  const creator = users.find((u) => u.id === createdById) || users[0];

  if (!assignee) {
    return res.status(404).json({ success: false, message: 'Assignee user not found' });
  }

  const newTask: Task = {
    id: `TSK-${Math.floor(1000 + Math.random() * 9000)}`,
    title,
    description: description || '',
    assignedToId: assignee.id,
    assignedToName: assignee.name,
    assignedToEmail: assignee.email,
    createdById: creator.id,
    createdByName: creator.name,
    priority: priority as TaskPriority,
    status: 'PENDING',
    dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: category || 'General Operations',
  };

  tasks.unshift(newTask);

  publishKafkaEvent('task-assignments', newTask.id, {
    taskId: newTask.id,
    taskTitle: newTask.title,
    assignedToId: assignee.id,
    assignedToName: assignee.name,
    priority: newTask.priority,
    dueDate: newTask.dueDate,
    assignedBy: creator.name,
  });

  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    userId: assignee.id,
    title: `New Task Assigned: ${newTask.title}`,
    message: `Assigned by ${creator.name}. Priority: ${newTask.priority}`,
    timestamp: new Date().toISOString(),
    read: false,
    taskId: newTask.id,
    type: 'TASK_ASSIGNED',
  };
  notifications.unshift(newNotif);

  res.status(201).json({ success: true, task: newTask, notification: newNotif });
});

router.put('/tasks/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, updatedByUserId } = req.body;

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const oldStatus = tasks[taskIndex].status;
  tasks[taskIndex].status = status as TaskStatus;
  tasks[taskIndex].updatedAt = new Date().toISOString();

  publishKafkaEvent('task-status-updates', id, {
    taskId: id,
    taskTitle: tasks[taskIndex].title,
    oldStatus,
    newStatus: status,
    updatedBy: updatedByUserId,
  });

  res.json({ success: true, task: tasks[taskIndex] });
});

router.post('/tasks/:id/submit', (req, res) => {
  const { id } = req.params;
  const { submissionNotes, submissionLinks } = req.body;

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  tasks[taskIndex].status = 'SUBMITTED';
  tasks[taskIndex].submissionNotes = submissionNotes || '';
  tasks[taskIndex].submissionLinks = submissionLinks || [];
  tasks[taskIndex].updatedAt = new Date().toISOString();

  publishKafkaEvent('task-status-updates', id, {
    taskId: id,
    action: 'WORK_SUBMITTED',
    notes: submissionNotes,
    links: submissionLinks,
  });

  const managerNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    userId: tasks[taskIndex].createdById,
    title: `Task Submitted: ${tasks[taskIndex].title}`,
    message: `${tasks[taskIndex].assignedToName} submitted completed work for review.`,
    timestamp: new Date().toISOString(),
    read: false,
    taskId: id,
    type: 'TASK_SUBMITTED',
  };
  notifications.unshift(managerNotif);

  res.json({ success: true, task: tasks[taskIndex], notification: managerNotif });
});

router.post('/tasks/:id/review', (req, res) => {
  const { id } = req.params;
  const { decision, reviewFeedback } = req.body;

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const newStatus: TaskStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  tasks[taskIndex].status = newStatus;
  tasks[taskIndex].reviewFeedback = reviewFeedback || '';
  tasks[taskIndex].updatedAt = new Date().toISOString();

  publishKafkaEvent('task-status-updates', id, {
    taskId: id,
    action: decision === 'APPROVE' ? 'TASK_APPROVED' : 'TASK_REJECTED',
    feedback: reviewFeedback,
  });

  const employeeNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    userId: tasks[taskIndex].assignedToId,
    title: decision === 'APPROVE' ? `Task Approved! 🎉` : `Task Revision Requested ⚠️`,
    message: `Manager review for "${tasks[taskIndex].title}": ${reviewFeedback || (decision === 'APPROVE' ? 'Great work!' : 'Please make updates.')}`,
    timestamp: new Date().toISOString(),
    read: false,
    taskId: id,
    type: 'TASK_REVIEWED',
  };
  notifications.unshift(employeeNotif);

  res.json({ success: true, task: tasks[taskIndex], notification: employeeNotif });
});

router.put('/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const { title, description, assignedToId, priority, dueDate, category, comments } = req.body;
  if (title) tasks[taskIndex].title = title;
  if (description !== undefined) tasks[taskIndex].description = description;
  if (priority) tasks[taskIndex].priority = priority;
  if (dueDate) tasks[taskIndex].dueDate = dueDate;
  if (category) tasks[taskIndex].category = category;
  if (comments) tasks[taskIndex].comments = comments;

  if (assignedToId && assignedToId !== tasks[taskIndex].assignedToId) {
    const newAssignee = users.find((u) => u.id === assignedToId);
    if (newAssignee) {
      tasks[taskIndex].assignedToId = newAssignee.id;
      tasks[taskIndex].assignedToName = newAssignee.name;
      tasks[taskIndex].assignedToEmail = newAssignee.email;
    }
  }

  tasks[taskIndex].updatedAt = new Date().toISOString();

  publishKafkaEvent('task-status-updates', id, {
    taskId: id,
    action: 'TASK_UPDATED',
    title: tasks[taskIndex].title,
  });

  res.json({ success: true, task: tasks[taskIndex] });
});

router.post('/tasks/:id/comments', (req, res) => {
  const { id } = req.params;
  const { text, authorId } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Comment text is required' });
  }

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const author = users.find((u) => u.id === authorId) || users[0];

  const newComment = {
    id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    taskId: id,
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorRole: author.role,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  if (!tasks[taskIndex].comments) {
    tasks[taskIndex].comments = [];
  }

  tasks[taskIndex].comments.push(newComment);
  tasks[taskIndex].updatedAt = new Date().toISOString();

  publishKafkaEvent('user-activity', id, {
    taskId: id,
    action: 'COMMENT_ADDED',
    commentId: newComment.id,
    authorName: author.name,
    textSnippet: newComment.text.slice(0, 60),
  });

  const recipientId = author.id === tasks[taskIndex].assignedToId ? tasks[taskIndex].createdById : tasks[taskIndex].assignedToId;
  const commentNotif: NotificationItem = {
    id: `notif-${Date.now()}`,
    userId: recipientId,
    title: `New Task Discussion Note on ${tasks[taskIndex].id}`,
    message: `${author.name}: "${newComment.text.slice(0, 70)}${newComment.text.length > 70 ? '...' : ''}"`,
    timestamp: new Date().toISOString(),
    read: false,
    taskId: id,
    type: 'TASK_UPDATED',
  };
  notifications.unshift(commentNotif);

  res.status(201).json({
    success: true,
    comment: newComment,
    task: tasks[taskIndex],
    notification: commentNotif,
  });
});

router.delete('/tasks/:id', (req, res) => {
  const { id } = req.params;
  tasks = tasks.filter((t) => t.id !== id);
  res.json({ success: true, message: 'Task deleted successfully' });
});

// 3. Notifications API
router.get('/notifications', (req, res) => {
  const { userId } = req.query;
  const userNotifs = userId ? notifications.filter((n) => n.userId === userId) : notifications;
  res.json({ success: true, notifications: userNotifs });
});

router.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const index = notifications.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
  }
  res.json({ success: true });
});

router.put('/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  notifications.forEach((n) => {
    if (!userId || n.userId === userId) {
      n.read = true;
    }
  });
  res.json({ success: true });
});

// 4. Kafka Broker Stream API
router.get('/kafka/events', (req, res) => {
  res.json({ success: true, events: kafkaEvents });
});

router.post('/kafka/publish', (req, res) => {
  const { topic, key, payload } = req.body;
  const evt = publishKafkaEvent(topic || 'task-assignments', key || 'TEST-KEY', payload || { test: true });
  res.json({ success: true, event: evt });
});

// 5. Eureka Microservices Health & Registry API
router.get('/eureka/services', (req, res) => {
  res.json({
    success: true,
    systemAuthor: 'YARAMALA SHUBHAROOP AKUL',
    architecture: 'Spring Boot Microservices + Eureka Discovery + PostgreSQL per service + Kafka Broker',
    services: getEurekaRegistry(),
  });
});

// 6. Metrics & Analytics API
router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: computeMetrics(tasks, users, kafkaEvents.length),
  });
});

// 7. Gemini AI Endpoints
router.post('/ai/suggest-task', async (req, res) => {
  const { goal, role } = req.body;
  if (!goal) {
    return res.status(400).json({ success: false, message: 'Goal description is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      success: true,
      suggestion: {
        title: `Implement ${goal.slice(0, 30)}...`,
        description: `Detailed task execution plan for: ${goal}. Ensure all integration tests pass and document service endpoints.`,
        suggestedPriority: 'HIGH',
        category: 'Software Engineering',
        suggestedSubtasks: [
          'Design interface contract and DTOs',
          'Write unit tests for service layer',
          'Deploy changes to staging environment',
        ],
      },
    });
  }

  try {
    const prompt = `You are an expert Engineering Project Manager. Based on the task goal below, generate a structured JSON object for a task assignment.
Goal: "${goal}"
Role Target: "${role || 'Software Engineer'}"

Return ONLY valid JSON with no markdown block markup using this exact structure:
{
  "title": "Concise Task Title",
  "description": "Clear step-by-step technical description",
  "suggestedPriority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "category": "Category name",
  "suggestedSubtasks": ["step 1", "step 2", "step 3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, suggestion: parsed });
    }

    res.json({
      success: true,
      suggestion: {
        title: goal,
        description: text,
        suggestedPriority: 'HIGH',
        category: 'Engineering Operations',
        suggestedSubtasks: ['Review architecture requirements', 'Execute task checklist'],
      },
    });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate task suggestion' });
  }
});

// Mount router under /api, /.netlify/functions/api, and / for full flexibility
app.use('/api', router);
app.use('/.netlify/functions/api', router);
app.use('/', router);

export { app };
export default app;
