import React, { useState, useMemo } from 'react';
import { Hotel, InspectionTemplate, User, WeeklyPlan } from '../types';
import { generateWeeklyInspectionPlan } from '../services/geminiService';
import { BuildingOfficeIcon, MagicIcon, CalendarCheckIcon } from './icons';

interface InspectionPlannerProps {
    hotels: Hotel[];
    templates: InspectionTemplate[];
    users: User[];
}

const LoadingState: React.FC = () => (
    <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 font-semibold text-slate-700 dark:text-slate-300">Generating your weekly plan...</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">The AI is analyzing your hotel areas and templates to create a balanced schedule.</p>
    </div>
);

const EmptyState: React.FC<{ onGenerate: () => void; hotelSelected: boolean; }> = ({ onGenerate, hotelSelected }) => (
    <div className="text-center p-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
        <CalendarCheckIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500"/>
        <h3 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-200">AI-Powered Inspection Planner</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Select a hotel and let our AI assistant create a balanced, week-long inspection schedule for your managers based on your defined areas and templates.
        </p>
        <div className="mt-6">
            <button
                onClick={onGenerate}
                disabled={!hotelSelected}
                className="flex items-center mx-auto gap-2 bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
                <MagicIcon className="w-5 h-5"/>
                <span>Generate Plan</span>
            </button>
        </div>
    </div>
);

const PlanDisplay: React.FC<{ plan: WeeklyPlan; users: User[] }> = ({ plan, users }) => {
    const days = Object.keys(plan) as (keyof WeeklyPlan)[];
    
    const getUserAvatar = (name: string) => {
        const user = users.find(u => u.name === name);
        return user?.avatar || 'https://i.pravatar.cc/150';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {days.map(day => (
                <div key={day} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                    <h3 className="text-lg font-bold capitalize text-primary-600 dark:text-primary-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-3">
                        {day}
                    </h3>
                    {plan[day].length > 0 ? (
                        <ul className="space-y-3">
                            {plan[day].map((item, index) => (
                                <li key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.templateName}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.areaName}</p>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                                        <img src={getUserAvatar(item.assignedManager)} alt={item.assignedManager} className="w-6 h-6 rounded-full" />
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-300">{item.assignedManager}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">No inspections scheduled.</p>
                    )}
                </div>
            ))}
        </div>
    );
};


export const InspectionPlanner: React.FC<InspectionPlannerProps> = ({ hotels, templates, users }) => {
    const [selectedHotelId, setSelectedHotelId] = useState<string>('');
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const managers = useMemo(() => users.filter(u => u.role === 'Admin' || u.role === 'Editor'), [users]);

    const handleGeneratePlan = async () => {
        const hotel = hotels.find(h => h.id === selectedHotelId);
        if (!hotel) {
            setError("Please select a valid hotel.");
            return;
        }

        if (!hotel.areas || hotel.areas.length === 0) {
            setError("The selected hotel has no defined areas. Please add areas in the Admin Panel before generating a plan.");
            return;
        }

        if (managers.length === 0) {
            setError("No managers (Admin or Editor roles) found to assign inspections to.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setPlan(null);

        try {
            const result = await generateWeeklyInspectionPlan(hotel, templates, managers);
            setPlan(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while generating the plan.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Inspection Planner</h1>
            </div>

            {/* Controls Section */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <BuildingOfficeIcon className="w-6 h-6 text-slate-500 dark:text-slate-400"/>
                    <label htmlFor="hotel-select-planner" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
                        Select a Hotel:
                    </label>
                </div>
                <select
                    id="hotel-select-planner"
                    value={selectedHotelId}
                    onChange={(e) => {
                        setSelectedHotelId(e.target.value);
                        setPlan(null); // Reset plan when hotel changes
                        setError(null);
                    }}
                    className="w-full sm:flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                >
                    <option value="" disabled>Choose a property...</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button
                    onClick={handleGeneratePlan}
                    disabled={!selectedHotelId || isLoading}
                    className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md disabled:bg-primary-300 disabled:cursor-not-allowed"
                >
                    <MagicIcon className="w-5 h-5"/>
                    <span>{plan ? 'Regenerate Plan' : 'Generate Plan'}</span>
                </button>
            </div>
            
            {error && (
                <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 text-red-700 dark:text-red-300 rounded-lg" role="alert">
                  <strong className="font-bold">Error: </strong>
                  <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {/* Display Area */}
            <div className="mt-6">
                {isLoading ? (
                    <LoadingState />
                ) : plan ? (
                    <PlanDisplay plan={plan} users={users}/>
                ) : (
                    <EmptyState onGenerate={handleGeneratePlan} hotelSelected={!!selectedHotelId} />
                )}
            </div>
        </div>
    );
};
