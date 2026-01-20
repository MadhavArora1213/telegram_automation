import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const SettingsScreen: React.FC = () => {
    const { phoneNumber } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark'
    );

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Settings</h1>
                <p className="text-slate-500 dark:text-[#9da6b9] mt-2">Manage your account preferences and application theme.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Account Section */}
                <section className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#135bec]">account_circle</span>
                        Account Profile
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block mb-2 text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Connected Phone Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-sm">call</span>
                                <input
                                    type="text"
                                    readOnly
                                    value={phoneNumber || 'Not Connected'}
                                    className="w-full bg-slate-50 dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl h-12 pl-12 pr-4 text-slate-600 dark:text-slate-400 font-mono outline-none cursor-default"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* App Preferences */}
                <section className="bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#135bec]">settings_suggest</span>
                        App Preferences
                    </h3>
                    <div className="space-y-4">
                        <div
                            onClick={toggleTheme}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#101622] rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-[#135bec] transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Toggle between light and dark interface</span>
                            </div>
                            <div className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${isDarkMode ? 'bg-[#135bec]' : 'bg-slate-300'}`}>
                                <div className={`size-4 bg-white rounded-full absolute shadow-sm transition-all ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#101622] rounded-xl border border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Desktop Notifications</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Receive alerts on job completion</span>
                            </div>
                            <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative flex items-center px-1">
                                <div className="size-4 bg-slate-400 rounded-full absolute left-1"></div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SettingsScreen;
