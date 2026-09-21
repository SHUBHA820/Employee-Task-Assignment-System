import React, { useState } from 'react';
import { Task } from '../types';
import { X, CheckCircle2, AlertTriangle, ExternalLink, FileText, Send } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewTask: (taskId: string, decision: 'APPROVE' | 'REJECT', feedback: string) => void;
  task: Task | null;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onReviewTask,
  task,
}) => {
  if (!isOpen || !task) return null;

  const [feedback, setFeedback] = useState('');

  const handleDecision = (decision: 'APPROVE' | 'REJECT') => {
    onReviewTask(task.id, decision, feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-modal border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white">
        
        <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-white/10 flex items-center justify-between text-white backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold">Manager Review & Oversight</h3>
            <p className="text-xs text-slate-400">Submitted by: <strong className="text-indigo-300">{task.assignedToName}</strong></p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</p>
            <p className="text-xs text-slate-500">{task.description}</p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>Employee Completion Notes</span>
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic">
              {task.submissionNotes || 'No notes provided by employee.'}
            </p>

            {task.submissionLinks && task.submissionLinks.length > 0 && (
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-800/60">
                <p className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 mb-1">Attached Work Links:</p>
                <div className="space-y-1">
                  {task.submissionLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Manager Feedback & Guidance Note
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Excellent work on the Kafka subscriber. All tests pass!"
              className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => handleDecision('REJECT')}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600/10 text-rose-600 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-600 hover:text-white transition-all flex items-center space-x-1"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Request Revisions</span>
            </button>

            <button
              type="button"
              onClick={() => handleDecision('APPROVE')}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center space-x-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Complete Task</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
