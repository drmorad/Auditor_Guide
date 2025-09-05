import React from 'react';
import { View, User, Hotel } from '../types';
import { DashboardIcon, DocumentIcon, TeamIcon, SunIcon, MoonIcon, AuditLogIcon, ClipboardCheckIcon, LogoutIcon, SettingsIcon, ShieldCheckIcon, MagicIcon } from './icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentUser: User;
  onLogout: () => void;
  hotels: Hotel[];
  activeHotelId: string | null;
  setActiveHotelId: (id: string) => void;
}

const NavItem: React.FC<{
  view: View;
  label: string;
  icon: React.ReactNode;
  currentView: View;
  onClick: (view: View) => void;
}> = ({ view, label, icon, currentView, onClick }) => {
  const isActive = currentView === view;
  return (
    <li
      onClick={() => onClick(view)}
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
        isActive
          ? 'bg-primary-500 text-white shadow-lg'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {icon}
      <span className="ml-3 font-medium">{label}</span>
    </li>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isDarkMode, toggleDarkMode, currentUser, onLogout, hotels, activeHotelId, setActiveHotelId }) => {
  // Admins get access to all hotels; other roles get only their assigned hotels.
  const userHotels = currentUser.role === 'Admin'
    ? hotels
    : hotels.filter(h => currentUser.hotelIds?.includes(h.id));
  
  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-800 shadow-lg flex flex-col justify-between p-4">
      <div>
        <div className="flex items-center justify-center p-4 mb-5 border-b border-slate-200 dark:border-slate-700">
          <svg className="w-8 h-8 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm0-4v-6h2v6h-2z"></path>
          </svg>
          <h1 className="text-2xl font-bold ml-2 text-slate-800 dark:text-white">Auditors Guide</h1>
        </div>
        <nav>
          <ul>
            <NavItem
              view={View.Dashboard}
              label="Dashboard"
              icon={<DashboardIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
            <NavItem
              view={View.Documents}
              label="Documents"
              icon={<DocumentIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
            <NavItem
              view={View.Inspections}
              label="Inspections"
              icon={<ClipboardCheckIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
             <NavItem
              view={View.SopTemplates}
              label="SOP Templates"
              icon={<MagicIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
            <NavItem
              view={View.Team}
              label="Team Access"
              icon={<TeamIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
            {currentUser.role === 'Admin' && (
              <NavItem
                view={View.AdminPanel}
                label="Admin Panel"
                icon={<ShieldCheckIcon className="w-5 h-5" />}
                currentView={currentView}
                onClick={setCurrentView}
              />
            )}
            <NavItem
              view={View.AuditLog}
              label="Audit Log"
              icon={<AuditLogIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
             <NavItem
              view={View.Settings}
              label="Settings"
              icon={<SettingsIcon className="w-5 h-5" />}
              currentView={currentView}
              onClick={setCurrentView}
            />
          </ul>
        </nav>
      </div>
      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
         {userHotels.length > 0 && (
          <div className="p-2 mb-2">
            <label htmlFor="hotel-selector" className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Active Hotel</label>
            <select
              id="hotel-selector"
              value={activeHotelId || ''}
              onChange={e => setActiveHotelId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold"
              aria-label="Select active hotel"
            >
              {userHotels.map(hotel => (
                <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
              ))}
            </select>
          </div>
        )}
         <div className="p-2 mb-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold">
                    {currentUser.name.charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                </div>
            </div>
         </div>
         <button onClick={toggleDarkMode} className="w-full flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
           {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
           <span className="ml-3 font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-lg cursor-pointer transition-colors duration-200 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
           <LogoutIcon className="w-5 h-5" />
           <span className="ml-3 font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
};