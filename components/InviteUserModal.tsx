import React, { useState } from 'react';
import { User } from '../types';
import { XIcon, UserPlusIcon } from './icons';

interface InviteUserModalProps {
  onClose: () => void;
  // FIX: Removed non-existent 'forcePasswordChange' property from Omit type for clarity.
  onSave: (newUser: Omit<User, 'id' | 'avatar'>) => void;
  organizationId: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({ onClose, onSave, organizationId }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('Viewer');
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
        setError('All fields are required.');
        return;
    }
    
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.');
        return;
    }

    // FIX: Added missing 'status' property to resolve the TypeScript error.
    // When a new user is invited, their status should be 'Pending'.
    // FIX: Added missing 'organizationId' property to the new user object to satisfy the User type, which is crucial for the application's multi-tenancy.
    onSave({ name, email, password, role, status: 'Pending', organizationId });
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
                <div>
                    <label htmlFor="invite-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                    </label>
                    <input
                        id="invite-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email Address
                    </label>
                    <input
                        id="invite-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="invite-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Temporary Password
                    </label>
                    <input
                        id="invite-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Role
                    </label>
                    <select
                        id="invite-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as User['role'])}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="Viewer">Viewer</option>
                        <option value="Editor">Editor</option>
                        <option value="Admin">Admin</option>
                    </select>
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