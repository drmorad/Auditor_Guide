
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Hotel, AuditLogEntry, User } from '../types';
import { TrendingUpIcon, DocumentIcon, ClipboardCheckIcon, AuditLogIcon } from './icons';

// --- MOCK DATA ---
interface MockInspection {
  id: string;
  hotelName: string;
  auditor: string;
  date: string;
  status: 'Completed' | 'Overdue';
  complianceScore: number;
}

const allInspections: MockInspection[] = [
  { id: 'insp1', hotelName: 'Grand Hyatt Resort', auditor: 'Bob Williams', date: '2024-07-29', status: 'Completed', complianceScore: 95 },
  { id: 'insp2', hotelName: 'Seaside Palace', auditor: 'Charlie Brown', date: '2024-07-28', status: 'Completed', complianceScore: 88 },
  { id: 'insp3', hotelName: 'Grand Hyatt Resort', auditor: 'Bob Williams', date: '2024-07-25', status: 'Completed', complianceScore: 92 },
  { id: 'insp4', hotelName: 'Grand Hyatt Resort', auditor: 'Default Admin', date: '2024-07-22', status: 'Completed', complianceScore: 98 },
  { id: 'insp5', hotelName: 'Seaside Palace', auditor: 'Charlie Brown', date: '2024-07-20', status: 'Overdue', complianceScore: 0 },
  { id: 'insp6', hotelName: 'Grand Hyatt Resort', auditor: 'Bob Williams', date: '2024-06-30', status: 'Completed', complianceScore: 85 },
  { id: 'insp7', hotelName: 'Seaside Palace', auditor: 'Default Admin', date: '2024-07-15', status: 'Completed', complianceScore: 91 },
  { id: 'insp8', hotelName: 'Grand Hyatt Resort', auditor: 'Default Admin', date: '2024-07-02', status: 'Overdue', complianceScore: 0 },
];

const documentStats: Record<string, { total: number; addedLast30Days: number }> = {
  'Grand Hyatt Resort': { total: 56, addedLast30Days: 8 },
  'Seaside Palace': { total: 42, addedLast30Days: 5 },
};
// --- END MOCK DATA ---

const StatCard: React.FC<{ title: string; value: string; change?: string; isPositive?: boolean, icon: React.ReactNode }> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-start">
    <div className="flex-shrink-0">{icon}</div>
    <div className="ml-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        {change && <p className={`text-xs mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{change}</p>}
    </div>
  </div>
);

const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return "just now";
    let interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");
    return Math.floor(seconds) + " seconds ago";
}


interface DashboardProps {
  hotel: Hotel | null;
  auditLogs: AuditLogEntry[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ hotel, auditLogs, users }) => {
  const hotelData = useMemo(() => {
    if (!hotel) return null;

    const hotelInspections = allInspections.filter(i => i.hotelName === hotel.name);
    const completedInspections = hotelInspections.filter(i => i.status === 'Completed');

    const avgCompliance = completedInspections.length > 0
      ? Math.round(completedInspections.reduce((sum, i) => sum + i.complianceScore, 0) / completedInspections.length)
      : 0;
      
    const overdueCount = hotelInspections.filter(i => i.status === 'Overdue').length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const auditsThisMonth = hotelInspections.filter(i => i.status === 'Completed' && new Date(i.date) >= thirtyDaysAgo).length;

    const docsAdded = documentStats[hotel.name]?.addedLast30Days || 0;
    
    const auditorPerformance = completedInspections.reduce((acc, inspection) => {
        if (!acc[inspection.auditor]) {
            acc[inspection.auditor] = { scores: [], count: 0 };
        }
        acc[inspection.auditor].scores.push(inspection.complianceScore);
        acc[inspection.auditor].count++;
        return acc;
    }, {} as Record<string, { scores: number[]; count: number }>);
    
    const auditorChartData = Object.entries(auditorPerformance).map(([auditor, data]) => ({
        name: auditor,
        'Average Score': Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
    }));

    const recentActivities = [
        ...hotelInspections.filter(i => i.status === 'Completed').map(i => ({
            id: i.id,
            type: 'Inspection',
            user: i.auditor,
            details: `Completed an inspection with score ${i.complianceScore}.`,
            timestamp: new Date(i.date),
        })),
        ...auditLogs.slice(0, 10).map(log => ({
             id: log.id,
             type: log.action,
             user: log.user,
             details: log.details,
             timestamp: log.timestamp,
        }))
    ].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);


    return {
        avgCompliance,
        overdueCount,
        auditsThisMonth,
        docsAdded,
        auditorChartData,
        recentActivities,
    };
  }, [hotel, auditLogs]);
  
  const iconProps = { className: "w-8 h-8 text-primary-500" };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
        {hotel ? `Dashboard: ${hotel.name}` : 'Dashboard'}
      </h1>
      
      {!hotelData ? (
        <p>Select a hotel to view its dashboard.</p>
      ) : (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Avg. Compliance" value={`${hotelData.avgCompliance}%`} change="+1.5% this month" isPositive={true} icon={<TrendingUpIcon {...iconProps} />} />
                <StatCard title="Inspections Overdue" value={`${hotelData.overdueCount}`} change="+1 from yesterday" isPositive={false} icon={<AuditLogIcon {...iconProps} />} />
                <StatCard title="Audits This Month" value={`${hotelData.auditsThisMonth}`} change="2 completed this week" isPositive={true} icon={<ClipboardCheckIcon {...iconProps} />} />
                <StatCard title="Documents Added" value={`${hotelData.docsAdded}`} change="in the last 30 days" isPositive={true} icon={<DocumentIcon {...iconProps} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Audit Performance by Auditor</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={hotelData.auditorChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgb(100 116 139)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                    <Legend />
                    <Bar dataKey="Average Score" fill="#3b82f6" name="Average Score (%)" />
                    </BarChart>
                </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                <ul className="space-y-4">
                    {hotelData.recentActivities.map(activity => {
                        const user = users.find(u => u.name === activity.user);
                        return (
                        <li key={activity.id} className="flex items-start gap-3">
                            <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full bg-slate-200 mt-1" />
                            <div className="flex-1">
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    <span className="font-semibold">{activity.user}</span> {activity.type === 'Inspection' ? 'completed an inspection.' : activity.type === 'User Logged In' ? 'logged in.' : 'performed an action.'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{activity.details}"</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(activity.timestamp)}</p>
                            </div>
                        </li>
                        )
                    })}
                </ul>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
