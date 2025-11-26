const headingFont = "'Airbnb Cereal VF', Circular, -apple-system, 'system-ui', Roboto, 'Helvetica Neue', sans-serif";

export default function OnboardingLayout({ title, subtitle, children, footer }){
  return (
    <div style={{ maxWidth: 1280, margin: '88px auto 56px', padding: '0 40px', textAlign: 'center' }}>
      {title && (
        <h2
          style={{
            fontSize: 32,
            fontWeight: 600,
            fontStyle: 'normal',
            lineHeight: '36px',
            marginBottom: 14,
            fontFamily: headingFont
          }}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <div style={{ color: '#6b7280', fontSize: 18, marginBottom: 40, fontFamily: headingFont }}>
          {subtitle}
        </div>
      )}
      <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'left' }}>
        {children}
        {footer && (
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
