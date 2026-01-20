
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const HistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All Types');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '30days'>('all');

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

  const handleNewCampaign = () => {
    navigate('/bulk-sender');
  };

  const exportHistory = () => {
    if (history.length === 0) {
      alert('No history to export');
      return;
    }

    const csvContent = [
      ['Timestamp', 'Name', 'Type', 'Recipients', 'Success Rate', 'Status', 'Ratio'].join(','),
      ...history.map(h => [
        h.timestamp + ' ' + (h.time || ''),
        h.name,
        h.type,
        h.recipients,
        h.rate,
        h.status,
        h.ratio || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'campaign_history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = history.filter(h => {
    // Type Filter
    let matchesType = true;
    if (activeFilter === 'Text Only') matchesType = h.type === 'Text Only' || h.icon === 'chat';
    else if (activeFilter === 'Media + Files') matchesType = h.type === 'Media + Files' || h.icon === 'image';
    else if (activeFilter === 'Success Only') matchesType = parseInt(h.rate || '0') === 100;

    // Search Filter
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Date Filter (Simple local check)
    let matchesDate = true;
    if (dateRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = new Date(h.timestamp) >= thirtyDaysAgo;
    }

    return matchesType && matchesSearch && matchesDate;
  });

  const handleViewDetails = (campaign: any) => {
    alert(`Campaign Details:\nName: ${campaign.name}\nType: ${campaign.type}\nRecipients: ${campaign.recipients}\nSuccess: ${campaign.ratio}\nDate: ${campaign.timestamp}`);
  };

  const totalMessages = history.reduce((acc, h) => acc + (h.recipients || 0), 0);
  const avgSuccess = history.length > 0
    ? Math.round(history.reduce((acc, h) => acc + parseInt(h.rate || '0'), 0) / history.length)
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Sent History</h2>
        <div className="flex gap-3">
          <button
            onClick={exportHistory}
            className="p-2 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:text-[#135bec] transition-all"
            title="Download CSV"
          >
            <span className="material-symbols-outlined">download</span>
          </button>
          <button
            onClick={handleNewCampaign}
            className="bg-[#135bec] text-white px-5 py-2.5 rounded-xl text-sm font-black tracking-wide hover:scale-105 transition-all"
          >
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Messages Sent', val: totalMessages.toString(), trend: '0%', icon: 'chat' },
          { label: 'Avg. Success Rate', val: `${avgSuccess}%`, trend: '0%', icon: 'verified' },
          { label: 'Active Campaigns', val: history.filter(h => h.status === 'In Progress').length.toString(), trend: 'None', icon: 'pending_actions' }
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative group overflow-hidden shadow-lg">
            <span className="material-symbols-outlined text-7xl text-[#135bec] absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity">{s.icon}</span>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{s.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{s.val}</p>
            <p className="text-[10px] font-bold text-emerald-400 mt-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              {s.trend} <span className="text-slate-600 ml-1">vs last month</span>
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message Audit Log</h3>
          <div className="flex gap-2">
            <div className={`flex items-center bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 transition-all ${showSearch ? 'w-48 md:w-64 border-[#135bec]' : 'w-24'}`}>
              <span
                onClick={() => setShowSearch(!showSearch)}
                className="material-symbols-outlined text-sm text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                {showSearch ? 'close' : 'filter_list'}
              </span>
              {showSearch ? (
                <input
                  autoFocus
                  className="bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white ml-2 w-full"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              ) : (
                <span onClick={() => setShowSearch(true)} className="text-xs font-bold text-slate-400 ml-2 cursor-pointer">Filter</span>
              )}
            </div>

            <button
              onClick={() => setDateRange(dateRange === 'all' ? '30days' : 'all')}
              className={`flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold transition-colors ${dateRange === '30days' ? 'bg-[#135bec]/10 border-[#135bec] text-[#135bec]' : 'bg-white dark:bg-[#1c1f27] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              {dateRange === '30days' ? 'Last 30 Days' : 'All Time'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All Types', 'Text Only', 'Media + Files', 'Success Only'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === t ? 'bg-[#135bec] text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-[#1c1f27] text-slate-500 border border-slate-200 dark:border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded bg-transparent border-slate-300 dark:border-slate-700" /></th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Campaign Name / Type</th>
                <th className="px-6 py-4">Recipients</th>
                <th className="px-6 py-4">Success Rate</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-slate-500">Loading history...</td></tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-[#9da6b9]">
                    No campaigns match this filter.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded bg-transparent border-slate-700" /></td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200">{h.timestamp}</span>
                        <span className="text-[10px] text-slate-500">{h.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="size-9 rounded-xl bg-[#135bec]/10 text-[#135bec] flex items-center justify-center">
                          <span className="material-symbols-outlined text-xl">{h.icon}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white truncate max-w-[200px]">{h.name}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{h.type}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-300">{h.recipients}</td>
                    <td className="px-6 py-4">
                      <div className="w-32 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                          <span className={`text-${h.color}-400`}>{h.rate}</span>
                          <span className="text-slate-600">{h.ratio}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-${h.color}-500`} style={{ width: h.rate }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${h.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        h.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                        }`}>{h.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(h)}
                        className="text-[#135bec] text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>Showing {history.length} results</span>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#282e39] font-bold text-slate-600 dark:text-slate-400">Prev</button>
              <button className="px-4 py-1.5 rounded-lg bg-[#135bec] text-white font-bold">1</button>
              <button className="px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#282e39] font-bold text-slate-600 dark:text-slate-400">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;
