import { useCallback, useEffect, useState } from 'react';
import { Search, Filter, Trash2, ListChecks, RefreshCw } from 'lucide-react';
import HistoryTable from '../components/HistoryTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { api, errorMessage } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';

const FILTERS = [
  { value: 'all', label: 'All types' },
  { value: 'tts', label: 'Text to Speech' },
  { value: 'stt', label: 'Speech to Text' },
  { value: 'assistant', label: 'Virtual Assistant' },
];

export default function History() {
  const { push } = useToast();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.history({ type: filter, search, limit: 300 });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(load, 260);
    return () => clearTimeout(timer);
  }, [load]);

  const remove = async () => {
    if (!target) return;
    setBusyId(target.id);
    try {
      await api.deleteHistoryItem(target.id);
      setItems((prev) => prev.filter((i) => i.id !== target.id));
      setTotal((prev) => Math.max(0, prev - 1));
      push('Record deleted.', 'success');
      setTarget(null);
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const { data } = await api.clearHistory(filter);
      push(data.message, 'success');
      setConfirmClear(false);
      await load();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">
            Every Text-to-Speech, Speech-to-Text and assistant interaction is stored in SQLite. Search,
            filter or delete records.
          </p>
        </div>
        <button className="btn btn-outline" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <section className="card">
        <div className="row" style={{ marginBottom: 18 }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label className="field-label" htmlFor="history-search">
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 13, opacity: 0.55 }}
              />
              <input
                id="history-search"
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Search by text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="field" style={{ minWidth: 190 }}>
            <label className="field-label" htmlFor="history-filter">
              <Filter size={13} style={{ verticalAlign: -2 }} /> Filter by type
            </label>
            <select
              id="history-filter"
              className="select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ justifyContent: 'flex-end' }}>
            <span className="field-label">&nbsp;</span>
            <button className="btn btn-danger" onClick={() => setConfirmClear(true)} disabled={!total}>
              <Trash2 size={16} /> Clear history
            </button>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="muted">
            {total} record{total === 1 ? '' : 's'} found
          </span>
          <span className="badge tts" style={{ textTransform: 'none' }}>
            {FILTERS.find((f) => f.value === filter)?.label}
          </span>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}

        {loading ? (
          <LoadingSpinner label="Loading history..." />
        ) : (
          <HistoryTable items={items} onDelete={setTarget} busyId={busyId} />
        )}

        {!loading && !items.length && !error && (
          <div className="empty" style={{ paddingTop: 10 }}>
            <ListChecks size={30} />
            <strong>History is empty</strong>
            <span>Records appear here automatically after each conversion.</span>
          </div>
        )}
      </section>

      <ConfirmationModal
        open={Boolean(target)}
        title="Delete this record?"
        message={`The record "${(target?.input_text || target?.output_text || '').slice(0, 70)}" will be permanently removed.`}
        confirmLabel="Delete"
        busy={Boolean(busyId)}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />

      <ConfirmationModal
        open={confirmClear}
        title="Clear history?"
        message="All matching history records will be permanently deleted. This action cannot be undone."
        confirmLabel="Clear all"
        busy={clearing}
        onConfirm={clearAll}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
