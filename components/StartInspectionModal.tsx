
import React, { useState, useMemo } from 'react';
import { Hotel, InspectionTemplate } from '../types';
import { XIcon } from './icons';

interface StartInspectionModalProps {
  hotels: Hotel[];
  templates: InspectionTemplate[];
  onClose: () => void;
  onStart: (hotelId: string, templateId: string, areaId: string) => void;
}

export const StartInspectionModal: React.FC<StartInspectionModalProps> = ({ hotels, templates, onClose, onStart }) => {
  const [selectedHotel, setSelectedHotel] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const availableAreas = useMemo(() => {
    if (!selectedHotel) return [];
    const hotel = hotels.find(h => h.id === selectedHotel);
    return hotel?.areas || [];
  }, [selectedHotel, hotels]);

  const handleHotelChange = (hotelId: string) => {
    setSelectedHotel(hotelId);
    setSelectedArea(''); // Reset area when hotel changes
  };

  const handleStart = () => {
    if (selectedHotel && selectedTemplate) {
      onStart(selectedHotel, selectedTemplate, selectedArea);
    }
  };

  const isStartDisabled = !selectedHotel || !selectedTemplate || (availableAreas.length > 0 && !selectedArea);

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
                onChange={(e) => handleHotelChange(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              >
                <option value="" disabled>Choose a property...</option>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="area-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Area/Outlet</label>
              <select
                id="area-select"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
                disabled={!selectedHotel || availableAreas.length === 0}
              >
                <option value="" disabled>
                    { !selectedHotel ? "Select a hotel first" : availableAreas.length > 0 ? "Choose an area..." : "No areas defined for this hotel"}
                </option>
                {availableAreas.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
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
            disabled={isStartDisabled}
            className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md disabled:bg-primary-400 disabled:cursor-not-allowed"
          >
            Start Inspection
          </button>
        </div>
      </div>
    </div>
  );
};