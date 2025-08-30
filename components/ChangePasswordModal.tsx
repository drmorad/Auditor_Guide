
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { XIcon, KeyIcon } from './icons';

interface ChangePasswordModalProps {
  user: User;
  onClose: () => void;
  onSave: (newPassword: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose, onSave }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (!newPassword) return 0;
    if (newPassword.length > 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  }, [newPassword]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (currentPassword !== user.password) {
        setError('Current password does not match.');
        return;
    }
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    onSave(newPassword);
  };

  const StrengthBar: React.FC<{ score: number }> = ({ score }) => {
    const colors = ['bg-slate-200', 'bg-red-500', 'bg-yellow-500', 'bg-yellow-500', 'bg-green-500'];
    const labels = ['Too short', 'Weak', 'Medium', 'Medium', 'Strong'];
    return (
        <div className="flex items-center gap-2">
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${colors[score]}`}
                    style={{ width: `${score * 25}%` }}
                ></div>
            </div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
                {newPassword && labels[score]}
            </span>
        </div>
    );
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
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
            <button 
                type="button"
                onClick={onClose} 
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
                aria-label="Close change password modal"
            >
                <XIcon className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <KeyIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                       Change Password
                    </h2>
                </div>
            </div>
            
            <div className="space-y-4 mt-6">
                {error && <p className="text-sm text-red-500">{error}</p>}
                
                <div>
                    <label htmlFor="current-password"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Current Password
                    </label>
                    <input
                        id="current-password" type="password"
                        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        required
                    />
                </div>
                
                <div>
                    <label htmlFor="new-password"
                           className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        New Password
                    </label>
                    <input
                        id="new-password" type="password"
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        required
                    />
                    <div className="mt-2">
                        <StrengthBar score={passwordStrength} />
                    </div>
                </div>
                 <div>
                    <label htmlFor="confirm-password"
                           className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Confirm New Password
                    </label>
                    <input
                        id="confirm-password" type="password"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                        required
                    />
                </div>
            </div>
        </div>
         <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button 
                type="button" onClick={onClose} 
                className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg"
            >
                Cancel
            </button>
            <button 
              type="submit"
              className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md"
            >
                Save Changes
            </button>
        </div>
      </form>
    </div>
  );
};