import React, { useState, useMemo } from 'react';
import { InspectionRecord, Hotel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { PrinterIcon } from './icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  const departments = useMemo(() => {
    const allDepartments = records.map(r => r.department);
    return [...new Set(allDepartments)].sort();
  }, [records]);

  const setDateRangePreset = (preset: 'day' | 'week' | 'month') => {
    const end = new Date();
    let start = new Date();
    if (preset === 'day') {
        // start is already today
    } else if (preset === 'week') {
        // Monday as start of the week
        const day = end.getDay();
        const diff = end.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(end.setDate(diff));
    } else if (preset === 'month') {
        start.setDate(1);
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };
  
  const handleGenerateReport = () => {
    setSelectedRecordIds(new Set()); // Reset selections on new report
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
      const isCorrectDepartment = departmentFilter === 'all' || rec.department === departmentFilter;
      return isAfterStart && isBeforeEnd && isCorrectHotel && isCorrectStatus && isCorrectDepartment;
    });

    if (filteredRecords.length === 0) {
      setReport({ isEmpty: true });
      return;
    }

    const completedRecords = filteredRecords.filter(rec => rec.status === 'Completed');

    const reportData: any = {
      filteredRecords, // Pass raw filtered records for PDF and selection table
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
  
  const handleSelectRecord = (recordId: string) => {
    setSelectedRecordIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(recordId)) newSet.delete(recordId);
        else newSet.add(recordId);
        return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && report?.filteredRecords) {
        setSelectedRecordIds(new Set(report.filteredRecords.map((r: InspectionRecord) => r.id)));
    } else {
        setSelectedRecordIds(new Set());
    }
  };

  const handleExportPDF = () => {
    if (!report || report.isEmpty || selectedRecordIds.size === 0) return;

    const selectedRecords = report.filteredRecords.filter((r: InspectionRecord) => selectedRecordIds.has(r.id));
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text("Compliance Audit Report (Selected)", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 14, 34);

    // Recalculate summary for selected items
    const completed = selectedRecords.filter(r => r.status === 'Completed');
    const inProgress = selectedRecords.filter(r => r.status === 'In Progress');
    const overdue = selectedRecords.filter(r => r.status === 'Overdue');
    let avgCompliance = 'N/A';
    if (completed.length > 0) {
        const totalItems = completed.reduce((sum, rec) => sum + rec.results.length, 0);
        const totalPassed = completed.reduce((sum, rec) => sum + rec.results.filter(r => r.status === 'pass').length, 0);
        avgCompliance = totalItems > 0 ? `${Math.round((totalPassed / totalItems) * 100)}%` : '0%';
    }

    // Summary Section
    doc.setFontSize(14);
    doc.text("Executive Summary (Selected Items)", 14, 45);
    
    autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: [
            ['Total Selected Inspections', selectedRecords.length],
            ['Completed', completed.length],
            ['In Progress', inProgress.length],
            ['Overdue', overdue.length],
            ['Compliance Score of Selected', avgCompliance],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] } // primary-600
    });

    // Detailed Records Table
    const lastY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Detailed Log (Selected Items)", 14, lastY);

    autoTable(doc, {
        startY: lastY + 5,
        head: [['Date', 'Template', 'Hotel', 'Auditor', 'Score', 'Status']],
        body: selectedRecords.map(rec => [
            rec.date,
            rec.templateName,
            rec.hotelName,
            rec.auditor,
            rec.status === 'Completed' ? `${rec.complianceScore}%` : '-',
            rec.status
        ]),
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] }, // slate-700
        styles: { fontSize: 8 }
    });

    doc.save(`audit-report-selected-${startDate}-${endDate}.pdf`);
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reporting & Analytics</h1>
      
      {/* Filters Section */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md space-y-4 no-print">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Filters:</span>
            <button onClick={() => setDateRangePreset('day')} className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">Today</button>
            <button onClick={() => setDateRangePreset('week')} className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">This Week</button>
            <button onClick={() => setDateRangePreset('month')} className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600">This Month</button>
        </div>
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
                        <div className="mt-4 sm:mt-0 flex gap-2">
                             <button onClick={handleExportPDF} disabled={selectedRecordIds.size === 0} className="no-print bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                <PrinterIcon className="w-4 h-4" />
                                Export Selected ({selectedRecordIds.size}) to PDF
                            </button>
                            <button onClick={() => window.print()} className="no-print bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                Quick Print
                            </button>
                        </div>
                    </div>

                     {/* Selectable Table */}
                     <div className="no-print">
                        <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-300">Filtered Inspections ({report.filteredRecords.length})</h3>
                        <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                    <tr>
                                        <th className="p-3">
                                            <input type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                onChange={handleSelectAll}
                                                checked={selectedRecordIds.size > 0 && selectedRecordIds.size === report.filteredRecords.length}
                                            />
                                        </th>
                                        <th className="p-3 font-semibold text-slate-500 dark:text-slate-400">Date</th>
                                        <th className="p-3 font-semibold text-slate-500 dark:text-slate-400">Template</th>
                                        <th className="p-3 font-semibold text-slate-500 dark:text-slate-400">Hotel</th>
                                        <th className="p-3 font-semibold text-slate-500 dark:text-slate-400">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {report.filteredRecords.map((rec: InspectionRecord) => (
                                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                            <td className="p-3">
                                                <input type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                    checked={selectedRecordIds.has(rec.id)}
                                                    onChange={() => handleSelectRecord(rec.id)}
                                                />
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{rec.date}</td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{rec.templateName}</td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300">{rec.hotelName}</td>
                                            <td className="p-3 font-semibold">{rec.status === 'Completed' ? `${rec.complianceScore}%` : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
