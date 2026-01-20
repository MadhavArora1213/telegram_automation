
import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginScreen from './screens/LoginScreen';
import VerifyScreen from './screens/VerifyScreen';
import BulkSenderScreen from './screens/BulkSenderScreen';
import ChatManagerScreen from './screens/ChatManagerScreen';
import MemberManagementScreen from './screens/MemberManagementScreen';
import HistoryScreen from './screens/HistoryScreen';
import DashboardOverview from './screens/DashboardOverview';
import SettingsScreen from './screens/SettingsScreen';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/verify';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8] dark:bg-[#101622]">
      {!isAuthPage && <Sidebar />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {!isAuthPage && <Header />}

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/verify" element={<VerifyScreen />} />
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/bulk-sender" element={<BulkSenderScreen />} />
            <Route path="/chats" element={<ChatManagerScreen />} />
            <Route path="/members" element={<MemberManagementScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
