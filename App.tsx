import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ChatAssistant } from './components/ChatAssistant';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { getChatResponse } from './services/geminiService';
import { View, User, Document, AuditLogEntry, Sop, SopTemplate, Hotel, InspectionRecord, ChatMessage, InspectionTemplate as InspectionTemplateType, Task, Incident } from './types';
import { MOCK_USERS, MOCK_DOCUMENTS, MOCK_HOTELS, MOCK_INSPECTION_RECORDS, MOCK_INSPECTION_TEMPLATES, MOCK_TASKS, MOCK_INCIDENTS } from './mockData';
import { InspectionPlanner } from './components/InspectionPlanner';
import { IncidentManager } from './components/IncidentManager';
import { SopLibrary } from './components/SopLibrary';
import { initializeGoogleClients, requestAccessToken, revokeToken, ITokenClient } from './services/googleAuthService';
import { findOrCreateDataFile, uploadData, loadData } from './services/googleDriveService';

const App: React.FC = () => {
  const [view, setView] = useState<View | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>(MOCK_HOTELS);
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>(MOCK_INSPECTION_RECORDS);
  const [inspectionTemplates, setInspectionTemplates] = useState<InspectionTemplateType[]>(MOCK_INSPECTION_TEMPLATES);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [departments, setDepartments] = useState<string[]>(['Kitchen', 'Housekeeping', 'Maintenance', 'Front Office', 'Security', 'Food & Beverage', 'Human Resources', 'Sales & Marketing', 'Spa & Recreation']);

  const [sopInitialData, setSopInitialData] = useState<any>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Google Drive & Data Persistence State
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDriveConfigured, setIsDriveConfigured] = useState(true);
  const [googleClientsInitialized, setGoogleClientsInitialized] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const tokenClient = useRef<ITokenClient | null>(null);
  
  const [driveDataFileId, setDriveDataFileId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const isInitialLoad = useRef(true);
  
  const appState = { users, documents, auditLogs, hotels, inspectionRecords, inspectionTemplates, tasks, incidents, departments, theme };

  // This effect tracks changes to any part of the app's data state.
  useEffect(() => {
    if (isInitialLoad.current) return;
    setHasUnsavedChanges(true);
    setSaveStatus('unsaved');
  }, [users, documents, auditLogs, hotels, inspectionRecords, inspectionTemplates, tasks, incidents, departments, theme]);
  
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
    } else {
      setView(null);
    }
  }, [currentUser]);
  
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

  const handleSaveData = useCallback(async () => {
      if (!isDriveConnected || !driveDataFileId) return;

      setSaveStatus('saving');
      try {
          await uploadData(driveDataFileId, appState);
          setHasUnsavedChanges(false);
          setSaveStatus('saved');
          addAuditLog('Data Synced', 'Saved application data to Google Drive.');
      } catch (error) {
          console.error("Failed to save data:", error);
          setSaveStatus('error');
          setDriveError('Failed to save data. Please try again.');
      }
  }, [isDriveConnected, driveDataFileId, appState, addAuditLog]);


  const handleLogout = () => {
    if (hasUnsavedChanges) {
        handleSaveData();
    }
    addAuditLog('User Logged Out', `User ${currentUser?.name} logged out.`);
    setCurrentUser(null);
  };

  const loadDataFromDrive = async (fileId: string) => {
    setIsLoadingData(true);
    try {
        const data = await loadData(fileId);
        isInitialLoad.current = true; // Prevent change detection during load

        setUsers(data.users || MOCK_USERS);
        setDocuments(data.documents || MOCK_DOCUMENTS);
        setAuditLogs(data.auditLogs ? data.auditLogs.map((log:any) => ({...log, timestamp: new Date(log.timestamp)})) : []);
        setHotels(data.hotels || MOCK_HOTELS);
        setInspectionRecords(data.inspectionRecords || MOCK_INSPECTION_RECORDS);
        setInspectionTemplates(data.inspectionTemplates || MOCK_INSPECTION_TEMPLATES);
        setTasks(data.tasks || MOCK_TASKS);
        setIncidents(data.incidents || MOCK_INCIDENTS);
        setDepartments(data.departments || []);
        setTheme(data.theme || 'light');
        addAuditLog('Data Synced', 'Loaded application data from Google Drive.');
    } catch (error) {
        console.error("Failed to load data from drive", error);
        setDriveError("Could not load data from Google Drive. Using local defaults.");
    } finally {
        setIsLoadingData(false);
        setTimeout(() => { isInitialLoad.current = false; }, 500);
    }
  };

  const handleConnectDrive = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setDriveError(null);

    let client = tokenClient.current;

    if (!googleClientsInitialized) {
        try {
            client = await initializeGoogleClients();
            if (client) {
                tokenClient.current = client;
                setGoogleClientsInitialized(true);
                setIsDriveConfigured(true);
            } else {
                const configError = "Google Drive credentials are not configured. Data persistence is disabled.";
                setIsDriveConfigured(false);
                setDriveError(configError);
                setIsConnecting(false);
                setIsLoadingData(false); // Stop loading if drive is not configured
                isInitialLoad.current = false;
                return;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Google client init error.";
            console.error("Failed to initialize Google clients:", errorMessage);
            const userFriendlyError = `Failed to connect to Google services. This can happen if the API key is invalid, has not been configured to use the Google Drive API, or if there's a network issue. Please check the browser console for more details. [${errorMessage}]`;
            setDriveError(userFriendlyError);
            setIsDriveConfigured(false);
            setIsConnecting(false);
            setIsLoadingData(false);
            isInitialLoad.current = false;
            return;
        }
    }

    if (!client) {
        setDriveError("Google client could not be initialized.");
        setIsConnecting(false);
        setIsLoadingData(false);
        isInitialLoad.current = false;
        return;
    }
    
    addAuditLog('Action Initiated', 'Connecting to Google Drive for data sync.');
    
    requestAccessToken(client, async (tokenResponse) => {
      if (tokenResponse.error) {
        const accessError = `Failed to get access token: ${tokenResponse.error_description || tokenResponse.error}`;
        setDriveError(accessError);
        addAuditLog('Integration Failed', 'Failed to connect to Google Drive.');
        setIsDriveConnected(false);
        setIsLoadingData(false);
        isInitialLoad.current = false;
      } else {
        setIsDriveConnected(true);
        addAuditLog('Integration Enabled', 'Successfully connected to Google Drive.');

        // Find or create the data file and load data
        const initialContent = JSON.stringify({ users: MOCK_USERS, documents: MOCK_DOCUMENTS, hotels: MOCK_HOTELS, inspectionRecords: MOCK_INSPECTION_RECORDS, inspectionTemplates: MOCK_INSPECTION_TEMPLATES, tasks: MOCK_TASKS, incidents: MOCK_INCIDENTS, departments: [], auditLogs: [], theme: 'light' }, null, 2);
        const fileId = await findOrCreateDataFile(initialContent);
        setDriveDataFileId(fileId);
        await loadDataFromDrive(fileId);
      }
      setIsConnecting(false);
    });
  };
  
  useEffect(() => {
    // Automatically try to connect to drive on app load.
    handleConnectDrive();
  }, []);


  const handleDisconnectDrive = () => {
    if(isDriveConnected) {
      revokeToken();
      setIsDriveConnected(false);
      addAuditLog('Integration Disabled', 'Disconnected from Google Drive.');
    }
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
      areas: [],
    };
    setHotels(prev => [...prev, newHotel]);
    addAuditLog('Hotel Added', `Added new hotel: ${name}.`);
  };

  const handleUpdateHotel = (updatedHotel: Hotel) => {
    setHotels(prevHotels => prevHotels.map(h => h.id === updatedHotel.id ? updatedHotel : h));
    addAuditLog('Hotel Details Updated', `Updated areas/outlets for ${updatedHotel.name}.`);
  };
  
  const handleDeleteHotel = (hotelId: string) => {
    const hotelToDelete = hotels.find(h => h.id === hotelId);
    if (hotelToDelete) {
      setHotels(prev => prev.filter(h => h.id !== hotelId));
      setUsers(prevUsers => prevUsers.map(user => ({
          ...user,
          hotelIds: user.hotelIds?.filter(id => id !== hotelId) || []
      })));
      addAuditLog('Hotel Removed', `Removed hotel: ${hotelToDelete.name}.`);
    }
  };

  const handleAddDepartment = (name: string) => {
    if (!departments.includes(name)) {
        setDepartments(prev => [...prev, name].sort());
        addAuditLog('Department Added', `Added new department: "${name}"`);
    }
  };

  const handleDeleteDepartment = (name: string) => {
    setDepartments(prev => prev.filter(d => d !== name));
    addAuditLog('Department Removed', `Removed department: "${name}"`);
  };

  const handleCreateInspectionTemplate = (template: InspectionTemplateType) => {
    setInspectionTemplates(prev => [...prev, template]);
    addAuditLog('Inspection Template Created', `Created new template: "${template.name}".`);
  };
  
  const handleAddTask = (
    taskData: Omit<Task, 'id' | 'recurringInstanceId'>, 
    recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; endDate: string; }
  ) => {
    if (!recurring) {
      const newTask: Task = { id: `task-${Date.now()}`, ...taskData };
      setTasks(prev => [...prev, newTask]);
      addAuditLog('Task Created', `Created new task: "${newTask.name}"`);
    } else {
      const newTasks: Task[] = [];
      const recurringInstanceId = `recur-${Date.now()}`;
      const taskDurationDays = Math.max(0, (new Date(taskData.end).getTime() - new Date(taskData.start).getTime()) / (1000 * 3600 * 24));
      let currentDate = new Date(taskData.start + 'T12:00:00Z');
      const finalEndDate = new Date(recurring.endDate + 'T12:00:00Z');

      while (currentDate <= finalEndDate) {
        const taskEndDate = new Date(currentDate);
        taskEndDate.setDate(currentDate.getDate() + taskDurationDays);
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}-${newTasks.length}`,
          recurringInstanceId,
          name: `${taskData.name} (${currentDate.toISOString().split('T')[0]})`,
          start: currentDate.toISOString().split('T')[0],
          end: taskEndDate.toISOString().split('T')[0],
          dependencies: [],
        };
        newTasks.push(newTask);
        switch (recurring.frequency) {
          case 'daily': currentDate.setDate(currentDate.getDate() + 1); break;
          case 'weekly': currentDate.setDate(currentDate.getDate() + 7); break;
          case 'monthly': currentDate.setMonth(currentDate.getMonth() + 1); break;
        }
      }
      setTasks(prev => [...prev, ...newTasks]);
      addAuditLog('Recurring Task Created', `Created ${newTasks.length} instances of recurring task: "${taskData.name}"`);
    }
  };

  const handleUpdateTasks = (updatedTasks: Task[]) => {
    setTasks(currentTasks => {
        const updatedTasksMap = new Map(updatedTasks.map(t => [t.id, t]));
        return currentTasks.map(t => updatedTasksMap.get(t.id) || t);
    });
    addAuditLog('Task(s) Updated', `Updated ${updatedTasks.length} task(s) via the scheduler.`);
  };

  const handleSendMessage = async (message: string) => {
      setChatHistory(prev => [...prev, { sender: 'user', text: message }]);
      setIsChatLoading(true);
      try {
          const stopWords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'what', 'where', 'how', 'who', 'why', 'tell', 'me', 'about', 'of', 'in', 'on', 'for', 'with', 'it', 'you', 'i', 'can', 'show', 'give'];
          const keywords = message.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word && !stopWords.includes(word));
          const relevantDocuments = documents.map(doc => {
                  const docText = `${doc.name} ${doc.tags.join(' ')} ${doc.content || ''}`.toLowerCase();
                  let score = 0;
                  keywords.forEach(keyword => { if (docText.includes(keyword)) score++; });
                  return { doc, score };
              }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3).map(item => item.doc);
          let context: string;
          if (relevantDocuments.length > 0) {
              const referencedDocNames = relevantDocuments.map(d => d.name);
              addAuditLog('AI Assistant Referenced Documents', `AI searched for context in: ${referencedDocNames.join(', ')}`);
              context = "Based on the user's question, here is some context from potentially relevant documents:\n\n" + 
                        relevantDocuments.map(d => `--- Document: ${d.name} ---\n${d.content || ''}`).join('\n\n');
          } else {
              context = "No relevant documents were found in the system regarding the user's query.";
          }
          const response = await getChatResponse(message, context);
          setChatHistory(prev => [...prev, { sender: 'ai', text: response }]);
      } catch (error) {
          setChatHistory(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't get a response. Please try again." }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const handleGetStarted = () => { setLoginError(null); setView(View.Login); };

  const handleLogin = (email: string, password: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'Active');
    if (user && user.password === password) {
      setCurrentUser(user);
      setLoginError(null);
      return true;
    }
    setLoginError("Invalid email or password.");
    return false;
  };

  const handleRegister = (name: string, email: string, password: string): boolean => {
    if (users.length > 0) {
      setLoginError("Registration is disabled. Please contact an administrator for an invite.");
      return false;
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        setLoginError("A user with this email already exists.");
        return false;
    }
    const newUser: User = {
      id: `user-${Date.now()}`, name, email, password, role: 'Admin', status: 'Active',
      avatar: `https://i.pravatar.cc/150?u=${email}`, organizationId: 'org-1', jobTitle: 'Administrator'
    };
    setUsers([newUser]);
    setCurrentUser(newUser);
    addAuditLog('User Registered', `First admin ${name} registered.`);
    setLoginError(null);
    return true;
  };

    if (isLoadingData) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">Loading your data...</p>
                </div>
            </div>
        );
    }
    
  const renderLoggedInView = () => {
    const selectedHotel = selectedHotelId ? hotels.find(h => h.id === selectedHotelId) : null;
    switch (view) {
      case View.Dashboard: return <Dashboard hotel={selectedHotel} auditLogs={auditLogs} users={users} inspectionRecords={inspectionRecords} incidents={incidents} tasks={tasks} />;
      case View.Documents: return <DocumentManager setView={setView} addAuditLog={addAuditLog} documents={documents} setDocuments={setDocuments} onSopCreated={handleSopCreated} isDriveConnected={isDriveConnected} isConnecting={isConnecting} onConnectDrive={handleConnectDrive} currentUser={currentUser!} isDriveConfigured={isDriveConfigured} driveError={driveError} />;
      case View.SopLibrary: return <SopLibrary documents={documents} setDocuments={setDocuments} setView={setView} addAuditLog={addAuditLog} />;
      case View.Inspections: return <InspectionManager records={inspectionRecords} setRecords={setInspectionRecords} hotels={hotels} templates={inspectionTemplates} currentUser={currentUser!} addAuditLog={addAuditLog} />;
      case View.Incidents: return <IncidentManager incidents={incidents} setIncidents={setIncidents} currentUser={currentUser!} users={users} hotels={hotels} addAuditLog={addAuditLog} />;
      case View.Team: return <TeamManager currentUser={currentUser!} users={users} setView={setView} onViewProfile={(user) => { setProfileUser(user); setView(View.UserProfile); }} />;
      case View.AuditLog: return <AuditLogView auditLogs={auditLogs} />;
      case View.Settings: return <Settings onOpenChangePassword={() => setIsChangePasswordOpen(true)} />;
      case View.SopGenerator: return <SopGenerator setView={setView} addAuditLog={addAuditLog} onSaveSop={handleSaveSop} initialData={sopInitialData} onClearInitialData={() => setSopInitialData(null)} />;
      case View.SopTemplates: return <SopTemplates setView={setView} onSelectTemplate={handleSelectSopTemplate} onStartFromScratch={() => { setSopInitialData(null); setView(View.SopGenerator); }} />;
      case View.AdminPanel: return <AdminPanel users={users} setUsers={setUsers} onSendInvite={handleInviteUser} addAuditLog={addAuditLog} currentUser={currentUser!} hotels={hotels} onAddHotel={handleAddHotel} onDeleteHotel={handleDeleteHotel} onUpdateHotel={handleUpdateHotel} inspectionTemplates={inspectionTemplates} onCreateTemplate={handleCreateInspectionTemplate} departments={departments} onAddDepartment={handleAddDepartment} onDeleteDepartment={handleDeleteDepartment} isDriveConnected={isDriveConnected} isConnecting={isConnecting} onConnectDrive={handleConnectDrive} onDisconnectDrive={handleDisconnectDrive} isDriveConfigured={isDriveConfigured} driveError={driveError} driveDataFileId={driveDataFileId} />;
      case View.UserProfile: return profileUser ? <UserProfile user={profileUser} allHotels={hotels} auditLogs={auditLogs} onBack={() => setView(View.Team)} /> : null;
      case View.Reporting: return <Reporting records={inspectionRecords} hotels={hotels} />;
      case View.Scheduler: return <Scheduler tasks={tasks} users={users} onAddTask={handleAddTask} onUpdateTasks={handleUpdateTasks} />;
      case View.Planner: return <InspectionPlanner hotels={hotels} templates={inspectionTemplates} users={users} />;
      default: return <Dashboard hotel={selectedHotel} auditLogs={auditLogs} users={users} inspectionRecords={inspectionRecords} incidents={incidents} tasks={tasks} />;
    }
  };
  
  if (!currentUser) {
      if (view === View.Login) { return <Login onLogin={handleLogin} onRegister={handleRegister} error={loginError} onBack={() => { setLoginError(null); setView(null); }} isInitialSetup={users.length === 0} /> }
      return <AppCatalog onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar view={view} setView={setView} onLogout={handleLogout} user={currentUser} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (<div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={() => setIsSidebarOpen(false)} aria-hidden="true" />)}
      <div className="flex-1 flex flex-col overflow-hidden">
         <Header view={view} user={currentUser} hotels={hotels} selectedHotelId={selectedHotelId} onSelectHotel={setSelectedHotelId} theme={theme} onToggleTheme={handleToggleTheme} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onSaveData={handleSaveData} saveStatus={saveStatus} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900">
          {renderLoggedInView()}
        </main>
      </div>

      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal user={currentUser} onClose={() => setIsChangePasswordOpen(false)} onSave={(newPassword) => {
            const updatedUser = { ...currentUser, password: newPassword };
            setCurrentUser(updatedUser);
            setUsers(us => us.map(u => u.id === currentUser.id ? updatedUser : u));
            addAuditLog('Password Changed', 'User changed their password.');
            setIsChangePasswordOpen(false);
          }} />
      )}
      {currentUser && (
        <>
            <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-transform transform hover:scale-110 z-40" aria-label="Open AI Assistant">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.08-3.239A8.93 8.93 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.72 14.28A7 7 0 0010 16a7 7 0 007-7c0-2.846-2.6-5-6-5S4 7.154 4 10c0 .724.182 1.418.504 2.053l-.336.999.952-.372z" clipRule="evenodd" /></svg>
            </button>
            <ChatAssistant isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} history={chatHistory} onSendMessage={handleSendMessage} isLoading={isChatLoading} />
        </>
      )}
    </div>
  );
};

export default App;