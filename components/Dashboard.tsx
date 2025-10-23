import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Hotel, AuditLogEntry, User } from '../types';
import { TrendingUpIcon, DocumentIcon, ClipboardCheckIcon, AuditLogIcon, ExclamationTriangleIcon } from './icons';

// --- MOCK DATA ---
interface MockInspection {
  id: string;
  hotelName: string;
  name: string;
  auditor: string;
  date: string;
  status: 'Completed' | 'Overdue';
  complianceScore: number;
}

const allInspections: MockInspection[] = [
  { id: 'insp1', hotelName: 'Grand Hyatt Resort', name: 'Daily Kitchen Hygiene', auditor: 'Bob Williams', date: '2024-07-29', status: 'Completed', complianceScore: 95 },
  { id: 'insp2', hotelName: 'Seaside Palace', name: 'F&B Service Area Safety', auditor: 'Charlie Brown', date: '2024-07-28', status: 'Completed', complianceScore: 88 },
  { id: 'insp3', hotelName: 'Grand Hyatt Resort', name: 'Daily Pool Safety', auditor: 'Bob Williams', date: '2024-07-25', status: 'Completed', complianceScore: 92 },
  { id: 'insp4', hotelName: 'Grand Hyatt Resort', name: 'Infrastructure & Fire Safety', auditor: 'Default Admin', date: '2024-07-22', status: 'Completed', complianceScore: 98 },
  { id: 'insp5', hotelName: 'Seaside Palace', name: 'Daily Kitchen Hygiene', auditor: 'Charlie Brown', date: '2024-07-20', status: 'Overdue', complianceScore: 0 },
  { id: 'insp6', hotelName: 'Grand Hyatt Resort', name: 'Food & Beverage Stores', auditor: 'Bob Williams', date: '2024-07-30', status: 'Completed', complianceScore: 78 },
  { id: 'insp7', hotelName: 'Seaside Palace', name: 'Public Area Housekeeping', auditor: 'Default Admin', date: '2024-07-15', status: 'Completed', complianceScore: 91 },
  { id: 'insp8', hotelName: 'Grand Hyatt Resort', name: 'Staff Cafeteria Hygiene', auditor: 'Default Admin', date: '2024-07-02', status: 'Overdue', complianceScore: 0 },
  { id: 'insp9', hotelName: 'Grand Hyatt Resort', name: 'Recreation Facilities Safety', auditor: 'Bob Williams', date: '2024-07-28', status: 'Completed', complianceScore: 85 },
];

interface MockCorrectiveAction {
  id: string;
  inspectionId: string;
  hotelName: string;
  issue: string;
  auditor: string;
  issueDate: string;
  resolutionDate?: string;
  status: 'Open' | 'Closed';
}

// Corresponds to failed items in inspections, representing "issues".
const allCorrectiveActions: MockCorrectiveAction[] = [
  // From insp6 (score 78) - implies a failure
  { id: 'ca1', inspectionId: 'insp6', hotelName: 'Grand Hyatt Resort', issue: 'Food & Beverage Stores temperature logs incomplete.', auditor: 'Bob Williams', issueDate: '2024-07-30', resolutionDate: '2024-08-01', status: 'Closed' },
  // From insp9 (score 85) - let's say a minor, but tracked, issue
  { id: 'ca2', inspectionId: 'insp9', hotelName: 'Grand Hyatt Resort', issue: 'Minor wear and tear on one treadmill.', auditor: 'Bob Williams', issueDate: '2024-07-28', status: 'Open' },
  // From insp5 (overdue) - overdue inspections are open issues
  { id: 'ca3', inspectionId: 'insp5', hotelName: 'Seaside Palace', issue: 'Daily Kitchen Hygiene inspection overdue.', auditor: 'Charlie Brown', issueDate: '2024-07-20', status: 'Open' },
   // From insp8 (overdue)
  { id: 'ca4', inspectionId: 'insp8', hotelName: 'Grand Hyatt Resort', issue: 'Staff Cafeteria Hygiene inspection overdue.', auditor: 'Default Admin', issueDate: '2024-07-02', status: 'Open' },
   // Another closed issue for avg time calculation
  { id: 'ca5', inspectionId: 'insp2', hotelName: 'Seaside Palace', issue: 'One service tray was chipped.', auditor: 'Charlie Brown', issueDate: '2024-07-28', resolutionDate: '2024-07-29', status: 'Closed' },
];


