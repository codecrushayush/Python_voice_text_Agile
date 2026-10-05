import { Menu, Sun, Moon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';

export default function Topbar({ onMenu, title }) {
  const { settings, toggleTheme } = useSettings();

  return (
    <header className="topbar">
      <button className="btn btn-ghost icon-btn" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <strong style={{ fontSize: '0.95rem' }}>{title}</strong>
      <button
        className="btn btn-ghost icon-btn"
        onClick={toggleTheme}
        aria-label="Toggle colour theme"
      >
        {settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </header>
  );
}
