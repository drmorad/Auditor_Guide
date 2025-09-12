import React, { useState, useMemo } from 'react';
import { InspectionRecord, Hotel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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
  const [report, setReport] = useState<any>(null);

  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const recordDate = new Date(rec.date);
      const isCompleted = rec.status === 'Completed';
      const isAfterStart = !startDate || recordDate >= new Date(startDate);
      const isBeforeEnd = !endDate || recordDate <= new Date(endDate);
      const isCorrectHotel = hotelId === 'all' || hotels.find(h => h.id === hotelId)?.name === rec.hotelName;
      return isCompleted && isAfterStart && isBeforeEnd && isCorrectHotel;
    });
  }, [records, startDate, endDate, hotelId, hotels]);
  
  const handleGenerateReport = () => {
    if (filteredRecords.length === 0) {
      setReport({ isEmpty: true });
      return;
    }

    const totalInspections = filteredRecords.length;
    let totalItems = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    const failedItemsByCategory: Record<string, number> = {};
    const inspectionsByDay: Record<string, { total: number, failed: number }> = {};

    filteredRecords.forEach(rec => {
        totalItems += rec.results.length;
        const failedCount = rec.results.filter(r => r.status === 'fail').length;
        totalFailed += failedCount;
        totalPassed += rec.results.filter(r => r.status === 'pass').length;

        rec.results.forEach(res => {
            if (res.status === 'fail') {
                failedItemsByCategory[rec.department] = (failedItemsByCategory[rec.department] || 0) + 1;
            }
        });

        const date = rec.date;
        if (!inspectionsByDay[date]) {
            inspectionsByDay[date] = { total: 0, failed: 0 };
        }
        inspectionsByDay[date].total++;
        if (failedCount > 0) {
          inspectionsByDay[date].failed++;
        }
    });

    const overallCompliance = totalItems > 0 ? Math.round((totalPassed / totalItems) * 100) : 0;
    const topFailingCategories = Object.entries(failedItemsByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, failed_items: value }));

    const trendData = Object.entries(inspectionsByDay)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, data]) => ({
          date,
          'Compliance Rate': Math.round(((data.total - data.failed) / data.total) * 100),
      }));

    setReport({
      totalInspections,
      overallCompliance,
      totalItems,
      totalFailed,
      topFailingCategories,
      trendData,
      isEmpty: false,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Reporting</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Generate summary reports based on completed inspections.</p>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md space-y-4 no-print">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
            </div>
            <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm"/>
            </div>
            <div>
                <label htmlFor="hotel-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hotel/Resort</label>
                <select id="hotel-filter" value={hotelId} onChange={e => setHotelId(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm">
                    <option value="all">All Hotels</option>
                    {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
            </div>
        </div>
        <div className="flex justify-end">
            <button onClick={handleGenerateReport} className="bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md">Generate Report</button>
        </div>
      </div>

      {report && (
        <div id="report-preview" className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow-md printable-area">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Inspection Summary Report</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                For {hotelId === 'all' ? 'All Hotels' : hotels.find(h => h.id === hotelId)?.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Date Range: {startDate} to {endDate}
              </p>
            </div>
            <button onClick={handlePrint} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors no-print">
              Export to PDF
            </button>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

          {report.isEmpty ? (
            <p className="text-center py-12 text-slate-500 dark:text-slate-400">No completed inspections found for the selected criteria.</p>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Inspections" value={report.totalInspections} />
                <StatCard title="Overall Compliance" value={`${report.overallCompliance}%`} />
                <StatCard title="Total Items Checked" value={report.totalItems} />
                <StatCard title="Total Failures" value={report.totalFailed} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Top Failing Departments</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report.topFailingCategories} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'rgb(100 116 139)', fontSize: 12, width: 200 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }} />
                      <Bar dataKey="failed_items" fill="#ef4444" name="Failed Items" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Compliance Rate Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <LineChart data={report.trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                            <XAxis dataKey="date" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                            <YAxis domain={[0, 100]} unit="%" tick={{ fill: 'rgb(100 116 139)', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(128,128,128,0.5)' }}/>
                            <Legend />
                            <Line type="monotone" dataKey="Compliance Rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};