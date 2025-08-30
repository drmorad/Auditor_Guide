
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocumentManager } from './components/DocumentManager';
import { TeamManager } from './components/TeamManager';
import { SopGenerator } from './components/SopGenerator';
import { AuditLogView } from './components/AuditLog';
import { SopTemplates } from './components/SopTemplates';
import { InspectionManager } from './components/InspectionManager';
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { AdminPanel } from './components/AdminPanel';
import { View, AuditLogEntry, Document, SopTemplate, User, Hotel, InspectionTemplate } from './types';

const initialHotels: Hotel[] = [
    { id: 'hotel-1', name: 'Grand Hyatt Resort' },
    { id: 'hotel-2', name: 'Seaside Palace' },
];

const initialUsers: User[] = [
    { id: '1', name: 'Default Admin', email: 'admin@opsdocs.com', password: 'Admin123!', role: 'Admin', avatar: 'https://picsum.photos/id/1011/100/100', status: 'Active', hotelIds: ['hotel-1', 'hotel-2'] },
    { id: '2', name: 'Bob Williams', email: 'editor@example.com', password: 'password', role: 'Editor', avatar: 'https://picsum.photos/id/1012/100/100', status: 'Active', hotelIds: ['hotel-1'] },
    { id: '3', name: 'Charlie Brown', email: 'viewer@example.com', password: 'password', role: 'Viewer', avatar: 'https://picsum.photos/id/1013/100/100', status: 'Active', hotelIds: ['hotel-2'] },
    { id: '4', name: 'Diana Prince (Pending)', email: 'new@example.com', role: 'Editor', avatar: 'https://picsum.photos/id/1014/100/100', status: 'Pending', verificationCode: '123456', hotelIds: ['hotel-1'] },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.Dashboard);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sopTemplateData, setSopTemplateData] = useState<{ topic: string; details: string; } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(initialUsers[0]);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>(initialHotels);
  const [activeHotelId, setActiveHotelId] = useState<string | null>(initialHotels[0]?.id || null);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    { id: 'log-2', action: 'Team Member Invited', user: 'Admin', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), details: 'Invited charlie.b@example.com as Viewer.' },
    { id: 'log-1', action: 'System Initialized', user: 'System', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), details: 'OpsDocs platform successfully started.' },
  ]);

  const addAuditLog = useCallback((action: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: new Date().toISOString(),
      timestamp: new Date(),
      user: currentUser?.name || 'System',
      action,
      details,
    };
    setAuditLogs(prevLogs => [newLog, ...prevLogs]);
  }, [currentUser]);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  }, []);

  const handleSelectSopTemplate = useCallback((template: SopTemplate) => {
    setSopTemplateData({ topic: template.title, details: template.details });
    addAuditLog('SOP Template Selected', `Selected template: "${template.title}"`);
    setCurrentView(View.SopGenerator);
  }, [addAuditLog]);
  
  const handleGenerateSopFromInspectionTemplate = useCallback((template: InspectionTemplate) => {
    const topic = template.name;
    const details = template.items.map(item => `- ${item.text}`).join('\n');
    setSopTemplateData({ topic, details });
    addAuditLog('SOP Generation Initiated', `Initiated SOP generation from inspection template: "${template.name}"`);
    setCurrentView(View.SopGenerator);
  }, [addAuditLog]);

  const handleStartSopFromScratch = useCallback(() => {
    setSopTemplateData(null);
    setCurrentView(View.SopGenerator);
  }, []);
  
  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.status === 'Active' && user.password === password) {
      setCurrentUser(user);
      setActiveHotelId(user.hotelIds?.[0] || null);
      addAuditLog('User Logged In', `User ${user.name} logged in.`);
      setLoginError(null);
      return true;
    } else {
      setLoginError('Invalid credentials or account not active.');
      return false;
    }
  };
  
  const handleActivateUser = (email: string, code: string, password: string): boolean => {
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'Pending');
      if (userIndex === -1) {
          setLoginError('Email not found or account already active.');
          return false;
      }
      const user = users[userIndex];
      if (user.verificationCode !== code) {
          setLoginError('Invalid verification code.');
          return false;
      }

      const updatedUser: User = { ...user, password, status: 'Active', verificationCode: undefined };
      setUsers(prev => prev.map((u, i) => i === userIndex ? updatedUser : u));
      setCurrentUser(updatedUser);
      setActiveHotelId(updatedUser.hotelIds?.[0] || null);
      addAuditLog('User Account Activated', `User ${user.name} activated their account.`);
      setLoginError(null);
      return true;
  };

  const handleLoginAsGuest = () => {
    const guestUser: User = { 
      id: 'guest',
      name: 'Guest User', 
      email: 'guest@example.com',
      role: 'Viewer',
      avatar: 'https://picsum.photos/id/1005/100/100',
      status: 'Active',
      hotelIds: [initialHotels[0].id]
    };
    setCurrentUser(guestUser);
    setActiveHotelId(guestUser.hotelIds?.[0] || null);
    addAuditLog('User Logged In', 'A guest user logged in.');
  };

  const handleLogout = () => {
    addAuditLog('User Logged Out', `User ${currentUser?.name} logged out.`);
    setCurrentUser(null);
    setCurrentView(View.Dashboard);
  };
  
  const handleSendInvite = (name: string, email: string, role: User['role']) => {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newUser: User = {
          id: new Date().toISOString(),
          name,
          email,
          role,
          avatar: `https://picsum.photos/seed/${name}/100/100`,
          status: 'Pending',
          verificationCode,
          hotelIds: activeHotelId ? [activeHotelId] : [],
      };
      setUsers(prev => [...prev, newUser]);
      addAuditLog('User Invite Sent', `Invite sent to ${email} with role ${role}. Code: ${verificationCode}`);
  };
  
  const handlePasswordChange = (newPassword: string) => {
      if (!currentUser) return;
      setUsers(prevUsers => prevUsers.map(user => 
          user.id === currentUser.id 
          ? { ...user, password: newPassword }
          : user
      ));
      setCurrentUser(prev => prev ? { ...prev, password: newPassword } : null);
      addAuditLog('Password Changed', `User ${currentUser.name} changed their password.`);
      setIsChangePasswordModalVisible(false);
  };

  const handleAddHotel = (hotelName: string) => {
    const newHotel: Hotel = {
      id: `hotel-${new Date().toISOString()}`,
      name: hotelName.trim(),
    };
    setHotels(prev => [...prev, newHotel]);
    if (currentUser?.role === 'Admin') {
      const adminHotelIds = [...(currentUser.hotelIds || []), newHotel.id];
      const updatedAdmin = { ...currentUser, hotelIds: adminHotelIds };
      setCurrentUser(updatedAdmin);
      setUsers(prevUsers => prevUsers.map(u => u.id === currentUser.id ? updatedAdmin : u));
    }
    addAuditLog('Hotel Added', `New hotel created: "${newHotel.name}"`);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} onLoginAsGuest={handleLoginAsGuest} onActivate={handleActivateUser} error={loginError} />;
  }

  const activeHotel = hotels.find(h => h.id === activeHotelId) || null;

  const renderView = () => {
    switch (currentView) {
      case View.Dashboard:
        return <Dashboard hotel={activeHotel} auditLogs={auditLogs} users={users} />;
      case View.Documents:
        return <DocumentManager setView={setCurrentView} addAuditLog={addAuditLog} />;
      case View.Inspections:
        return <InspectionManager 
                  addAuditLog={addAuditLog} 
                  activeHotel={activeHotel}
                  onGenerateSop={handleGenerateSopFromInspectionTemplate}
                />;
      case View.Team:
        return <TeamManager 
                  currentUser={currentUser} 
                  users={users} 
                  setView={setCurrentView}
                />;
      case View.AdminPanel:
         return <AdminPanel
                  currentUser={currentUser}
                  users={users}
                  setUsers={setUsers}
                  onSendInvite={handleSendInvite}
                  addAuditLog={addAuditLog}
                  hotels={hotels}
                  onAddHotel={handleAddHotel}
                />;
      case View.SopTemplates:
        return <SopTemplates 
          onSelectTemplate={handleSelectSopTemplate} 
          onStartFromScratch={handleStartSopFromScratch}
          setView={setCurrentView}
        />;
      case View.SopGenerator:
        return <SopGenerator setView={setCurrentView} addAuditLog={addAuditLog} initialData={sopTemplateData} />;
      case View.AuditLog:
        return <AuditLogView auditLogs={auditLogs} />;
      case View.Settings:
        return <Settings onOpenChangePassword={() => setIsChangePasswordModalVisible(true)} />;
      default:
        return <Dashboard hotel={activeHotel} auditLogs={auditLogs} users={users} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        hotels={hotels}
        activeHotelId={activeHotelId}
        setActiveHotelId={setActiveHotelId}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        {renderView()}
      </main>
      
      {isChangePasswordModalVisible && currentUser && (
        <ChangePasswordModal
            user={currentUser}
            onClose={() => setIsChangePasswordModalVisible(false)}
            onSave={handlePasswordChange}
        />
      )}
    </div>
  );
};

export default App;
