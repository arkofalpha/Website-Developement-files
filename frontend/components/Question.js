export default function Question({ id, text, value, onChange }) {
  return (
    <div className="question">
      <p className="qtext">{text}</p>
      <div className="options">
        {[1,2,3,4,5].map(n => (
          <label key={n} className={`opt ${value===n ? 'selected' : ''}`}>
            <input type="radio" name={id} value={n} checked={value===n} onChange={() => onChange(id, n)} />
            <span>{n}</span>
          </label>
        ))}
      </div>
      <style jsx>{`
        .question { margin-bottom:12px }
        .qtext { margin-bottom:8px }
        .options { display:flex; gap:8px }
        .opt { display:inline-flex; align-items:center; gap:6px; padding:6px 8px; border:1px solid #E2E8F0; border-radius:6px }
        .opt.selected { border-color:#2B6CB0; background:#EBF8FF }
        input { display:none }
      `}</style>
    </div>
  )
}
