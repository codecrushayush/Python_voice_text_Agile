import { Download, RotateCcw } from 'lucide-react';

export default function AudioPlayer({ src, autoPlay = false, onReplay, downloadName }) {
  if (!src) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = downloadName || 'speech';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="audio-box">
      <audio key={src} controls autoPlay={autoPlay} src={src}>
        Your browser does not support the audio element.
      </audio>
      <div className="row">
        <button className="btn btn-outline btn-sm" onClick={onReplay}>
          <RotateCcw size={15} /> Replay
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleDownload}>
          <Download size={15} /> Download
        </button>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: '0.78rem' }}>
          {src.endsWith('.mp3') ? 'MP3 audio' : 'WAV audio'}
        </span>
      </div>
    </div>
  );
}
