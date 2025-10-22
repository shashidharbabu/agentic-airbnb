const optionFont = "'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif";

export default function OptionCard({ title, subtitle, selected, onClick, RightIcon, titleSize = 17, iconSize = 24, height = 108 }){
  return (
    <button
      onClick={onClick}
      style={{
        padding: '20px 22px',
        borderRadius: 16,
        height,
        width: '100%',
        border: selected ? '2px solid #222' : '1px solid #ddd',
        textAlign: 'left',
        background: selected ? '#f7f7f7' : '#fff',
        fontSize: 16,
        fontFamily: optionFont,
        cursor: 'pointer'
      }}
      type="button"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: titleSize }}>{title}</div>
          {subtitle && <div style={{ color: '#6b7280', fontSize: 14, marginTop: 6, fontFamily: optionFont }}>{subtitle}</div>}
        </div>
        {RightIcon && <RightIcon size={iconSize} />}
      </div>
    </button>
  )
}


