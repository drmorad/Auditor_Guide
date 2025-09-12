
import React from 'react';

export const Scheduler: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Scheduler</h1>
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <p className="text-center text-slate-500 dark:text-slate-400">
          Inspection scheduling functionality will be available here.
        </p>
         <div className="mt-8 p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
          <p className="text-center text-lg font-semibold text-slate-700 dark:text-slate-300">
            Coming Soon
          </p>
          <p className="text-center text-slate-500 dark:text-slate-400 mt-2">
            Plan and assign upcoming audits and inspections on a shared calendar.
          </p>
        </div>
      </div>
    </div>
  );
};
