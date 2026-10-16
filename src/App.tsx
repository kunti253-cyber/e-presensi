/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LegalFooter } from './components/LegalFooter';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './views/DashboardView';
import { StudentsView } from './views/StudentsView';
import { PrintQrView } from './views/PrintQrView';
import { ScannerView } from './views/ScannerView';
import { RecapView } from './views/RecapView';
import { SettingsView } from './views/SettingsView';
import { api, getAuthToken } from './services/api';
import { AppSettings } from './types';
import { RefreshCw } from 'lucide-react';

const defaultSettings: AppSettings = {
  adminPanelTitle: 'ADMIN PANEL ABSENSI SISWA',
  schoolName: 'SD NEGERI HARAPAN BANGSA',
  schoolAddress: 'Jl. Pendidikan Mandiri No. 12, Kota Cerdas',
  npsn: '20234567',
  headmaster: 'H. Suherman, S.Pd., M.M.',
  academicYear: '2024/2025',
  lateTimeThreshold: '07:15',
  logoUrl: null,
  legalCopyright: 'by Kunti Kunanti, M.Pd.',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Initial Auth & Settings Check
  useEffect(() => {
    const initApp = async () => {
      try {
        // Fetch public settings for branding
        const s = await api.getSettings();
        if (s) setSettings(s);
      } catch (err) {
        console.warn('Unable to load settings from server, using default:', err);
      }

      // Check current auth token
      const token = getAuthToken();
      if (token) {
        const isValid = await api.verifyAuth();
        setIsAuthenticated(isValid);
      } else {
        setIsAuthenticated(false);
      }
      setIsCheckingAuth(false);
    };

    initApp();
  }, []);

  const handleLoginSuccess = (user: string) => {
    setAdminUsername(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-semibold">Menghubungkan ke Database Terpusat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Admin Authentication Gate */}
      {!isAuthenticated && (
        <LoginModal
          settings={settings}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Main Admin Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          settings={settings}
          adminUsername={adminUsername}
          onLogout={handleLogout}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <Header
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            settings={settings}
            adminUsername={adminUsername}
          />

          {/* View Container */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto pb-16">
            {currentTab === 'dashboard' && (
              <DashboardView
                settings={settings}
                onNavigate={setCurrentTab}
              />
            )}

            {currentTab === 'students' && (
              <StudentsView />
            )}

            {currentTab === 'print-qr' && (
              <PrintQrView
                settings={settings}
              />
            )}

            {currentTab === 'scan-qr' && (
              <ScannerView
                settings={settings}
              />
            )}

            {currentTab === 'rekap' && (
              <RecapView
                settings={settings}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSettingsUpdate={setSettings}
                adminUsername={adminUsername}
                onAdminUsernameChange={setAdminUsername}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mandatory Legal Authority Footer */}
      <LegalFooter copyrightText={settings.legalCopyright} />
    </div>
  );
}
