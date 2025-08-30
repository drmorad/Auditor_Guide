
import React from 'react';
import { User, View } from '../types';
import { ShieldCheckIcon } from './icons';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const colors = {
    Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Editor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>{role}</span>;
};

interface TeamManagerProps {
  currentUser: User;
  users: User[];
  setView: (view: View) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ currentUser, users, setView }) => {
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Team Access</h1>
          {currentUser.role === 'Admin' && (
            <button 
              onClick={() => setView(View.AdminPanel)}
              className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
              <ShieldCheckIcon className="w-5 h-5" />
              Manage Users
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.filter(u => u.status === 'Active').map((member) => (
              <li key={member.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                  <RoleBadge role={member.role} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
