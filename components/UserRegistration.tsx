
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { MailIcon } from './icons';

interface UserRegistrationProps {
  users: User[];
  onSendInvite: (name: string, email: string, role: User['role']) => void;
}

export const UserRegistration: React.FC<UserRegistrationProps> = ({ users, onSendInvite }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<User['role']>('Viewer');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const pendingUsers = useMemo(() => {
    return users.filter(u => u.status === 'Pending');
  }, [users]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        setError('A user with this email already exists.');
        return;
    }

    onSendInvite(name.trim(), email.trim(), role);
    setSuccessMessage(`Invite sent successfully to ${email.trim()}!`);

    // Reset form
    setName('');
    setEmail('');
    setRole('Viewer');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Panel: User Management</h1>
        </div>

        {/* Invite Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <MailIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Send New Invitation</h2>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                    </div>
                     <div>
                        <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                    <select id="reg-role" value={role} onChange={e => setRole(e.target.value as User['role'])} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                        <option value="Viewer">Viewer</option>
                        <option value="Editor">Editor</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                 <div className="flex justify-end">
                    <button type="submit" className="bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
                        Send Invite
                    </button>
                </div>
            </form>
        </div>
        
        {/* Pending Invitations List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
             <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                Pending Invitations
             </h2>
             <div className="space-y-3">
                {pendingUsers.length > 0 ? pendingUsers.map(user => (
                    <div key={user.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email} - <span className="font-medium">{user.role}</span></p>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Verification Code: <span className="font-bold tracking-widest text-primary-600 dark:text-primary-400">{user.verificationCode}</span>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No pending invitations.</p>
                )}
             </div>
        </div>

    </div>
  );
};
