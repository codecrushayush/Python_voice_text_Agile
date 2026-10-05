export default function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
