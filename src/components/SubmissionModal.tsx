import React, { useState } from 'react';
import { Task } from '../types';
import { X, Upload, Link, FileText, CheckCircle } from 'lucide-react';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitWork: (taskId: string, notes: string, links: string[]) => void;
  task: Task | null;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  onSubmitWork,
  task,
}) => {
  if (!isOpen || !task) return null;

  const [notes, setNotes] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [linksList, setLinksList] = useState<string[]>([]);

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    setLinksList([...linksList, linkInput.trim()]);
    setLinkInput('');
  };

  const handleRemoveLink = (index: number) => {
    setLinksList(linksList.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitWork(task.id, notes, linksList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-modal border border-white/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-white">
        
        <div className="p-4 sm:p-6 bg-slate-950/60 border-b border-white/10 flex items-center justify-between text-white backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold">Submit Completed Work</h3>
              <p className="text-xs text-slate-400">Task: <strong className="text-indigo-300">{task.id}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">{task.title}</p>
            <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Completion Notes & Technical Summary *
            </label>
            <textarea
              required
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what was built, unit tests executed, microservice API endpoints updated, or deployment notes..."
              className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deliverable Links & Pull Requests
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://github.com/org/repo/pull/123 or test dashboard URL"
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
              >
                Add Link
              </button>
            </div>

            {linksList.length > 0 && (
              <div className="mt-2 space-y-1">
                {linksList.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                    <span className="truncate max-w-[280px]">{link}</span>
                    <button type="button" onClick={() => handleRemoveLink(idx)} className="text-rose-500 font-bold ml-2">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center space-x-1"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Submit for Manager Review</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
