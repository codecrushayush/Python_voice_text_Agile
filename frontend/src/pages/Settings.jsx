import { useEffect, useState } from 'react';
import { Moon, Sun, Languages, Gauge, PlayCircle, RotateCcw, CheckCircle2, Server } from 'lucide-react';
import { api, errorMessage } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../components/Toast.jsx';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
];

export default function Settings() {
  const { settings, update, toggleTheme } = useSettings();
  const { push } = useToast();
  const [backend, setBackend] = useState('checking');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .health()
      .then(() => setBackend('online'))
      .catch(() => setBackend('offline'));
  }, []);

  const save = () => {
    setSaved(true);
    push('Settings saved to localStorage.', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    update({ theme: 'light', language: 'en', rate: 175, autoPlay: true });
    push('Settings restored to defaults.', 'info');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Preferences are stored in your browser using localStorage and applied instantly.
          </p>
        </div>
        <div className="row">
          <button className="btn btn-outline" onClick={reset}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="btn btn-primary" onClick={save}>
            {saved ? <CheckCircle2 size={16} /> : null}
            {saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </div>

      <div className="split">
        <section className="card">
          <h2 className="card-title">Appearance</h2>
          <p className="card-subtitle">Choose the colour theme of the application.</p>

          <div className="setting-row">
            <div className="setting-info row" style={{ gap: 12 }}>
              {settings.theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              <div>
                <strong>Dark mode</strong>
                <span>Switch between light and dark appearance.</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.theme === 'dark'}
                onChange={toggleTheme}
                aria-label="Toggle dark mode"
              />
              <span className="switch-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info row" style={{ gap: 12 }}>
              <PlayCircle size={20} />
              <div>
                <strong>Auto-play generated speech</strong>
                <span>Play audio automatically after a conversion.</span>
              </div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => update({ autoPlay: e.target.checked })}
                aria-label="Toggle auto play"
              />
              <span className="switch-slider" />
            </label>
          </div>
        </section>

        <div className="stack">
          <section className="card">
            <h2 className="card-title">Speech defaults</h2>
            <p className="card-subtitle">Used for new Text-to-Speech and assistant requests.</p>

            <div className="stack" style={{ gap: 16 }}>
              <div className="field">
                <label className="field-label" htmlFor="settings-language">
                  <Languages size={13} style={{ verticalAlign: -2 }} /> Default language
                </label>
                <select
                  id="settings-language"
                  className="select"
                  value={settings.language}
                  onChange={(e) => update({ language: e.target.value })}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="settings-rate">
                  <Gauge size={13} style={{ verticalAlign: -2 }} /> Speech rate: {settings.rate} wpm
                </label>
                <input
                  id="settings-rate"
                  className="range"
                  type="range"
                  min="80"
                  max="300"
                  step="5"
                  value={settings.rate}
                  onChange={(e) => update({ rate: Number(e.target.value) })}
                />
                <div className="meta-line">
                  <span>80 = slow</span>
                  <span>175 = normal</span>
                  <span>300 = fast</span>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">
              <Server size={18} /> Backend status
            </h2>
            <div className="row">
              <span className={`badge ${backend === 'online' ? 'assistant' : 'stt'}`}>
                {backend === 'checking' ? 'Checking...' : backend === 'online' ? 'Connected' : 'Offline'}
              </span>
              <span className="muted">FastAPI at http://127.0.0.1:8000</span>
            </div>
            {backend === 'offline' && (
              <div className="alert alert-error" style={{ marginTop: 14 }}>
                Backend is not reachable. Start it with:{" "}
                <span className="mono">uvicorn app.main:app --reload</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
