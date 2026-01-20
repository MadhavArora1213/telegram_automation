import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { TelegramMember } from '../types';

const MemberManagementScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionString } = useAuth();
  const [groupId, setGroupId] = useState('');
  const [members, setMembers] = useState<TelegramMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (location.state && (location.state as any).initialGroupId) {
      const id = (location.state as any).initialGroupId;
      setGroupId(id);
    }
  }, [location.state]);

  useEffect(() => {
    if (groupId && sessionString && location.state && (location.state as any).initialGroupId) {
      handleFetchMembers();
    }
  }, [groupId, sessionString]);

  const handleFetchMembers = async () => {
    if (!groupId) {
      alert('Please enter a Group ID or Username');
      return;
    }
    if (!sessionString) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.fetchMembers(sessionString, groupId);
      if (result.status === 'success') {
        setMembers(result.members);
        setSelectedIds([]);
      } else {
        alert(result.message || 'Failed to fetch members');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map(m => m.id));
    }
  };

  const toggleSelectMember = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = (isAll: boolean) => {
    const listToExport = isAll ? members : members.filter(m => selectedIds.includes(m.id));
    if (listToExport.length === 0) {
      alert('No members to export');
      return;
    }

    const csvContent = [
      ['User ID', 'First Name', 'Last Name', 'Username', 'Status'].join(','),
      ...listToExport.map(m => [m.id, m.firstName || '', m.lastName || '', m.username || '', m.status || 'Active'].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `members_${groupId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkMessage = () => {
    if (selectedIds.length === 0) {
      alert('Please select members first');
      return;
    }
    // Convert numerical IDs to string IDs for the bulk sender
    const strIds = selectedIds.map(id => id.toString());
    navigate('/bulk-sender', { state: { initialChatIds: strIds } });
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to remove ${selectedIds.length} members from the local list?`)) {
      setMembers(prev => prev.filter(m => !selectedIds.includes(m.id)));
      setSelectedIds([]);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto pb-32">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Manage Group Members</h1>
          <p className="text-slate-500 dark:text-[#9da6b9] mt-2">Fetch, filter, and execute bulk operations on Telegram group participants.</p>
        </div>
        <button
          onClick={() => handleExport(true)}
          className="flex items-center gap-2 px-6 h-11 bg-white dark:bg-[#282e39] text-slate-700 dark:text-white font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#135bec] transition-all"
        >
          <span className="material-symbols-outlined text-sm">upload_file</span>
          Export All
        </button>
      </div>

      <div className="bg-white dark:bg-[#1c1f27] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-9">
            <label className="block mb-3 text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">Group ID or Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">link</span>
              <input
                className="w-full bg-slate-50 dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl h-14 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#135bec] outline-none transition-all"
                placeholder="e.g. -10012345678 or @official_group"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />
            </div>
          </div>
          <div className="md:col-span-3">
            <button
              onClick={handleFetchMembers}
              disabled={loading}
              className="w-full h-14 bg-[#135bec] text-white font-black rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#135bec]/30 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">{loading ? 'sync' : 'group_add'}</span>
              {loading ? 'Fetching...' : 'Fetch Members'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { icon: 'groups', label: 'Total', val: members.length.toString(), color: 'text-blue-400 bg-blue-400/10' },
          { icon: 'check_circle', label: 'Selected', val: selectedIds.length.toString(), color: 'text-[#135bec] bg-[#135bec]/10' },
          { icon: 'description', label: 'Format', val: 'CSV', color: 'text-emerald-400 bg-emerald-400/10' },
          { icon: 'verified_user', label: 'Verified', val: 'Active', color: 'text-amber-400 bg-amber-400/10' }
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
            <div className={`size-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <span className="material-symbols-outlined text-2xl">{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Active Group:</span>
            <span className="px-3 py-1 bg-[#135bec]/10 text-[#135bec] text-xs font-bold rounded-full">{groupId || 'None'}</span>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 w-12">
                <input
                  type="checkbox"
                  checked={members.length > 0 && selectedIds.length === members.length}
                  onChange={toggleSelectAll}
                  className="rounded bg-transparent border-slate-300 dark:border-slate-700 text-[#135bec]"
                />
              </th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User ID</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Username</th>
              <th className="px-4 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m, i) => (
              <tr key={m.id} className={`hover:bg-white/5 transition-colors ${selectedIds.includes(m.id) ? 'bg-[#135bec]/5' : ''}`}>
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => toggleSelectMember(m.id)}
                    className="rounded bg-transparent border-slate-300 dark:border-slate-700 text-[#135bec]"
                  />
                </td>
                <td className="px-4 py-4 text-xs font-mono text-slate-500">{m.id}</td>
                <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">{m.firstName}</td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">{m.lastName}</td>
                <td className="px-4 py-4 text-sm text-[#135bec] font-semibold">@{m.username}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{m.status || 'Active'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:text-white">more_vert</span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 dark:text-[#9da6b9]">
                  No members fetched yet. Enter a Group ID above to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-8 bg-slate-900 dark:bg-slate-900 border border-white/10 px-8 py-4 rounded-full shadow-2xl z-30 ring-1 ring-white/10 ml-32">
        <div className="flex items-center gap-3">
          <span className="bg-white/20 size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white">{selectedIds.length}</span>
          <span className="text-sm font-bold text-white">Selected</span>
        </div>
        <div className="h-6 w-px bg-white/10"></div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleBulkMessage}
            className="flex items-center gap-2 text-white text-sm font-bold hover:text-[#135bec] transition-colors"
          >
            <span className="material-symbols-outlined text-base">send</span>Bulk Message
          </button>
          <button
            onClick={() => handleExport(false)}
            className="flex items-center gap-2 text-white text-sm font-bold hover:text-[#135bec] transition-colors"
          >
            <span className="material-symbols-outlined text-base">download</span>Export
          </button>
          <button
            onClick={handleDelete}
            className="text-white/40 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberManagementScreen;
