import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Hotel, AuditLogEntry, User, InspectionRecord, Incident, Task } from '../types';
import { TrendingUpIcon, DocumentIcon, ClipboardCheckIcon, AuditLogIcon, ExclamationTriangleIcon, TicketIcon, CalendarCheckIcon } from './icons';

interface DashboardProps {
  hotel: Hotel | null;
  auditLogs: AuditLogEntry[];
  users: User[];
  inspectionRecords: InspectionRecord[];
  incidents: Incident[];
  tasks: Task[];
}

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

const Heatmap: React.FC<{
    title: string;
    rows: string[];
    cols: string[];
    grid: { value: number | null; count: number }[][];
}> = ({ title, rows, cols, grid }) => {
    const getColor = (value: number | null) => {
        if (value === null) return 'bg-slate-50 dark:bg-slate-900/50';
        if (value >= 90) return 'bg-emerald-500 text-white';
        if (value >= 80) return 'bg-emerald-400 text-white';
        if (value >= 70) return 'bg-yellow-400 text-slate-900';
        if (value >= 60) return 'bg-orange-400 text-white';
        return 'bg-red-500 text-white';
    };

    return (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md overflow-hidden" aria-labelledby="heatmap-heading">
            <h3 id="heatmap-heading" className="font-semibold text-slate-800 dark:text-white mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-[120px]">
                                Location \ Dept
                            </th>
                            {cols.map(col => (
                                <th key={col} className="p-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-[80px]">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                <td className="p-2 font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]" title={row}>
                                    {row}
                                </td>
                                {grid[rowIndex].map((cell, colIndex) => (
                                    <td key={colIndex} className="p-1">
                                        <div
                                            className={`w-full h-10 rounded flex items-center justify-center text-xs font-bold transition-transform hover:scale-105 cursor-default ${getColor(cell.value)}`}
                                            title={cell.value !== null ? `${cell.value}% (${cell.count} inspections)` : 'No data'}
                                        >
                                            {cell.value !== null ? `${cell.value}%` : '-'}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr><td colSpan={cols.length + 1} className="p-4 text-center text-slate-500">No data available for heatmap.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 justify-end">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500"></div> &lt;60%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-400"></div> 60-70%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-400"></div> 70-80%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400"></div> 80-90%</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div> 90%+</div>
            </div>
        </section>
    );
};

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
    type: 'Incident' | 'Task' | 'Inspection';
    description: string;
    assignee: string;
    date: Date;
    severity?: string;
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
                                const user = users.find(u => u.name === item.assignee || u.id === item.assignee);
                                return (
                                <tr key={item.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-3 font-medium text-slate-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            {item.severity === 'Critical' ? 
                                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-red-500" /> :
                                                item.type === 'Task' ?
                                                <CalendarCheckIcon className="w-4 h-4 flex-shrink-0 text-yellow-500" /> :
                                                <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 text-orange-400" />
                                            }
                                            <span>{item.description}</span>
                                            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 ml-1">{item.type}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-600 dark:text-slate-400">
                                        <div className="flex items-center gap-2">
                                            {user && <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full"/>}
                                            <span>{user ? user.name : item.assignee}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-slate-500 dark:text-slate-500 text-right">{timeAgo(item.date)}</td>
                                </tr>
                            )})
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center p-8 text-slate-500 dark:text-slate-400">
                                    No priority items found. Great job!
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
            <h3 id="team-perf-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Team Performance</h3>
            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Highest Inspection Scores</h4>
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ hotel, auditLogs, users, inspectionRecords, incidents, tasks }) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const dashboardData = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Filter Data by Date and Hotel context
    const filteredInspections = inspectionRecords.filter(i => {
      const inspectionDate = new Date(i.date);
      const isDateValid = inspectionDate >= start && inspectionDate <= end;
      const isHotelValid = hotel ? i.hotelName === hotel.name : true;
      return isDateValid && isHotelValid;
    });

    const filteredIncidents = incidents.filter(inc => {
        const date = new Date(inc.createdAt);
        const isDateValid = date >= start && date <= end;
        const isHotelValid = hotel ? inc.hotelId === hotel.id : true;
        return isDateValid && isHotelValid;
    });

    const filteredTasks = tasks.filter(task => {
        const date = new Date(task.end);
        const isDateValid = date >= start && date <= end;
        // Tasks aren't directly linked to hotels in the mock data structure typically, 
        // but if we had that link we'd filter here. For now, assume tasks are global or filtered by assignee.
        return isDateValid;
    });

    // 1. Calculate Hotel Comparison (For Overall View)
    const allHotelNames = [...new Set(inspectionRecords.map(i => i.hotelName))];
    const hotelComparisonData = allHotelNames.map(name => {
        const hotelRecs = inspectionRecords.filter(i => i.hotelName === name && i.status === 'Completed' && new Date(i.date) >= start && new Date(i.date) <= end);
        const avgScore = hotelRecs.length > 0 
            ? Math.round(hotelRecs.reduce((sum, i) => sum + i.complianceScore, 0) / hotelRecs.length) 
            : 0;
        return { name, 'Compliance Score': avgScore };
    }).sort((a, b) => b['Compliance Score'] - a['Compliance Score']);

    // 2. Inspection Stats
    const completedInspections = filteredInspections.filter(i => i.status === 'Completed');
    const avgCompliance = completedInspections.length > 0
      ? Math.round(completedInspections.reduce((sum, i) => sum + i.complianceScore, 0) / completedInspections.length)
      : 0;
    const inspectionCount = completedInspections.length;
    const overdueInspectionCount = filteredInspections.filter(i => i.status === 'Overdue').length;

    // 3. Incident Stats
    const openIncidents = incidents.filter(i => (i.status === 'Open' || i.status === 'In Progress') && (hotel ? i.hotelId === hotel.id : true)); // All open incidents, not just in date range
    const openIncidentsCount = openIncidents.length;
    const criticalIncidents = openIncidents.filter(i => i.severity === 'Critical');
    
    // Incident Category Data for Chart
    const incidentCategoryData = Object.entries(
        filteredIncidents.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    // 4. Task Stats
    const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.end) < new Date() && (hotel ? true : true)); // Logic gap: tasks not linked to hotel. showing all.
    const completedTasksInRange = filteredTasks.filter(t => t.status === 'completed').length;
    const taskCompletionRate = filteredTasks.length > 0 ? Math.round((completedTasksInRange / filteredTasks.length) * 100) : 0;

    // 5. Auditor Performance
    // FIX: This block was updated to correctly type the accumulator in the reduce function.
    const auditorPerformance = completedInspections.reduce((acc: Record<string, { scores: number[]; count: number }>, inspection) => {
        const auditorName = inspection.auditor;
        let performanceData = acc[auditorName];
        if (!performanceData) {
            performanceData = { scores: [], count: 0 };
            acc[auditorName] = performanceData;
        }
        performanceData.scores.push(inspection.complianceScore);
        performanceData.count++;
        return acc;
    }, {});
    
    const auditorChartData = Object.entries(auditorPerformance).map(([auditor, data]) => ({
        name: auditor,
        'Average Score': Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
        count: data.count
    }));

    const topPerformers = [...auditorChartData]
        .sort((a, b) => b['Average Score'] - a['Average Score'])
        .slice(0, 3)
        .map(p => {
            const user = users.find(u => u.name === p.name);
            return { name: p.name, avatar: user?.avatar || '', value: `${p['Average Score']}%` };
        });

    const mostActiveAuditors = [...auditorChartData]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(p => {
            const user = users.find(u => u.name === p.name);
            return { name: p.name, avatar: user?.avatar || '', value: `${p.count} insp.` };
        });

    // 6. Priority Follow Ups
    const followUps: FollowUpItem[] = [
        ...criticalIncidents.map(inc => ({
            id: inc.id,
            type: 'Incident' as const,
            description: inc.title,
            assignee: inc.assignedTo ? (users.find(u => u.id === inc.assignedTo)?.name || 'Unassigned') : 'Unassigned',
            date: new Date(inc.createdAt),
            severity: inc.severity
        })),
        ...overdueTasks.map(task => ({
            id: task.id,
            type: 'Task' as const,
            description: `Overdue: ${task.name}`,
            assignee: users.find(u => u.id === task.assigneeId)?.name || 'Unassigned',
            date: new Date(task.end)
        })),
        ...filteredInspections.filter(i => i.status === 'Overdue').map(insp => ({
            id: insp.id,
            type: 'Inspection' as const,
            description: `Missed Inspection: ${insp.templateName}`,
            assignee: insp.auditor,
            date: new Date(insp.date)
        }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 10);

    // 7. Heatmap Data
    const rows = hotel 
        ? [...new Set(filteredInspections.map(i => i.areaName || 'General'))].sort()
        : [...new Set(filteredInspections.map(i => i.hotelName))].sort();
    
    const cols = [...new Set(filteredInspections.map(i => i.department))].sort();

    const grid = rows.map(row => {
        return cols.map(col => {
            const match = filteredInspections.filter(i => 
                (hotel ? (i.areaName || 'General') : i.hotelName) === row && 
                i.department === col
            );
            const avg = match.length > 0 
                ? Math.round(match.reduce((a, b) => a + b.complianceScore, 0) / match.length) 
                : null;
            return { value: avg, count: match.length };
        });
    });

    // 8. Compliance Trend (Line Chart)
    const trendMap: Record<string, { sum: number; count: number }> = {};
    completedInspections.forEach(i => {
        const date = i.date.split('T')[0];
        if (!trendMap[date]) trendMap[date] = { sum: 0, count: 0 };
        trendMap[date].sum += i.complianceScore;
        trendMap[date].count += 1;
    });
    const complianceTrend = Object.entries(trendMap)
        .map(([date, { sum, count }]) => ({ date, score: Math.round(sum / count) }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 9. Department Performance (Bar Chart)
    const deptMap: Record<string, { sum: number; count: number }> = {};
    completedInspections.forEach(i => {
        const dept = i.department;
        if (!deptMap[dept]) deptMap[dept] = { sum: 0, count: 0 };
        deptMap[dept].sum += i.complianceScore;
        deptMap[dept].count += 1;
    });
    const departmentPerformance = Object.entries(deptMap)
        .map(([name, { sum, count }]) => ({ name, score: Math.round(sum / count) }))
        .sort((a, b) => b.score - a.score);

    return {
        avgCompliance,
        inspectionCount,
        overdueInspectionCount,
        openIncidentsCount,
        incidentCategoryData,
        taskCompletionRate,
        hotelComparisonData,
        auditorChartData,
        topPerformers,
        mostActiveAuditors,
        followUps,
        heatmapData: { rows, cols, grid },
        complianceTrend,
        departmentPerformance
    };
  }, [hotel, auditLogs, users, inspectionRecords, incidents, tasks, startDate, endDate]);
  
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard id="avg-compliance-card" title="Avg. Compliance" value={`${dashboardData.avgCompliance}%`} icon={<TrendingUpIcon {...iconProps} />} />
        <StatCard id="audits-period-card" title="Inspections Done" value={`${dashboardData.inspectionCount}`} icon={<ClipboardCheckIcon {...iconProps} />} />
        <StatCard id="open-issues-card" title="Open Incidents" value={`${dashboardData.openIncidentsCount}`} isPositive={dashboardData.openIncidentsCount === 0} icon={<TicketIcon {...iconProps} />} />
        <StatCard id="task-rate-card" title="Task Completion" value={`${dashboardData.taskCompletionRate}%`} isPositive={dashboardData.taskCompletionRate > 80} icon={<CalendarCheckIcon {...iconProps} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
            <PriorityFollowUps items={dashboardData.followUps} users={users} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 3: Compliance Trend (Line) */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="chart-trend-heading">
                    <h3 id="chart-trend-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Compliance Trend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        {dashboardData.complianceTrend.length > 0 ? (
                            <LineChart data={dashboardData.complianceTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} name="Avg Score" />
                            </LineChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">No data available.</div>
                        )}
                    </ResponsiveContainer>
                </section>

                {/* Chart 4: Department Performance (Bar) */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="chart-dept-heading">
                    <h3 id="chart-dept-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Department Performance</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        {dashboardData.departmentPerformance.length > 0 ? (
                            <BarChart data={dashboardData.departmentPerformance} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} unit="%" />
                                <YAxis type="category" dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} width={80} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                <Bar dataKey="score" fill="#82ca9d" name="Avg Score" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">No data available.</div>
                        )}
                    </ResponsiveContainer>
                </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart 1: Comparison or Trend */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="chart-1-heading">
                    <h3 id="chart-1-heading" className="font-semibold text-slate-800 dark:text-white mb-4">
                        {hotel ? 'Inspection Score Distribution' : 'Hotel Compliance Comparison'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={hotel ? dashboardData.auditorChartData : dashboardData.hotelComparisonData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                            <XAxis dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                            <Bar dataKey={hotel ? "Average Score" : "Compliance Score"} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </section>

                {/* Chart 2: Incident Categories */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="chart-2-heading">
                    <h3 id="chart-2-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Incidents by Category</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        {dashboardData.incidentCategoryData.length > 0 ? (
                            <PieChart>
                                <Pie
                                    data={dashboardData.incidentCategoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {dashboardData.incidentCategoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                <Legend />
                            </PieChart>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">No incidents in this period.</div>
                        )}
                    </ResponsiveContainer>
                </section>
            </div>

            <Heatmap 
                title={hotel ? "Compliance by Area & Department" : "Compliance by Hotel & Department"}
                rows={dashboardData.heatmapData.rows}
                cols={dashboardData.heatmapData.cols}
                grid={dashboardData.heatmapData.grid}
            />
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
            <TeamPerformanceSnapshot topPerformers={dashboardData.topPerformers} mostActive={dashboardData.mostActiveAuditors} />
            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md" aria-labelledby="activity-heading">
                <h3 id="activity-heading" className="font-semibold text-slate-800 dark:text-white mb-4">Recent Activity Log</h3>
                <ul className="space-y-4">
                    {auditLogs.slice(0, 6).map(activity => {
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
    </div>
  );
};