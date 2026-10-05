import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AudioLines,
  Mic,
  Bot,
  History,
  Settings,
  Waves,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/text-to-speech', label: 'Text to Speech', icon: AudioLines },
  { to: '/speech-to-text', label: 'Speech to Text', icon: Mic },
  { to: '/assistant', label: 'Virtual Assistant', icon: Bot },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Waves size={20} />
          </div>
          <div>
            <div className="brand-name">VoiceSuite</div>
            <div className="brand-tag">Python + Agile</div>
          </div>
        </div>

        <div className="nav-section-label">Modules</div>
        <nav>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          Text-to-Speech, Speech-to-Text and a rule-based Virtual Assistant.
          <br />
          No AI models used.
        </div>
      </aside>
    </>
  );
}
