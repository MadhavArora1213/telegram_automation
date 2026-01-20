import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { TelegramChat } from '../types';

const BulkSenderScreen: React.FC = () => {
  const location = useLocation();
  const { sessionString } = useAuth();
  const [msgType, setMsgType] = useState<'text' | 'media'>('text');
  const [progress, setProgress] = useState(0);
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryTiming, setDeliveryTiming] = useState<'now' | 'scheduled'>('now');
  const [scheduledTime, setScheduledTime] = useState('');
  const [statusLogs, setStatusLogs] = useState<{ time: string, status: string, msg: string, color: string }[]>([]);

  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.initialChatIds) {
        setSelectedChatIds(prev => {
          const newIds = state.initialChatIds.filter((id: string) => !prev.includes(id));
          return [...prev, ...newIds];
        });
      } else if (state.initialChatId) {
        const id = state.initialChatId;
        setSelectedChatIds(prev => prev.includes(id) ? prev : [...prev, id]);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (sessionString) {
      fetchChats();
    }
  }, [sessionString]);

  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const fetchChats = async () => {
    try {
      const result = await apiService.getGroupChats(sessionString!);
      if (result.status === 'success') {
        setChats(result.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats', err);
    }
  };

  const addLog = (status: string, msg: string, color: string) => {
    const time = new Date().toLocaleTimeString();
    setStatusLogs(prev => [{ time, status, msg, color }, ...prev].slice(0, 50));
  };

  const handleSend = async () => {
    if (selectedChatIds.length === 0) {
      alert('Please select at least one recipient');
      return;
    }
    if (!messageText && !mediaFile) {
      alert('Please enter a message or upload media');
      return;
    }

    if (deliveryTiming === 'scheduled' && !scheduledTime) {
      alert('Please select a scheduled time');
      return;
    }

    if (deliveryTiming === 'scheduled') {
      const waitTime = new Date(scheduledTime).getTime() - new Date().getTime();
      if (waitTime <= 0) {
        alert('Please select a future time');
        return;
      }
      addLog('SYSTEM', `Campaign scheduled for ${new Date(scheduledTime).toLocaleString()}`, 'text-amber-400');
      setLoading(true);
      setTimeout(() => executeSend(), waitTime);
      return;
    }

    executeSend();
  };

  const executeSend = async () => {
    setLoading(true);
    setProgress(0);
    setSentCount(0);
    setFailedCount(0);
    addLog('SYSTEM', `Starting campaign for ${selectedChatIds.length} recipients...`, 'text-[#135bec]');

    try {
      let results;
      if (msgType === 'text') {
        results = await apiService.sendMessage(sessionString!, selectedChatIds, messageText);
      } else if (mediaFile) {
        results = await apiService.sendMedia(sessionString!, selectedChatIds, mediaFile, messageText);
      }

      if (results && results.results) {
        const total = selectedChatIds.length;
        let successful = 0;
        let failed = 0;
        results.results.forEach((res: any, index: number) => {
          if (res.status === 'success') {
            successful++;
            addLog('SUCCESS', `Sent to ${res.id}`, 'text-green-500');
          } else {
            failed++;
            addLog('FAILED', `Failed to ${res.id}: ${res.message}`, 'text-red-500');
          }
          setProgress(Math.round(((index + 1) / total) * 100));
        });
        setSentCount(successful);
        setFailedCount(failed);
        addLog('SYSTEM', `Campaign completed. ${successful}/${total} successful.`, 'text-white');

        // Save to History
        const rate = Math.round((successful / total) * 100);
        await apiService.saveHistory({
          name: messageText.slice(0, 30) || (mediaFile ? mediaFile.name : 'Untitled Campaign'),
          type: msgType === 'text' ? 'Text Only' : 'Media + Files',
          recipients: total,
          rate: `${rate}%`,
          status: 'Completed',
          ratio: `${successful}/${total}`,
          color: rate > 80 ? 'emerald' : rate > 50 ? 'amber' : 'red',
          icon: msgType === 'text' ? 'chat' : 'image'
        });
      }
    } catch (err: any) {
      addLog('ERROR', err.message || 'Workflow failed', 'text-red-500');
    } finally {
      setLoading(false);
    }
  };

  const toggleChatSelection = (chatId: string) => {
    setSelectedChatIds(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight mb-1">Scheduled Bulk Sender</h1>
          <p className="text-slate-500 dark:text-[#9da6b9] text-lg">Automate your Telegram campaigns with precise scheduling.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#282e39] rounded-lg text-sm font-bold border border-slate-200 dark:border-[#3f4553] shadow-sm">
          <span className="material-symbols-outlined text-green-500 text-sm">wifi</span>
          Connection: {sessionString ? 'Active' : 'Disconnected'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Section 1 */}
          <section className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#282e39] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#135bec]">group_add</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">1. Select Recipients</h3>
              </div>
              <button
                onClick={fetchChats}
                className="bg-[#135bec]/20 text-[#135bec] text-xs font-bold px-4 py-1.5 rounded-full hover:bg-[#135bec]/30"
              >
                Refresh List
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-[#282e39] rounded-xl p-4 bg-slate-50 dark:bg-[#111318] mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chats.map(chat => (
                  <label key={chat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-[#282e39] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedChatIds.includes(chat.id.toString())}
                      onChange={() => toggleChatSelection(chat.id.toString())}
                      className="rounded bg-white dark:bg-[#1c1f27] border-slate-300 dark:border-[#3f4553] text-[#135bec]"
                    />
                    <span className="text-slate-900 dark:text-white text-sm truncate">{chat.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-[#9da6b9] ml-auto uppercase">{chat.type}</span>
                  </label>
                ))}
                {chats.length === 0 && (
                  <p className="text-[#9da6b9] text-sm col-span-2 text-center py-4">No chats found. Make sure you are logged in.</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedChatIds.map(id => {
                const chat = chats.find(c => c.id.toString() === id);
                return (
                  <span key={id} className="bg-[#135bec]/20 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2 border border-[#135bec]/30">
                    {chat?.title || id}
                    <span
                      onClick={() => toggleChatSelection(id)}
                      className="material-symbols-outlined text-xs cursor-pointer hover:text-red-500"
                    >
                      close
                    </span>
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-[#9da6b9]">Currently selected: <span className="text-[#135bec] font-bold">{selectedChatIds.length} recipients</span></p>
          </section>

          {/* Section 2 */}
          <section className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#282e39] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#135bec]">edit_note</span>
                <h3 className="text-slate-900 dark:text-white text-lg font-bold">2. Compose Message</h3>
              </div>
              <div className="flex bg-slate-100 dark:bg-[#282e39] p-1 rounded-xl h-10 w-64">
                <button
                  onClick={() => setMsgType('text')}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${msgType === 'text' ? 'bg-white dark:bg-[#111318] text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-[#9da6b9]'}`}
                >
                  Text Message
                </button>
                <button
                  onClick={() => setMsgType('media')}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${msgType === 'media' ? 'bg-white dark:bg-[#111318] text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-[#9da6b9]'}`}
                >
                  Media Message
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {msgType === 'media' && (
                <div
                  onClick={() => document.getElementById('mediaInput')?.click()}
                  className={`border-2 border-dashed ${mediaFile ? 'border-[#135bec] bg-[#135bec]/5' : 'border-slate-200 dark:border-[#3f4553] bg-slate-50 dark:bg-[#111318]'} rounded-2xl p-10 flex flex-col items-center gap-2 hover:border-[#135bec] transition-colors group cursor-pointer`}
                >
                  <input
                    id="mediaInput"
                    type="file"
                    className="hidden"
                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  />
                  <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-[#3f4553] group-hover:text-[#135bec]">
                    {mediaFile ? 'check_circle' : 'cloud_upload'}
                  </span>
                  <p className="text-sm font-medium text-slate-600 dark:text-white">
                    {mediaFile ? mediaFile.name : 'Drag & drop files here or browse'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-[#9da6b9]">Supports JPG, PNG, MP4, PDF (Max 20MB)</p>
                </div>
              )}

              <div className="relative">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111318] border border-slate-200 dark:border-[#3f4553] rounded-2xl p-5 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#135bec]/50 outline-none min-h-[160px] resize-none"
                  placeholder={msgType === 'media' ? "Type your media caption here..." : "Type your message here..."}
                />
              </div>

              <div className="flex items-center justify-between py-4 border-t border-slate-100 dark:border-[#282e39]">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-[#9da6b9] mb-2">Delay (seconds)</label>
                  <input type="number" defaultValue={3} className="w-24 bg-slate-50 dark:bg-[#111318] border border-slate-200 dark:border-[#3f4553] rounded-lg h-10 px-3 text-slate-900 dark:text-white focus:ring-[#135bec]" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="rounded bg-slate-50 dark:bg-[#282e39] border-slate-300 dark:border-[#3f4553] text-[#135bec]" id="spam-protection" defaultChecked />
                  <label htmlFor="spam-protection" className="text-sm text-slate-500 dark:text-[#9da6b9]">Smart Anti-Spam protection</label>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#282e39] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1 space-y-4">
                <h3 className="text-slate-900 dark:text-white text-sm font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#135bec]">schedule</span>
                  3. Delivery Timing
                </h3>
                <div className="flex gap-4">
                  <div className="flex bg-slate-100 dark:bg-[#282e39] p-1 rounded-xl h-12 flex-1">
                    <button
                      onClick={() => setDeliveryTiming('now')}
                      className={`flex-1 rounded-lg text-xs font-bold transition-all ${deliveryTiming === 'now' ? 'bg-white dark:bg-[#111318] text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#9da6b9]'}`}
                    >
                      Send Now
                    </button>
                    <button
                      onClick={() => setDeliveryTiming('scheduled')}
                      className={`flex-1 rounded-lg text-xs font-bold transition-all ${deliveryTiming === 'scheduled' ? 'bg-white dark:bg-[#111318] text-slate-900 dark:text-white' : 'text-slate-500 dark:text-[#9da6b9]'}`}
                    >
                      Later
                    </button>
                  </div>
                  {deliveryTiming === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-slate-50 dark:bg-[#111318] border border-slate-200 dark:border-[#3f4553] rounded-xl px-4 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#135bec] outline-none"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSend}
                  disabled={loading || !sessionString}
                  className="px-10 h-[52px] rounded-xl bg-[#135bec] text-white font-black shadow-xl shadow-[#135bec]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loading ? 'SENDING...' : 'SEND ALL'}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Progress */}
          <div className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#282e39] rounded-2xl p-6 shadow-xl">
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#135bec]">analytics</span>
              Current Progress
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                  <span className="text-slate-500 dark:text-[#9da6b9]">Sending...</span>
                  <span className="text-[#135bec]">{progress}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-[#282e39] rounded-full overflow-hidden">
                  <div className="h-full bg-[#135bec]" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#111318] p-4 rounded-xl border border-slate-100 dark:border-[#282e39]">
                  <p className="text-[10px] text-slate-500 dark:text-[#9da6b9] font-bold uppercase">Sent</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{sentCount}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111318] p-4 rounded-xl border border-slate-100 dark:border-[#282e39]">
                  <p className="text-[10px] text-slate-500 dark:text-[#9da6b9] font-bold uppercase">Failed</p>
                  <p className="text-2xl font-black text-red-500">{failedCount}</p>
                </div>
              </div>
              <button className="w-full py-3 rounded-xl border border-red-500/50 text-red-500 font-bold hover:bg-red-500/10 transition-colors">Emergency Stop</button>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#282e39] rounded-2xl overflow-hidden shadow-xl flex flex-col h-[400px]">
            <div className="p-4 bg-slate-50 dark:bg-[#282e39] border-b border-slate-200 dark:border-[#3f4553] flex justify-between items-center">
              <span className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">terminal</span>
                Live Status Log
              </span>
              <span className="material-symbols-outlined text-slate-400 dark:text-[#9da6b9] text-sm cursor-pointer hover:text-slate-900 dark:hover:text-white">delete_sweep</span>
            </div>
            <div className="flex-1 p-4 font-mono text-[11px] space-y-2 custom-scrollbar overflow-y-auto">
              {statusLogs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-[#565f73]">[{log.time}]</span>
                  <span className={log.color}>{log.status}</span>
                  <span className="text-[#9da6b9] truncate">{log.msg}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-[#111318] border-t border-slate-200 dark:border-[#282e39] text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-[#9da6b9]">Last sync: just now</span>
                <span className="text-green-500 flex items-center gap-1">
                  <span className="size-1 rounded-full bg-green-500 animate-pulse"></span>
                  Live Monitoring Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkSenderScreen;
