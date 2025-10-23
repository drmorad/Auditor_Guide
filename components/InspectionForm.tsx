
import React, { useState, useMemo } from 'react';
import { InspectionRecord, InspectionResult } from '../types';
import { CameraIcon, PlusCircleIcon } from './icons';

interface InspectionFormProps {
  inspection: InspectionRecord;
  onSave: (updatedRecord: InspectionRecord) => void;
  onExit: () => void;
}

const PhotoPlaceholder: React.FC<{ onRemove: () => void }> = ({ onRemove }) => (
    <div className="relative group w-24 h-24 bg-slate-200 dark:bg-slate-600 rounded-md flex items-center justify-center">
        <CameraIcon className="w-8 h-8 text-slate-400 dark:text-slate-400" />
        <button 
            onClick={onRemove}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            aria-label="Remove photo"
        >
            &times;
        </button>
    </div>
);


export const InspectionForm: React.FC<InspectionFormProps> = ({ inspection, onSave, onExit }) => {
  const [results, setResults] = useState<InspectionResult[]>(inspection.results);

  const progress = useMemo(() => {
    const completed = results.filter(r => r.status !== 'pending').length;
    return Math.round((completed / results.length) * 100);
  }, [results]);

  const handleStatusChange = (questionId: string, status: 'pass' | 'fail') => {
    setResults(currentResults => currentResults.map(r => 
      r.questionId === questionId ? { ...r, status } : r
    ));
  };
  
  const handleNotesChange = (questionId: string, notes: string) => {
    setResults(currentResults => currentResults.map(r => 
      r.questionId === questionId ? { ...r, notes } : r
    ));
  };
  
  const handleAddPhoto = (questionId: string) => {
    // In a real app, this would open a camera modal. Here we just mock it.
    setResults(currentResults => currentResults.map(r => 
      r.questionId === questionId ? { ...r, photo: 'placeholder' } : r
    ));
  };
  
  const handleRemovePhoto = (questionId: string) => {
    setResults(currentResults => currentResults.map(r => 
      r.questionId === questionId ? { ...r, photo: undefined } : r
    ));
  };
  
  const handleSaveProgress = () => {
    onSave({ ...inspection, results });
  };
  
  const handleCompleteInspection = () => {
    if (progress < 100) {
        alert("Please complete all items before finalizing the inspection.");
        return;
    }
    const passedCount = results.filter(r => r.status === 'pass').length;
    const score = results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0;
    onSave({ ...inspection, results, status: 'Completed', complianceScore: score });
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{inspection.templateName}</h1>
                    <p className="text-slate-500 dark:text-slate-400">{inspection.hotelName}{inspection.areaName ? ` - ${inspection.areaName}` : ''} - {inspection.date}</p>
                </div>
                <button onClick={onExit} className="text-sm font-semibold text-slate-600 hover:text-primary-600">Exit Form</button>
            </div>
            {/* Progress Bar */}
            <div>
                <div className="flex justify-between mb-1">
                    <span className="text-base font-medium text-primary-700 dark:text-primary-400">Progress</span>
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-400">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
            {results.map((result, index) => (
                <div key={result.questionId} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                    <p className="font-semibold text-slate-800 dark:text-white">{index + 1}. {result.question}</p>
                    
                    <div className="flex gap-2 mt-3">
                        <button 
                            onClick={() => handleStatusChange(result.questionId, 'pass')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${result.status === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-green-100'}`}
                        >
                            Pass
                        </button>
                        <button 
                            onClick={() => handleStatusChange(result.questionId, 'fail')}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${result.status === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-red-100'}`}
                        >
                            Fail
                        </button>
                    </div>

                    {result.status === 'fail' && (
                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3 animate-fade-in">
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Notes (Required)</label>
                                <textarea 
                                    value={result.notes || ''}
                                    onChange={(e) => handleNotesChange(result.questionId, e.target.value)}
                                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm"
                                    rows={2}
                                    placeholder="Describe the issue and corrective action taken..."
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Photo Evidence</label>
                                <div className="mt-1 flex items-center gap-2">
                                    {result.photo ? (
                                        <PhotoPlaceholder onRemove={() => handleRemovePhoto(result.questionId)} />
                                    ) : (
                                        <button onClick={() => handleAddPhoto(result.questionId)} className="flex items-center gap-2 text-sm text-primary-600 font-semibold p-2 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/50">
                                            <PlusCircleIcon className="w-5 h-5"/>
                                            Add Photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
        
         {/* Footer Actions */}
        <div className="sticky bottom-6 flex justify-end gap-3">
            <button onClick={handleSaveProgress} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-6 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg hover:bg-slate-100 dark:hover:bg-slate-600">
                Save Progress
            </button>
            <button
                onClick={handleCompleteInspection}
                disabled={progress < 100}
                className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                Complete Inspection
            </button>
        </div>
    </div>
  );
};