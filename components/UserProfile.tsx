import React, { useMemo } from 'react';
import { User, Hotel, AuditLogEntry } from '../types';
import { BuildingOfficeIcon } from './icons';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const colors = {
    Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Editor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>{role}</span>;
};

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");

    return Math.floor(seconds) + " seconds ago";
}

interface UserProfileProps {
  user: User;
  allHotels: Hotel[];
  auditLogs: AuditLogEntry[];
  onBack: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, allHotels, auditLogs, onBack }) => {

  const assignedHotels = useMemo(() => {
    if (user.role === 'Admin') return allHotels; // Admins have access to all
    return allHotels.filter(hotel => user.hotelIds?.includes(hotel.id));
  }, [user, allHotels]);
  
  const userActivity = useMemo(() => {
      return auditLogs.filter(log => log.user === user.name).slice(0, 15);
  }, [auditLogs, user.name]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-slate-500 hover:text-primary-500 transition-colors p-1 rounded-full -ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">User Profile</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-700 shadow-md" />
                <div className="flex-grow">
                    <div className="flex items-center gap-3">
                       <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                       <RoleBadge role={user.role} />
                    </div>
                    <p className="text-md text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
                </div>
            </div>
        </div>

        {/* Assigned Hotels */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
             <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Assigned Hotels</h3>
             <div className="space-y-3">
                {assignedHotels.length > 0 ? (
                    assignedHotels.map(hotel => (
                        <div key={hotel.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center gap-3">
                           <BuildingOfficeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                           <span className="font-medium text-slate-800 dark:text-slate-200">{hotel.name}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">This user is not assigned to any specific hotels.</p>
                )}
             </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
             <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
             <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {userActivity.length > 0 ? (
                    userActivity.map(log => (
                        <li key={log.id} className="py-3">
                            <p className="font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{log.details}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo(log.timestamp)}</p>
                        </li>
                    ))
                ) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No recent activity found for this user.</p>
                )}
             </ul>
        </div>
    </div>
  );
};
