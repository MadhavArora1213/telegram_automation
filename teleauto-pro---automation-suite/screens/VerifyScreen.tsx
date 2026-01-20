
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const VerifyScreen: React.FC = () => {
  const navigate = useNavigate();
  const [otpCode, setOtpCode] = useState(['', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(54);

  const otpRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (timer > 0) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 4) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tempLoginData = JSON.parse(localStorage.getItem('temp_login_data') || '{}');
      const { phoneNumber } = tempLoginData;

      if (!phoneNumber) {
        setError('Login session expired. Please go back and try again.');
        return;
      }

      const fullOtpCode = otpCode.join('');
      const result = await apiService.verifyOtp(phoneNumber, fullOtpCode, password);

      if (result.status === 'success') {
        localStorage.setItem('sessionString', result.sessionString);
        localStorage.setItem('phoneNumber', phoneNumber);
        localStorage.removeItem('temp_login_data');
        navigate('/dashboard');
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f6f6f8] dark:bg-[#101622]">
      <div className="w-full max-w-[480px]">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-[#135bec] transition-colors mb-8"
        >
          <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Back to Login
        </button>

        <div className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-[#135bec]/10 text-[#135bec] mb-6">
              <span className="material-symbols-outlined text-3xl">verified_user</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h1>
            <p className="text-slate-400 text-sm">
              We've sent a 5-digit verification code to your <span className="text-white font-bold">Telegram App</span>.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form className="space-y-8" onSubmit={handleVerify}>
            <div className="flex justify-center gap-3">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={otpRefs[i]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="size-14 text-center text-xl font-bold bg-slate-900 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-[#135bec] outline-none"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">2FA Cloud Password (Optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your cloud password"
                className="w-full h-12 bg-slate-900 text-white border border-slate-700 rounded-xl px-4 focus:ring-2 focus:ring-[#135bec] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#135bec] text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">login</span>
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-400">
                Didn't receive the code?
                <button type="button" className="text-[#135bec] font-semibold ml-1 hover:underline">
                  Resend in 00:{timer < 10 ? `0${timer}` : timer}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyScreen;
