
import React from 'react';
import { AuditLogEntry } from '../types';
import { DocumentIcon, MagicIcon, TeamIcon, SettingsIcon } from './icons';

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");

    return Math.floor(seconds) + " seconds ago";
}

const LogIcon: React.FC<{ action: string }> = ({ action }) => {
    const iconProps = { className: "w-5 h-5 text-slate-500 dark:text-slate-400" };
    switch(action) {
        case 'Document Uploaded':
            return <DocumentIcon {...iconProps} />;
        case 'SOP Generated':
            return <MagicIcon {...iconProps} />;
        case 'Role Changed':
        case 'Team Member Invited':
            return <TeamIcon {...iconProps} />;
        default:
            return <SettingsIcon {...iconProps} />;
    }
}

export const AuditLogView: React.FC<{ auditLogs: AuditLogEntry[] }> = ({ auditLogs }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Audit Log</h1>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
        <div className="flow-root">
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {auditLogs.length > 0 ? auditLogs.map(log => (
              <li key={log.id} className="p-4 sm:p-6">
                <div className="relative flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                            <LogIcon action={log.action} />
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{log.details}</p>
                        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500 dark:text-slate-500">
                            <p>{log.user}</p>
                            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                            <p><time dateTime={log.timestamp.toISOString()}>{timeAgo(log.timestamp)}</time></p>
                        </div>
                    </div>
                </div>
              </li>
            )) : (
                <li className="p-6 text-center text-slate-500 dark:text-slate-400">No audit events recorded yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
