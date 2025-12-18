import React, { useState, useMemo } from 'react';
import { User, Hotel, InspectionTemplate } from '../types';
import { MailIcon, TeamIcon, BuildingOfficeIcon, XIcon, UserPlusIcon, ClipboardDocumentListIcon, TrashIcon, BriefcaseIcon, PlusCircleIcon, LinkIcon, DriveIcon, CheckIcon, ExclamationTriangleIcon } from './icons';
import { ConfirmRoleChangeModal } from './ConfirmRoleChangeModal';
import { InviteUserModal } from './InviteUserModal';
import { CreateTemplateModal } from './CreateTemplateModal';
import { ManageAreasModal } from './ManageAreasModal';

const RoleBadge: React.FC<{ role: User['role'] }> = ({ role }) => {
  const colors = {
    Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Editor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[role]}`}>{role}</span>;
};

interface AdminPanelProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onSendInvite: (user: Omit<User, 'id' | 'avatar'>) => void;
  addAuditLog: (action: string, details: string) => void;
  currentUser: User;
  hotels: Hotel[];
  onAddHotel: (name: string) => void;
  onDeleteHotel: (hotelId: string) => void;
  onUpdateHotel: (updatedHotel: Hotel) => void;
  inspectionTemplates: InspectionTemplate[];
  onCreateTemplate: (template: InspectionTemplate) => void;
  departments: string[];
  onAddDepartment: (name: string) => void;
  onDeleteDepartment: (name: string) => void;
  isDriveConnected: boolean;
  isConnecting: boolean;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  isDriveConfigured: boolean;
  driveError: string | null;
  driveDataFileId: string | null;
}

type AdminTab = 'users' | 'hotels' | 'templates' | 'departments' | 'integrations';

const AssignHotelsModal: React.FC<{
  user: User;
  hotels: Hotel[];
  onClose: () => void;
  onSave: (userId: string, hotelIds: string[]) => void;
}> = ({ user, hotels, onClose, onSave }) => {
  const [selectedHotelIds, setSelectedHotelIds] = useState<Set<string>>(new Set(user.hotelIds || []));

  const handleToggleHotel = (hotelId: string) => {
    const newSelection = new Set(selectedHotelIds);
    if (newSelection.has(hotelId)) {
      newSelection.delete(hotelId);
    } else {
      newSelection.add(hotelId);
    }
    setSelectedHotelIds(newSelection);
  };

  const handleSave = () => {
    onSave(user.id, Array.from(selectedHotelIds));
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="assign-hotels-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <button 
              onClick={onClose} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full"
              aria-label="Close hotel assignment modal"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <h2 id="assign-hotels-title" className="text-xl font-bold text-slate-900 dark:text-white">Assign Hotels for {user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Select the properties this user can access.</p>
        </div>
        <div className="p-6">
          <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
            {hotels.map(hotel => (
              <label key={hotel.id} className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={selectedHotelIds.has(hotel.id)}
                  onChange={() => handleToggleHotel(hotel.id)}
                  className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 font-medium text-slate-800 dark:text-slate-200">{hotel.name}</span>
              </label>
            ))}
            {hotels.length === 0 && <p className="text-sm text-center text-slate-500 dark:text-slate-400">No hotels have been added to this organization yet.</p>}
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 rounded-b-xl">
            <button onClick={onClose} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 shadow-md">
              Save Assignments
            </button>
        </div>
      </div>
    </div>
  );
};


export const AdminPanel: React.FC<AdminPanelProps> = ({ users, setUsers, onSendInvite, addAuditLog, currentUser, hotels, onAddHotel, onDeleteHotel, onUpdateHotel, inspectionTemplates, onCreateTemplate, departments, onAddDepartment, onDeleteDepartment, isDriveConnected, isConnecting, onConnectDrive, onDisconnectDrive, isDriveConfigured, driveError, driveDataFileId }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newHotelName, setNewHotelName] = useState('');
  const [hotelSuccessMessage, setHotelSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('hotels');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [assigningHotelsToUser, setAssigningHotelsToUser] = useState<User | null>(null);
  const [roleChangeConfirmation, setRoleChangeConfirmation] = useState<{ user: User; newRole: User['role'] } | null>(null);
  const [managingAreasForHotel, setManagingAreasForHotel] = useState<Hotel | null>(null);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'Pending'), [users]);
  const activeUsers = useMemo(() => users.filter(u => u.status === 'Active'), [users]);

  const handleInviteSave = (newUser: Omit<User, 'id' | 'avatar'>) => {
    if (users.some(u => u.email.toLowerCase() === newUser.email.trim().toLowerCase())) {
        alert('A user with this email already exists.');
        return;
    }
    onSendInvite(newUser);
    setIsInviteModalOpen(false);
  };
  
  const handleConfirmRoleChange = () => {
    if (!roleChangeConfirmation) return;
    const { user: member, newRole } = roleChangeConfirmation;
    
    addAuditLog('Role Changed', `Changed ${member.name}'s role from ${member.role} to ${newRole}.`);
    setUsers(currentUsers => currentUsers.map(m => m.id === member.id ? {...m, role: newRole} : m));
    
    setOpenMenuId(null);
    setRoleChangeConfirmation(null);
  };
  
  const handleAddHotelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHotelName.trim()) {
      onAddHotel(newHotelName);
      setHotelSuccessMessage(`Successfully added hotel: "${newHotelName.trim()}"`);
      setNewHotelName('');
      setTimeout(() => setHotelSuccessMessage(''), 3000);
    }
  };
  
  const handleAddDepartmentSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newDepartmentName.trim()) {
          onAddDepartment(newDepartmentName.trim());
          setNewDepartmentName('');
      }
  };

  const handleDeleteHotelClick = (hotel: Hotel) => {
    const confirmationMessage = `Are you sure you want to delete "${hotel.name}"? This will also remove it from any users it is assigned to. This action cannot be undone.`;
    if (window.confirm(confirmationMessage)) {
      onDeleteHotel(hotel.id);
    }
  };
  
  const handleCreateTemplate = (template: InspectionTemplate) => {
    onCreateTemplate(template);
    setIsTemplateModalOpen(false);
  };

  const handleSaveHotelAssignments = (userId: string, newHotelIds: string[]) => {
      setUsers(currentUsers =>
          currentUsers.map(user =>
              user.id === userId ? { ...user, hotelIds: newHotelIds } : user
          )
      );
      const user = users.find(u => u.id === userId);
      addAuditLog('Hotel Assignment Changed', `Updated hotel access for ${user?.name}. They now have access to ${newHotelIds.length} hotel(s).`);
      setAssigningHotelsToUser(null);
  };

  const TabButton: React.FC<{ tabName: AdminTab; label: string; icon: React.ReactNode; }> = ({ tabName, label, icon }) => {
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center gap-2 px-3 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
          isActive
            ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {icon}
        {label}
      </button>
    );
  };
  
  const renderUserManagement = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    User Management
                </h2>
                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Invite New Member
                </button>
             </div>
             
             <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Pending Invitations</h3>
             <div className="space-y-3">
                {pendingUsers.length > 0 ? pendingUsers.map(user => (
                    <div key={user.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email} - <span className="font-medium">{user.role}</span></p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No pending invitations.</p>
                )}
             </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white p-6 border-b border-slate-200 dark:border-slate-700">
                Manage Active Users
            </h2>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {activeUsers.map((member) => (
                <li key={member.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-grow">
                      <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                      <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <RoleBadge role={member.role} />
                      {member.role !== 'Admin' && (
                        <button 
                            onClick={() => setAssigningHotelsToUser(member)} 
                            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          <BuildingOfficeIcon className="w-4 h-4"/>
                          <span>Manage Hotels ({member.hotelIds?.length || 0})</span>
                        </button>
                      )}
                      {currentUser.id !== member.id && (
                          <div className="relative">
                          <button onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)} className="text-slate-500 hover:text-primary-500 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                              </svg>
                          </button>
                          {openMenuId === member.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-10 border dark:border-slate-600">
                              <ul className="py-1 text-sm text-slate-700 dark:text-slate-200">
                                  {(['Admin', 'Editor', 'Viewer'] as const).map(role => (
                                  <li key={role}>
                                      <button
                                          onClick={() => {
                                              setOpenMenuId(null);
                                              if (member.role !== role) {
                                                setRoleChangeConfirmation({ user: member, newRole: role });
                                              }
                                          }}
                                          disabled={member.role === role}
                                          className="w-full text-left block px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                      >
                                          Set as {role}
                                      </button>
                                      </li>
                                  ))}
                              </ul>
                              </div>
                          )}
                          </div>
                      )}
                    </div>
                </li>
                ))}
            </ul>
        </div>
    </div>
  );

  const renderHotelManagement = () => (
     <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">Manage Hotels</h2>
            {hotelSuccessMessage && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-md text-sm">
                    {hotelSuccessMessage}
                </div>
            )}
            <form onSubmit={handleAddHotelSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
                <input 
                    type="text" 
                    value={newHotelName} 
                    onChange={e => setNewHotelName(e.target.value)} 
                    placeholder="New Hotel or Resort Name" 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                    aria-label="New Hotel Name"
                />
                <button type="submit" className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md flex-shrink-0">Add Hotel</button>
            </form>
            <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Existing Hotels:</h3>
                {hotels.length > 0 ? (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700 -mx-6">
                    {hotels.map(hotel => (
                        <li key={hotel.id} className="px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group">
                          <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{hotel.name}</span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{hotel.areas?.length || 0} areas defined</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setManagingAreasForHotel(hotel)} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">Manage Areas</button>
                            <button 
                              onClick={() => handleDeleteHotelClick(hotel)}
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              aria-label={`Delete ${hotel.name}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No hotels added yet.</p>
                )}
            </div>
        </div>
     </div>
  );
  
    const renderTemplateManagement = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
             <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Inspection Templates
                </h2>
                <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex items-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                    <UserPlusIcon className="w-5 h-5" />
                    Create New Template
                </button>
             </div>
             
             <div className="space-y-3">
                {inspectionTemplates.length > 0 ? inspectionTemplates.map(template => (
                    <div key={template.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{template.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{template.department} - {template.questions.length} questions</p>
                    </div>
                )) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No custom templates created yet.</p>
                )}
             </div>
        </div>
    </div>
  );

  const renderDepartmentManagement = () => (
      <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3">Manage Departments</h2>
              <form onSubmit={handleAddDepartmentSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
                  <input
                      type="text"
                      value={newDepartmentName}
                      onChange={e => setNewDepartmentName(e.target.value)}
                      placeholder="New Department Name"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                      aria-label="New Department Name"
                  />
                  <button type="submit" className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md flex-shrink-0 flex items-center gap-2">
                      <PlusCircleIcon className="w-5 h-5"/>
                      Add
                  </button>
              </form>
              <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Existing Departments:</h3>
                  <div className="flex flex-wrap gap-2">
                      {departments.length > 0 ? departments.map(dept => (
                          <div key={dept} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-full border border-slate-200 dark:border-slate-600">
                              <span className="text-slate-800 dark:text-slate-200 text-sm">{dept}</span>
                              <button
                                  onClick={() => onDeleteDepartment(dept)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                                  title={`Remove ${dept}`}
                              >
                                  <XIcon className="w-4 h-4"/>
                              </button>
                          </div>
                      )) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400">No departments added yet.</p>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );

  const renderIntegrationsManagement = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          Manage Integrations
        </h2>
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DriveIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Google Drive Data Sync</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Connect your Google Drive account to save and load all application data.</p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full sm:w-auto">
                    {driveError ? (
                        <div className="relative group flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-semibold py-2 px-4 rounded-lg w-full sm:w-auto">
                           <ExclamationTriangleIcon className="w-5 h-5" />
                           <span>Unavailable</span>
                           <div className="absolute bottom-full mb-2 w-72 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                             {driveError}
                           </div>
                        </div>
                    ) : !isDriveConfigured ? (
                        <div className="relative group flex items-center justify-center gap-2 bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 font-semibold py-2 px-4 rounded-lg w-full sm:w-auto cursor-not-allowed">
                           <ExclamationTriangleIcon className="w-5 h-5" />
                           <span>Not Configured</span>
                           <div className="absolute bottom-full mb-2 w-72 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-md p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Google Drive integration is unavailable. The administrator needs to configure the required API credentials.
                           </div>
                        </div>
                    ) : isDriveConnected ? (
                        <>
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                <CheckIcon className="w-4 h-4" /> Connected
                            </span>
                            <button
                                onClick={onDisconnectDrive}
                                className="text-xs font-semibold text-red-500 hover:underline"
                            >
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onConnectDrive}
                            disabled={isConnecting}
                            className="flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:cursor-wait w-full sm:w-auto"
                        >
                            {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                    )}
                </div>
            </div>
            {driveDataFileId && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Data File Link</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your application data is stored in the following file in your Google Drive:</p>
                <a 
                  href={`https://drive.google.com/file/d/${driveDataFileId}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline break-all"
                >
                  <LinkIcon className="w-4 h-4 flex-shrink-0" />
                  <span>auditors_guide_data.json</span>
                </a>
              </div>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Panel</h1>
        
        <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
            <TabButton tabName="hotels" label="Hotel Management" icon={<BuildingOfficeIcon className="w-5 h-5"/>} />
            <TabButton tabName="users" label="User Management" icon={<TeamIcon className="w-5 h-5"/>} />
            <TabButton tabName="templates" label="Templates" icon={<ClipboardDocumentListIcon className="w-5 h-5"/>} />
            <TabButton tabName="departments" label="Departments" icon={<BriefcaseIcon className="w-5 h-5"/>} />
            <TabButton tabName="integrations" label="Integrations" icon={<LinkIcon className="w-5 h-5"/>} />
          </nav>
        </div>

        <div className="mt-6">
            {activeTab === 'users' && renderUserManagement()}
            {activeTab === 'hotels' && renderHotelManagement()}
            {activeTab === 'templates' && renderTemplateManagement()}
            {activeTab === 'departments' && renderDepartmentManagement()}
            {activeTab === 'integrations' && renderIntegrationsManagement()}
        </div>
        
        {isInviteModalOpen && (
            <InviteUserModal
                onClose={() => setIsInviteModalOpen(false)}
                onSave={handleInviteSave}
                organizationId={currentUser.organizationId}
            />
        )}

        {isTemplateModalOpen && (
            <CreateTemplateModal
                onClose={() => setIsTemplateModalOpen(false)}
                onSave={handleCreateTemplate}
                departments={departments}
                isDriveConfigured={isDriveConfigured}
                isDriveConnected={isDriveConnected}
                isConnecting={isConnecting}
                onConnectDrive={onConnectDrive}
            />
        )}

        {assigningHotelsToUser && (
          <AssignHotelsModal
            user={assigningHotelsToUser}
            hotels={hotels}
            onClose={() => setAssigningHotelsToUser(null)}
            onSave={handleSaveHotelAssignments}
          />
        )}

        {roleChangeConfirmation && (
            <ConfirmRoleChangeModal
                user={roleChangeConfirmation.user}
                newRole={roleChangeConfirmation.newRole}
                onClose={() => setRoleChangeConfirmation(null)}
                onConfirm={handleConfirmRoleChange}
            />
        )}

        {managingAreasForHotel && (
            <ManageAreasModal 
                hotel={managingAreasForHotel}
                onClose={() => setManagingAreasForHotel(null)}
                onSave={onUpdateHotel}
            />
        )}
    </div>
  );
};