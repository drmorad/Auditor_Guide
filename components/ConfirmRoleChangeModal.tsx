import React from 'react';
import { User } from '../types';
import { XIcon, ExclamationTriangleIcon } from './icons';

interface ConfirmRoleChangeModalProps {
  user: User;
  newRole: User['role'];
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmRoleChangeModal: React.FC<ConfirmRoleChangeModalProps> = ({ user, newRole, onClose, onConfirm }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-role-change-title"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-grow">
              <h2 id="confirm-role-change-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Confirm Role Change
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to change <span className="font-semibold">{user.name}</span>'s role to <span className="font-semibold">{newRole}</span>?
              </p>
            </div>
            <button
                onClick={onClose}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
                aria-label="Close confirmation"
            >
                <XIcon className="w-5 h-5" />
            </button>
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
            type="button"
            onClick={onConfirm}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
};
