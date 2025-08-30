
import React from 'react';
import { KeyIcon } from './icons';

interface SettingsProps {
  onOpenChangePassword: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onOpenChangePassword }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">
            Account Security
        </h2>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Password</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    It's a good idea to use a strong password that you're not using elsewhere.
                </p>
            </div>
            <button 
                onClick={onOpenChangePassword}
                className="flex items-center gap-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
            >
                <KeyIcon className="w-5 h-5"/>
                Change Password
            </button>
        </div>
      </div>
    </div>
  );
};