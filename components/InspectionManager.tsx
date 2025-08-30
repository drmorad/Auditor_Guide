import React, { useState, useRef, useMemo, useCallback } from 'react';
import { InspectionTemplate, InspectionRecord, InspectionResult, Hotel } from '../types';
import { XIcon, SearchIcon, CameraIcon, MagicIcon } from './icons';

interface InspectionManagerProps {
  addAuditLog: (action: string, details: string) => void;
  activeHotel: Hotel | null;
  onGenerateSop: (template: InspectionTemplate) => void;
}

const mockTemplates: InspectionTemplate[] = [
  // Kitchen Department
  {
    id: 'TPL_KITCHEN_HS',
    name: 'Daily Kitchen Hygiene & Safety',
    department: 'Kitchen Department',
    sector: 'Kitchen, Pastry', 
    items: [
      { id: 'KHS01', text: 'Structure & Cleaning: Floors, walls, ceilings are clean, in good repair, and free from pooling water. Cleaning schedules are being followed.' },
      { id: 'KHS02', text: 'Ventilation: Extraction systems are clean, free from grease, and working correctly.' },
      { id: 'KHS03', text: 'Food Contact Surfaces: All prep tables, cutting boards, and surfaces are clean and sanitized before use.' },
      { id: 'KHS04', text: 'Refrigeration Temperatures: All refrigerators are operating at or below 4°C. Temperatures are logged.' },
      { id: 'KHS05', text: 'Freezer Temperatures: All freezers are operating at or below -18°C. Temperatures are logged.' },
    ],
  },
  {
    id: 'TPL_STORES_HS',
    name: 'Food & Beverage Stores Safety',
    department: 'Kitchen Department',
    sector: 'Stores',
    items: [
      { id: 'STHS01', text: 'Dry goods are stored off the floor on clean, stable shelving.' },
      { id: 'STHS02', text: 'Stock rotation (FIFO) is being correctly applied.' },
      { id: 'STHS03', text: 'No damaged, rusted, or swollen cans or packages are present.' },
      { id: 'STHS04', text: 'Storage areas are cool, dry, well-ventilated, and pest-free.' },
    ],
  },
  // Food & Beverage Department
  {
    id: 'TPL_FNB_HS',
    name: 'F&B Service Area Safety',
    department: 'Food & Beverage Department',
    sector: 'Food & Beverage',
    items: [
      { id: 'FNBHS01', text: 'Furniture & Floors: Tables, chairs, and highchairs are clean, stable, and sanitized. Floors are clean, dry, and free from hazards.' },
      { id: 'FNBHS02', text: 'Buffet Hot Holding: Hot holding units maintain food above 63°C. Temperatures are checked and logged.' },
      { id: 'FNBHS03', text: 'Buffet Cold Holding: Cold holding units maintain food below 8°C. Temperatures are checked and logged.' },
    ],
  },
  {
    id: 'TPL_FOODCOURT_HS',
    name: 'Food Court Area Cleanliness & Safety',
    department: 'Food & Beverage Department',
    sector: 'Food Court Area',
    items: [
      { id: 'FCHS01', text: 'Tables and chairs are clean, sanitized, and checked for stability.' },
      { id: 'FCHS02', text: 'Waste receptacles are emptied regularly and do not overflow.' },
      { id: 'FCHS03', text: 'Floors are regularly swept and cleaned of spills and debris.' },
    ],
  },
  // HR & Staff Welfare Department
  {
    id: 'TPL_STAFFCAFE_HS',
    name: 'Staff Cafeteria Hygiene & Safety',
    department: 'HR & STAFF WELFARE Department',
    sector: 'Staff Cafeteria',
    items: [
      { id: 'SCHS01', text: 'Serving Line & Surfaces: Counters, sneeze guards, and all food contact surfaces are visibly clean and have been sanitized.' },
      { id: 'SCHS02', text: 'Hot Holding Temperature Control: Hot food is held at or above 63°C. Temperatures are logged.' },
      { id: 'SCHS03', text: 'Cold Holding Temperature Control: Cold food (salads, desserts) is held at or below 8°C (ideally <5°C). Temperatures are logged.' },
    ],
  },
  // Housekeeping Department
  {
    id: 'TPL_HOUSEKEEPING_HS',
    name: 'Public Area & Housekeeping Safety',
    department: 'Housekeeping Department',
    sector: 'House Keeping',
    items: [
      { id: 'HKHS01', text: 'Corridors, stairs, and public areas are clean, well-lit, and free of obstructions.' },
      { id: 'HKHS02', text: 'Floor surfaces are in good condition (no torn carpets, broken tiles).' },
      { id: 'HKHS03', text: 'Public restrooms are clean, sanitized, and fully stocked.' },
    ],
  },
  // Recreation Department
  {
    id: 'TPL_REC_HS',
    name: 'Recreation Facilities Safety Check',
    department: 'Recreation Department',
    sector: 'Recreation',
    items: [
      { id: 'RECHS01', text: 'Gym equipment is clean, sanitized, and functioning correctly with no damage.' },
      { id: 'RECHS02', text: 'Emergency stop buttons on gym equipment are clearly visible and working.' },
      { id: 'RECHS03', text: 'Playground equipment is free from damage, sharp edges, or entrapment hazards.' },
    ],
  },
  {
    id: 'TPL_POOL_HS',
    name: 'Daily Pool Safety',
    department: 'Recreation Department',
    sector: 'Pools Safety',
    items: [
      { id: 'PSHS01', text: 'Pool water is clear, and the main drain at the bottom is clearly visible.' },
      { id: 'PSHS02', text: 'Water chemistry (chlorine/pH) is tested and recorded; levels are within approved range.' },
      { id: 'PSHS03', text: 'Pool deck is clean, non-slip, and free of trip or slip hazards.' },
    ],
  },
  // Engineering Department
  {
    id: 'TPL_INFRA_HS',
    name: 'General Infrastructure & Fire Safety',
    department: 'Engineering Department',
    sector: 'Infrastructure',
    items: [
      { id: 'INFHS01', text: 'Fire escape routes are clearly marked, well-lit, and completely unobstructed.' },
      { id: 'INFHS02', text: 'Fire extinguishers are in their designated locations, fully charged, and with valid inspection tags.' },
      { id: 'INFHS03', text: 'Fire alarm panel indicates normal status with no faults.' },
    ],
  }
];

