
import React, { useState, useMemo } from 'react';
import { User, Hotel } from '../types';
import { MailIcon, TeamIcon, BuildingOfficeIcon } from './icons';

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
  onSendInvite: (name: string, email: string, role: User['role']) => void;
  addAuditLog: (action: string, details: string) => void;
  currentUser: User;
  hotels: Hotel[];
  onAddHotel: (name: string) => void;
}

type AdminTab = 'users' | 'hotels';

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, setUsers, onSendInvite, addAuditLog, currentUser, hotels, onAddHotel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<User['role']>('Viewer');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newHotelName, setNewHotelName] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const pendingUsers = useMemo(() => users.filter(u => u.status === 'Pending'), [users]);
  const activeUsers = useMemo(() => users.filter(u => u.status === 'Active'), [users]);

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        setError('A user with this email already exists.');
        return;
    }

    onSendInvite(name.trim(), email.trim(), role);
    setSuccessMessage(`Invite sent successfully to ${email.trim()}!`);
    setName('');
    setEmail('');
    setRole('Viewer');
    setTimeout(() => setSuccessMessage(''), 5000);
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleRoleChange = (member: User, newRole: User['role']) => {
    if (member.role === newRole) {
      setOpenMenuId(null);
      return;
    };
    
    addAuditLog('Role Changed', `Changed ${member.name}'s role from ${member.role} to ${newRole}.`);
    setUsers(currentUsers => currentUsers.map(m => m.id === member.id ? {...m, role: newRole} : m));
    setOpenMenuId(null);
  };
  
  const handleAddHotelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newHotelName.trim()) {
      onAddHotel(newHotelName);
      setNewHotelName('');
    }
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
        {/* Invite Form Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <MailIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Send New Invitation</h2>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input id="reg-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                    </div>
                     <div>
                        <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                        <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                    </div>
                </div>
                <div>
                    <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                    <select id="reg-role" value={role} onChange={e => setRole(e.target.value as User['role'])} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                        <option value="Viewer">Viewer</option>
                        <option value="Editor">Editor</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>
                 <div className="flex justify-end">
                    <button type="submit" className="bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md">
                        Send Invite
                    </button>
                </div>
            </form>
        </div>
        
        {/* Pending Invitations List Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
             <h2 className="text-xl font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
                Pending Invitations
             </h2>
             <div className="space-y-3">
                {pendingUsers.length > 0 ? pendingUsers.map(user => (
                    <div key={user.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email} - <span className="font-medium">{user.role}</span></p>
                        </div>
                         <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span>Verification Code:</span>
                            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                                <span className="font-bold tracking-widest text-primary-600 dark:text-primary-400">{user.verificationCode}</span>
                                <button type="button" onClick={() => handleCopyCode(user.verificationCode!)} className="text-slate-500 hover:text-primary-500 transition-colors" aria-label="Copy code">
                                    {copiedCode === user.verificationCode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No pending invitations.</p>
                )}
             </div>
        </div>

        {/* Active Users List Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white p-6 border-b border-slate-200 dark:border-slate-700">
                Manage Active Users
            </h2>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {activeUsers.map((member) => (
                <li key={member.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{member.email}</p>
                    </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
                    <RoleBadge role={member.role} />
                    {currentUser.id !== member.id && (
                        <div className="relative">
                        <button onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)} className="text-slate-500 hover:text-primary-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                        </button>
                        {openMenuId === member.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-10 border dark:border-slate-600">
                            <ul className="py-1 text-sm text-slate-700 dark:text-slate-200">
                                {(['Admin', 'Editor', 'Viewer'] as const).map(role => (
                                <li key={role}>
                                    <button
                                        onClick={() => handleRoleChange(member, role)}
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
            <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Existing Hotels:</h3>
                {hotels.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                    {hotels.map(hotel => (
                        <li key={hotel.id}>{hotel.name}</li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No hotels added yet.</p>
                )}
            </div>
        </div>
     </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Panel</h1>
        
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <TabButton tabName="users" label="User Management" icon={<TeamIcon className="w-5 h-5"/>} />
            <TabButton tabName="hotels" label="Hotel Management" icon={<BuildingOfficeIcon className="w-5 h-5"/>} />
          </nav>
        </div>

        <div className="mt-6">
            {activeTab === 'users' && renderUserManagement()}
            {activeTab === 'hotels' && renderHotelManagement()}
        </div>
    </div>
  );
};
