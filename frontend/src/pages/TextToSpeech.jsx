import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioLines, Eraser, Sparkles, AlertCircle } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer.jsx';
import { api, errorMessage } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatDate } from '../utils/format.js';

const MAX_CHARS = 5000;

const FALLBACK_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

export default function TextToSpeech() {
  const { settings, update } = useSettings();
  const { push } = useToast();

  const [text, setText] = useState('');
  const [language, setLanguage] = useState(settings.language);
  const [rate, setRate] = useState(settings.rate);
  const [engine, setEngine] = useState('auto');
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    api
      .languages()
      .then(({ data }) => setLanguages(data.languages))
      .catch(() => setLanguages(FALLBACK_LANGUAGES));
  }, []);

  const tooLong = text.length > MAX_CHARS;
  const canSubmit = text.trim().length > 0 && !tooLong && !loading;

  const previewName = useMemo(
    () => `speech-${Date.now()}.${result?.audio_url?.endsWith('.mp3') ? 'mp3' : 'wav'}`,
    [result]
  );

  const convert = async () => {
    if (!text.trim()) {
      setError('Please enter some text before converting.');
      return;
    }
    if (tooLong) {
      setError(`Text is too long. Maximum ${MAX_CHARS} characters.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.textToSpeech({ text, language, rate, engine });
      setResult(data);
      update({ language, rate });
      push('Speech generated successfully.', 'success');
      if (settings.autoPlay) {
        setTimeout(() => audioRef.current?.querySelector('audio')?.play().catch(() => {}), 150);
      }
    } catch (err) {
      setError(errorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setText('');
    setResult(null);
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Text to Speech</h1>
          <p className="page-subtitle">
            Enter text, choose a language and speech rate, then generate audio you can play or download.
          </p>
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <h2 className="card-title">
              <AudioLines size={18} /> Input text
            </h2>
            <p className="card-subtitle">Type or paste the text you want to convert into speech.</p>

            <div className="field">
              <textarea
                className="textarea"
                placeholder="Type something like: Hello, welcome to my university project..."
                value={text}
                maxLength={MAX_CHARS + 200}
                onChange={(e) => setText(e.target.value)}
              />
              <div className={`char-counter ${tooLong ? 'warn' : ''}`}>
                {text.length} / {MAX_CHARS} characters
              </div>
            </div>

            <div className="field-row" style={{ marginTop: 14 }}>
              <div className="field">
                <label className="field-label" htmlFor="tts-language">
                  Language
                </label>
                <select
                  id="tts-language"
                  className="select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="tts-engine">
                  Engine
                </label>
                <select
                  id="tts-engine"
                  className="select"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                >
                  <option value="auto">Auto (online then offline)</option>
                  <option value="gtts">gTTS (online)</option>
                  <option value="pyttsx3">pyttsx3 (offline)</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="tts-rate">
                  Speech rate: {rate} wpm
                </label>
                <input
                  id="tts-rate"
                  className="range"
                  type="range"
                  min="80"
                  max="300"
                  step="5"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: 16 }}>
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn btn-primary btn-lg" onClick={convert} disabled={!canSubmit}>
                {loading ? <span className="spinner" /> : <Sparkles size={17} />}
                {loading ? 'Generating audio...' : 'Convert to speech'}
              </button>
              <button className="btn btn-outline" onClick={clearAll} disabled={loading || (!text && !result)}>
                <Eraser size={16} /> Clear
              </button>
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card" ref={audioRef}>
            <h2 className="card-title">Generated audio</h2>
            <p className="card-subtitle">Play, replay or download the produced speech file.</p>

            {!result && !loading && (
              <div className="empty">
                <AudioLines size={34} />
                <strong>No audio yet</strong>
                <span>Enter text and press convert to generate speech.</span>
              </div>
            )}

            {loading && (
              <div className="loading-block">
                <div className="spinner spinner-lg" />
                <span>Generating speech, please wait...</span>
              </div>
            )}

            {result && !loading && (
              <div className="stack" style={{ gap: 14 }}>
                <div
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 14,
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                  }}
                >
                  {result.text}
                </div>

                <AudioPlayer
                  src={result.audio_url}
                  autoPlay={settings.autoPlay}
                  onReplay={() => audioRef.current?.querySelector('audio')?.play().catch(() => {})}
                  downloadName={previewName}
                />

                <div className="meta-line">
                  <span>Engine: {result.engine}</span>
                  <span>Language: {result.language}</span>
                  <span>Rate: {result.rate} wpm</span>
                  <span>Created: {formatDate(result.created_at)}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
