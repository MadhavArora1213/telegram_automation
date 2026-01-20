import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '../services/api';

const DashboardOverview: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await apiService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSent = history.reduce((acc, h) => acc + (h.recipients || 0), 0);
  const avgSuccess = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + parseInt(h.rate || '0'), 0) / history.length)
    : 0;

  const exportReport = () => {
    if (history.length === 0) {
      alert('No data to export');
      return;
    }
    const headers = ['Timestamp', 'Campaign', 'Type', 'Recipients', 'Success Rate', 'Status'];
    const csvContent = [
      headers.join(','),
      ...history.map(h => [h.timestamp, h.name, h.type, h.recipients, h.rate, h.status].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teleauto_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Prepare chart data (last 7 entries)
  const chartData = history.slice(0, 7).reverse().map(h => ({
    name: h.timestamp.split(',')[0],
    sent: h.recipients,
    failed: Math.round(h.recipients * (1 - parseInt(h.rate) / 100))
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-[#9da6b9]">Monitor your account activity and campaign performance at a glance.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportReport}
            className="px-6 h-12 rounded-xl bg-white dark:bg-[#282e39] text-slate-700 dark:text-white font-bold border border-slate-200 dark:border-slate-800 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-[#323945] transition-all"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: 'send', label: 'Total Sent', val: totalSent.toLocaleString(), trend: '+0%', color: 'text-blue-400 bg-blue-400/10' },
          { icon: 'group', label: 'Campaigns', val: history.length.toString(), trend: 'Active', color: 'text-purple-400 bg-purple-400/10' },
          { icon: 'verified', label: 'Avg Success', val: `${avgSuccess}%`, trend: '0%', color: 'text-emerald-400 bg-emerald-400/10' },
          { icon: 'schedule', label: 'Uptime', val: '100%', trend: 'Stable', color: 'text-amber-400 bg-amber-400/10' }
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className={`size-10 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
              <span className="material-symbols-outlined text-xl">{s.icon}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-[#9da6b9] mb-1">{s.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{s.val}</p>
              <p className="text-xs font-bold text-emerald-400">{s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Campaign Performance</h3>
            <div className="text-[10px] text-slate-500 dark:text-[#9da6b9] font-bold uppercase tracking-widest">Recent Campaigns</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282e39" vertical={false} />
                <XAxis dataKey="name" stroke="#565f73" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#565f73" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111318', border: '1px solid #282e39', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px' }}
                />
                <Bar dataKey="sent" name="Sent" fill="#135bec" radius={[2, 2, 0, 0]} barSize={20} />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] scrollbar-hide">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-[#9da6b9] text-center py-10">No recent activity found.</p>
            ) : (
              history.slice(0, 5).map((h, i) => (
                <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                  <div className={`mt-1 size-8 rounded-lg flex items-center justify-center ${h.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    <span className="material-symbols-outlined text-sm">{h.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{h.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-[#9da6b9] font-medium">{h.timestamp} • {h.ratio} Sent</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-[#9da6b9] hover:text-[#135bec] transition-colors">View All Activity</button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
