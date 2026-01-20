import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { TelegramChat } from '../types';

const ChatManagerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { sessionString } = useAuth();
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    if (sessionString) {
      fetchChats();
    }
  }, [sessionString]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const result = await apiService.getGroupChats(sessionString!);
      if (result.status === 'success') {
        setChats(result.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chat.username && chat.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      chat.id.toString().includes(searchTerm);

    if (filterType === 'All') return matchesSearch;
    if (filterType === 'Supergroups') return matchesSearch && chat.type === 'supergroup';
    if (filterType === 'Channels') return matchesSearch && chat.type === 'channel';
    if (filterType === 'Private') return matchesSearch && chat.type === 'private';
    return matchesSearch;
  });

  const getChatInitial = (title: string) => {
    return title.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getChatColor = (id: number) => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-purple-500 to-pink-600',
      'from-amber-500 to-yellow-600',
      'from-rose-500 to-red-600'
    ];
    return colors[Math.abs(id) % colors.length];
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end gap-4 mb-10">
        <div>
          <h2 className="text-slate-900 dark:text-white text-4xl font-extrabold tracking-tight mb-2">Group Chats</h2>
          <p className="text-slate-500 dark:text-[#9da6b9]">Manage and filter your joined groups, supergroups, and channels.</p>
        </div>
        <button
          onClick={fetchChats}
          disabled={loading}
          className="flex items-center gap-2 h-11 px-5 bg-white dark:bg-[#282e39] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-white font-bold hover:shadow-lg transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-xl">{loading ? 'sync' : 'refresh'}</span>
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Chats', val: chats.length },
          { label: 'Supergroups', val: chats.filter(c => c.type === 'supergroup').length },
          { label: 'Channels', val: chats.filter(c => c.type === 'channel').length }
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-500 dark:text-[#9da6b9] text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
          <input
            className="w-full h-12 pl-12 pr-4 bg-white dark:bg-[#282e39] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#135bec]"
            placeholder="Search by chat title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Supergroups', 'Channels', 'Private'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-6 h-12 rounded-xl text-sm font-bold transition-all ${filterType === f ? 'bg-[#135bec] text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-[#282e39] text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-[#135bec]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#111318] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#9da6b9] uppercase tracking-widest">Chat Details</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#9da6b9] uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#9da6b9] uppercase tracking-widest">Chat ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-[#9da6b9] uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredChats.map((chat) => (
              <tr key={chat.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${getChatColor(chat.id)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                      {getChatInitial(chat.title)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{chat.title}</p>
                      <p className="text-xs text-slate-500 dark:text-[#9da6b9]">{chat.username ? `@${chat.username}` : 'No Username'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${chat.type === 'channel' ? 'bg-emerald-900/40 text-emerald-400' :
                    chat.type === 'supergroup' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                    {chat.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 group cursor-pointer text-[#9da6b9] hover:text-[#135bec] transition-colors" onClick={() => navigator.clipboard.writeText(chat.id.toString())}>
                    <span className="font-mono text-sm">{chat.id}</span>
                    <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100">content_copy</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => navigate('/bulk-sender', { state: { initialChatId: chat.id.toString() } })}
                      className="p-2 text-slate-500 hover:text-[#135bec] hover:bg-[#135bec]/10 rounded-lg transition-all"
                      title="Send Message"
                    >
                      <span className="material-symbols-outlined">mail</span>
                    </button>
                    <button
                      onClick={() => navigate('/members', { state: { initialGroupId: chat.id.toString() } })}
                      className="p-2 text-slate-500 hover:text-[#135bec] hover:bg-[#135bec]/10 rounded-lg transition-all"
                      title="View Members"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-[#9da6b9]">
                  <span className="material-symbols-outlined animate-spin mr-2">sync</span>
                  Fetching chats from Telegram...
                </td>
              </tr>
            )}
            {!loading && filteredChats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-[#9da6b9]">
                  No chats found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/20 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">Showing {filteredChats.length} results</p>
        </div>
      </div>
    </div>
  );
};

export default ChatManagerScreen;
