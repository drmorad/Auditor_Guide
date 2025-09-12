import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocumentManager } from './components/DocumentManager';
import { SopGenerator } from './components/SopGenerator';
import { SopTemplates } from './components/SopTemplates';
import { TeamManager } from './components/TeamManager';
import { AuditLogView } from './components/AuditLog';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { UserProfile } from './components/UserProfile';
import { InspectionManager } from './components/InspectionManager';
import { Reporting } from './components/Reporting';
import { Scheduler } from './components/Scheduler';
import { AppCatalog } from './components/AppCatalog';
import { Login } from './components/Login';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ChatAssistant } from './components/ChatAssistant';
import { Header } from './components/Header';
import { getChatResponse } from './services/geminiService';
import { View, User, Document, AuditLogEntry, Sop, SopTemplate, Hotel, InspectionRecord, ChatMessage, InspectionTemplate as InspectionTemplateType } from './types';
import { MOCK_USERS, MOCK_DOCUMENTS, MOCK_HOTELS, MOCK_INSPECTION_RECORDS, MOCK_INSPECTION_TEMPLATES } from './mockData';

const APP_STORAGE_PREFIX = 'auditorsguide_';

// Helper function to get item from localStorage
const getStoredItem = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(`${APP_STORAGE_PREFIX}${key}`);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper function to set item in localStorage
const setStoredItem = <T,>(key: string, value: T) => {
    try {
        localStorage.setItem(`${APP_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};


const App: React.FC = () => {
  const [view, setView] = useState<View | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => getStoredItem('users', MOCK_USERS));
  const [documents, setDocuments] = useState<Document[]>(() => getStoredItem('documents', MOCK_DOCUMENTS));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getStoredItem('auditLogs', []));
  const [hotels, setHotels] = useState<Hotel[]>(() => getStoredItem('hotels', MOCK_HOTELS));
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>(() => getStoredItem('inspectionRecords', MOCK_INSPECTION_RECORDS));
  const [inspectionTemplates, setInspectionTemplates] = useState<InspectionTemplateType[]>(() => getStoredItem('inspectionTemplates', MOCK_INSPECTION_TEMPLATES));
  const [sopInitialData, setSopInitialData] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getStoredItem('theme', 'light'));
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // --- Data Persistence Effects ---
  useEffect(() => { setStoredItem('users', users); }, [users]);
  useEffect(() => { setStoredItem('documents', documents); }, [documents]);
  useEffect(() => { setStoredItem('auditLogs', auditLogs); }, [auditLogs]);
  useEffect(() => { setStoredItem('hotels', hotels); }, [hotels]);
  useEffect(() => { setStoredItem('inspectionRecords', inspectionRecords); }, [inspectionRecords]);
  useEffect(() => { setStoredItem('inspectionTemplates', inspectionTemplates); }, [inspectionTemplates]);
  useEffect(() => { setStoredItem('theme', theme); }, [theme]);

  const addAuditLog = useCallback((action: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLogEntry = {
      id: new Date().toISOString(),
      action,
      details,
      user: currentUser.name,
      timestamp: new Date(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setView(View.Dashboard);
      addAuditLog('User Logged In', `User ${currentUser.name} logged in.`);
    } else {
      setView(null); // Show AppCatalog if not logged in
    }
  }, [currentUser, addAuditLog]);
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  const handleToggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    addAuditLog('Theme Changed', `Switched to ${theme === 'light' ? 'dark' : 'light'} mode.`);
  };

  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email && u.password === password && u.status !== 'Pending');
    if (user) {
      setCurrentUser(user);
      setLoginError(null);
      // If user was pending, set them to active upon first login
      if (user.status === 'Pending') {
          const updatedUsers = users.map(u => u.id === user.id ? { ...u, status: 'Active' as const } : u);
          setUsers(updatedUsers);
      }
      return true;
    }
    setLoginError('Invalid credentials or account not active.');
    return false;
  };
  
  const handleRegister = (name: string, email: string, password: string): boolean => {
    if (users.some(u => u.email === email)) {
      setLoginError('An account with this email already exists.');
      return false;
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      role: 'Admin',
      status: 'Active',
      organizationId: 'org-1',
      hotelIds: [],
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setLoginError(null);
    return true;
  };
  
  const handleLogout = () => {
    addAuditLog('User Logged Out', `User ${currentUser?.name} logged out.`);
    setCurrentUser(null);
  };
  
  const handleSopCreated = (sop: Sop) => {
    setSopInitialData(sop);
    setView(View.SopGenerator);
    addAuditLog('SOP Drafted', `AI drafted SOP: "${sop.title}"`);
  };

  const handleSaveSop = (docData: { name: string; category: Document['category']; tags: string[]; content: string; }) => {
    const newDoc: Document = {
      id: new Date().toISOString(),
      name: docData.name,
      category: docData.category,
      tags: docData.tags,
      content: docData.content,
      type: 'text/plain',
      lastModified: new Date().toISOString().split('T')[0],
      modifiedBy: currentUser?.name || 'System',
      organizationId: currentUser?.organizationId || 'org-1',
      notes: [],
    };
    setDocuments(prev => [newDoc, ...prev]);
    addAuditLog('SOP Saved', `Saved SOP as document: "${docData.name}"`);
    setView(View.Documents);
  };
  
  const handleSelectSopTemplate = (template: SopTemplate) => {
    setSopInitialData({ topic: template.title, details: template.details });
    setView(View.SopGenerator);
  };
  
  const handleInviteUser = (user: Omit<User, 'id' | 'avatar'>) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      avatar: `https://i.pravatar.cc/150?u=${user.email}`,
      ...user,
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('Team Member Invited', `Invited ${user.name} (${user.email}) as ${user.role}.`);
  };
  
  const handleAddHotel = (name: string) => {
    const newHotel: Hotel = {
      id: `hotel-${Date.now()}`,
      name,
    };
    setHotels(prev => [...prev, newHotel]);
    addAuditLog('Hotel Added', `Added new hotel: ${name}.`);
  };

  const handleCreateInspectionTemplate = (template: InspectionTemplateType) => {
    setInspectionTemplates(prev => [...prev, template]);
    addAuditLog('Inspection Template Created', `Created new template: "${template.name}".`);
  };

  const handleSendMessage = async (message: string) => {
      setChatHistory(prev => [...prev, { sender: 'user', text: message }]);
      setIsChatLoading(true);
      try {
          const context = documents.map(d => `Document: ${d.name}\nContent: ${d.content || ''}`).join('\n\n---\n\n');
          const response = await getChatResponse(message, context);
          setChatHistory(prev => [...prev, { sender: 'ai', text: response }]);
      } catch (error) {
          setChatHistory(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't get a response. Please try again." }]);
      } finally {
          setIsChatLoading(false);
      }
  };


  const renderView = () => {
    if (!currentUser) {
      return (
        <div className="flex-grow bg-slate-100 dark:bg-slate-900">
          <Login onLogin={handleLogin} onRegister={handleRegister} error={loginError} onBack={() => setView(null)} />
        </div>
      );
    }

    const selectedHotel = selectedHotelId ? hotels.find(h => h.id === selectedHotelId) : null;

    switch (view) {
      case View.Dashboard:
        return <Dashboard hotel={selectedHotel} auditLogs={auditLogs} users={users} />;
      case View.Documents:
        return <DocumentManager setView={setView} addAuditLog={addAuditLog} documents={documents} setDocuments={setDocuments} onSopCreated={handleSopCreated} />;
      case View.Inspections:
        return <InspectionManager records={inspectionRecords} setRecords={setInspectionRecords} hotels={hotels} templates={inspectionTemplates} currentUser={currentUser} addAuditLog={addAuditLog} />;
      case View.Team:
        return <TeamManager currentUser={currentUser} users={users} setView={setView} onViewProfile={(user) => { setProfileUser(user); setView(View.UserProfile); }} />;
      case View.AuditLog:
        return <AuditLogView auditLogs={auditLogs} />;
      case View.Settings:
        return <Settings onOpenChangePassword={() => setIsChangePasswordOpen(true)} />;
      case View.SopGenerator:
        return <SopGenerator setView={setView} addAuditLog={addAuditLog} onSaveSop={handleSaveSop} initialData={sopInitialData} onClearInitialData={() => setSopInitialData(null)} />;
      case View.SopTemplates:
        return <SopTemplates setView={setView} onSelectTemplate={handleSelectSopTemplate} onStartFromScratch={() => { setSopInitialData(null); setView(View.SopGenerator); }} />;
      case View.AdminPanel:
        return <AdminPanel users={users} setUsers={setUsers} onSendInvite={handleInviteUser} addAuditLog={addAuditLog} currentUser={currentUser} hotels={hotels} onAddHotel={handleAddHotel} inspectionTemplates={inspectionTemplates} onCreateTemplate={handleCreateInspectionTemplate} />;
      case View.UserProfile:
        return profileUser ? <UserProfile user={profileUser} allHotels={hotels} auditLogs={auditLogs} onBack={() => setView(View.Team)} /> : null;
      case View.Reporting:
        return <Reporting records={inspectionRecords} hotels={hotels} />;
       case View.Scheduler:
        return <Scheduler/>;
      default:
        return <Dashboard hotel={selectedHotel} auditLogs={auditLogs} users={users} />;
    }
  };

  if (view === null) {
      return <AppCatalog onGetStarted={() => setView(View.Dashboard)} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {currentUser && <Sidebar view={view} setView={setView} onLogout={handleLogout} user={currentUser} />}
      
      {currentUser ? (
        <div className="flex-1 flex flex-col overflow-hidden">
           <Header
            view={view}
            user={currentUser}
            hotels={hotels}
            selectedHotelId={selectedHotelId}
            onSelectHotel={setSelectedHotelId}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
          <main className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900">
            {renderView()}
          </main>
        </div>
      ) : (
         <main className="flex-1 overflow-y-auto">
            {renderView()}
         </main>
      )}

      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal
          user={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onSave={(newPassword) => {
            setCurrentUser(u => u ? {...u, password: newPassword} : null);
            setUsers(us => us.map(u => u.id === currentUser.id ? {...u, password: newPassword} : u));
            addAuditLog('Password Changed', 'User changed their password.');
            setIsChangePasswordOpen(false);
          }}
        />
      )}
      {currentUser && (
        <>
            <button
                onClick={() => setIsChatOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform transform hover:scale-110 z-40"
                aria-label="Open AI Assistant"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.08-3.239A8.93 8.93 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.72 14.28A7 7 0 0010 16a7 7 0 007-7c0-2.846-2.6-5-6-5S4 7.154 4 10c0 .724.182 1.418.504 2.053l-.336.999.952-.372z" clipRule="evenodd" /></svg>
            </button>
            <ChatAssistant
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                history={chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isChatLoading}
            />
        </>
      )}
    </div>
  );
};

export default App;
