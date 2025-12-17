import React, { useState, useMemo, useRef } from 'react';
import { InspectionRecord, Hotel, User, InspectionTemplate } from '../types';
import { ClipboardCheckIcon, XIcon, CameraIcon, UploadIcon, PrinterIcon } from './icons';
import { StartInspectionModal } from './StartInspectionModal';
import { InspectionForm } from './InspectionForm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


interface InspectionManagerProps {
  records: InspectionRecord[];
  setRecords: React.Dispatch<React.SetStateAction<InspectionRecord[]>>;
  hotels: Hotel[];
  templates: InspectionTemplate[];
  currentUser: User;
  addAuditLog: (action: string, details: string) => void;
}

const RecordsTable: React.FC<{ records: InspectionRecord[], onResume: (record: InspectionRecord) => void, onView: (record: InspectionRecord) => void }> = ({ records, onResume, onView }) => {
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
                        {record.status === 'In Progress' ? (
                            <button onClick={() => onResume(record)} className="text-sm font-semibold text-primary-600 hover:underline">Resume</button>
                        ) : (
                            <button onClick={() => onView(record)} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400">View</button>
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

const InspectionDetailModal: React.FC<{ record: InspectionRecord; onClose: () => void; onUpdate: (record: InspectionRecord) => void }> = ({ record, onClose, onUpdate }) => {
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItemsForExport, setSelectedItemsForExport] = useState<Set<string>>(new Set());

    const failedItems = record.results.filter(r => r.status === 'fail');
    const passedItems = record.results.filter(r => r.status === 'pass');
    
    const handleToggleItemSelection = (questionId: string) => {
        setSelectedItemsForExport(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const handleSelectAllFailed = () => {
        const failedIds = failedItems.map(item => item.questionId);
        setSelectedItemsForExport(prev => new Set([...prev, ...failedIds]));
    };

    const handleSelectAllPassed = () => {
        const passedIds = passedItems.map(item => item.questionId);
        setSelectedItemsForExport(prev => new Set([...prev, ...passedIds]));
    };
    
    const cancelSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedItemsForExport(new Set());
    };

    const handleExportPDF = (onlySelected = false) => {
        const doc = new jsPDF();
        
        const itemsToExport = {
            failed: onlySelected ? failedItems.filter(item => selectedItemsForExport.has(item.questionId)) : failedItems,
            passed: onlySelected ? passedItems.filter(item => selectedItemsForExport.has(item.questionId)) : passedItems,
        };
        
        const reportTitle = onlySelected ? `${record.templateName} (Selected Items)` : record.templateName;

        // Title & Header
        doc.setFontSize(20);
        doc.text(reportTitle, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Hotel: ${record.hotelName}`, 14, 32);
        doc.text(`Area: ${record.areaName || 'N/A'}`, 14, 38);
        doc.text(`Date: ${record.date}`, 14, 44);
        doc.text(`Auditor: ${record.auditor}`, 14, 50);

        if (!onlySelected) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Final Compliance Score: ${record.complianceScore}%`, 14, 58);
            doc.setFont('helvetica', 'normal');
        }

        let startY = onlySelected ? 60 : 65;

        // Failed Items Table
        if (itemsToExport.failed.length > 0) {
            autoTable(doc, {
                startY: startY,
                head: [['Failed Item', 'Auditor Notes', 'Photos']],
                body: itemsToExport.failed.map(item => [
                    item.question,
                    item.notes || 'No notes provided.',
                    item.photos && item.photos.length > 0 ? `Yes (${item.photos.length})` : 'No'
                ]),
                headStyles: { fillColor: '#ef4444' }, // red-500
                didDrawPage: (data) => { startY = data.cursor?.y || startY; }
            });
            startY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Passed Items Table
        if (itemsToExport.passed.length > 0) {
            autoTable(doc, {
                startY: startY,
                head: [['Passed Items']],
                body: itemsToExport.passed.map(item => [item.question]),
                headStyles: { fillColor: '#22c55e' }, // green-500
            });
        }

        const fileNameSuffix = onlySelected ? 'Selected_Items' : 'Full_Report';
        doc.save(`Inspection_${record.templateName.replace(/ /g, '_')}_${fileNameSuffix}.pdf`);
        
        if (onlySelected) {
            cancelSelectionMode();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && activeQuestionId) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const base64 = ev.target?.result as string;
                const updatedResults = record.results.map(r => {
                    if (r.questionId === activeQuestionId) {
                        return { ...r, photos: [...(r.photos || []), base64] };
                    }
                    return r;
                });
                onUpdate({ ...record, results: updatedResults });
                setActiveQuestionId(null);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const triggerCamera = (questionId: string) => {
        setActiveQuestionId(questionId);
        cameraInputRef.current?.click();
    };

    const triggerUpload = (questionId: string) => {
        setActiveQuestionId(questionId);
        uploadInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            {/* Hidden Inputs */}
            <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={cameraInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />
            <input 
                type="file" 
                accept="image/*" 
                ref={uploadInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
            />

            {viewingImage && (
                <div className="absolute inset-0 z-50 flex justify-center items-center bg-black bg-opacity-90 p-4" onClick={(e) => { e.stopPropagation(); setViewingImage(null); }}>
                    <button className="absolute top-4 right-4 text-white"><XIcon className="w-8 h-8"/></button>
                    <img src={viewingImage} alt="Evidence" className="max-w-full max-h-full rounded-lg" />
                </div>
            )}
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl relative animate-fade-in-up flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{record.templateName}</h2>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-4">
                            <span>{record.hotelName} {record.areaName ? `• ${record.areaName}` : ''}</span>
                            <span>• {record.date}</span>
                            <span>• {record.auditor}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className={`px-3 py-1 rounded-full font-bold text-lg ${record.complianceScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {record.complianceScore}%
                        </div>
                        <button onClick={onClose}><XIcon className="w-6 h-6 text-slate-400" /></button>
                    </div>
                </div>

                {/* Selection Action Bar */}
                {isSelectionMode && (
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/50 border-b border-primary-200 dark:border-primary-800 flex flex-wrap items-center justify-between gap-3 sticky top-[113px] z-10 animate-fade-in">
                        <span className="font-semibold text-primary-800 dark:text-primary-200">{selectedItemsForExport.size} items selected</span>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSelectAllFailed} className="text-xs font-semibold text-red-600 hover:underline">Select All Failed</button>
                            <button onClick={handleSelectAllPassed} className="text-xs font-semibold text-green-600 hover:underline">Select All Passed</button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={cancelSelectionMode} className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                            <button onClick={() => handleExportPDF(true)} disabled={selectedItemsForExport.size === 0} className="flex items-center gap-2 text-sm font-semibold bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 disabled:bg-primary-300">
                                <PrinterIcon className="w-4 h-4" /> Export Selected
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="p-6 space-y-8 overflow-y-auto">
                    {/* Failed Items Section */}
                    <div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span>
                            Failed Items ({failedItems.length})
                        </h3>
                        {failedItems.length > 0 ? (
                            <div className="space-y-4">
                                {failedItems.map((item, idx) => (
                                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg p-4 flex gap-3">
                                        {isSelectionMode && (
                                            <input 
                                                type="checkbox" 
                                                className="mt-1 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                                                checked={selectedItemsForExport.has(item.questionId)}
                                                onChange={() => handleToggleItemSelection(item.questionId)}
                                            />
                                        )}
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{item.question}</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => triggerCamera(item.questionId)} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
                                                        <CameraIcon className="w-3 h-3"/> Take Photo
                                                    </button>
                                                    <button onClick={() => triggerUpload(item.questionId)} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
                                                        <UploadIcon className="w-3 h-3"/> Upload
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {item.notes && (
                                                <div className="mb-3 text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded border border-red-100 dark:border-red-900/30">
                                                    <span className="font-semibold text-red-600 dark:text-red-400">Note:</span> {item.notes}
                                                </div>
                                            )}

                                            {item.photos && item.photos.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Evidence</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.photos.map((photo, pIdx) => (
                                                            <div key={pIdx} className="relative group cursor-pointer" onClick={() => setViewingImage(photo)}>
                                                                <img src={photo} alt="Evidence" className="w-20 h-20 object-cover rounded-md border border-slate-300 dark:border-slate-600" />
                                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-md"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No failed items.</p>
                        )}
                    </div>

                    {/* Passed Items Section */}
                    <div>
                        <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            Passed Items ({passedItems.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {passedItems.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded">
                                    {isSelectionMode && (
                                        <input 
                                            type="checkbox" 
                                            className="mt-1 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                                            checked={selectedItemsForExport.has(item.questionId)}
                                            onChange={() => handleToggleItemSelection(item.questionId)}
                                        />
                                    )}
                                    <span className="text-green-500">✓</span>
                                    <span>{item.question}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer with export options */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0 z-10">
                    <button onClick={() => setIsSelectionMode(true)} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">
                        Select Items to Export...
                    </button>
                    <button onClick={() => handleExportPDF(false)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md">
                        <PrinterIcon className="w-5 h-5"/> Export Full Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export const InspectionManager: React.FC<InspectionManagerProps> = ({ records, setRecords, hotels, templates, currentUser, addAuditLog }) => {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [activeInspection, setActiveInspection] = useState<InspectionRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<InspectionRecord | null>(null);
  
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

  const handleUpdateViewingRecord = (updatedRecord: InspectionRecord) => {
      setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
      setViewingRecord(updatedRecord);
      addAuditLog('Inspection Evidence Added', `Added photo evidence to completed inspection "${updatedRecord.templateName}".`);
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


      <RecordsTable records={filteredRecords} onResume={setActiveInspection} onView={setViewingRecord} />
      
      {isStartModalOpen && (
        <StartInspectionModal
            hotels={hotels}
            templates={templates}
            onClose={() => setIsStartModalOpen(false)}
            onStart={handleStartInspection}
        />
      )}

      {viewingRecord && (
          <InspectionDetailModal 
            record={viewingRecord}
            onClose={() => setViewingRecord(null)}
            onUpdate={handleUpdateViewingRecord}
          />
      )}
    </div>
  );
};
