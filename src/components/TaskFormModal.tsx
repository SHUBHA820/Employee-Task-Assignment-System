import React, { useState, useEffect } from 'react';
import { Task, User, TaskPriority, TaskComment } from '../types';
import {
  X,
  Sparkles,
  Plus,
  Check,
  MessageSquare,
  Send,
  Clock,
  User as UserIcon,
  ShieldCheck,
  Zap,
  CornerDownLeft,
  Tag,
  AlertCircle
} from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Partial<Task>) => void;
  users: User[];
  currentUser: User;
  editingTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
  currentUser,
  editingTask,
}) => {
  if (!isOpen) return null;

  const employees = users.filter((u) => u.role === 'EMPLOYEE' || u.role === 'MANAGER');

  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [assignedToId, setAssignedToId] = useState(editingTask?.assignedToId || (employees[0]?.id || ''));
  const [priority, setPriority] = useState<TaskPriority>(editingTask?.priority || 'HIGH');
  const [dueDate, setDueDate] = useState(
    editingTask?.dueDate
      ? new Date(editingTask.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [category, setCategory] = useState(editingTask?.category || 'Software Engineering');

  // Real-time Comments & Discussion State
  const [comments, setComments] = useState<TaskComment[]>(editingTask?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Sync comments when editingTask updates
  useEffect(() => {
    if (editingTask?.comments) {
      setComments(editingTask.comments);
    }
  }, [editingTask]);

  // AI Assistance State
  const [aiGoalInput, setAiGoalInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedToId) return;

    onSubmit({
      id: editingTask?.id,
      title,
      description,
      assignedToId,
      priority,
      dueDate: new Date(dueDate).toISOString(),
      createdById: currentUser.id,
      createdByName: currentUser.name,
      category,
      comments,
    });

    onClose();
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim()) return;

    const textToPost = newCommentText.trim();
    setIsPostingComment(true);

    const tempComment: TaskComment = {
      id: `cmt-${Date.now()}`,
      taskId: editingTask?.id || 'new-task',
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      authorRole: currentUser.role,
      text: textToPost,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    setComments((prev) => [...prev, tempComment]);
    setNewCommentText('');

    // If editing existing task, persist via API
    if (editingTask?.id) {
      try {
        const res = await fetch(`/api/tasks/${editingTask.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToPost,
            authorId: currentUser.id,
          }),
        });
        const data = await res.json();
        if (data.success && data.comment) {
          // Update temp ID with server ID
          setComments((prev) =>
            prev.map((c) => (c.id === tempComment.id ? data.comment : c))
          );
        }
      } catch (err) {
        console.error('Error posting comment:', err);
      }
    }
    setIsPostingComment(false);
  };

  const handleGenerateWithAi = async () => {
    if (!aiGoalInput.trim()) return;
    setIsAiGenerating(true);
    setAiSuccessMsg(false);

    try {
      const res = await fetch('/api/ai/suggest-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: aiGoalInput, role: 'Software Engineer' }),
      });
      const data = await res.json();

      if (data.success && data.suggestion) {
        setTitle(data.suggestion.title);
        setDescription(
          `${data.suggestion.description}\n\nSuggested Sub-Tasks:\n` +
            (data.suggestion.suggestedSubtasks || []).map((s: string) => `- [ ] ${s}`).join('\n')
        );
        if (data.suggestion.suggestedPriority) {
          setPriority(data.suggestion.suggestedPriority as TaskPriority);
        }
        if (data.suggestion.category) {
          setCategory(data.suggestion.category);
        }
        setAiSuccessMsg(true);
        setTimeout(() => setAiSuccessMsg(false), 3000);
      }
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setIsAiGenerating(false);
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

  const presetNoteChips = [
    '🔍 Need clarification on requirement',
    '✅ Code review PR attached',
    '⚡ In Progress - Active development',
    '⚠️ Dependency blocked by upstream service',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-modal border border-white/20 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-white/10 flex items-center justify-between text-white backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center space-x-2">
                <span>{editingTask ? `Edit Task (${editingTask.id})` : 'Create & Assign Task'}</span>
                {editingTask && (
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-400/30">
                    {comments.length} Discussion Notes
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Main Task Service Endpoint: <code className="text-indigo-400">POST /api/tasks</code>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* AI Assistance Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-500/30">
            <div className="flex items-center space-x-2 text-purple-300 text-xs font-bold mb-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Gemini AI Task Generator</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2">
              Type a high-level goal and Gemini will auto-write task title, detailed technical steps, and priority.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiGoalInput}
                onChange={(e) => setAiGoalInput(e.target.value)}
                placeholder="e.g. Implement Kafka retry mechanism for failed email notifications"
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-purple-500/30 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={isAiGenerating || !aiGoalInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAiGenerating ? 'Generating...' : 'Auto-Fill'}</span>
              </button>
            </div>

            {aiSuccessMsg && (
              <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Task fields generated successfully!</span>
              </p>
            )}
          </div>

          <form id="task-form" onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Integrate Kafka Consumer in Notification Service"
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assign To Employee *
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900/90 border border-white/10 text-white"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.title} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900/90 border border-white/10 text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900/90 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Microservices, DevOps"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900/90 border border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Task Description & Technical Deliverables
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail technical requirements, expected deliverables, API contracts, or repository PR references..."
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-900/90 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
              />
            </div>
          </form>

          {/* Real-time Collaboration Comments Section */}
          <div className="border-t border-white/15 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Task Discussion & Collaboration Notes</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-400/30">
                      {comments.length}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Real-time comment stream between managers and assigned employees.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-400/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active Channel</span>
              </div>
            </div>

            {/* Quick Preset Note Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">Quick Notes:</span>
              {presetNoteChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewCommentText((prev) => (prev ? `${prev} ${chip}` : chip))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar bg-slate-950/40 p-3.5 rounded-xl border border-white/10">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <MessageSquare className="w-6 h-6 text-slate-500 mx-auto mb-1 opacity-40" />
                  <p className="text-xs font-medium">No discussion notes on this task yet.</p>
                  <p className="text-[10px] text-slate-500">Leave a note below to start the conversation with your team.</p>
                </div>
              ) : (
                comments.map((comment) => {
                  const isManager = comment.authorRole === 'MANAGER';
                  const isCurrentUser = comment.authorId === currentUser.id;

                  return (
                    <div
                      key={comment.id}
                      className={`flex items-start space-x-3 p-3 rounded-xl border transition-all ${
                        isCurrentUser
                          ? 'bg-indigo-950/40 border-indigo-500/30 ml-4'
                          : 'bg-slate-900/60 border-white/10 mr-4'
                      }`}
                    >
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-white/20 mt-0.5 flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">
                              {comment.authorName}
                            </span>

                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                isManager
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                              }`}
                            >
                              {comment.authorRole}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{formatTimeAgo(comment.timestamp)}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post Comment Input Bar */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={`Comment as ${currentUser.name} (${currentUser.role})...`}
                  className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-900/90 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddComment()}
                  disabled={!newCommentText.trim() || isPostingComment}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 border border-white/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isPostingComment ? 'Posting...' : 'Post Note'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Press Enter or click Post Note to send</span>
                <span className="text-cyan-300 font-mono">Real-time Kafka WebSocket Sync Enabled</span>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-white/10 flex justify-between items-center backdrop-blur-md">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Posting as <strong className="text-slate-200">{currentUser.name}</strong></span>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-form"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg transition-all border border-white/20"
            >
              {editingTask ? 'Save Task Changes' : 'Publish Task & Trigger Kafka Event'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

