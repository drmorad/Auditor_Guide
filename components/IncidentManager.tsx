import React, { useState, useMemo, useRef } from 'react';
import { Incident, IncidentSeverity, IncidentStatus, IncidentCategory, User, Hotel } from '../types';
import { TicketIcon, PlusCircleIcon, XIcon, CheckIcon, ExclamationTriangleIcon, CameraIcon, UploadIcon, TrashIcon } from './icons';

interface IncidentManagerProps {
    incidents: Incident[];
    setIncidents: React.Dispatch<React.SetStateAction<Incident[]>>;
    currentUser: User;
    users: User[];
    hotels: Hotel[];
    addAuditLog: (action: string, details: string) => void;
}

const SeverityBadge: React.FC<{ severity: IncidentSeverity }> = ({ severity }) => {
    const colors = {
        Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        Critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors[severity]}`}>{severity}</span>;
};

const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
    const colors = {
        Open: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        'In Progress': 'bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        Resolved: 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        Verified: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-md ${colors[status]}`}>{status}</span>;
};

export const IncidentManager: React.FC<IncidentManagerProps> = ({ incidents, setIncidents, currentUser, users, hotels, addAuditLog }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'All'>('All');
    const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'All'>('All');

    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newHotelId, setNewHotelId] = useState('');
    const [newAreaId, setNewAreaId] = useState('');
    const [newSeverity, setNewSeverity] = useState<IncidentSeverity>('Medium');
    const [newCategory, setNewCategory] = useState<IncidentCategory>('Maintenance');
    const [newAssignee, setNewAssignee] = useState('');
    const [newPhotos, setNewPhotos] = useState<string[]>([]);

    // Refs for file inputs
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const filteredIncidents = useMemo(() => {
        return incidents.filter(inc => {
            if (filterStatus !== 'All' && inc.status !== filterStatus) return false;
            if (filterSeverity !== 'All' && inc.severity !== filterSeverity) return false;
            return true;
        }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [incidents, filterStatus, filterSeverity]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setNewPhotos(prev => [...prev, ev.target!.result as string]);
                }
            };
            reader.readAsDataURL(file);
        }
        // Clear input so same file can be selected again if needed
        e.target.value = '';
    };

    const removePhoto = (index: number) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateIncident = (e: React.FormEvent) => {
        e.preventDefault();
        const newIncident: Incident = {
            id: `inc-${Date.now()}`,
            title: newTitle,
            description: newDesc,
            hotelId: newHotelId,
            areaId: newAreaId,
            severity: newSeverity,
            category: newCategory,
            status: 'Open',
            reportedBy: currentUser.name,
            assignedTo: newAssignee || undefined,
            photos: newPhotos,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            logs: [{ date: new Date().toISOString(), action: 'Created', user: currentUser.name }]
        };

        setIncidents([newIncident, ...incidents]);
        addAuditLog('Incident Reported', `New ${newSeverity} incident: "${newTitle}"`);
        setIsCreateModalOpen(false);
        // Reset form
        setNewTitle(''); setNewDesc(''); setNewHotelId(''); setNewAreaId(''); setNewAssignee(''); setNewPhotos([]);
    };

    const handleUpdateStatus = (incident: Incident, newStatus: IncidentStatus) => {
        const updatedIncident = {
            ...incident,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            logs: [...incident.logs, { date: new Date().toISOString(), action: `Status changed to ${newStatus}`, user: currentUser.name }]
        };
        setIncidents(prev => prev.map(i => i.id === incident.id ? updatedIncident : i));
        setSelectedIncident(updatedIncident); // Update the detailed view if open
        addAuditLog('Incident Updated', `Incident "${incident.title}" moved to ${newStatus}`);
    };

    const activeHotel = hotels.find(h => h.id === newHotelId);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Incident Tickets</h1>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors shadow-md">
                    <ExclamationTriangleIcon className="w-5 h-5"/>
                    Report Incident
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex flex-wrap gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Verified">Verified</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Severity</label>
                    <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                        <option value="All">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredIncidents.length > 0 ? filteredIncidents.map(incident => {
                        const hotelName = hotels.find(h => h.id === incident.hotelId)?.name || 'Unknown Hotel';
                        const areaName = hotels.find(h => h.id === incident.hotelId)?.areas?.find(a => a.id === incident.areaId)?.name;
                        const assigneeName = users.find(u => u.id === incident.assignedTo)?.name || 'Unassigned';

                        return (
                            <li key={incident.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setSelectedIncident(incident)}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{incident.title}</h3>
                                            <SeverityBadge severity={incident.severity} />
                                            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{incident.category}</span>
                                            {incident.photos && incident.photos.length > 0 && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <CameraIcon className="w-3 h-3"/> {incident.photos.length}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-1">{incident.description}</p>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
                                            <span>{hotelName}{areaName ? ` • ${areaName}` : ''}</span>
                                            <span>Reported by: {incident.reportedBy}</span>
                                            <span>Assigned to: {assigneeName}</span>
                                            <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <StatusBadge status={incident.status} />
                                    </div>
                                </div>
                            </li>
                        );
                    }) : (
                        <li className="p-8 text-center text-slate-500 dark:text-slate-400">No incidents found.</li>
                    )}
                </ul>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Report New Incident</h2>
                            <button onClick={() => setIsCreateModalOpen(false)}><XIcon className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" placeholder="e.g. Broken Pipe in Kitchen" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Severity</label>
                                    <select value={newSeverity} onChange={e => setNewSeverity(e.target.value as any)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value as any)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Safety">Safety</option>
                                        <option value="Hygiene">Hygiene</option>
                                        <option value="Guest">Guest</option>
                                        <option value="Security">Security</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hotel</label>
                                    <select required value={newHotelId} onChange={e => setNewHotelId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                                        <option value="">Select Hotel</option>
                                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Area</label>
                                    <select value={newAreaId} onChange={e => setNewAreaId(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" disabled={!newHotelId}>
                                        <option value="">Select Area (Optional)</option>
                                        {activeHotel?.areas?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea required rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                            
                            {/* Camera / Photo Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Evidence Photos</label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {newPhotos.map((photo, index) => (
                                        <div key={index} className="relative w-24 h-24">
                                            <img src={photo} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                                            <button 
                                                type="button" 
                                                onClick={() => removePhoto(index)} 
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                                aria-label="Remove photo"
                                            >
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => cameraInputRef.current?.click()} 
                                        className="flex items-center gap-2 text-sm text-primary-600 font-semibold p-2.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/50 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                                    >
                                        <CameraIcon className="w-5 h-5"/>
                                        Take Photo
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => uploadInputRef.current?.click()} 
                                        className="flex items-center gap-2 text-sm text-primary-600 font-semibold p-2.5 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/50 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                                    >
                                        <UploadIcon className="w-5 h-5"/>
                                        Upload
                                    </button>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        className="hidden" 
                                        ref={cameraInputRef} 
                                        onChange={handleFileChange} 
                                    />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        ref={uploadInputRef} 
                                        onChange={handleFileChange} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign To</label>
                                <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 shadow-md">Submit Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail View Modal */}
            {selectedIncident && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={() => setSelectedIncident(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl relative animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm font-mono text-slate-400">#{selectedIncident.id}</span>
                                    <SeverityBadge severity={selectedIncident.severity} />
                                    <StatusBadge status={selectedIncident.status} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedIncident.title}</h2>
                            </div>
                            <button onClick={() => setSelectedIncident(null)}><XIcon className="w-6 h-6 text-slate-400" /></button>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Description</h3>
                                    <p className="text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">{selectedIncident.description}</p>
                                </div>
                                {selectedIncident.photos && selectedIncident.photos.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Evidence</h3>
                                        <div className="grid grid-cols-3 gap-3">
                                            {selectedIncident.photos.map((photo, i) => (
                                                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                                    <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Audit Trail</h3>
                                    <ul className="space-y-3">
                                        {selectedIncident.logs.map((log, i) => (
                                            <li key={i} className="flex gap-3 text-sm">
                                                <div className="min-w-[4px] bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                                                <div>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300">{log.action}</p>
                                                    <p className="text-xs text-slate-500">{log.user} • {new Date(log.date).toLocaleString()}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Location</p>
                                        <p className="text-sm dark:text-slate-300">{hotels.find(h => h.id === selectedIncident.hotelId)?.name}</p>
                                        <p className="text-sm text-slate-500">{hotels.find(h => h.id === selectedIncident.hotelId)?.areas?.find(a => a.id === selectedIncident.areaId)?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Assigned To</p>
                                        <p className="text-sm dark:text-slate-300">{users.find(u => u.id === selectedIncident.assignedTo)?.name || 'Unassigned'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Reported By</p>
                                        <p className="text-sm dark:text-slate-300">{selectedIncident.reportedBy}</p>
                                    </div>
                                </div>

                                {/* Workflow Actions */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Actions</h3>
                                    <div className="space-y-2">
                                        {selectedIncident.status === 'Open' && (
                                            <button onClick={() => handleUpdateStatus(selectedIncident, 'In Progress')} className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Start Work</button>
                                        )}
                                        {selectedIncident.status === 'In Progress' && (
                                            <button onClick={() => handleUpdateStatus(selectedIncident, 'Resolved')} className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Mark Resolved</button>
                                        )}
                                        {selectedIncident.status === 'Resolved' && (
                                            <button onClick={() => handleUpdateStatus(selectedIncident, 'Verified')} className="w-full py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900">Verify & Close</button>
                                        )}
                                        {selectedIncident.status === 'Verified' && (
                                            <button disabled className="w-full py-2 bg-slate-200 text-slate-500 rounded-lg font-semibold cursor-not-allowed">Ticket Closed</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
