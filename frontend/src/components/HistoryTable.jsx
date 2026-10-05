import { Trash2, Download, SearchX } from 'lucide-react';
import { formatDate, downloadText } from '../utils/format.js';
import EmptyState from './EmptyState.jsx';

const TYPE_LABEL = {
  tts: 'Text to Speech',
  stt: 'Speech to Text',
  assistant: 'Assistant',
};

export default function HistoryTable({ items, onDelete, busyId }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={SearchX}
        title="No records found"
        description="Try a different search term or convert some text to start building history."
      />
    );
  }

  const handleDownload = (item) => {
    const content = `Type: ${TYPE_LABEL[item.type] || item.type}\nDate: ${formatDate(item.created_at)}\n\nInput:\n${item.input_text}\n\nOutput:\n${item.output_text}\n`;
    downloadText(`history-${item.id}.txt`, content);
  };

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Text</th>
            <th>Date &amp; Time</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <span className={`badge ${item.type}`}>{TYPE_LABEL[item.type] || item.type}</span>
              </td>
              <td>
                <div className="cell-clip">
                  <strong style={{ fontWeight: 600 }}>{item.input_text || '-'}</strong>
                </div>
                {item.output_text && item.type !== 'tts' && (
                  <div className="cell-clip muted" style={{ marginTop: 4 }}>
                    {item.output_text}
                  </div>
                )}
                {item.audio_path && (
                  <div style={{ marginTop: 8 }}>
                    <audio controls preload="none" style={{ height: 32, maxWidth: 260 }} src={item.audio_path} />
                  </div>
                )}
              </td>
              <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                {formatDate(item.created_at)}
              </td>
              <td>
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Download record as text"
                    onClick={() => handleDownload(item)}
                  >
                    <Download size={15} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    title="Delete record"
                    onClick={() => onDelete(item)}
                    disabled={busyId === item.id}
                  >
                    {busyId === item.id ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <Trash2 size={15} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
