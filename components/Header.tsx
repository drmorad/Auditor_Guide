import React, { useState, useRef, useEffect } from 'react';
import { User, Hotel, View } from '../types';
import { SunIcon, MoonIcon, ChevronDownIcon, CheckIcon, BuildingOfficeIcon } from './icons';

interface HeaderProps {
  view: View | null;
  user: User;
  hotels: Hotel[];
  selectedHotelId: string | null;
  onSelectHotel: (hotelId: string | null) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
}

const VIEW_TITLES: Record<View, string> = {
  [View.Dashboard]: 'Dashboard',
  [View.Documents]: 'Document Hub',
  [View.Inspections]: 'Inspections',
  [View.Team]: 'Team Access',
  [View.AuditLog]: 'Audit Log',
  [View.Settings]: 'Settings',
  [View.SopGenerator]: 'AI SOP Generator',
  [View.SopTemplates]: 'SOP Templates',
  [View.AdminPanel]: 'Admin Panel',
  [View.UserProfile]: 'User Profile',
  [View.Reporting]: 'Reporting',
  [View.Scheduler]: 'Scheduler',
  [View.Planner]: 'Inspection Planner',
};

export const Header: React.FC<HeaderProps> = ({ view, user, hotels, selectedHotelId, onSelectHotel, theme, onToggleTheme, onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedHotel = hotels.find(h => h.id === selectedHotelId);
  const displayLabel = selectedHotel ? selectedHotel.name : 'Overall Dashboard';
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1 text-slate-500 hover:text-primary-500 md:hidden"
          aria-label="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{view ? VIEW_TITLES[view] : 'Welcome'}</h1>
      </div>

      <div className="flex items-center gap-4">
        {view === View.Dashboard && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-sm font-semibold bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover-bg-slate-600 transition-colors"
            >
              <BuildingOfficeIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
              <span className="truncate max-w-[200px]">{displayLabel}</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-700 rounded-md shadow-lg z-20 border dark:border-slate-600 animate-fade-in-up">
                <ul className="py-1 text-sm text-slate-700 dark:text-slate-200 max-h-60 overflow-y-auto">
                  <li>
                    <button
                      onClick={() => { onSelectHotel(null); setIsDropdownOpen(false); }}
                      className="w-full text-left flex items-center justify-between px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      Overall Dashboard
                      {!selectedHotelId && <CheckIcon className="w-4 h-4 text-primary-500" />}
                    </button>
                  </li>
                  {hotels.map(hotel => (
                    <li key={hotel.id}>
                      <button
                        onClick={() => { onSelectHotel(hotel.id); setIsDropdownOpen(false); }}
                        className="w-full text-left flex items-center justify-between px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600"
                      >
                        {hotel.name}
                        {selectedHotelId === hotel.id && <CheckIcon className="w-4 h-4 text-primary-500" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <MoonIcon className="w-5 h-5 text-slate-600" /> : <SunIcon className="w-5 h-5 text-yellow-400" />}
        </button>
      </div>
    </header>
  );
};