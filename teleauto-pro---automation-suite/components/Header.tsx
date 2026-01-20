
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-[#282e39] bg-white dark:bg-[#101622]/50 backdrop-blur-md px-8 flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#9da6b9] material-symbols-outlined text-xl">search</span>
          <input
            className="form-input w-full h-10 pl-12 pr-4 bg-slate-50 dark:bg-[#282e39] border border-slate-200 dark:border-none rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#9da6b9] text-sm font-normal focus:ring-2 focus:ring-[#135bec]/50 transition-all outline-none"
            placeholder="Search campaigns, chats..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Right side header actions removed as requested */}
      </div>
    </header>
  );
};

export default Header;
