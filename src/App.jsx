import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ChatPage from './pages/ChatPage';
import MapPage from './pages/MapPage';
import AlertsPage from './pages/AlertsPage';
import ClimatePage from './pages/ClimatePage';
import LibraryPage from './pages/LibraryPage';
import CropIntelligencePage from './pages/CropIntelligencePage';
import SettingsPage from './pages/SettingsPage';
import AuthModal from './components/auth/AuthModal';
import { PersonaProvider } from './context/PersonaContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <PersonaProvider>
          <BrowserRouter>
            <AuthModal />
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<ChatPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="crops" element={<CropIntelligencePage />} />
                <Route path="map" element={<MapPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="climate" element={<ClimatePage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </PersonaProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
