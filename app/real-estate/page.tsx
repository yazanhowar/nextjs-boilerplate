'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BANKS } from '@/lib/banks-config'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function RealEstatePage() {
  const router = useRouter()
  const [dark, setDark] = useState(false)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [gov, setGov] = useState('all')

  useEffect(() => {
    const stored = localStorage.getItem('hbtf-theme')
    setDark(stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }, [])

  useEffect(() => {
    getSupabase().from('bank_real_estate').select('*').order('price_jod').then(({ data }) => {
      setListings(data || [])
      setLoading(false)
    })
  }, [])

  const t = {
    bg: 'var(--cf-bg)',
    surface: 'var(--cf-surface)',
    border: 'var(--cf-line)',
    text: 'var(--cf-ink)',
    textSub: 'var(--cf-ink2)',
    textMuted: 'var(--cf-ink3)',
    accent: 'var(--cf-primary)',
    shadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
  }

  function canonType(raw: any): string {
    const s = String(raw || '').toLowerCase()
    if (!s) return 'Other'
    if (/(commercial|office|shop|warehouse|industrial|\u062a\u062c\u0627\u0631\u064a|\u0635\u0646\u0627\u0639\u064a|\u0645\u0643\u062a\u0628|\u0645\u0633\u062a\u0648\u062f\u0639|\u0645\u062e\u0632\u0646)/.test(s)) return 'Commercial & Industrial'
    if (/(villa|farm|\u0641\u064a\u0644\u0627|\u0641\u0644\u0644|\u0645\u0632\u0631\u0639)/.test(s)) return 'Villa & Farm'
    if (/(apart|roof|duplex|surface|studio|\u0634\u0642|\u0633\u0637\u062d|\u0633\u062a\u0648\u062f\u064a\u0648)/.test(s)) return 'Apartment'
    if (/(land|plot|organization|\u0623\u0631\u0636|\u0627\u0631\u0627\u0636\u064a|\u0623\u0631\u0627\u0636\u064a|\u0642\u0637\u0639|\u062a\u0646\u0638\u064a\u0645)/.test(s)) return 'Land'
    if (/(house|residen|building|project|property|\u0645\u0646\u0632\u0644|\u0628\u064a\u062a|\u0633\u0643\u0646\u064a|\u0639\u0645\u0627\u0631|\u0645\u0634\u0631\u0648\u0639|\u0625\u0633\u0643\u0627\u0646|\u0627\u0633\u0643\u0627\u0646)/.test(s)) return 'Residential'
    return 'Other'
  }
  const GOVS: any[] = [
    ['Amman', /(\u0639\u0645\u0627\u0646|\u0646\u0627\u0639\u0648\u0631|\u0635\u0648\u064a\u0644\u062d|\u0627\u0644\u062c\u0628\u064a\u0647\u0629|\u0646\u0635\u064a\u0631|\u0648\u0627\u062f\u064a \u0627\u0644\u0633\u064a\u0631|\u0645\u0627\u0631\u0643\u0627|\u0627\u0644\u064a\u0627\u062f\u0648\u062f\u0629|\u0637\u0628\u0631\u0628\u0648\u0631|\u0634\u0641\u0627 \u0628\u062f\u0631\u0627\u0646|\u0633\u062d\u0627\u0628|\u0627\u0644\u0645\u0648\u0642\u0631|\u0627\u0644\u062c\u064a\u0632\u0629|\u062a\u0644\u0627\u0639 \u0627\u0644\u0639\u0644\u064a|\u062e\u0644\u062f\u0627|\u062f\u064a\u0631 \u063a\u0628\u0627\u0631|\u0627\u0644\u0642\u0648\u064a\u0633\u0645\u0629|\u0627\u0644\u0646\u0648\u064a\u062c\u064a\u0633|\u062c\u0627\u0648\u0627|amman)/],
    ['Zarqa', /(\u0627\u0644\u0632\u0631\u0642\u0627\u0621|\u0627\u0644\u0631\u0635\u064a\u0641\u0629|\u0627\u0644\u0647\u0627\u0634\u0645\u064a\u0629|\u0627\u0644\u0623\u0632\u0631\u0642|\u0627\u0644\u0636\u0644\u064a\u0644|\u064a\u0627\u062c\u0648\u0632|zarqa)/],
    ['Irbid', /(\u0625\u0631\u0628\u062f|\u0627\u0631\u0628\u062f|\u0627\u0644\u0631\u0645\u062b\u0627|irbid)/],
    ['Balqa', /(\u0627\u0644\u0633\u0644\u0637|\u0627\u0644\u0628\u0644\u0642\u0627\u0621|\u0627\u0644\u0641\u062d\u064a\u0635|\u062f\u064a\u0631 \u0639\u0644\u0627|balqa|salt)/],
    ['Madaba', /(\u0645\u0623\u062f\u0628\u0627|\u0645\u0627\u062f\u0628\u0627|\u0627\u0644\u0641\u064a\u062d\u0627\u0621|\u0630\u064a\u0628\u0627\u0646|madaba)/],
    ['Aqaba', /(\u0627\u0644\u0639\u0642\u0628\u0629|aqaba)/],
    ['Karak', /(\u0627\u0644\u0643\u0631\u0643|\u0627\u0644\u0642\u0637\u0631\u0627\u0646\u0629|karak)/],
    ['Mafraq', /(\u0627\u0644\u0645\u0641\u0631\u0642|mafraq)/],
    ['Jerash', /(\u062c\u0631\u0634|jerash)/],
    ['Ajloun', /(\u0639\u062c\u0644\u0648\u0646|ajloun)/],
    ['Maan', /(\u0645\u0639\u0627\u0646|\u0627\u0644\u0628\u062a\u0631\u0627\u0621|\u0627\u0644\u0634\u0648\u0628\u0643|maan)/],
    ['Tafilah', /(\u0627\u0644\u0637\u0641\u064a\u0644\u0629|tafilah)/]
  ]
  function govOf(loc: any): string { const s = String(loc || ''); for (const g of GOVS) { if (g[1].test(s)) return g[0] } return 'Other' }
  const propertyTypes = ['all', ...new Set(listings.map(l => canonType(l.property_type)))]
  const governorates = ['all', ...GOVS.map(g => g[0]).filter(g => listings.some(l => govOf(l.location) === g)), ...(listings.some(l => govOf(l.location) === 'Other') ? ['Other'] : [])]
  
  const filtered = listings.filter(l => {
    if (filter !== 'all' && canonType(l.property_type) !== filter) return false
    if (gov !== 'all' && govOf(l.location) !== gov) return false
    if (search) {
      const q = search.toLowerCase()
      const bank = BANKS.find(b => b.id === l.bank_id)
      if (!l.location?.toLowerCase().includes(q) && !bank?.name?.toLowerCase().includes(q) && !l.description_en?.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: t.text }}>
      <header style={{ backgroundColor: dark ? 'rgba(10,22,40,0.9)' : 'rgba(242,244,247,0.9)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            
            <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>Bank Real Estate Listings</span>
          </div>
          <button onClick={() => router.push('/chat')} style={{ backgroundColor: t.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
            Ask AI about Properties
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', color: t.text }}>Properties for Sale</h1>
          <p style={{ fontSize: 14, color: t.textSub, margin: 0 }}>
            Bank-owned real estate available across all 15 Jordanian banks &middot; {loading ? '...' : listings.length} listings
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search location, bank, or description..."
            style={{ flex: 1, minWidth: 200, backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: '9px 14px', fontSize: 14, color: t.text, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {propertyTypes.map(pt => (
              <button key={pt} onClick={() => setFilter(pt)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', backgroundColor: filter === pt ? t.accent : t.surface, color: filter === pt ? '#fff' : t.textSub, border: `1px solid ${filter === pt ? t.accent : t.border}` }}>
                {pt === 'all' ? 'All types' : pt}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {governorates.map(g => (
              <button key={g} onClick={() => setGov(g)} style={{ padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', backgroundColor: gov === g ? t.accent : t.surface, color: gov === g ? '#fff' : t.textSub, border: '1px solid ' + (gov === g ? t.accent : t.border) }}>
                {g === 'all' ? 'All governorates' : g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: t.textSub }}>Loading listings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&var(--cf-teal);</div>
            <p style={{ color: t.textSub, fontSize: 15, margin: '0 0 8px' }}>
              {listings.length === 0 ? 'No property listings yet.' : 'No listings match your search.'}
            </p>
            {listings.length === 0 && (
              <p style={{ color: t.textMuted, fontSize: 13, margin: 0 }}>
                Ask the AI analyst about bank-owned properties and it will search the database.
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map((listing, i) => {
              const bank = BANKS.find(b => b.id === listing.bank_id)
              return (
                <div key={i} style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: t.shadow }}>
                  <div style={{ backgroundColor: 'var(--cf-surface2)', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: dark ? 'var(--cf-ink)' : '#fff', border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src={`https://www.google.com/s2/favicons?domain=${bank?.domain}&sz=32`} width={18} height={18} style={{ objectFit: 'contain' }} onError={(e: any) => e.target.style.display='none'} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: t.textSub }}>{bank?.shortName || 'Bank'}</span>
                    </div>
                    <span style={{ fontSize: 11, color: t.accent, backgroundColor: t.accent + '18', padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}>
                      {canonType(listing.property_type)}
                    </span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                      {listing.price_jod ? `JOD ${listing.price_jod.toLocaleString()}` : 'Price on request'}
                    </div>
                    {listing.location && <div style={{ fontSize: 13, color: t.textSub, marginBottom: 8 }}>📍 {listing.location}</div>}
                    {listing.area_sqm && <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 8 }}>{listing.area_sqm.toLocaleString()} m&sup2;</div>}
                    {listing.description_en && <p style={{ fontSize: 13, color: t.textSub, margin: '0 0 12px', lineHeight: 1.5 }}>{listing.description_en.slice(0, 120)}{listing.description_en.length > 120 ? '...' : ''}</p>}
                    {listing.listing_url && (
                      <a href={listing.listing_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: t.accent, textDecoration: 'none', fontWeight: 500 }}>
                        View listing &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
