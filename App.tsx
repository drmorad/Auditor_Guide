

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocumentManager } from './components/DocumentManager';
import { TeamManager } from './components/TeamManager';
import { Login } from './components/Login';
import { AuditLogView } from './components/AuditLog';
import { SopGenerator } from './components/SopGenerator';
import { SopTemplates } from './components/SopTemplates';
import { Settings } from './components/Settings';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { InspectionManager } from './components/InspectionManager';
import { AdminPanel } from './components/AdminPanel';
import { UserProfile } from './components/UserProfile';

import { View, User, AuditLogEntry, Document, SopTemplate, InspectionTemplate, Hotel, InspectionRecord } from './types';

// --- INITIAL CLIENT SETUP (SEED DATA) ---
// This section simulates a database for a new client.
const ORG_ID = 'org_hygiene_manager_group'; // Unique ID for this client organization

const initialDocuments: Document[] = [
  { id: '7', name: 'HACCP - Day 4.pdf', category: 'Team File', tags: [], lastModified: '2025-08-29', modifiedBy: 'Current User', type: 'application/pdf', embedLink: 'https://drive.google.com/file/d/1yjwZ6k3-L2D5-gH-AN532e-4-y5C-bYt/preview', notes: [], organizationId: ORG_ID },
  { id: '1', name: 'Hand Washing Procedure', category: 'SOP', tags: ['hygiene', 'staff'], lastModified: '2024-07-28', modifiedBy: 'Jane Doe', content: `Purpose: To ensure all staff follow a standardized procedure for hand washing to prevent cross-contamination.\n\nProcedure:\n1. Wet hands with running water.\n2. Apply soap and lather for at least 20 seconds, covering all surfaces.\n3. Rinse hands thoroughly under running water.\n4. Dry hands with a single-use towel.`, type: 'text/plain', notes: [], organizationId: ORG_ID },
  { id: '2', name: 'Cold Storage Temperature Log', category: 'HACCP', tags: ['temperature', 'food safety'], lastModified: '2024-07-27', modifiedBy: 'John Smith', content: `This document is used to log the temperature of all cold storage units (refrigerators and freezers) three times daily. This is a critical control point for food safety.\n\nInstructions:\n- Record the temperature at 9 AM, 2 PM, and 8 PM.\n- If any temperature is outside the safe range (below 4°C for fridges, below -18°C for freezers), report to the manager immediately.`, type: 'text/plain', notes: [], organizationId: ORG_ID },
  { id: '3', name: 'Q3 Internal Audit', category: 'Audit', tags: ['compliance', 'quarterly'], lastModified: '2024-07-25', modifiedBy: 'Admin', content: `Summary of Q3 Internal Audit Findings:\n\nOverall Score: 92%\n\nStrengths:\n- Excellent adherence to hand washing protocols.\n- Accurate and consistent temperature logging.\n\nAreas for Improvement:\n- Chemical storage needs better labeling.\n- One fire extinguisher was found to be past its inspection date.`, type: 'text/plain', notes: [], organizationId: ORG_ID },
  { id: '4', name: 'Onboarding Checklist', category: 'Team File', tags: ['hr', 'new staff'], lastModified: '2024-07-20', modifiedBy: 'Jane Doe', content: `New Staff Onboarding Checklist:\n\n[ ] Complete HR paperwork.\n[ ] Issue uniform and name tag.\n[ ] Tour of the facility.\n[ ] Introduction to team members.\n[ ] Review of key SOPs (Hand Washing, Emergency Plan).\n[ ] Shadow a senior team member for one shift.`, type: 'text/plain', notes: [], organizationId: ORG_ID },
  { id: '5', name: 'Emergency Evacuation Plan', category: 'SOP', tags: ['safety', 'emergency'], lastModified: '2024-07-15', modifiedBy: 'Admin', content: `In case of fire or other emergency requiring evacuation:\n\n1. Upon hearing the alarm, cease all work immediately.\n2. Proceed to the nearest marked exit.\n3. Do not use elevators.\n4. Assemble at the designated meeting point in the main parking lot.\n5. Await further instructions from the safety coordinator.`, type: 'text/plain', notes: [], organizationId: ORG_ID },
  { id: '6', name: 'Kitchen Layout Diagram.png', category: 'Team File', tags: ['diagram', 'safety'], lastModified: '2024-07-12', modifiedBy: 'Jane Doe', content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuNWRHWFIAAE4pSURBVHhe7d15VFTXvvDx+d2547pLDs/dZccwGhcTcxz33E1N99Rcc0zjvcvMVQc/zJ3cO1M33T090wM4GcFABkUURMFFFAEFsRBRQYosUAS7g+yA7O7sLrv/9ofAQQMzc3d+f2Am9fn+eN5n7j3nnvO9p/c5555n/Pnz58/v999/T7du3TpssQjV6tWrV1tYWFhfffWV/dSpU3bv3j38gQMH7JkzZ+xLL72037t3z+7fv2+/efOm/e677+zll19e+vHHH21xcbFdt25dwV27drVFixYt5YkTJ2y3bt3s+vXrKz/88IPdu3fP3rBhg923b59Vq1ZtbGtrY8ePH9/w+/fv2927d1d+/PFH+/LLL9vt27ft4cOH+/Dhg3327JnduXPHvvLKK/bll1+2jz/+uN2/f98+ffq0zZ8/v2zcuLFdu3ZNiYg/WlhYWBERESkiIqK4uLhK4uLiysrKyiY3N7c8PDzse/fucXgHBwft1NRUe/v2bXt5ebk9Pj5uN27cWBYWFvpPf4iIiGjevHnK0NBQu2/fPiUjI6OUlJSU7t27pxQVFZXu3r2rHD16tLx69WopKCgoRUdHVyIiIsqZM2fsqVOn7JkzZ+wJEyZoR0dHu2TJkv2MGTPssWPH7OPHj21paWnZunVrKygoaO3YsWM5cuSIfe3atQ1t27a1Xbt2tW+//ba1devWduHCBXtqaqpdsWJF2759e9u5c2fZtWtXe/bsmf3pT39qHTp0aPzxxx/thx9+aD///HP7/fffW/v27dsff/zR+vXXX9vWrVtbixYtavz+++9ty5YtbceOHa1169a19evXt/3796/x/Pnz8uDBg3bkyJFl586dJSUlpaSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKC-9gI/AAAAAAAAAACgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKC-Ag/APYE2kDu7WDQAAAABJRU5erkJggg==', type: 'image/png', notes: [], organizationId: ORG_ID },
  { id: '8', name: 'Competitor Manual', category: 'SOP', tags: ['secret'], lastModified: '2024-01-01', modifiedBy: 'Other Manager', content: `This document should not be visible to the Hygiene Manager's team.`, type: 'text/plain', notes: [], organizationId: 'org_other' },
];

const initialHotels: Hotel[] = [
    { id: 'hotel1', name: 'Grand Hyatt Resort', organizationId: ORG_ID },
    { id: 'hotel2', name: 'Seaside Palace', organizationId: ORG_ID },
    // A hotel for another org to demonstrate isolation
    { id: 'hotel3', name: 'Competitor Hotel', organizationId: 'org_other' },
];

const initialUsers: User[] = [
    // --- The Hygiene Manager's Team ---
    {
        id: 'user1',
        name: 'Hygiene Manager',
        email: 'manager@example.com',
        password: 'password123',
        role: 'Admin',
        avatar: `https://i.pravatar.cc/150?u=user1`,
        status: 'Active',
        hotelIds: ['hotel1', 'hotel2'],
        organizationId: ORG_ID,
    },
    {
        id: 'user2',
        name: 'Assistant One',
        email: 'assistant1@example.com',
        password: 'password123',
        role: 'Editor',
        avatar: `https://i.pravatar.cc/150?u=user2`,
        status: 'Active',
        hotelIds: ['hotel1'],
        organizationId: ORG_ID,
    },
    {
        id: 'user3',
        name: 'Assistant Two',
        email: 'assistant2@example.com',
        password: 'password123',
        role: 'Editor',
        avatar: `https://i.pravatar.cc/150?u=user3`,
        status: 'Active',
        hotelIds: ['hotel2'],
        organizationId: ORG_ID,
    },
    // --- A user from a different organization to prove data isolation ---
     {
        id: 'user4',
        name: 'Other Manager',
        email: 'other@example.com',
        password: 'password123',
        role: 'Admin',
        avatar: `https://i.pravatar.cc/150?u=user4`,
        status: 'Active',
        hotelIds: ['hotel3'],
        organizationId: 'org_other',
    },
];

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<View>(View.Dashboard);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [sopGeneratorData, setSopGeneratorData] = useState<{ topic: string, details: string } | null>(null);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [hotels, setHotels] = useState<Hotel[]>(initialHotels);
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [activeHotelId, setActiveHotelId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (currentUser) {
            const userHotels = hotels.filter(h => h.organizationId === currentUser.organizationId && currentUser.hotelIds?.includes(h.id));
            if (userHotels.length > 0 && !activeHotelId) {
                setActiveHotelId(userHotels[0].id);
            } else if (userHotels.length === 0) {
                setActiveHotelId(null);
            }
        }
    }, [currentUser, hotels, activeHotelId]);

    const addAuditLog = useCallback((action: string, details: string) => {
        if (currentUser) {
            const newLog: AuditLogEntry = {
                id: new Date().toISOString(),
                timestamp: new Date(),
                user: currentUser.name,
                action,
                details
            };
            setAuditLogs(prev => [newLog, ...prev]);
        }
    }, [currentUser]);

    const handleLogin = (email: string, password: string): boolean => {
        setLoginError(null);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user && user.status === 'Active') {
            setCurrentUser(user);
            addAuditLog('User Logged In', `User ${user.name} logged in successfully.`);
            return true;
        }
        if (user && user.status === 'Pending') {
            setLoginError('This account is pending activation. Please use the activation link.');
            return false;
        }
        setLoginError('Invalid credentials or account not active.');
        return false;
    };
    
    const handleActivateAccount = (email: string, code: string, newPassword: string): boolean => {
        setLoginError(null);
        const userIndex = users.findIndex(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.verificationCode === code &&
            u.status === 'Pending'
        );

        if (userIndex > -1) {
            const updatedUsers = [...users];
            const userToActivate = {
                ...updatedUsers[userIndex],
                status: 'Active' as 'Active',
                password: newPassword,
                verificationCode: undefined,
            };
            updatedUsers[userIndex] = userToActivate;
            setUsers(updatedUsers);
            setCurrentUser(userToActivate);
            addAuditLog('User Account Activated', `User ${userToActivate.name} activated their account.`);
            return true;
        }

        setLoginError('Invalid email or verification code. Please check your details and try again.');
        return false;
    };
    
    const handleRegister = (name: string, email: string, password: string): boolean => {
        setLoginError(null);
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setLoginError('An account with this email already exists.');
            return false;
        }

        const newId = `user_${new Date().getTime()}`;
        const newOrgId = `org_${new Date().getTime()}`;

        const newAdmin: User = {
            id: newId,
            name,
            email,
            password,
            role: 'Admin',
            avatar: `https://i.pravatar.cc/150?u=${newId}`,
            status: 'Active',
            hotelIds: [],
            organizationId: newOrgId,
        };

        setUsers(prev => [...prev, newAdmin]);
        setCurrentUser(newAdmin);

        // Add a temporary "Welcome" log for the new user, as addAuditLog depends on currentUser being set
        const welcomeLog: AuditLogEntry = {
            id: new Date().toISOString(),
            timestamp: new Date(),
            user: newAdmin.name,
            action: 'Organization Registered',
            details: `New organization created and Admin account for ${newAdmin.name} registered.`
        };
        setAuditLogs(prev => [welcomeLog, ...prev]);

        return true;
    };

    const handleSendInvite = (name: string, email: string, role: User['role']) => {
        if (!currentUser) return;

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const newId = `user_${new Date().getTime()}`;

        const newUser: User = {
            id: newId,
            name,
            email,
            role,
            avatar: `https://i.pravatar.cc/150?u=${newId}`,
            status: 'Pending',
            verificationCode,
            hotelIds: [],
            organizationId: currentUser.organizationId,
        };

        setUsers(prev => [...prev, newUser]);
        addAuditLog('Team Member Invited', `Invited ${name} (${email}) with role ${role}.`);
    };

    const handleLogout = () => {
        if (currentUser) {
            addAuditLog('User Logged Out', `User ${currentUser.name} logged out.`);
        }
        setCurrentUser(null);
        setCurrentView(View.Dashboard);
    };

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleSopTemplateSelect = (template: SopTemplate) => {
        setSopGeneratorData({ topic: template.title, details: template.details });
        setCurrentView(View.SopGenerator);
    };
    
    const handleStartSopFromScratch = () => {
        setSopGeneratorData(null);
        setCurrentView(View.SopGenerator);
    };

    const handleGenerateSopFromTemplate = (template: InspectionTemplate) => {
        const details = template.items.map(item => `- ${item.text}`).join('\n');
        setSopGeneratorData({ topic: template.name, details });
        setCurrentView(View.SopGenerator);
    };

    const handleAddHotel = (name: string) => {
        if (name.trim() && currentUser) {
            const newHotel: Hotel = {
                id: `hotel_${new Date().getTime()}`,
                name: name.trim(),
                organizationId: currentUser.organizationId,
            };
            setHotels(prev => [...prev, newHotel]);
            addAuditLog('Hotel Added', `New hotel created: "${name.trim()}"`);
        }
    };
    
    const handleSaveSop = (newDocumentData: { name: string; category: Document['category']; tags: string[]; content: string; }) => {
        if (!currentUser) return;
        
        const newDocument: Document = {
            id: `doc_${new Date().getTime()}`,
            name: newDocumentData.name,
            category: newDocumentData.category,
            tags: newDocumentData.tags,
            content: newDocumentData.content,
            type: 'text/plain',
            lastModified: new Date().toISOString().split('T')[0],
            modifiedBy: currentUser.name,
            organizationId: currentUser.organizationId,
        };
        setDocuments(prev => [newDocument, ...prev]);
        addAuditLog('SOP Saved', `New document created from AI generator: "${newDocument.name}"`);
        setCurrentView(View.Documents);
    };
    
    const handleViewProfile = (user: User) => {
      setSelectedUser(user);
      setCurrentView(View.UserProfile);
    };

    // --- DATA FILTERING FOR MULTI-TENANCY ---
    const orgUsers = users.filter(u => u.organizationId === currentUser?.organizationId);
    const orgHotels = hotels.filter(h => h.organizationId === currentUser?.organizationId);
    const orgDocuments = documents.filter(d => d.organizationId === currentUser?.organizationId);
    const activeHotel = orgHotels.find(h => h.id === activeHotelId) ?? null;

    if (!currentUser) {
        return <Login onLogin={handleLogin} onRegister={handleRegister} onActivate={handleActivateAccount} error={loginError} />;
    }

    const renderView = () => {
        switch (currentView) {
            case View.Dashboard:
                return <Dashboard hotel={activeHotel} auditLogs={auditLogs} users={orgUsers} />;
            case View.Documents:
                return <DocumentManager setView={setCurrentView} addAuditLog={addAuditLog} documents={orgDocuments} setDocuments={setDocuments} />;
            case View.Inspections:
                return <InspectionManager addAuditLog={addAuditLog} activeHotel={activeHotel} onGenerateSop={handleGenerateSopFromTemplate} />;
            case View.Team:
                return <TeamManager currentUser={currentUser} users={orgUsers} setView={setCurrentView} onViewProfile={handleViewProfile} />;
            case View.AuditLog:
                return <AuditLogView auditLogs={auditLogs} />;
            case View.SopGenerator:
                 return <SopGenerator setView={setCurrentView} addAuditLog={addAuditLog} initialData={sopGeneratorData} onSaveSop={handleSaveSop} />;
            case View.SopTemplates:
                return <SopTemplates onSelectTemplate={handleSopTemplateSelect} onStartFromScratch={handleStartSopFromScratch} setView={setCurrentView} />;
            case View.Settings:
                return <Settings onOpenChangePassword={() => setIsChangePasswordOpen(true)} />;
            case View.AdminPanel:
                return <AdminPanel users={orgUsers} setUsers={setUsers} onSendInvite={handleSendInvite} addAuditLog={addAuditLog} currentUser={currentUser} hotels={orgHotels} onAddHotel={handleAddHotel} />;
            case View.UserProfile:
                return selectedUser ? <UserProfile user={selectedUser} allHotels={orgHotels} auditLogs={auditLogs} onBack={() => setCurrentView(View.Team)} /> : <TeamManager currentUser={currentUser} users={orgUsers} setView={setCurrentView} onViewProfile={handleViewProfile} />;
            default:
                return <Dashboard hotel={activeHotel} auditLogs={auditLogs} users={orgUsers} />;
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
                hotels={orgHotels}
                activeHotelId={activeHotelId}
                setActiveHotelId={setActiveHotelId}
            />
            <main className="flex-1 p-6 overflow-y-auto">
                {renderView()}
            </main>
            {isChangePasswordOpen && (
                <ChangePasswordModal 
                    user={currentUser} 
                    onClose={() => setIsChangePasswordOpen(false)} 
                    onSave={(newPassword) => {
                        // In a real app, this would be an API call
                        setUsers(users.map(u => u.id === currentUser.id ? {...u, password: newPassword} : u));
                        addAuditLog('Password Changed', 'User changed their password.');
                        setIsChangePasswordOpen(false);
                    }} 
                />
            )}
        </div>
    );
};

export default App;