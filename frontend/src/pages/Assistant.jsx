import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Mic,
  Volume2,
  Trash2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { api, errorMessage } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { WavRecorder } from '../utils/recorder.js';
import { clockTimer, formatTime } from '../utils/format.js';

export default function Assistant() {
  const { settings } = useSettings();
  const { push } = useToast();

  const [input, setInput] = useState('');
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [commands, setCommands] = useState([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    api
      .assistantCommands()
      .then(({ data }) => setCommands(data.commands))
      .catch(() => setCommands([]));
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  const send = async (value) => {
    const text = (value ?? input).trim();
    if (!text) {
      setError('Please type a command first.');
      return;
    }
    setLoading(true);
    setError('');
    setInput('');
    setTurns((prev) => [...prev, { role: 'user', text, at: new Date().toISOString() }]);

    try {
      const { data } = await api.assistant({ text, speak: false, language: settings.language });
      setTurns((prev) => [
        ...prev,
        {
          role: 'bot',
          text: data.response,
          type: data.command_type,
          audio: data.audio_url,
          at: data.created_at,
        },
      ]);
      if (data.command_type === 'clear') {
        setTimeout(() => setTurns([]), 400);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const speak = async (text) => {
    try {
      const { data } = await api.textToSpeech({
        text,
        language: settings.language,
        rate: settings.rate,
        engine: 'auto',
      });
      const audio = new Audio(data.audio_url);
      audio.play().catch(() => push('Browser blocked audio playback.', 'error'));
    } catch (err) {
      push(errorMessage(err), 'error');
    }
  };

  const toggleMic = async () => {
    setError('');
    if (recording) {
      setRecording(false);
      clearInterval(timerRef.current);
      try {
        const blob = await recorderRef.current.stop();
        if (!blob) return;
        const file = new File([blob], 'assistant.wav', { type: 'audio/wav' });
        const form = new FormData();
        form.append('file', file);
        form.append('language', settings.language);
        form.append('source', 'microphone');
        const { data } = await api.speechToText(form);
        await send(data.text);
      } catch (err) {
        setError(err.message || errorMessage(err));
      }
      return;
    }

    recorderRef.current = new WavRecorder();
    try {
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      await recorderRef.current.start();
    } catch (err) {
      setRecording(false);
      clearInterval(timerRef.current);
      setError(err.message || 'Could not start recording.');
    }
  };

  const clearChat = () => {
    setTurns([]);
    setError('');
    push('Conversation cleared.', 'info');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Virtual Assistant</h1>
          <p className="page-subtitle">
            A rule-based assistant. It only executes predefined commands using Python conditions - no AI
            or chatbot model is involved.
          </p>
        </div>
        <button className="btn btn-outline" onClick={clearChat} disabled={!turns.length}>
          <Trash2 size={16} /> Clear chat
        </button>
      </div>

      <div className="split">
        <div className="stack">
          <section className="card">
            <div className="chat" ref={chatRef}>
              {!turns.length && (
                <div className="empty">
                  <Bot size={34} />
                  <strong>Start the conversation</strong>
                  <span>Try &quot;what time is it&quot;, &quot;open Google&quot; or &quot;help&quot;.</span>
                </div>
              )}
              {turns.map((turn, index) => (
                <div key={`${turn.at}-${index}`} className={`bubble ${turn.role}`}>
                  {turn.text}
                  <span className="bubble-time">{formatTime(turn.at)}</span>
                  {turn.role === 'bot' && turn.type !== 'clear' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 8, padding: '4px 8px' }}
                      onClick={() => speak(turn.text)}
                    >
                      <Volume2 size={14} /> Speak response
                    </button>
                  )}
                </div>
              ))}
              {loading && (
                <div className="bubble bot">
                  <span className="row">
                    <span className="spinner" style={{ width: 14, height: 14 }} /> Thinking...
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginTop: 16 }}>
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}

            <div className="row" style={{ marginTop: 18 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder={"Type a command, e.g. \"what is today's date\""}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && send()}
                disabled={loading}
              />
              <button
                className={`btn ${recording ? 'btn-danger' : 'btn-outline'} icon-btn`}
                onClick={toggleMic}
                disabled={loading}
                title={recording ? `Stop recording ${clockTimer(seconds)}` : 'Speak your command'}
              >
                <Mic size={18} />
              </button>
              <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
                <Send size={16} /> Send
              </button>
            </div>

            {recording && (
              <div className="muted" style={{ marginTop: 10 }}>
                <span className="dot" /> Listening... {clockTimer(seconds)} (press the microphone to stop)
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h2 className="card-title">
              <Lightbulb size={18} /> Supported commands
            </h2>
            <p className="card-subtitle">Click a command to insert it into the input box.</p>
            <div className="row" style={{ gap: 8 }}>
              {(commands.length
                ? commands.map((c) => c.command)
                : ['hello', 'what time is it', "what is today's date", 'open Google', 'help']
              ).map((cmd) => (
                <button key={cmd} className="command-chip" onClick={() => setInput(cmd)} disabled={loading}>
                  {cmd}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">How it works</h2>
            <p className="muted">
              Your command is normalised in Python and matched against a list of rules
              (<span className="mono">greeting</span>, <span className="mono">time</span>,{' '}
              <span className="mono">date</span>, <span className="mono">open_url</span>,{' '}
              <span className="mono">search</span>, <span className="mono">help</span>,{' '}
              <span className="mono">about</span>, <span className="mono">clear</span>). If nothing matches,
              the assistant answers with a fixed fallback message.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
