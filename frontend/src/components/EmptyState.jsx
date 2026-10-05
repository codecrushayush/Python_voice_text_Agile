export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={34} />}
      <strong>{title}</strong>
      <span>{description}</span>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
