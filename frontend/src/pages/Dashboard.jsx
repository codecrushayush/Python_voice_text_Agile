import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AudioLines,
  Mic,
  Bot,
  ListChecks,
  ArrowRight,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { api, errorMessage } from '../services/api.js';
import { formatDate } from '../utils/format.js';

const QUICK_ACTIONS = [
  {
    label: 'Convert Text to Speech',
    hint: 'Type a sentence and listen to it',
    to: '/text-to-speech',
    icon: AudioLines,
  },
  {
    label: 'Convert Speech to Text',
    hint: 'Record audio or upload a file',
    to: '/speech-to-text',
    icon: Mic,
  },
  {
    label: 'Open Virtual Assistant',
    hint: 'Run a predefined voice command',
    to: '/assistant',
    icon: Bot,
  },
  {
    label: 'View History',
    hint: 'Search, filter and delete records',
    to: '/history',
    icon: ListChecks,
  },
];

const TYPE_LABEL = { tts: 'Text to Speech', stt: 'Speech to Text', assistant: 'Assistant' };

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.stats();
      setStats(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of your Text-to-Speech, Speech-to-Text and Virtual Assistant activity.
          </p>
        </div>
        <button className="btn btn-outline" onClick={load}>
          <Activity size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Backend connection failed.</strong>
            <div>{error}</div>
          </div>
        </div>
      )}

      {loading && !stats ? (
        <LoadingSpinner label="Loading dashboard..." large />
      ) : (
        <div className="stack">
          <div className="grid grid-4">
            <StatCard icon={AudioLines} label="Text-to-Speech conversions" value={stats?.total_tts ?? 0} color="indigo" />
            <StatCard icon={Mic} label="Speech-to-Text conversions" value={stats?.total_stt ?? 0} color="sky" />
            <StatCard icon={Bot} label="Assistant commands" value={stats?.total_assistant ?? 0} color="emerald" />
            <StatCard icon={ListChecks} label="Total records" value={stats?.total ?? 0} color="amber" />
          </div>

          <section className="card">
            <h2 className="section-title">Quick actions</h2>
            <div className="grid grid-actions">
              {QUICK_ACTIONS.map(({ label, hint, to, icon: Icon }) => (
                <button key={to} className="quick-card" onClick={() => navigate(to)}>
                  <span className="quick-icon">
                    <Icon size={20} />
                  </span>
                  <strong>{label}</strong>
                  <span>{hint}</span>
                  <span className="row" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem' }}>
                    Open <ArrowRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2 className="section-title">Recent activity</h2>
            {!stats?.recent?.length ? (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Convert your first text to speech or run an assistant command to see activity here."
              />
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {stats.recent.map((item) => (
                  <div
                    key={item.id}
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div className="row">
                      <span className={`badge ${item.type}`}>{TYPE_LABEL[item.type]}</span>
                      <span className="cell-clip" style={{ maxWidth: 520 }}>
                        {item.input_text || item.output_text || '-'}
                      </span>
                    </div>
                    <span className="muted" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
