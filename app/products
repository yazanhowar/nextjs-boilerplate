'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import ThemeToggle from '../../components/ThemeToggle'
import LangToggle from '../../components/LangToggle'
import { useLang } from '../../lib/LangContext'

type Bank = { id: number; name_en: string; short_name: string; name_ar: string; short_name_ar: string; bank_type: string; slug: string }
type Product = { id: number; bank_id: number; category: string; sub_category: string; product_name_en: string; description_en: string; is_islamic: boolean; sharia_structure: string; target_segment: string; source_url: string }

const CATEGORIES = [
  { key: 'retail_loan', label: 'Retail Loans', labelAr: 'قروض التجزئة', icon: '🏠' },
  { key: 'retail_deposit', label: 'Deposits', labelAr: 'الودائع', icon: '💰' },
  { key: 'retail_card', label: 'Cards', labelAr: 'البطاقات', icon: '💳' },
  { key: 'digital', label: 'Digital Banking', labelAr: 'الخدمات الرقمية', icon: '📱' },
  { key: 'corporate_loan', label: 'Corporate & SME', labelAr: 'الشركات والمنشآت', icon: '🏢' },
  { key: 'insurance', label: 'Insurance', labelAr: 'التأمين', icon: '🛡️' },
  { key: 'investment', label: 'Investment', labelAr: 'الاستثمار', icon: '📈' },
  { key: 'other', label: 'Programs & Other', labelAr: 'البرامج وأخرى', icon: '⭐' },
]

