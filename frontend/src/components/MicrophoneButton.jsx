import { Mic, Square } from 'lucide-react';

export default function MicrophoneButton({ recording, disabled, onToggle, elapsedLabel }) {
  return (
    <div className="recorder">
      <button
        type="button"
        className={`rec-btn ${recording ? 'recording' : ''}`}
        onClick={onToggle}
        disabled={disabled}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        {recording ? <Square size={30} /> : <Mic size={32} />}
      </button>

      <div className="rec-timer">{elapsedLabel}</div>

      <div className="rec-state">
        {recording ? (
          <>
            <span className="dot" /> Recording... press stop when finished
          </>
        ) : (
          'Press the microphone to start recording'
        )}
      </div>
    </div>
  );
}
