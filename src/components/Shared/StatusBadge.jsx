export default function StatusBadge({ status }) {
  const colors = {
    PENDING:  { background: '#fff3cd', color: '#856404' },
    APPROVED: { background: '#cce5ff', color: '#004085' },
    PAID:     { background: '#d4edda', color: '#155724' },
    REJECTED: { background: '#f8d7da', color: '#721c24' },
  }
  const style = colors[status] || { background: '#e2e3e5', color: '#383d41' }
  return (
    <span
      style={{
        ...style,
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}