const FEATURES: Record<string, { key: string; label: string; labelAr: string; match: (p: Product) => boolean }[]> = {
  retail_loan: [
    { key: 'home', label: 'Home / Mortgage Loan', labelAr: 'قرض سكني', match: p => p.sub_category === 'home_loan' },
    { key: 'personal', label: 'Personal Loan', labelAr: 'قرض شخصي', match: p => p.sub_category === 'personal_loan' },
    { key: 'car', label: 'Auto Loan', labelAr: 'قرض سيارة', match: p => p.sub_category === 'car_loan' },
    { key: 'education', label: 'Education Loan', labelAr: 'قرض تعليمي', match: p => p.sub_category === 'education' },
    { key: 'salary_advance', label: 'Salary Advance', labelAr: 'سلفة راتب', match: p => p.product_name_en?.toLowerCase().includes('salary') || p.product_name_en?.toLowerCase().includes('advance') },
    { key: 'instant', label: 'Instant Loan (App)', labelAr: 'قرض فوري', match: p => p.product_name_en?.toLowerCase().includes('instant') },
    { key: 'land', label: 'Land Financing', labelAr: 'تمويل أرض', match: p => p.product_name_en?.toLowerCase().includes('land') },
    { key: 'purchase', label: '0% Purchase Finance', labelAr: 'تمويل شراء 0%', match: p => p.sub_category === 'purchase_finance' },
  ],
  retail_deposit: [
    { key: 'current', label: 'Current Account', labelAr: 'حساب جاري', match: p => p.sub_category === 'current' },
    { key: 'savings', label: 'Savings Account', labelAr: 'حساب توفير', match: p => p.sub_category === 'savings' },
    { key: 'td', label: 'Time Deposit', labelAr: 'وديعة آجلة', match: p => p.sub_category === 'time_deposit' },
    { key: 'basic', label: 'Basic Bank Account', labelAr: 'حساب أساسي', match: p => p.product_name_en?.toLowerCase().includes('basic') },
    { key: 'youth', label: 'Youth / Kids Account', labelAr: 'حساب الأطفال', match: p => ['kid','youth','child','mustaqbaly','kanzy','sumu','bright'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'women', label: "Women's Account", labelAr: 'حساب المرأة', match: p => ['women','harir','shorouq','sayidaty','anty'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'prize', label: 'Prize-Linked Savings', labelAr: 'ادخار بجوائز', match: p => ['prize','tawfeer','tawfeeri','gold road'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'cd', label: 'Certificate of Deposit', labelAr: 'شهادة إيداع', match: p => p.product_name_en?.toLowerCase().includes('certificate') },
  ],
  retail_card: [
    { key: 'classic', label: 'Classic Credit Card', labelAr: 'بطاقة كلاسيك', match: p => p.sub_category === 'credit_card' && p.product_name_en?.toLowerCase().includes('classic') },
    { key: 'gold', label: 'Gold Credit Card', labelAr: 'بطاقة ذهبية', match: p => p.sub_category === 'credit_card' && p.product_name_en?.toLowerCase().includes('gold') },
    { key: 'platinum', label: 'Platinum Credit Card', labelAr: 'بطاقة بلاتينية', match: p => p.sub_category === 'credit_card' && p.product_name_en?.toLowerCase().includes('platinum') },
    { key: 'signature', label: 'Signature / World', labelAr: 'سيغنيتشر / ورلد', match: p => p.sub_category === 'credit_card' && (p.product_name_en?.toLowerCase().includes('signature') || p.product_name_en?.toLowerCase().includes('world')) },
    { key: 'infinite', label: 'Infinite Card', labelAr: 'بطاقة إنفينيت', match: p => p.sub_category === 'credit_card' && p.product_name_en?.toLowerCase().includes('infinite') },
    { key: 'cashback', label: 'Cashback Card', labelAr: 'كاش باك', match: p => p.sub_category === 'credit_card' && p.product_name_en?.toLowerCase().includes('cashback') },
    { key: 'cobrand', label: 'Co-branded / Miles', labelAr: 'بطاقة مشتركة / أميال', match: p => p.sub_category === 'credit_card' && ['miles','fly','royal','amex'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'debit', label: 'Debit Card', labelAr: 'بطاقة خصم', match: p => p.sub_category === 'debit_card' },
    { key: 'prepaid', label: 'Prepaid Card', labelAr: 'بطاقة مدفوعة مسبقاً', match: p => p.sub_category === 'prepaid' },
    { key: 'wearable', label: 'Wearable Payment', labelAr: 'دفع بالإكسسوار', match: p => ['wearable','band','watch'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
  ],
  digital: [
    { key: 'mobile', label: 'Mobile Banking App', labelAr: 'تطبيق موبايل', match: p => p.sub_category === 'mobile_banking' },
    { key: 'online', label: 'Internet Banking', labelAr: 'إنترنت بنكنج', match: p => p.sub_category === 'online_banking' },
    { key: 'cliq', label: 'CliQ Instant Payment', labelAr: 'كليك للدفع الفوري', match: p => p.product_name_en?.toLowerCase().includes('cliq') },
    { key: 'apple', label: 'Apple Pay', labelAr: 'آبل باي', match: p => p.product_name_en?.toLowerCase().includes('apple pay') },
    { key: 'google', label: 'Google Pay', labelAr: 'جوجل باي', match: p => p.product_name_en?.toLowerCase().includes('google pay') },
    { key: 'onboarding', label: 'Digital Account Opening', labelAr: 'فتح حساب رقمي', match: p => ['digital account','onboarding'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'pos', label: 'POS / SoftPOS', labelAr: 'نقاط البيع', match: p => p.product_name_en?.toLowerCase().includes('pos') },
    { key: 'corp', label: 'Corporate Digital Platform', labelAr: 'منصة الشركات', match: p => p.sub_category === 'corporate_banking' },
    { key: 'itm', label: 'ITM / Smart ATM', labelAr: 'صراف ذكي', match: p => ['itm','kiosk','interactive teller'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'open', label: 'Open Banking API', labelAr: 'الخدمات المفتوحة', match: p => p.product_name_en?.toLowerCase().includes('open banking') },
  ],
  corporate_loan: [
    { key: 'corp', label: 'Corporate Lending', labelAr: 'إقراض مؤسسي', match: p => p.sub_category === 'corporate_loan' },
    { key: 'sme', label: 'SME Banking', labelAr: 'المنشآت الصغيرة', match: p => p.sub_category === 'sme' },
    { key: 'trade', label: 'Trade Finance / LC', labelAr: 'تمويل تجاري', match: p => p.sub_category === 'trade_finance' },
    { key: 'women_sme', label: "Women in Business", labelAr: 'المرأة في الأعمال', match: p => p.product_name_en?.toLowerCase().includes('women') && p.category === 'corporate_loan' },
    { key: 'green', label: 'Green / Renewable', labelAr: 'تمويل أخضر', match: p => ['green','renewable','energy efficiency'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'startup', label: 'Startup Program', labelAr: 'برنامج الشركات الناشئة', match: p => ['startup','start program'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'syndicated', label: 'Syndicated Loans', labelAr: 'قروض مجمعة', match: p => p.product_name_en?.toLowerCase().includes('syndicated') },
    { key: 'supply', label: 'Supply Chain Finance', labelAr: 'سلسلة الإمداد', match: p => p.product_name_en?.toLowerCase().includes('supply chain') },
  ],
  insurance: [
    { key: 'life', label: 'Life Insurance', labelAr: 'تأمين الحياة', match: p => p.product_name_en?.toLowerCase().includes('life') },
    { key: 'general', label: 'General Insurance', labelAr: 'تأمين عام', match: p => p.product_name_en?.toLowerCase().includes('general') },
    { key: 'critical', label: 'Critical Illness', labelAr: 'أمراض خطرة', match: p => p.product_name_en?.toLowerCase().includes('critical') },
    { key: 'education', label: 'Education Plan', labelAr: 'خطة تعليمية', match: p => p.product_name_en?.toLowerCase().includes('education') && p.category === 'insurance' },
    { key: 'retirement', label: 'Retirement Plan', labelAr: 'خطة تقاعد', match: p => p.product_name_en?.toLowerCase().includes('retirement') },
    { key: 'medical', label: 'Medical / Health', labelAr: 'صحي / طبي', match: p => ['health','medical','shifa'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
  ],
  investment: [
    { key: 'wealth', label: 'Wealth Management', labelAr: 'إدارة الثروات', match: p => p.sub_category === 'wealth_management' },
    { key: 'private', label: 'Private Banking', labelAr: 'الخدمات الخاصة', match: p => p.sub_category === 'private_banking' },
    { key: 'brokerage', label: 'Brokerage / Trading', labelAr: 'وساطة / تداول', match: p => p.sub_category === 'brokerage' },
    { key: 'fx', label: 'Foreign Exchange', labelAr: 'صرف العملات', match: p => p.sub_category === 'fx' },
    { key: 'treasury', label: 'Treasury Products', labelAr: 'منتجات الخزينة', match: p => p.sub_category === 'treasury' },
    { key: 'sukuk', label: 'Sukuk / Islamic Invest.', labelAr: 'صكوك', match: p => p.product_name_en?.toLowerCase().includes('sukuk') },
    { key: 'capital', label: 'Capital Market', labelAr: 'سوق رأس المال', match: p => p.sub_category === 'capital_market' },
  ],
  other: [
    { key: 'premium', label: 'Premium Banking Program', labelAr: 'برنامج متميز', match: p => p.sub_category === 'program' && ['premium','edge','select','prime','prestige','pearl','thuraya','jah','elite','xclusive','priority'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'loyalty', label: 'Loyalty / Rewards', labelAr: 'ولاء / مكافآت', match: p => p.sub_category === 'loyalty' || ['reward','points','iskan coin'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'safe_box', label: 'Safe Deposit Boxes', labelAr: 'صناديق الأمانات', match: p => ['safe deposit','safe store','safe box'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'remittance', label: 'Remittance Services', labelAr: 'تحويلات دولية', match: p => ['remittance','moneygram','western union'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'digital_sub', label: 'Digital Bank Subsidiary', labelAr: 'بنك رقمي تابع', match: p => p.sub_category === 'digital_bank' },
    { key: 'green', label: 'Green / Sustainability', labelAr: 'الاستدامة', match: p => ['sustainab','green bond','ecolytiq'].some(k => p.product_name_en?.toLowerCase().includes(k)) },
    { key: 'hajj', label: 'Hajj / Religious', labelAr: 'منتجات الحج', match: p => p.product_name_en?.toLowerCase().includes('hajj') },
  ],
}

export default function ProductsPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'

  const [banks, setBanks] = useState<Bank[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('retail_loan')
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('banks').select('id,name_en,short_name,name_ar,short_name_ar,bank_type,slug').eq('is_active', true).order('name_en'),
      supabase.from('bank_products').select('*'),
    ]).then(([b, p]) => {
      setBanks(b.data || [])
      setProducts(p.data || [])
      setLoading(false)
    })
  }, [])

  const bName = (b: Bank) => isAr ? (b.short_name_ar || b.name_ar || b.short_name) : b.short_name
  const features = FEATURES[activeCategory] || []
  const activeCat = CATEGORIES.find(c => c.key === activeCategory)

  const getMatch = (bankId: number, feature: typeof features[0]) => {
    const bankProds = products.filter(p => p.bank_id === bankId && p.category === activeCategory)
    return bankProds.find(p => feature.match(p)) || null
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <header className="hbtf-header">
        <div>
          <div className="hbtf-logo-eyebrow">
            <a href="/">{isAr ? 'الرئيسية' : 'Rapid Intelligence'}</a>{' / '}
            {isAr ? 'مقارنة المنتجات' : 'Product Comparison'}
          </div>
          <div className="hbtf-logo-title">{isAr ? 'مقارنة المنتجات المصرفية' : 'Banking Product Comparison'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a href="/" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>← {isAr ? 'الرئيسية' : 'Dashboard'}</a>
          <LangToggle /><ThemeToggle />
        </div>
      </header>

      <div style={{ padding: '1.75rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                borderColor: activeCategory === cat.key ? 'var(--accent)' : 'var(--border)',
                background: activeCategory === cat.key ? 'var(--accent)' : 'var(--bg-card)',
                color: activeCategory === cat.key ? 'white' : 'var(--text-secondary)',
              }}>
              {cat.icon} {isAr ? cat.labelAr : cat.label}
            </button>
          ))}
        </div>

        {/* Matrix card */}
        <div className="hbtf-card">
          <div className="hbtf-card-header">
            <div>
              <span className="hbtf-card-label">{activeCat?.icon} {isAr ? activeCat?.labelAr : activeCat?.label}</span>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {isAr ? `${features.length} ميزة × 15 بنك — مرّر على الخلية لمعرفة اسم المنتج` : `${features.length} features × 15 banks — hover cell for product details`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <span><span style={{ color: 'var(--positive)', fontWeight: 700 }}>✓</span> {isAr ? 'متاح' : 'Available'}</span>
              <span><span style={{ color: 'var(--positive)', fontWeight: 700 }}>●</span> {isAr ? 'إسلامي' : 'Islamic'}</span>
              <span><span style={{ color: 'var(--border)' }}>—</span> {isAr ? 'غير مدرج' : 'Not listed'}</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>{isAr ? 'جارٍ التحميل...' : 'Loading...'}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-table-head)' }}>
                    <th style={{
                      textAlign: 'start', padding: '0.75rem 1.25rem', fontSize: '0.6rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)', minWidth: '200px',
                      position: 'sticky', insetInlineStart: 0, background: 'var(--bg-table-head)', zIndex: 10,
                    }}>
                      {isAr ? 'الميزة / المنتج' : 'Feature / Product'}
                    </th>
                    {banks.map(b => (
                      <th key={b.id} style={{
                        textAlign: 'center', padding: '0.5rem 0.375rem', fontSize: '0.6rem',
                        fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)',
                        minWidth: '72px', maxWidth: '88px',
                      }}>
                        <a href={`/bank/${b.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-secondary)', lineHeight: 1.3 }}>{bName(b)}</div>
                          {b.bank_type === 'islamic' && <div style={{ fontSize: '0.5rem', color: 'var(--positive)', marginTop: '0.1rem' }}>●</div>}
                        </a>
                      </th>
                    ))}
                    <th style={{
                      textAlign: 'center', padding: '0.5rem 0.75rem', fontSize: '0.6rem',
                      fontWeight: 700, color: 'var(--accent)', borderBottom: '1px solid var(--border)', minWidth: '64px',
                    }}>
                      {isAr ? 'التغطية' : 'Coverage'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, fi) => {
                    const matches = banks.map(b => ({ bank: b, product: getMatch(b.id, feature) }))
                    const count = matches.filter(m => m.product).length
                    const pct = Math.round((count / banks.length) * 100)

                    return (
                      <tr key={feature.key}
                        style={{ background: fi % 2 === 1 ? 'var(--bg-row-alt)' : '' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-row-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = fi % 2 === 1 ? 'var(--bg-row-alt)' : '')}>

                        <td style={{
                          padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.775rem',
                          color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)',
                          position: 'sticky', insetInlineStart: 0,
                          background: fi % 2 === 1 ? 'var(--bg-row-alt)' : 'var(--bg-card)', zIndex: 5,
                        }}>
                          {isAr ? feature.labelAr : feature.label}
                        </td>

                        {matches.map(({ bank, product }) => {
                          const cellKey = `${feature.key}-${bank.id}`
                          const isHovered = hoveredCell === cellKey
                          return (
                            <td key={bank.id}
                              style={{ textAlign: 'center', padding: '0.5rem 0.25rem', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle', position: 'relative' }}
                              onMouseEnter={() => setHoveredCell(cellKey)}
                              onMouseLeave={() => setHoveredCell(null)}>
                              {product ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <span style={{ fontSize: '0.9375rem', color: 'var(--positive)', cursor: 'default' }}>
                                    {product.is_islamic ? '●' : '✓'}
                                  </span>
                                  {isHovered && (
                                    <div style={{
                                      position: 'fixed', zIndex: 9999,
                                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                                      borderRadius: '10px', padding: '0.75rem 0.875rem',
                                      width: '220px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                      pointerEvents: 'none',
                                      transform: 'translate(-50%, -110%)',
                                      left: '50%',
                                    }}>
                                      <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: '0.25rem' }}>{bName(bank)}</div>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.375rem', lineHeight: 1.3 }}>{product.product_name_en}</div>
                                      {product.description_en && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{product.description_en.slice(0,120)}{product.description_en.length > 120 ? '…' : ''}</div>
                                      )}
                                      {product.is_islamic && product.sharia_structure && (
                                        <div style={{ fontSize: '0.625rem', color: 'var(--positive)', marginTop: '0.375rem', fontWeight: 600 }}>⬡ {product.sharia_structure}</div>
                                      )}
                                      {product.source_url && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--accent)' }}>↗ {isAr ? 'المصدر متاح' : 'Source available'}</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--border)', fontSize: '0.75rem' }}>—</span>
                              )}
                            </td>
                          )
                        })}

                        <td style={{ textAlign: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: pct >= 80 ? 'var(--positive)' : pct >= 50 ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {count}/15
                          </div>
                          <div style={{ height: '3px', background: 'var(--border)', borderRadius: '2px', marginTop: '0.25rem', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? 'var(--positive)' : 'var(--accent)', borderRadius: '2px', transition: 'width 0.4s' }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--bg-table-head)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', borderTop: '2px solid var(--border)', position: 'sticky', insetInlineStart: 0, background: 'var(--bg-table-head)' }}>
                      {isAr ? 'إجمالي المنتجات في هذه الفئة' : 'Total products in category'}
                    </td>
                    {banks.map(b => {
                      const count = products.filter(p => p.bank_id === b.id && p.category === activeCategory).length
                      return (
                        <td key={b.id} style={{ textAlign: 'center', padding: '0.75rem 0.25rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', borderTop: '2px solid var(--border)' }}>
                          {count}
                        </td>
                      )
                    })}
                    <td style={{ borderTop: '2px solid var(--border)' }} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {isAr
            ? '✓ = منتج متاح · ● = منتج إسلامي · — = غير مدرج · مرّر على الخانة لعرض تفاصيل المنتج · انقر على اسم البنك للصفحة الكاملة'
            : '✓ = available · ● = Islamic product · — = not listed · hover any cell to see product name & details · click bank name for full profile'}
        </p>
      </div>
    </main>
  )
}
