import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { logout, phoneNumber } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Chats', icon: 'chat_bubble', path: '/chats' },
    { name: 'Members', icon: 'group', path: '/members' },
    { name: 'Bulk Sender', icon: 'send', path: '/bulk-sender' },
    { name: 'History', icon: 'history', path: '/history' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <aside className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] flex flex-col justify-between p-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white bg-[#135bec]">
            <span className="material-symbols-outlined fill-1">rocket_launch</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-tight">TeleAuto Pro</h1>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500"></span>
              <p className="text-slate-500 dark:text-[#9da6b9] text-xs font-medium">{phoneNumber || '@admin_user'}</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-[#135bec] text-white shadow-lg shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#282e39]'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-sm font-semibold tracking-wide">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-[#1c1f27] rounded-xl">
          <div className="size-8 rounded-full bg-[#135bec]/10 flex items-center justify-center text-[#135bec]">
            <span className="material-symbols-outlined text-sm">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{phoneNumber || 'Connected'}</p>
          </div>
          <span
            onClick={handleLogout}
            className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
          >
            logout
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
