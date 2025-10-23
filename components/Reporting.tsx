import React, { useState, useMemo } from 'react';
import { InspectionRecord, Hotel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ReportingProps {
  records: InspectionRecord[];
  hotels: Hotel[];
}

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
  <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg text-center">
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">{value}</p>
  </div>
);

export const Reporting: React.FC<ReportingProps> = ({ records, hotels }) => {
  const today = new Date();
  const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [hotelId, setHotelId] = useState('all');
  const [statusFilter, setStatusFilter] = useState<InspectionRecord['status'] | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [report, setReport] = useState<any>(null);

  const departments = useMemo(() => {
    const allDepartments = records.map(r => r.department);
    return [...new Set(allDepartments)].sort();
  }, [records]);
  
  const handleGenerateReport = () => {
    const filteredRecords = records.filter(rec => {
      const recordDate = new Date(rec.date);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to start of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of the day

      const isAfterStart = recordDate >= start;
      const isBeforeEnd = recordDate <= end;
      const isCorrectHotel = hotelId === 'all' || hotels.find(h => h.id === hotelId)?.name === rec.hotelName;
      const isCorrectStatus = statusFilter === 'all' || rec.status === statusFilter;
      const isCorrectDepartment = departmentFilter === 'all' || rec.department === rec.department;
      return isAfterStart && isBeforeEnd && isCorrectHotel && isCorrectStatus && isCorrectDepartment;
    });

    if (filteredRecords.length === 0) {
      setReport({ isEmpty: true });
      return;
    }

    const completedRecords = filteredRecords.filter(rec => rec.status === 'Completed');

    const reportData: any = {
      totalInspections: filteredRecords.length,
      completedCount: completedRecords.length,
      inProgressCount: filteredRecords.filter(r => r.status === 'In Progress').length,
      overdueCount: filteredRecords.filter(r => r.status === 'Overdue').length,
      isEmpty: false,
      hasCompletedData: completedRecords.length > 0,
    };
    
    if (reportData.hasCompletedData) {
      let totalItems = 0;
      let totalPassed = 0;

      const failedItemsByQuestion: Record<string, number> = {};
      const inspectionsByDay: Record<string, { scores: number[] }> = {};
      const complianceByDept: Record<string, { scores: number[] }> = {};

      completedRecords.forEach(rec => {
          totalItems += rec.results.length;
          totalPassed += rec.results.filter(r => r.status === 'pass').length;
          
          rec.results.forEach(res => {
              if (res.status === 'fail') {
                  failedItemsByQuestion[res.question] = (failedItemsByQuestion[res.question] || 0) + 1;
              }
          });

          const recordDateOnly = rec.date.split('T')[0];
          if (!inspectionsByDay[recordDateOnly]) {
              inspectionsByDay[recordDateOnly] = { scores: [] };
          }
          inspectionsByDay[recordDateOnly].scores.push(rec.complianceScore);
          
          if (!complianceByDept[rec.department]) {
              complianceByDept[rec.department] = { scores: [] };
          }
          complianceByDept[rec.department].scores.push(rec.complianceScore);
      });

      reportData.avgCompliance = totalItems > 0 ? Math.round((totalPassed / totalItems) * 100) : 0;
      
      reportData.topFailedItems = Object.entries(failedItemsByQuestion)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([question, count]) => ({ question, count }));

      reportData.complianceOverTime = Object.entries(inspectionsByDay)
          .map(([date, data]) => ({
              date,
              'Average Score': Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
      reportData.complianceByDepartment = Object.entries(complianceByDept)
          .map(([department, data]) => ({
              name: department,
              'Average Score': Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
          }))
          .sort((a,b) => b['Average Score'] - a['Average Score']);
    }
    
    setReport(reportData);
  };
  
  const handlePrint = () => {
    window.print();
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reporting & Analytics</h1>
      
      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Date Filters */}
            <div className="lg:col-span-2 xl:col-span-2 grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"/>
                </div>
            </div>
            {/* Hotel Filter */}
            <div>
                <label htmlFor="hotel-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hotel</label>
                <select id="hotel-filter" value={hotelId} onChange={e => setHotelId(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                <option value="all">All Hotels</option>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            </div>
            {/* Status Filter */}
             <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="all">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Overdue">Overdue</option>
                </select>
            </div>
             {/* Department Filter */}
            <div>
                <label htmlFor="department-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select id="department-filter" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                    <option value="all">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="flex items-end">
                <button onClick={handleGenerateReport} className="w-full bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors shadow-md h-full">
                Generate Report
                </button>
            </div>
        </div>
      </div>
      
      {/* Report Section */}
      {report && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md printable-area animate-fade-in">
            {report.isEmpty ? (
                <p className="text-center text-slate-500 dark:text-slate-400">No inspection records found for the selected filters.</p>
            ) : (
                <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 dark:border-slate-700 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Compliance Report</h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                For period: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                            </p>
                        </div>
                        <button onClick={handlePrint} className="no-print mt-4 sm:mt-0 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                            Print Report
                        </button>
                    </div>

                    {/* Summary Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Selection Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <StatCard title="Total Inspections" value={report.totalInspections} />
                           <StatCard title="Completed" value={report.completedCount} />
                           <StatCard title="In Progress" value={report.inProgressCount} />
                           <StatCard title="Overdue" value={report.overdueCount} />
                        </div>
                    </div>
                    
                    {/* Detailed Analysis Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Detailed Analysis of Completed Inspections</h3>
                        {!report.hasCompletedData ? (
                             <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <p className="font-semibold text-slate-600 dark:text-slate-300">No completed inspections found in your selection.</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed charts and compliance scores can only be generated from completed records.</p>
                            </div>
                        ) : (
                           <div className="space-y-8">
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    <div className="xl:col-span-1">
                                         <StatCard title="Overall Compliance Score" value={`${report.avgCompliance}%`} />
                                        <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2 text-center">Top Failed Items</h4>
                                            {report.topFailedItems.length > 0 ? (
                                                <ul className="space-y-2 text-sm">
                                                {report.topFailedItems.map((item: any) => (
                                                    <li key={item.question} className="flex justify-between items-center bg-slate-100 dark:bg-slate-700 p-2 rounded">
                                                    <span className="truncate pr-2 text-slate-700 dark:text-slate-300">{item.question}</span>
                                                    <span className="font-bold text-red-500 flex-shrink-0">{item.count}</span>
                                                    </li>
                                                ))}
                                                </ul>
                                            ): (
                                                <p className="text-center text-xs text-slate-500 dark:text-slate-400 py-2">No failed items in this selection.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="xl:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-4 text-center">Compliance by Department</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={report.complianceByDepartment} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} unit="%" />
                                                <YAxis type="category" dataKey="name" tick={{ fill: 'rgb(100 116 139)', fontSize: 12, width: 200 }} />
                                                <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                                <Bar dataKey="Average Score" fill="#4f46e5" name="Avg. Score" unit="%" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-4 text-center">Compliance Rate Over Time</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={report.complianceOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                            <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: 'rgb(100 116 139)' }} unit="%" />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                                            <Line type="monotone" dataKey="Average Score" stroke="#4f46e5" strokeWidth={2} name="Avg. Daily Score" unit="%" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                           </div>
                        )}
                    </div>

                </div>
            )}
        </div>
      )}
    </div>
  );
};