const documentStats: Record<string, { total: number; addedLast30Days: number }> = {
  'Grand Hyatt Resort': { total: 56, addedLast30Days: 8 },
  'Seaside Palace': { total: 42, addedLast30Days: 5 },
};
// --- END MOCK DATA ---

const StatCard: React.FC<{ title: string; value: string; change?: string; isPositive?: boolean, icon: React.ReactNode, id: string }> = ({ title, value, change, isPositive, icon, id }) => (
  <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex items-start" aria-labelledby={id}>
    <div className="flex-shrink-0">{icon}</div>
    <div className="ml-4">
        <h3 id={id} className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        {change && <p className={`text-xs mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{change}</p>}
    </div>
  </section>
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

interface FollowUpItem {
    id: string;
    type: 'Corrective Action' | 'Overdue Inspection';
    description: string;
    assignee: string;
    date: Date;
}

const PriorityFollowUps: React.FC<{ items: FollowUpItem[], users: User[] }> = ({ items, users }) => {
    return (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="follow-ups-heading">
            <h3 id="follow-ups-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Priority Follow-Ups</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">A table of urgent follow-up items including open corrective actions and overdue inspections.</caption>
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400">Item</th>
                            <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400">Assigned To</th>
                            <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Age</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? (
                            items.map(item => {
                                const user = users.find(u => u.name === item.assignee);
                                return (
                                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <ExclamationTriangleIcon className={`w-4 h-4 flex-shrink-0 ${item.type === 'Overdue Inspection' ? 'text-red-500' : 'text-yellow-500'}`} />
                                            <span>{item.description}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            {user && <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full"/>}
                                            <span>{item.assignee}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-500 dark:text-slate-500 text-right">{timeAgo(item.date)}</td>
                                </tr>
                            )})
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center p-8 text-slate-500 dark:text-slate-400">
                                    No open issues or overdue inspections. Great job!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

interface AuditorStat { name: string; avatar: string; value: string | number; }

const TeamPerformanceSnapshot: React.FC<{ topPerformers: AuditorStat[], mostActive: AuditorStat[] }> = ({ topPerformers, mostActive }) => {
    const PerfListItem: React.FC<{ stat: AuditorStat }> = ({ stat }) => (
         <li className="flex items-center gap-3">
            <img src={stat.avatar} alt={stat.name} className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{stat.name}</p>
            </div>
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{stat.value}</p>
        </li>
    );
    return (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="team-perf-heading">
            <h3 id="team-perf-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Team Performance (Selected Period)</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Top Performers (Avg. Score)</h4>
                    <ul className="space-y-3">
                        {topPerformers.length > 0 ? topPerformers.map(p => <PerfListItem key={p.name} stat={p} />) : <p className="text-xs text-center text-slate-500">No data available.</p>}
                    </ul>
                </div>
                 <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Most Active Auditors</h4>
                     <ul className="space-y-3">
                        {mostActive.length > 0 ? mostActive.map(p => <PerfListItem key={p.name} stat={p} />) : <p className="text-xs text-center text-slate-500">No data available.</p>}
                    </ul>
                </div>
            </div>
        </section>
    );
};


interface DashboardProps {
  hotel: Hotel | null;
  auditLogs: AuditLogEntry[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ hotel, auditLogs, users }) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const hotelData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const dateFilteredInspections = allInspections.filter(i => {
      const inspectionDate = new Date(i.date);
      return inspectionDate >= start && inspectionDate <= end;
    });

    const dateFilteredCorrectiveActions = allCorrectiveActions.filter(ca => {
      const issueDate = new Date(ca.issueDate);
      return issueDate >= start && issueDate <= end;
    });

    const allHotelNames = [...new Set(allInspections.map(i => i.hotelName))];
    const hotelComparisonData = allHotelNames.map(name => {
        const completed = dateFilteredInspections.filter(i => i.hotelName === name && i.status === 'Completed');
        const avgScore = completed.length > 0 
            ? Math.round(completed.reduce((sum, i) => sum + i.complianceScore, 0) / completed.length) 
            : 0;
        return { name, 'Compliance Score': avgScore };
    }).sort((a, b) => b['Compliance Score'] - a['Compliance Score']);

    if (!hotel) {
      return {
        hotelComparisonData,
        avgCompliance: 0, overdueCount: 0, auditsThisPeriod: 0, docsAdded: 0,
        auditorChartData: [], recentActivities: [], recentInspections: [],
        openIssues: 0, avgResolutionTime: 0, priorityFollowUps: [],
        topPerformers: [], mostActiveAuditors: [],
      };
    }
    
    const hotelInspections = dateFilteredInspections.filter(i => i.hotelName === hotel.name);
    const completedInspections = hotelInspections.filter(i => i.status === 'Completed');

    const avgCompliance = completedInspections.length > 0
      ? Math.round(completedInspections.reduce((sum, i) => sum + i.complianceScore, 0) / completedInspections.length)
      : 0;
      
    const overdueCount = hotelInspections.filter(i => i.status === 'Overdue').length;
    const auditsThisPeriod = completedInspections.length;
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

    const recentActivities = auditLogs
        .filter(log => hotel.name ? log.details.includes(hotel.name) || !allHotelNames.some(hName => log.details.includes(hName)) : true)
        .slice(0, 5);

    const hotelActions = dateFilteredCorrectiveActions.filter(a => a.hotelName === hotel.name);
    const openIssues = hotelActions.filter(a => a.status === 'Open').length;
    
    const closedActions = hotelActions.filter(a => a.status === 'Closed' && a.resolutionDate);
    const totalResolutionDays = closedActions.reduce((sum, action) => {
        const issueDate = new Date(action.issueDate);
        const resolutionDate = new Date(action.resolutionDate!);
        const diffTime = Math.abs(resolutionDate.getTime() - issueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        return sum + diffDays;
    }, 0);
    
    const avgResolutionTime = closedActions.length > 0
        ? Math.round(totalResolutionDays / closedActions.length)
        : 0;

    // Data for new components
    const openCorrectiveActions = hotelActions.filter(a => a.status === 'Open');
    const overdueInspections = hotelInspections.filter(i => i.status === 'Overdue');
    const priorityFollowUps: FollowUpItem[] = [
        ...openCorrectiveActions.map(a => ({ id: a.id, type: 'Corrective Action' as const, description: a.issue, assignee: a.auditor, date: new Date(a.issueDate) })),
        ...overdueInspections.map(i => ({ id: i.id, type: 'Overdue Inspection' as const, description: i.name, assignee: i.auditor, date: new Date(i.date) }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const auditorPerformanceStats = users.map(user => {
        const userInspections = completedInspections.filter(i => i.auditor === user.name && i.hotelName === hotel.name);
        if (userInspections.length === 0) return { name: user.name, avatar: user.avatar, avgScore: 0, inspectionCount: 0 };
        const avgScore = Math.round(userInspections.reduce((sum, i) => sum + i.complianceScore, 0) / userInspections.length);
        return { name: user.name, avatar: user.avatar, avgScore, inspectionCount: userInspections.length };
    });

    const topPerformers = [...auditorPerformanceStats]
        .filter(u => u.inspectionCount > 0)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 3)
        .map(p => ({ ...p, value: `${p.avgScore}%` }));

    const mostActiveAuditors = [...auditorPerformanceStats]
        .filter(u => u.inspectionCount > 0)
        .sort((a, b) => b.inspectionCount - a.inspectionCount)
        .slice(0, 3)
        .map(p => ({...p, value: `${p.inspectionCount} insp.`}));


    return {
        avgCompliance, overdueCount, auditsThisPeriod, docsAdded, auditorChartData,
        recentActivities, openIssues, avgResolutionTime, hotelComparisonData,
        priorityFollowUps, topPerformers, mostActiveAuditors,
    };
  }, [hotel, auditLogs, users, startDate, endDate]);
  
  const iconProps = { className: "w-8 h-8 text-primary-500" };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          {hotel ? `Dashboard: ${hotel.name}` : 'Overall Dashboard'}
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <label htmlFor="start-date" className="text-sm font-medium text-slate-600 dark:text-slate-400">From</label>
                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
            </div>
            <div className="flex items-center gap-2">
                <label htmlFor="end-date" className="text-sm font-medium text-slate-600 dark:text-slate-400">To</label>
                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-1.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
            </div>
        </div>
      </div>
      
      {!hotel ? (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="overall-comparison-heading">
            <h3 id="overall-comparison-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Hotel Compliance Comparison</h3>
            <div className="sr-only" aria-hidden="true">
              <table>
                <caption>Hotel Compliance Comparison Data</caption>
                <thead>
                  <tr>
                    <th scope="col">Hotel Name</th>
                    <th scope="col">Average Compliance Score</th>
                  </tr>
                </thead>
                <tbody>
                  {hotelData.hotelComparisonData.map(item => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item['Compliance Score']}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hotelData.hotelComparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} unit="%" />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12, width: 200 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                    <Bar dataKey="Compliance Score" fill="#4f46e5" name="Average Score" unit="%" />
                </BarChart>
            </ResponsiveContainer>
        </section>
      ) : (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard id="avg-compliance-card" title="Avg. Compliance" value={`${hotelData.avgCompliance}%`} icon={<TrendingUpIcon {...iconProps} />} />
                <StatCard id="audits-period-card" title="Audits in Period" value={`${hotelData.auditsThisPeriod}`} icon={<ClipboardCheckIcon {...iconProps} />} />
                <StatCard id="open-issues-card" title="Open Issues" value={`${hotelData.openIssues}`} isPositive={hotelData.openIssues === 0} icon={<ExclamationTriangleIcon {...iconProps} />} />
                <StatCard id="resolution-time-card" title="Avg. Resolution Time" value={`${hotelData.avgResolutionTime} Days`} isPositive={hotelData.avgResolutionTime < 3} icon={<AuditLogIcon {...iconProps} />} />
                <StatCard id="overdue-card" title="Inspections Overdue" value={`${hotelData.overdueCount}`} isPositive={hotelData.overdueCount === 0} icon={<AuditLogIcon {...iconProps} />} />
                <StatCard id="docs-added-card" title="Documents Added" value={`${hotelData.docsAdded}`} change="in the last 30 days" isPositive={true} icon={<DocumentIcon {...iconProps} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    <PriorityFollowUps items={hotelData.priorityFollowUps} users={users} />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Hotel Comparison Chart */}
                        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="hotel-comparison-heading">
                            <h3 id="hotel-comparison-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Hotel Compliance Comparison</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={hotelData.hotelComparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                    <Bar dataKey="Compliance Score" fill="#6366f1" name="Average Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </section>
                         {/* Auditor Performance Chart */}
                        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="auditor-perf-heading">
                            <h3 id="auditor-perf-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Audit Performance by Auditor</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={hotelData.auditorChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                    <Bar dataKey="Average Score" fill="#4f46e5" name="Average Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </section>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    <TeamPerformanceSnapshot topPerformers={hotelData.topPerformers} mostActive={hotelData.mostActiveAuditors} />
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="activity-heading">
                        <h3 id="activity-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                        <ul className="space-y-4">
                            {hotelData.recentActivities.map(activity => {
                                const user = users.find(u => u.name === activity.user);
                                return (
                                <li key={activity.id} className="flex items-start gap-3">
                                    <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full bg-slate-200 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-800 dark:text-slate-200">
                                            <span className="font-semibold">{activity.user}</span> {activity.action.toLowerCase().replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">"{activity.details}"</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(activity.timestamp)}</p>
                                    </div>
                                </li>
                                )
                            })}
                        </ul>
                    </section>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
