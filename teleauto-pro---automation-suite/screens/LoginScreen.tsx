
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullPhoneNumber = countryCode + phoneNumber;
      const result = await apiService.startLogin(fullPhoneNumber, apiId, apiHash);

      if (result.status === 'success') {
        localStorage.setItem('temp_login_data', JSON.stringify({ phoneNumber: fullPhoneNumber, apiId, apiHash }));
        navigate('/verify');
      } else {
        setError(result.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f6f6f8] dark:bg-[#101622]">
      <header className="fixed top-0 w-full flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#135bec] size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">send</span>
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold">TeleAuto Pro</h2>
        </div>
      </header>

      <div className="max-w-[480px] w-full mt-20">
        <div className="text-center mb-8">
          <h1 className="text-slate-900 dark:text-white text-4xl font-bold mb-3 tracking-tight">Connect Your Telegram</h1>
          <p className="text-slate-500 dark:text-[#9da6b9] text-base leading-relaxed">
            Enter your API credentials and phone number to start managing your chats with professional tools.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1c1f27] p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-[#3b4354]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-white">API ID</label>
                <a href="https://my.telegram.org/auth" target="_blank" rel="noopener noreferrer" className="text-[#135bec] text-xs font-medium hover:underline">Where to get this?</a>
              </div>
              <input
                type="text"
                value={apiId}
                onChange={(e) => setApiId(e.target.value)}
                placeholder="e.g. 1234567"
                required
                className="w-full bg-slate-50 dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg h-12 px-4 text-sm focus:ring-2 focus:ring-[#135bec]/50 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-2">API Hash</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder="Your 32-character API Hash"
                  required
                  className="w-full bg-slate-50 dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg h-12 px-4 text-sm focus:ring-2 focus:ring-[#135bec]/50 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white material-symbols-outlined"
                >
                  {showPassword ? 'visibility' : 'visibility_off'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-white mb-2">Phone Number</label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="bg-slate-50 dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg h-12 px-2 text-sm outline-none"
                >
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="555 0123"
                  required
                  className="flex-1 bg-slate-50 dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg h-12 px-4 text-sm focus:ring-2 focus:ring-[#135bec]/50 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#135bec] text-white h-12 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>

          <div className="flex items-center gap-4 py-6">
            <div className="h-px flex-1 bg-slate-200 dark:bg-[#3b4354]"></div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Security</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-[#3b4354]"></div>
          </div>

          <div className="p-4 rounded-xl bg-[#135bec]/5 border border-[#135bec]/20 flex gap-3">
            <span className="material-symbols-outlined text-[#135bec] text-xl">shield</span>
            <p className="text-xs text-slate-500 dark:text-[#9da6b9] leading-relaxed">
              Your credentials are never stored on our servers. We use the official Telegram API to establish a direct connection from your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
