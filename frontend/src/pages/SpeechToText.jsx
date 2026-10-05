import { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Upload,
  Copy,
  Download,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  FileAudio,
} from 'lucide-react';
import MicrophoneButton from '../components/MicrophoneButton.jsx';
import { api, errorMessage } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { WavRecorder } from '../utils/recorder.js';
import { clockTimer, copyToClipboard, downloadText, formatDate } from '../utils/format.js';

const ALLOWED = ['.wav', '.mp3', '.ogg', '.webm', '.flac', '.m4a', '.aac', '.aiff'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function SpeechToText() {
  const { settings } = useSettings();
  const { push } = useToast();

  const [tab, setTab] = useState('microphone');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      recorderRef.current?.cancel();
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    };
  }, [pendingUrl]);

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    stopTimer();
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const acceptFile = (file) => {
    if (!file) return;
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED.includes(ext)) {
      setError(`Unsupported file type. Allowed formats: ${ALLOWED.join(', ')}.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File is too large. Maximum upload size is 10 MB.');
      return;
    }
    if (file.size === 0) {
      setError('The selected file is empty.');
      return;
    }
    setError('');
    setResult(null);
    setPendingFile(file);
    setUploadName(file.name);
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setPendingUrl(URL.createObjectURL(file));
  };

  const toggleRecording = async () => {
    setError('');
    if (recording) {
      setRecording(false);
      stopTimer();
      try {
        const blob = await recorderRef.current.stop();
        if (blob) {
          const file = new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
          acceptFile(file);
          setTab('microphone');
        }
      } catch (err) {
        setError(err.message || 'Recording failed.');
      }
      return;
    }

    recorderRef.current = new WavRecorder();
    try {
      setRecording(true);
      startTimer();
      await recorderRef.current.start();
    } catch (err) {
      setRecording(false);
      stopTimer();
      setError(err.message || 'Could not start recording.');
    }
  };

  const convert = async () => {
    if (!pendingFile) {
      setError('Record audio or choose a file first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', pendingFile);
      form.append('language', settings.language);
      form.append('source', tab === 'microphone' ? 'microphone' : 'upload');
      const { data } = await api.speechToText(form);
      setResult(data);
      push('Speech converted to text.', 'success');
    } catch (err) {
      setError(errorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPendingFile(null);
    setUploadName('');
    setResult(null);
    setError('');
    setSeconds(0);
    setCopied(false);
    if (pendingUrl) {
      URL.revokeObjectURL(pendingUrl);
      setPendingUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copy = async () => {
    if (!result?.text) return;
    await copyToClipboard(result.text);
    setCopied(true);
    push('Recognised text copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Speech to Text</h1>
          <p className="page-subtitle">
            Record from your microphone or upload an audio file to convert speech into editable text.
          </p>
        </div>
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="row" style={{ marginBottom: 18 }}>
              <button
                className={`btn ${tab === 'microphone' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTab('microphone')}
              >
                <Mic size={16} /> Microphone
              </button>
              <button
                className={`btn ${tab === 'upload' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTab('upload')}
              >
                <Upload size={16} /> Upload file
              </button>
            </div>

            {tab === 'microphone' && (
              <div className="stack">
                <MicrophoneButton
                  recording={recording}
                  disabled={loading}
                  onToggle={toggleRecording}
                  elapsedLabel={clockTimer(seconds)}
                />
                <p className="muted" style={{ textAlign: 'center' }}>
                  Recording is captured in your browser and sent as a standard WAV file.
                </p>
              </div>
            )}

            {tab === 'upload' && (
              <div
                className={`drop-zone ${pendingFile ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  acceptFile(e.dataTransfer.files?.[0]);
                }}
              >
                <FileAudio size={30} style={{ opacity: 0.6 }} />
                <div style={{ marginTop: 10, fontWeight: 600 }}>
                  {uploadName || 'Click or drop an audio file here'}
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Supported: WAV, MP3, OGG, WebM, FLAC, M4A (max 10 MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED.join(',')}
                  style={{ display: 'none' }}
                  onChange={(e) => acceptFile(e.target.files?.[0])}
                />
              </div>
            )}

            {pendingFile && (
              <div className="audio-box" style={{ marginTop: 16 }}>
                <strong style={{ fontSize: '0.88rem' }}>{uploadName}</strong>
                {pendingUrl && <audio controls src={pendingUrl} style={{ width: '100%' }} />}
                <div className="meta-line">
                  <span>Size: {(pendingFile.size / 1024).toFixed(1)} KB</span>
                  <span>Ready to convert</span>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: 16 }}>
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn btn-primary btn-lg" onClick={convert} disabled={!pendingFile || loading}>
                {loading ? <span className="spinner" /> : <CheckCircle2 size={17} />}
                {loading ? 'Converting...' : 'Convert speech to text'}
              </button>
              <button className="btn btn-outline" onClick={reset} disabled={loading || (!pendingFile && !result)}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </section>
        </div>

        <section className="card">
          <h2 className="card-title">Recognised text</h2>
          <p className="card-subtitle">Copy the transcript or download it as a text file.</p>

          {!result && !loading && (
            <div className="empty">
              <Mic size={34} />
              <strong>Nothing converted yet</strong>
              <span>Record or upload audio, then press convert.</span>
            </div>
          )}

          {loading && (
            <div className="loading-block">
              <div className="spinner spinner-lg" />
              <span>Analysing audio, please wait...</span>
            </div>
          )}

          {result && !loading && (
            <div className="stack" style={{ gap: 14 }}>
              <textarea
                className="textarea"
                style={{ minHeight: 200 }}
                value={result.text}
                readOnly={!result.text}
              />
              <div className="meta-line">
                <span>Source: {result.source}</span>
                <span>File: {result.filename}</span>
                {result.duration_seconds != null && <span>Length: {result.duration_seconds}s</span>}
                <span>Created: {formatDate(result.created_at)}</span>
              </div>
              <div className="row">
                <button className="btn btn-outline btn-sm" onClick={copy}>
                  <Copy size={15} /> {copied ? 'Copied!' : 'Copy text'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => downloadText('transcript.txt', result.text)}
                >
                  <Download size={15} /> Download .txt
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
