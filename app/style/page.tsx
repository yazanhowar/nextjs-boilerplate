'use client'

function Showcase() {
  return (
    <>
      <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:18}}>
        <button className="cf-btn cf-btn-primary">Primary</button>
        <button className="cf-btn cf-btn-secondary">Secondary</button>
        <button className="cf-btn cf-btn-gradient">Gradient CTA</button>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>
        <span className="cf-chip">Arab Bank</span>
        <span className="cf-chip cf-chip-primary">Group basis</span>
        <span className="cf-chip cf-chip-positive">Submitted</span>
        <span className="cf-chip cf-chip-negative">Overdue</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div className="cf-stat">
          <div className="cf-stat-label">Sector Assets</div>
          <div className="cf-stat-value">75.43B</div>
          <div className="cf-stat-delta-pos">+4.2% YoY</div>
        </div>
        <div className="cf-stat">
          <div className="cf-stat-label">Deposits</div>
          <div className="cf-stat-value">50.32B</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:4,height:22,marginTop:8}}>
            <span style={{flex:1,background:'var(--cf-primary)',borderRadius:2,height:'50%'}} />
            <span style={{flex:1,background:'var(--cf-primary)',borderRadius:2,height:'70%'}} />
            <span style={{flex:1,background:'var(--cf-teal)',borderRadius:2,height:'100%'}} />
            <span style={{flex:1,background:'var(--cf-primary)',borderRadius:2,height:'64%'}} />
          </div>
        </div>
      </div>
      <div className="cf-insight">
        <img src="/convo-icon.svg" width={22} height={22} style={{borderRadius:6,flex:'none'}} alt="ZAD" />
        <div>
          <div className="cf-insight-text">Sector deposits reached 50.32B JOD.</div>
          <div className="cf-insight-src">Source: ABJ - sector basis</div>
        </div>
      </div>
    </>
  )
}

export default function StylePage() {
  return (
    <div className="cf-page" style={{padding:'40px 32px',fontFamily:'var(--cf-font-sans)'}}>
      <div style={{maxWidth:980,margin:'0 auto'}}>
        <div className="cf-mono" style={{fontSize:12,letterSpacing:'0.16em',color:'var(--cf-ink3)',marginBottom:6}}>CONVO.FINANCE DESIGN SYSTEM</div>
        <h1 style={{fontSize:30,fontWeight:600,letterSpacing:'-0.02em',color:'var(--cf-ink)',margin:'0 0 6px'}}>Component Library</h1>
        <p style={{fontSize:15,color:'var(--cf-ink2)',margin:'0 0 28px',maxWidth:620}}>Identical component set in both modes, built on the --cf-* design tokens. The proof of parity.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <div className="cf-light cf-frame">
            <div className="cf-mono" style={{fontSize:11,letterSpacing:'0.1em',color:'var(--cf-ink2)',marginBottom:18}}>LIGHT</div>
            <Showcase />
          </div>
          <div className="dark cf-frame">
            <div className="cf-mono" style={{fontSize:11,letterSpacing:'0.1em',color:'var(--cf-ink2)',marginBottom:18}}>DARK</div>
            <Showcase />
          </div>
        </div>
      </div>
    </div>
  )
}
