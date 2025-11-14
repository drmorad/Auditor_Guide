import React, { useState } from 'react';
import { Hotel, Area } from '../types';
import { XIcon, TrashIcon, PlusCircleIcon } from './icons';

interface ManageAreasModalProps {
  hotel: Hotel;
  onClose: () => void;
  onSave: (updatedHotel: Hotel) => void;
}

const SUGGESTED_AREA_TYPES: string[] = [
    'Outlet',
    'Bar',
    'Pool',
    'Public Area',
    'Back of House',
    'Kitchen',
    'Restaurant',
    'Lobby',
    'Spa',
    'Gym',
    'Conference Room',
    'Ballroom',
    'Receiving',
    'Storage',
    'Staff Area',
    'Room Service',
    'Engineering',
    'Laundry',
    'Guest Room',
    'Exterior',
    'Parking',
    'Business Center',
    'Gift Shop',
    'Rooftop',
    'Terrace',
    'Kids Club',
];


export const ManageAreasModal: React.FC<ManageAreasModalProps> = ({ hotel, onClose, onSave }) => {
  const [areas, setAreas] = useState<Area[]>(hotel.areas || []);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaType, setNewAreaType] = useState<string>('');

  const handleAddArea = () => {
    if (!newAreaName.trim() || !newAreaType.trim()) return;
    const newArea: Area = {
      id: `area-${Date.now()}`,
      name: newAreaName.trim(),
      type: newAreaType.trim(),
    };
    setAreas([...areas, newArea]);
    setNewAreaName('');
    setNewAreaType('');
  };

  const handleDeleteArea = (areaId: string) => {
    setAreas(areas.filter(a => a.id !== areaId));
  };

  const handleSave = () => {
    onSave({ ...hotel, areas });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      onClick={onClose} aria-modal="true" role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl relative animate-fade-in-up flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full">
            <XIcon className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Areas for {hotel.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Add or remove specific outlets, bars, pools, and other areas.</p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Add New Area</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newAreaName}
                onChange={e => setNewAreaName(e.target.value)}
                placeholder="e.g., Main Kitchen, Sunset Bar"
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              />
              <input
                list="area-types-datalist"
                id="area-type-input"
                value={newAreaType}
                onChange={e => setNewAreaType(e.target.value)}
                placeholder="Type or select a type"
                className="w-full sm:w-56 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
              />
              <datalist id="area-types-datalist">
                {SUGGESTED_AREA_TYPES.map(type => <option key={type} value={type} />)}
              </datalist>
              <button onClick={handleAddArea} className="flex-shrink-0 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md flex items-center justify-center gap-2">
                  <PlusCircleIcon className="w-5 h-5"/> Add
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Existing Areas</h3>
            <div className="space-y-2">
              {areas.length > 0 ? areas.map(area => (
                <div key={area.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{area.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{area.type}</p>
                  </div>
                  <button onClick={() => handleDeleteArea(area.id)} className="p-1 text-slate-400 hover:text-red-500">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No areas added yet for this hotel.</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md">Save Changes</button>
        </div>
      </div>
    </div>
  );
};