const InspectionDetailModal: React.FC<{ record: InspectionRecord; onClose: () => void; }> = ({ record, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
              aria-label="Close"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white pr-8">{record.hotelName} - {record.templateName}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Department: {record.department} | Sector: {record.sector}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Inspected by {record.inspector} on {record.date}</p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto space-y-3">
             {record.results.map(res => (
                <div key={res.itemId} className="p-3 border-l-4 rounded-r-md" style={{ borderColor: res.status === 'pass' ? '#22c55e' : res.status === 'fail' ? '#ef4444' : '#64748b' }}>
                    <p className="font-semibold">{res.itemText} - <span className={`font-bold uppercase ${res.status === 'pass' ? 'text-green-500' : res.status === 'fail' ? 'text-red-500' : 'text-slate-500'}`}>{res.status}</span></p>
                    {res.notes && <p className="text-sm italic text-slate-600 dark:text-slate-400 mt-1">Notes: {res.notes}</p>}
                    {res.photo && <img src={res.photo} alt="Evidence" className="mt-2 h-32 w-32 object-cover rounded-lg shadow-sm" />}
                </div>
            ))}
            {record.summaryNotes && (
                <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md mt-4">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Summary Notes</h3>
                    <p className="text-sm italic text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{record.summaryNotes}</p>
                </div>
            )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end rounded-b-xl">
            <button 
              onClick={onClose} 
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
};

export const InspectionManager: React.FC<InspectionManagerProps> = ({ addAuditLog, activeHotel, onGenerateSop }) => {
  type ViewState = 'LIST' | 'SELECT_TEMPLATE' | 'FORM';
  const [viewState, setViewState] = useState<ViewState>('LIST');
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InspectionTemplate | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [currentResults, setCurrentResults] = useState<InspectionResult[]>([]);
  const [hotelName, setHotelName] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>('Current User');
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [currentItemIdForPhoto, setCurrentItemIdForPhoto] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [inspectorFilter, setInspectorFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueDepartments = useMemo(() => {
    return [...new Set(mockTemplates.map(t => t.department))].sort();
  }, []);

  const uniqueInspectors = useMemo(() => {
    return [...new Set(records.map(r => r.inspector))].sort();
  }, [records]);

  const templatesByDept = useMemo(() => {
    return mockTemplates.reduce((acc, tpl) => {
        if (!acc[tpl.department]) {
            acc[tpl.department] = [];
        }
        acc[tpl.department].push(tpl);
        return acc;
    }, {} as Record<string, InspectionTemplate[]>);
  }, []);

  const startNewInspection = (template: InspectionTemplate) => {
    setSelectedTemplate(template);
    setCurrentResults(template.items.map(item => ({
        itemId: item.id,
        itemText: item.text,
        status: 'n/a',
    })));
    setHotelName(activeHotel?.name || '');
    setInspectorName('Current User');
    setEditingRecordId(null);
    setSummaryNotes('');
    setViewState('FORM');
  };

  const resumeInspection = (record: InspectionRecord) => {
    const template = mockTemplates.find(t => t.name === record.templateName);
    if (!template) {
        console.error("Template not found for this draft.");
        return;
    }
    setSelectedTemplate(template);
    setCurrentResults(record.results);
    setHotelName(record.hotelName);
    setInspectorName(record.inspector);
    setSummaryNotes(record.summaryNotes || '');
    setEditingRecordId(record.id);
    addAuditLog('Inspection Resumed', `Resumed draft for ${record.hotelName}: "${record.templateName}"`);
    setViewState('FORM');
  };

  const handleResultChange = (itemId: string, status: 'pass' | 'fail') => {
    setCurrentResults(prev => prev.map(r => r.itemId === itemId ? {...r, status} : r));
  };
  
  const handleNotesChange = (itemId: string, notes: string) => {
    setCurrentResults(prev => prev.map(r => r.itemId === itemId ? {...r, notes} : r));
  };

  const handlePhotoAddClick = (itemId: string) => {
    setCurrentItemIdForPhoto(itemId);
    photoInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && currentItemIdForPhoto) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoDataUrl = e.target?.result as string;
            const itemId = currentItemIdForPhoto;
            setCurrentResults(prev => prev.map(r => r.itemId === itemId ? {...r, photo: photoDataUrl} : r));
        };
        reader.readAsDataURL(file);
    }
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const saveOrUpdateInspection = (status: 'Draft' | 'Completed') => {
    if (!selectedTemplate || (!hotelName.trim() || !inspectorName.trim())) {
      alert("Please enter a Hotel/Resort name and Inspector's name.");
      return
    };

    if (editingRecordId) {
        // Update existing record
        setRecords(prevRecords => prevRecords.map(rec => 
            rec.id === editingRecordId 
            ? { ...rec, inspector: inspectorName, results: currentResults, status, date: new Date().toISOString().split('T')[0], summaryNotes: summaryNotes.trim() }
            : rec
        ));
        const action = status === 'Completed' ? 'Inspection Completed' : 'Draft Saved';
        const details = `${status === 'Completed' ? 'Completed inspection' : 'Updated draft'} for ${hotelName}: "${selectedTemplate.name}".`;
        addAuditLog(action, details);
    } else {
        // Create new record
        const newRecord: InspectionRecord = {
            id: new Date().toISOString(),
            hotelName: hotelName.trim(),
            templateName: selectedTemplate.name,
            department: selectedTemplate.department,
            sector: selectedTemplate.sector,
            date: new Date().toISOString().split('T')[0],
            inspector: inspectorName.trim(),
            results: currentResults,
            summaryNotes: summaryNotes.trim(),
            status,
        };
        setRecords(prev => [newRecord, ...prev]);

        const action = status === 'Completed' ? 'Inspection Completed' : 'Draft Saved';
        let details = `${status === 'Completed' ? 'Completed' : 'Saved draft for'} audit at ${hotelName}: "${selectedTemplate.name}".`;
        if (status === 'Completed') {
          const failedItems = newRecord.results.filter(r => r.status === 'fail');
          details += failedItems.length > 0 ? ` ${failedItems.length} item(s) failed.` : ` All items passed.`;
        }
        addAuditLog(action, details);
    }

    setViewState('LIST');
    setEditingRecordId(null);
  };
  
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      if (activeHotel && rec.hotelName !== activeHotel.name) {
          return false;
      }
      if (startDate && rec.date < startDate) return false;
      if (endDate && rec.date > endDate) return false;
      if (departmentFilter && rec.department !== departmentFilter) return false;
      if (inspectorFilter && rec.inspector !== inspectorFilter) return false;
      
      const searchLower = searchQuery.toLowerCase();
      if (searchQuery && 
          !rec.templateName.toLowerCase().includes(searchLower) &&
          !rec.hotelName.toLowerCase().includes(searchLower)) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, startDate, endDate, departmentFilter, inspectorFilter, searchQuery, activeHotel]);

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;

    addAuditLog('Data Exported', `Exported ${filteredRecords.length} inspection records to CSV.`);

    const csvRows = [];
    const headers = [
        'Inspection ID', 'Hotel Name', 'Date', 'Inspector', 'Department', 'Sector', 'Template Name',
        'Item ID', 'Item Text', 'Status', 'Notes'
    ];
    csvRows.push(headers.join(','));

    const escapeCsvField = (field: string | undefined | null): string => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        if (/[",\n\r]/.test(stringField)) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    for (const record of filteredRecords) {
        for (const result of record.results) {
            const row = [
                escapeCsvField(record.id), escapeCsvField(record.hotelName), escapeCsvField(record.date),
                escapeCsvField(record.inspector), escapeCsvField(record.department), escapeCsvField(record.sector),
                escapeCsvField(record.templateName), escapeCsvField(result.itemId), escapeCsvField(result.itemText),
                escapeCsvField(result.status), escapeCsvField(result.notes)
            ];
            csvRows.push(row.join(','));
        }
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `inspections_export_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const clearFilters = useCallback(() => {
      setStartDate('');
      setEndDate('');
      setDepartmentFilter('');
      setInspectorFilter('');
      setSearchQuery('');
      addAuditLog('Filters Cleared', 'All inspection filters have been reset.');
  }, [addAuditLog]);

  const renderList = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Daily Inspections</h1>
            <button onClick={() => setViewState('SELECT_TEMPLATE')} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
                Start New Inspection
            </button>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md space-y-4">
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by hotel or inspection name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-lg border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 py-2 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-primary-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="department-filter" className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Department</label>
                    <select
                        id="department-filter"
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                        aria-label="Filter by department"
                    >
                        <option value="">All Departments</option>
                        {uniqueDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="inspector-filter" className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Inspector</label>
                    <select
                        id="inspector-filter"
                        value={inspectorFilter}
                        onChange={(e) => setInspectorFilter(e.target.value)}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                        aria-label="Filter by inspector"
                    >
                        <option value="">All Inspectors</option>
                        {uniqueInspectors.map(inspector => (
                            <option key={inspector} value={inspector}>{inspector}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start-date" className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">Start Date</label>
                        <input
                            type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || ''}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                            aria-label="Start date"
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">End Date</label>
                        <input
                            type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || ''}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"
                            aria-label="End date"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={clearFilters}
                        className="w-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                    >
                        Clear Filters
                    </button>
                    <button
                        onClick={handleExportCsv}
                        disabled={filteredRecords.length === 0}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Export to CSV
                    </button>
                </div>
            </div>
        </div>

         <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Hotel</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Audit Name</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Department</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Date</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Inspector</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    <th className="p-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Failed</th>
                    <th className="p-4"></th>
                </tr>
                </thead>
                <tbody>
                    {filteredRecords.length > 0 ? filteredRecords.map(rec => {
                        const failedCount = rec.results.filter(r => r.status === 'fail').length;
                        return (
                            <tr key={rec.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                <td className="p-4 font-medium text-slate-900 dark:text-white">{rec.hotelName}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.templateName}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.department}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.date}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{rec.inspector}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${rec.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>{rec.status}</span>
                                </td>
                                <td className="p-4"><span className={failedCount > 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>{failedCount}</span></td>
                                <td className="p-4 text-right">
                                    {rec.status === 'Draft' ? (
                                        <button onClick={() => resumeInspection(rec)} className="bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-800/50 text-yellow-700 dark:text-yellow-300 text-xs font-semibold py-1 px-3 rounded-md transition-colors">Resume</button>
                                    ) : (
                                        <button onClick={() => setSelectedRecord(rec)} className="bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/50 dark:hover:bg-primary-800/50 text-primary-600 dark:text-primary-300 text-xs font-semibold py-1 px-3 rounded-md transition-colors">View</button>
                                    )}
                                </td>
                            </tr>
                        )
                    }) : (
                        <tr><td colSpan={8} className="text-center p-8 text-slate-500 dark:text-slate-400">No inspections found matching your criteria.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
  
  const renderTemplateSelection = () => (
    <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setViewState('LIST')} className="text-slate-500 hover:text-primary-500"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Select an Inspection Template</h1>
        </div>
        <div className="space-y-8">
            {Object.entries(templatesByDept).map(([dept, templates]) => (
                <div key={dept}>
                    <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 border-b-2 border-primary-500 pb-2 mb-4">{dept}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tpl.name}</h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex-grow">Sector: {tpl.sector}</p>
                                <div className="mt-6 space-y-2">
                                    <button onClick={() => startNewInspection(tpl)} className="w-full bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">Start Inspection</button>
                                    <button 
                                      onClick={() => onGenerateSop(tpl)} 
                                      className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <MagicIcon className="w-5 h-5 text-primary-500"/>
                                        Generate SOP
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderForm = () => {
    if (!selectedTemplate) return null;
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setViewState('SELECT_TEMPLATE')} className="text-slate-500 hover:text-primary-500"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{selectedTemplate.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Department: {selectedTemplate.department} | Sector: {selectedTemplate.sector}</p>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="hotel-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Hotel / Resort Name
                        </label>
                        <input
                            id="hotel-name"
                            type="text"
                            value={hotelName}
                            onChange={(e) => setHotelName(e.target.value)}
                            placeholder="e.g., Grand Hyatt Resort"
                            disabled={!!activeHotel || !!editingRecordId}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label htmlFor="inspector-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Inspector's Name
                        </label>
                        <input
                            id="inspector-name"
                            type="text"
                            value={inspectorName}
                            onChange={(e) => setInspectorName(e.target.value)}
                            placeholder="Enter inspector's full name"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>

                {currentResults.map(result => (
                    <div key={result.itemId} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{result.itemText}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => handleResultChange(result.itemId, 'pass')} className={`px-4 py-1 rounded-md text-sm font-semibold ${result.status === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'}`}>Pass</button>
                            <button onClick={() => handleResultChange(result.itemId, 'fail')} className={`px-4 py-1 rounded-md text-sm font-semibold ${result.status === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'}`}>Fail</button>
                        </div>
                        {result.status === 'fail' && (
                            <div className="mt-3 flex flex-col md:flex-row gap-4 animate-fade-in items-start">
                                <textarea 
                                  value={result.notes || ''}
                                  onChange={(e) => handleNotesChange(result.itemId, e.target.value)} 
                                  placeholder="Add corrective action notes..." 
                                  rows={3} 
                                  className="w-full flex-grow p-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                ></textarea>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <input type="file" accept="image/*" capture="environment" ref={photoInputRef} onChange={handleFileChange} className="hidden" />
                                    <button onClick={() => handlePhotoAddClick(result.itemId)} className="flex items-center gap-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                        <CameraIcon className="w-5 h-5"/>
                                        <span>{result.photo ? 'Change Photo' : 'Add Photo'}</span>
                                    </button>
                                    {result.photo && <img src={result.photo} alt="Attached preview" className="h-16 w-16 object-cover rounded-md shadow-sm" />}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <label htmlFor="summary-notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Summary Notes
                    </label>
                    <textarea
                        id="summary-notes"
                        value={summaryNotes}
                        onChange={(e) => setSummaryNotes(e.target.value)}
                        rows={4}
                        placeholder="Add any overall comments, observations, or follow-up actions here..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
                <button onClick={() => saveOrUpdateInspection('Draft')} className="bg-slate-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-600">Save Draft</button>
                <button onClick={() => saveOrUpdateInspection('Completed')} className="bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700">Complete Inspection</button>
            </div>
        </div>
    )
  }

  return (
    <>
        {viewState === 'LIST' && renderList()}
        {viewState === 'SELECT_TEMPLATE' && renderTemplateSelection()}
        {viewState === 'FORM' && renderForm()}

        {selectedRecord && (
            <InspectionDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
    </>
  );
};