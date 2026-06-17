// lib/banks-config.ts
export interface BankConfig {
  id: number; ticker: string; name: string; nameAr: string; shortName: string
  domain: string; logoUrl: string; primaryColor: string; sector: 'conventional' | 'islamic'
  isHBTF: boolean; description: string
}

// Branded SVG logo generator — coloured square with white initials
// Used for banks where no reliable favicon exists
function makeSVG(initials: string, bg: string): string {
  const fs = initials.length > 3 ? 16 : initials.length > 2 ? 18 : 22
  const s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="12" fill="' + bg + '"/>' +
    '<text x="32" y="32" dominant-baseline="central" text-anchor="middle" ' +
    'font-family="system-ui,sans-serif" font-weight="700" font-size="' + fs + '" fill="white">' +
    initials + '</text></svg>'
  return 'data:image/svg+xml;base64,' + btoa(s)
}

// Google favicon helper — confirmed working for these domains
const gf = (domain: string) => 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=64'

export const BANKS: BankConfig[] = [
  // id:1  Arab Bank — google favicon confirmed working
  { id: 1,  ticker: 'ARBK',  name: 'Arab Bank',                       nameAr: 'البنك العربي',                  shortName: 'Arab Bank',  domain: 'arabbank.jo',         logoUrl: gf('arabbank.jo'),                 primaryColor: '#CC0000', sector: 'conventional', isHBTF: false, description: "Jordan's largest bank, with 600+ branches across 30 countries." },
  // id:2  Housing Bank — SVG (hbtf.com favicon unreliable)
  { id: 2,  ticker: 'THBK',  name: 'Housing Bank',                    nameAr: 'بنك الإسكان',                   shortName: 'HBTF',       domain: 'hbtf.com',            logoUrl: makeSVG('HBTF', '#004D8F'),        primaryColor: '#004D8F', sector: 'conventional', isHBTF: true,  description: "Jordan's second-largest bank and market leader in retail banking." },
  // id:3  JKB — SVG (no favicon available for jkb.com.jo)
  { id: 3,  ticker: 'JOKB',  name: 'Jordan Kuwait Bank',              nameAr: 'بنك الأردن الكويت',             shortName: 'JKB',        domain: 'jkb.com.jo',          logoUrl: makeSVG('JKB', '#004A97'),         primaryColor: '#004A97', sector: 'conventional', isHBTF: false, description: 'KIPCO Group subsidiary, fastest-growing bank in Jordan by profit.' },
  // id:4  Capital Bank — SVG (capitalbank.jo favicon unreliable)
  { id: 4,  ticker: 'CAPL',  name: 'Capital Bank',                    nameAr: 'كابيتال بنك',                   shortName: 'Capital',    domain: 'capitalbank.jo',      logoUrl: makeSVG('CAPL', '#E4002B'),        primaryColor: '#E4002B', sector: 'conventional', isHBTF: false, description: "Jordan's third-largest bank with operations in Jordan and Iraq." },
  // id:5  Bank al Etihad — google favicon confirmed working
  { id: 5,  ticker: 'ETHD',  name: 'Bank al Etihad',                  nameAr: 'بنك الاتحاد',                   shortName: 'Etihad',     domain: 'bankaletihad.com',    logoUrl: gf('bankaletihad.com'),            primaryColor: '#F26522', sector: 'conventional', isHBTF: false, description: 'Mid-size bank known for strong digital banking and SME lending.' },
  // id:6  Cairo Amman Bank — google favicon confirmed working
  { id: 6,  ticker: 'CABK',  name: 'Cairo Amman Bank',                nameAr: 'بنك القاهرة عمان',              shortName: 'CAB',        domain: 'cab.jo',              logoUrl: gf('cab.jo'),                      primaryColor: '#00529B', sector: 'conventional', isHBTF: false, description: 'Operates 103 branches in Jordan and 22 in Palestine.' },
  // id:7  Jordan Ahli Bank — google favicon confirmed working
  { id: 7,  ticker: 'AHLI',  name: 'Jordan Ahli Bank',                nameAr: 'البنك الأهلي الأردني',          shortName: 'Ahli',       domain: 'ahli.com',            logoUrl: gf('ahli.com'),                    primaryColor: '#00833E', sector: 'conventional', isHBTF: false, description: "One of Jordan's oldest banks, with presence in Palestine and Cyprus." },
  // id:8  AJIB — google favicon confirmed working
  { id: 8,  ticker: 'AJIB',  name: 'Arab Jordan Investment Bank',     nameAr: 'بنك الاستثمار العربي الأردني',  shortName: 'AJIB',       domain: 'ajib.com',            logoUrl: gf('ajib.com'),                    primaryColor: '#1B3A6B', sector: 'conventional', isHBTF: false, description: 'Corporate and investment banking specialist.' },
  // id:9  Jordan Islamic Bank — google favicon confirmed working
  { id: 9,  ticker: 'JOIB',  name: 'Jordan Islamic Bank',             nameAr: 'البنك الإسلامي الأردني',        shortName: 'JIB',        domain: 'jordanislamicbank.com', logoUrl: gf('jordanislamicbank.com'),     primaryColor: '#006633', sector: 'islamic',      isHBTF: false, description: "Jordan's largest Islamic bank with 111 branches." },
  // id:10 Safwa — google favicon confirmed working
  { id: 10, ticker: 'SAFWA', name: 'Safwa Islamic Bank',              nameAr: 'بنك صفوة الإسلامي',             shortName: 'Safwa',      domain: 'safwabank.com',       logoUrl: gf('safwabank.com'),               primaryColor: '#009B77', sector: 'islamic',      isHBTF: false, description: 'Sharia-compliant banking, Al Ittihad Islamic Investment controlling shareholder.' },
  // id:11 IIAB — SVG (iiabank.com.jo favicon returns globe)
  { id: 11, ticker: 'IIAB',  name: 'Islamic International Arab Bank', nameAr: 'البنك العربي الإسلامي الدولي',  shortName: 'IIAB',       domain: 'iiabank.com.jo',      logoUrl: makeSVG('IIAB', '#006C35'),        primaryColor: '#006C35', sector: 'islamic',      isHBTF: false, description: 'Wholly owned Islamic banking subsidiary of Arab Bank plc, 47 Jordan branches.' },
  // id:12 Bank of Jordan — google favicon confirmed working
  { id: 12, ticker: 'BOJX',  name: 'Bank of Jordan',                  nameAr: 'بنك الأردن',                    shortName: 'BOJ',        domain: 'bankofjordan.com',    logoUrl: gf('bankofjordan.com'),            primaryColor: '#003DA5', sector: 'conventional', isHBTF: false, description: "Established in 1960, one of Jordan's oldest commercial banks." },
  // id:13 Invest Bank — google favicon confirmed working
  { id: 13, ticker: 'INVB',  name: 'Invest Bank',                     nameAr: 'بنك الاستثمار',                 shortName: 'InvestBank', domain: 'investbank.jo',       logoUrl: gf('investbank.jo'),               primaryColor: '#C8102E', sector: 'conventional', isHBTF: false, description: 'Smaller specialist bank with Palestinian and Gulf family ownership.' },
  // id:14 Bank ABC Jordan — google favicon confirmed working
  { id: 14, ticker: 'ABCO',  name: 'Bank ABC Jordan',                 nameAr: 'المؤسسة العربية المصرفية',      shortName: 'Bank ABC',   domain: 'bank-abc.com',        logoUrl: gf('bank-abc.com'),                primaryColor: '#1D1D1B', sector: 'conventional', isHBTF: false, description: '87% owned by Arab Banking Corporation Bahrain.' },
  // id:15 JCB — google favicon confirmed working
  { id: 15, ticker: 'JCBK',  name: 'Jordan Commercial Bank',          nameAr: 'البنك التجاري الأردني',          shortName: 'JCB',        domain: 'jcbank.com.jo',       logoUrl: gf('jcbank.com.jo'),               primaryColor: '#8B1A1A', sector: 'conventional', isHBTF: false, description: 'Smallest listed Jordanian bank.' },
]

export const BANK_MAP = Object.fromEntries(BANKS.map(b => [b.id, b]))
export function getBank(id: number): BankConfig | undefined { return BANK_MAP[id] }
export const CONVENTIONAL_BANKS = BANKS.filter(b => b.sector === 'conventional')
export const ISLAMIC_BANKS = BANKS.filter(b => b.sector === 'islamic')
