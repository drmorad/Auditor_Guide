
import React, { useMemo } from 'react';
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


interface DashboardProps {
  hotel: Hotel | null;
  auditLogs: AuditLogEntry[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ hotel, auditLogs, users }) => {
  const hotelData = useMemo(() => {
    const allHotelNames = [...new Set(allInspections.map(i => i.hotelName))];
    const hotelComparisonData = allHotelNames.map(name => {
        const completed = allInspections.filter(i => i.hotelName === name && i.status === 'Completed');
        const avgScore = completed.length > 0 
            ? Math.round(completed.reduce((sum, i) => sum + i.complianceScore, 0) / completed.length) 
            : 0;
        return { name, 'Compliance Score': avgScore };
    }).sort((a, b) => b['Compliance Score'] - a['Compliance Score']);

    if (!hotel) {
      return {
        hotelComparisonData,
        avgCompliance: 0, overdueCount: 0, auditsThisMonth: 0, docsAdded: 0,
        auditorChartData: [], recentActivities: [], recentInspections: [],
        openIssues: 0, avgResolutionTime: 0,
      };
    }

    const hotelInspections = allInspections.filter(i => i.hotelName === hotel.name);
    const completedInspections = hotelInspections.filter(i => i.status === 'Completed');

    const avgCompliance = completedInspections.length > 0
      ? Math.round(completedInspections.reduce((sum, i) => sum + i.complianceScore, 0) / completedInspections.length)
      : 0;
      
    const overdueCount = hotelInspections.filter(i => i.status === 'Overdue').length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const auditsThisMonth = completedInspections.filter(i => new Date(i.date) >= thirtyDaysAgo).length;

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
        ...completedInspections.map(i => ({
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

    const recentInspections = completedInspections
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const hotelActions = allCorrectiveActions.filter(a => a.hotelName === hotel.name);
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

    return {
        avgCompliance,
        overdueCount,
        auditsThisMonth,
        docsAdded,
        auditorChartData,
        recentActivities,
        recentInspections,
        openIssues,
        avgResolutionTime,
        hotelComparisonData,
    };
  }, [hotel, auditLogs]);
  
  const iconProps = { className: "w-8 h-8 text-primary-500" };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
        {hotel ? `Dashboard: ${hotel.name}` : 'Overall Dashboard'}
      </h1>
      
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
                    <Bar dataKey="Compliance Score" fill="#3b82f6" name="Average Score" unit="%" />
                </BarChart>
            </ResponsiveContainer>
        </section>
      ) : (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard id="avg-compliance-card" title="Avg. Compliance" value={`${hotelData.avgCompliance}%`} change="+1.5% this month" isPositive={true} icon={<TrendingUpIcon {...iconProps} />} />
                <StatCard id="audits-month-card" title="Audits This Month" value={`${hotelData.auditsThisMonth}`} change="2 completed this week" isPositive={true} icon={<ClipboardCheckIcon {...iconProps} />} />
                <StatCard id="open-issues-card" title="Open Issues" value={`${hotelData.openIssues}`} isPositive={hotelData.openIssues === 0} icon={<ExclamationTriangleIcon {...iconProps} />} />
                <StatCard id="resolution-time-card" title="Avg. Resolution Time" value={`${hotelData.avgResolutionTime} Days`} isPositive={hotelData.avgResolutionTime < 3} icon={<AuditLogIcon {...iconProps} />} />
                <StatCard id="overdue-card" title="Inspections Overdue" value={`${hotelData.overdueCount}`} isPositive={hotelData.overdueCount === 0} icon={<AuditLogIcon {...iconProps} />} />
                <StatCard id="docs-added-card" title="Documents Added" value={`${hotelData.docsAdded}`} change="in the last 30 days" isPositive={true} icon={<DocumentIcon {...iconProps} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Hotel Comparison Chart */}
                        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="hotel-comparison-heading">
                            <h3 id="hotel-comparison-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Hotel Compliance Comparison</h3>
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
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={hotelData.hotelComparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                    <Bar dataKey="Compliance Score" fill="#8884d8" name="Average Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </section>
                         {/* Auditor Performance Chart */}
                        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="auditor-perf-heading">
                            <h3 id="auditor-perf-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Audit Performance by Auditor</h3>
                             <div className="sr-only" aria-hidden="true">
                              <table>
                                <caption>Auditor Performance Data</caption>
                                <thead>
                                  <tr>
                                    <th scope="col">Auditor Name</th>
                                    <th scope="col">Average Score</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {hotelData.auditorChartData.map(item => (
                                    <tr key={item.name}>
                                      <td>{item.name}</td>
                                      <td>{item['Average Score']}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={hotelData.auditorChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                    <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                    <Bar dataKey="Average Score" fill="#3b82f6" name="Average Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </section>
                    </div>

                    {/* Inspection Records Section */}
                    <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="inspections-heading">
                        <h3 id="inspections-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Recent Inspection Records</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <caption className="sr-only">A table of the five most recent inspection records for the selected hotel.</caption>
                                <thead className="border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400">Inspection Name</th>
                                        <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400">Date</th>
                                        <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400">Auditor</th>
                                        <th scope="col" className="p-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hotelData.recentInspections.length > 0 ? (
                                        hotelData.recentInspections.map(insp => (
                                            <tr key={insp.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                                <td className="p-3 font-medium text-slate-900 dark:text-white">{insp.name}</td>
                                                <td className="p-3 text-slate-600 dark:text-slate-400">{insp.date}</td>
                                                <td className="p-3 text-slate-600 dark:text-slate-400">{insp.auditor}</td>
                                                <td className={`p-3 font-bold text-right ${getScoreColor(insp.complianceScore)}`}>
                                                    {insp.complianceScore}%
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center p-8 text-slate-500 dark:text-slate-400">
                                                No completed inspections found for this hotel.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Sidebar Column */}
                <section className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="activity-heading">
                    <h3 id="activity-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
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
                </section>
            </div>
        </>
      )}
    </div>
  );
};
