import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TextToSpeech from './pages/TextToSpeech.jsx';
import SpeechToText from './pages/SpeechToText.jsx';
import Assistant from './pages/Assistant.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

const TITLES = {
  '/': 'Dashboard',
  '/text-to-speech': 'Text to Speech',
  '/speech-to-text': 'Speech to Text',
  '/assistant': 'Virtual Assistant',
  '/history': 'History',
  '/settings': 'Settings',
};

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="app-column">
          <Topbar onMenu={() => setMenuOpen((v) => !v)} title={TITLES[location.pathname] || 'VoiceSuite'} />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/text-to-speech" element={<TextToSpeech />} />
              <Route path="/speech-to-text" element={<SpeechToText />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
