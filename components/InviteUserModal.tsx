import React, { useState } from 'react';
import { User } from '../types';
import { XIcon, UserPlusIcon, MagicIcon } from './icons';
import { suggestUserRole } from '../services/geminiService';

interface InviteUserModalProps {
  onClose: () => void;
  onSave: (newUser: Omit<User, 'id' | 'avatar'>) => void;
  organizationId: string;
}

const AISuggestionBox: React.FC<{ reasoning: string; onDismiss: () => void }> = ({ reasoning, onDismiss }) => (
    <div className="bg-primary-50 dark:bg-primary-900/40 p-3 rounded-lg border border-primary-200 dark:border-primary-800/60 animate-fade-in">
        <div className="flex justify-between items-start">
            <div className="flex gap-2">
                <MagicIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0"/>
                <div>
                    <h4 className="text-sm font-semibold text-primary-800 dark:text-primary-300">AI Suggestion</h4>
                    <p className="text-xs text-primary-700 dark:text-primary-400 mt-1">{reasoning}</p>
                </div>
            </div>
            <button onClick={onDismiss} className="text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 p-1 -mt-1 -mr-1 rounded-full">
                <XIcon className="w-3 h-3"/>
            </button>
        </div>
    </div>
);


export const InviteUserModal: React.FC<InviteUserModalProps> = ({ onClose, onSave, organizationId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('Viewer');
  const [error, setError] = useState('');
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleSuggest = async () => {
      if (!jobTitle.trim()) {
          setError('Please enter a job title to get a suggestion.');
          return;
      }
      setIsSuggesting(true);
      setError('');
      setSuggestion(null);
      try {
          const result = await suggestUserRole(jobTitle);
          setRole(result.role);
          setSuggestion(result.reasoning);
      } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not get suggestion.');
      } finally {
          setIsSuggesting(false);
      }
  };


  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
        setError('Name, email, and password are required.');
        return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    onSave({ name, email, password, role, status: 'Pending', organizationId, jobTitle: jobTitle.trim() });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <form 
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <button 
              type="button"
              onClick={onClose} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
              aria-label="Close invite modal"
            >
              <XIcon className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <UserPlusIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Invite New Member</h2>
            </div>
            
            <div className="space-y-4 mt-6">
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="invite-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Full Name
                        </label>
                        <input
                            id="invite-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Address
                        </label>
                        <input
                            id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                            required
                        />
                    </div>
                </div>
                 <div>
                    <label htmlFor="job-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Job Title (Optional)
                    </label>
                    <input
                        id="job-title" type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g., Executive Chef, Night Auditor"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                    />
                </div>
                <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Role
                    </label>
                    <div className="flex items-center gap-2">
                        <select
                            id="invite-role" value={role} onChange={(e) => setRole(e.target.value as User['role'])}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        >
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <button 
                            type="button" 
                            onClick={handleSuggest} 
                            disabled={isSuggesting || !jobTitle}
                            className="flex items-center justify-center gap-2 flex-shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Suggest role with AI"
                        >
                            {isSuggesting ? (
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <MagicIcon className="w-5 h-5 text-primary-500"/>
                            )}
                            Suggest
                        </button>
                    </div>
                    {suggestion && <div className="mt-2"><AISuggestionBox reasoning={suggestion} onDismiss={() => setSuggestion(null)} /></div>}
                </div>
                 <div>
                    <label htmlFor="invite-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Temporary Password
                    </label>
                    <input
                        id="invite-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        required
                    />
                </div>
            </div>
        </div>
         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button 
              type="button"
              onClick={onClose} 
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
             <button 
              type="submit"
              className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              Send Invite
            </button>
        </div>
      </form>
    </div>
  );
};