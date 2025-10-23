
import React, { useState, useMemo } from 'react';
import { InspectionRecord, Hotel, User, InspectionTemplate } from '../types';
import { ClipboardCheckIcon } from './icons';
import { StartInspectionModal } from './StartInspectionModal';
import { InspectionForm } from './InspectionForm';

interface InspectionManagerProps {
  records: InspectionRecord[];
  setRecords: React.Dispatch<React.SetStateAction<InspectionRecord[]>>;
  hotels: Hotel[];
  templates: InspectionTemplate[];
  currentUser: User;
  addAuditLog: (action: string, details: string) => void;
}

const RecordsTable: React.FC<{ records: InspectionRecord[], onResume: (record: InspectionRecord) => void }> = ({ records, onResume }) => {
    const getStatusColor = (status: InspectionRecord['status']) => {
        switch (status) {
        case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md overflow-x-auto">
            <table className="w-full text-left">
            <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Inspection</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Hotel / Area</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Auditor</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Date</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 text-right">Score</th>
                <th className="p-4"></th>
                </tr>
            </thead>
            <tbody>
                {records.length > 0 ? (
                records.map((record) => (
                    <tr key={record.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="p-4 font-medium text-slate-900 dark:text-white">{record.templateName}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                        <div>{record.hotelName}</div>
                        {record.areaName && <div className="text-xs text-slate-500">{record.areaName}</div>}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{record.auditor}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{record.date}</td>
                    <td className="p-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(record.status)}`}>
                        {record.status}
                        </span>
                    </td>
                    <td className="p-4 text-sm font-bold text-right">
                        {record.status === 'Completed' ? `${record.complianceScore}%` : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                        {record.status === 'In Progress' && (
                            <button onClick={() => onResume(record)} className="text-sm font-semibold text-primary-600 hover:underline">Resume</button>
                        )}
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-500 dark:text-slate-400">
                    No inspection records found matching your filters.
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
    )
};


export const InspectionManager: React.FC<InspectionManagerProps> = ({ records, setRecords, hotels, templates, currentUser, addAuditLog }) => {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [activeInspection, setActiveInspection] = useState<InspectionRecord | null>(null);
  
  const [hotelFilter, setHotelFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | InspectionRecord['status']>('all');

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
        const hotelMatch = hotelFilter === 'all' || hotels.find(h => h.id === hotelFilter)?.name === record.hotelName;
        const templateMatch = templateFilter === 'all' || record.templateId === templateFilter;
        const statusMatch = statusFilter === 'all' || record.status === statusFilter;
        return hotelMatch && templateMatch && statusMatch;
    });
  }, [records, hotelFilter, templateFilter, statusFilter, hotels]);

  const handleStartInspection = (hotelId: string, templateId: string, areaId: string) => {
    const hotel = hotels.find(h => h.id === hotelId);
    const template = templates.find(t => t.id === templateId);
    if (!hotel || !template) return;

    const area = hotel.areas?.find(a => a.id === areaId);

    const newRecord: InspectionRecord = {
        id: `insp-${Date.now()}`,
        templateId,
        templateName: template.name,
        date: new Date().toISOString().split('T')[0],
        auditor: currentUser.name,
        hotelName: hotel.name,
        department: template.department,
        status: 'In Progress',
        results: template.questions.map(q => ({
            questionId: q.id,
            question: q.text,
            status: 'pending',
        })),
        complianceScore: 0,
        areaId: area?.id,
        areaName: area?.name,
    };
    
    setRecords(prev => [newRecord, ...prev]);
    setActiveInspection(newRecord);
    addAuditLog('Inspection Started', `Started "${template.name}" at ${hotel.name}${area ? ` (${area.name})` : ''}.`);
    setIsStartModalOpen(false);
  };
  
  const handleSaveInspection = (updatedRecord: InspectionRecord) => {
    const isCompleting = updatedRecord.status === 'Completed';

    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    
    if (isCompleting) {
        addAuditLog('Inspection Completed', `Completed "${updatedRecord.templateName}" with score ${updatedRecord.complianceScore}%.`);
        setActiveInspection(null);
    } else {
         addAuditLog('Inspection Progress Saved', `Saved progress for "${updatedRecord.templateName}".`);
    }
  };

  if (activeInspection) {
    return (
        <InspectionForm
            inspection={activeInspection}
            onSave={handleSaveInspection}
            onExit={() => setActiveInspection(null)}
        />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Inspections</h1>
        <button onClick={() => setIsStartModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
          <ClipboardCheckIcon className="w-5 h-5"/>
          Start New Inspection
        </button>
      </div>
      
      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label htmlFor="hotel-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Hotel</label>
                <select id="hotel-filter" value={hotelFilter} onChange={e => setHotelFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="all">All Hotels</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="template-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Template</label>
                <select id="template-filter" value={templateFilter} onChange={e => setTemplateFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="all">All Templates</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Status</label>
                <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="all">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Overdue">Overdue</option>
                </select>
            </div>
        </div>
      </div>


      <RecordsTable records={filteredRecords} onResume={setActiveInspection} />
      
      {isStartModalOpen && (
        <StartInspectionModal
            hotels={hotels}
            templates={templates}
            onClose={() => setIsStartModalOpen(false)}
            onStart={handleStartInspection}
        />
      )}
    </div>
  );
};
