import React from 'react';
import { View, User } from '../types';
import { DashboardIcon, DocumentIcon, ClipboardCheckIcon, TeamIcon, AuditLogIcon, SettingsIcon, BuildingOfficeIcon, TrendingUpIcon, MagicIcon } from './icons';

interface SidebarProps {
  view: View | null;
  setView: (view: View) => void;
  onLogout: () => void;
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li>
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary-500 text-white shadow-md'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3 font-semibold">{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ view, setView, onLogout, user, isOpen, onClose }) => {
  const navItems = [
    { id: View.Dashboard, label: 'Dashboard', icon: <DashboardIcon className="w-6 h-6" /> },
    { id: View.Documents, label: 'Documents', icon: <DocumentIcon className="w-6 h-6" /> },
    { id: View.SopTemplates, label: 'SOP Templates', icon: <MagicIcon className="w-6 h-6" /> }, // Corrected link
    { id: View.Inspections, label: 'Inspections', icon: <ClipboardCheckIcon className="w-6 h-6" /> },
    { id: View.Team, label: 'Team Access', icon: <TeamIcon className="w-6 h-6" /> },
    { id: View.Reporting, label: 'Reporting', icon: <TrendingUpIcon className="w-6 h-6" /> },
    { id: View.Scheduler, label: 'Scheduler', icon: <AuditLogIcon className="w-6 h-6" /> },
    { id: View.AuditLog, label: 'Audit Log', icon: <AuditLogIcon className="w-6 h-6" /> },
  ];
  
  if (user.role === 'Admin') {
      navItems.push({ id: View.AdminPanel, label: 'Admin Panel', icon: <BuildingOfficeIcon className="w-6 h-6" /> });
  }

  return (
    <aside
      className={`w-64 bg-slate-800 text-white flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-20 flex items-center justify-center border-b border-slate-700">
        <h1 className="text-2xl font-bold">AuditorsGuide</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={view === item.id}
              onClick={() => {
                setView(item.id);
                onClose();
              }}
            />
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center mb-4">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
          <div className="ml-3">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-slate-400">{user.role}</p>
          </div>
        </div>
        <ul className="space-y-2">
            <NavItem
                icon={<SettingsIcon className="w-6 h-6" />}
                label="Settings"
                isActive={view === View.Settings}
                onClick={() => {
                  setView(View.Settings);
                  onClose();
                }}
            />
        </ul>
        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="w-full mt-4 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 transition-colors text-white font-semibold"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
};