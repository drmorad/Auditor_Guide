
import React, { useState } from 'react';
import { Hotel, InspectionTemplate } from '../types';
import { XIcon } from './icons';

interface StartInspectionModalProps {
  hotels: Hotel[];
  templates: InspectionTemplate[];
  onClose: () => void;
  onStart: (hotelId: string, templateId: string) => void;
}

export const StartInspectionModal: React.FC<StartInspectionModalProps> = ({ hotels, templates, onClose, onStart }) => {
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleStart = () => {
    if (selectedHotel && selectedTemplate) {
      onStart(selectedHotel, selectedTemplate);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full">
            <XIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Start New Inspection</h2>
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="hotel-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Hotel/Resort</label>
              <select
                id="hotel-select"
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              >
                <option value="" disabled>Choose a property...</option>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="template-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Inspection Template</label>
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              >
                <option value="" disabled>Choose a template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!selectedHotel || !selectedTemplate}
            className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md disabled:bg-primary-400 disabled:cursor-not-allowed"
          >
            Start Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
