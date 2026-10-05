export default function LoadingSpinner({ label = 'Loading...', large = false }) {
  return (
    <div className="loading-block">
      <div className={`spinner ${large ? 'spinner-lg' : ''}`} />
      <span>{label}</span>
    </div>
  );
}
