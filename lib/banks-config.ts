// lib/banks-config.ts
// Single source of truth for all 15 banks — display names, logos, colors, metadata.
// Logos use Google's favicon service as reliable fallback + official domain.

export interface BankConfig {
  id: number
  ticker: string
  name: string           // Plain English, no jargon
  nameAr: string
  shortName: string      // For tight spaces
  domain: string
  logoUrl: string        // Google favicon CDN — always works
  primaryColor: string   // Bank's brand color for card accents
  sector: 'conventional' | 'islamic'
  isHBTF: boolean        // True for Housing Bank (the owner)
  description: string    // One plain sentence
}

export const BANKS: BankConfig[] = [
  {
    id: 1,
    ticker: 'ARBK',
    name: 'Arab Bank',
    nameAr: 'البنك العربي',
    shortName: 'Arab Bank',
    domain: 'arabbank.jo',
    logoUrl: 'https://logo.clearbit.com/arabbank.com',
    primaryColor: '#CC0000',
    sector: 'conventional',
    isHBTF: false,
    description: "Jordan's largest bank, with 600+ branches across 30 countries.",
  },
  {
    id: 2,
    ticker: 'THBK',
    name: 'Housing Bank',
    nameAr: 'البنك الأهلي الأردني',
    shortName: 'HBTF',
    domain: 'hbtf.com',
    logoUrl: 'https://logo.clearbit.com/hbtf.com',
    primaryColor: '#004D8F',
    sector: 'conventional',
    isHBTF: true,
    description: "Jordan's second-largest bank and market leader in retail banking.",
  },
  {
    id: 3,
    ticker: 'JOKB',
    name: 'Jordan Kuwait Bank',
    nameAr: 'بنك الأردن الكويت',
    shortName: 'JKB',
    domain: 'jkb.com',
    logoUrl: 'https://logo.clearbit.com/jkb.com',
    primaryColor: '#004A97',
    sector: 'conventional',
    isHBTF: false,
    description: 'KIPCO Group subsidiary, fastest-growing bank in Jordan by profit.',
  },
  {
    id: 4,
    ticker: 'CAPL',
    name: 'Capital Bank',
    nameAr: 'كابيتال بنك',
    shortName: 'Capital',
    domain: 'capitalbank.jo',
    logoUrl: 'https://logo.clearbit.com/capitalbank.jo',
    primaryColor: '#E4002B',
    sector: 'conventional',
    isHBTF: false,
    description: "Jordan's third-largest bank with operations in Jordan and Iraq.",
  },
  {
    id: 5,
    ticker: 'ETHD',
    name: 'Bank al Etihad',
    nameAr: 'بنك الاتحاد',
    shortName: 'Etihad',
    domain: 'bankaletihad.com',
    logoUrl: 'https://logo.clearbit.com/bankaletihad.com',
    primaryColor: '#F26522',
    sector: 'conventional',
    isHBTF: false,
    description: 'Mid-size bank known for strong digital banking and SME lending.',
  },
  {
    id: 6,
    ticker: 'CABK',
    name: 'Cairo Amman Bank',
    nameAr: 'بنك القاهرة عمان',
    shortName: 'CAB',
    domain: 'cab.jo',
    logoUrl: 'https://logo.clearbit.com/cab.jo',
    primaryColor: '#00529B',
    sector: 'conventional',
    isHBTF: false,
    description: 'Operates 103 branches in Jordan and 22 in Palestine.',
  },
  {
    id: 7,
    ticker: 'AHLI',
    name: 'Jordan Ahli Bank',
    nameAr: 'البنك الأهلي الأردني',
    shortName: 'Ahli',
    domain: 'ahli.com',
    logoUrl: 'https://logo.clearbit.com/ahli.com',
    primaryColor: '#00833E',
    sector: 'conventional',
    isHBTF: false,
    description: 'One of Jordan\'s oldest banks, with presence in Palestine and Cyprus.',
  },
  {
    id: 8,
    ticker: 'AJIB',
    name: 'Arab Jordan Investment Bank',
    nameAr: 'بنك الاستثمار العربي الأردني',
    shortName: 'AJIB',
    domain: 'ajib.com',
    logoUrl: 'https://logo.clearbit.com/ajib.com',
    primaryColor: '#1B3A6B',
    sector: 'conventional',
    isHBTF: false,
    description: 'Corporate and investment banking specialist with operations in Qatar and Cyprus.',
  },
  {
    id: 9,
    ticker: 'JOIB',
    name: 'Jordan Islamic Bank',
    nameAr: 'البنك الإسلامي الأردني',
    shortName: 'JIB',
    domain: 'jordanislamicbank.com',
    logoUrl: 'https://logo.clearbit.com/jordanislamicbank.com',
    primaryColor: '#006633',
    sector: 'islamic',
    isHBTF: false,
    description: "Jordan's largest Islamic bank with 111 branches — an Al Baraka Group member.",
  },
  {
    id: 10,
    ticker: 'SAFWA',
    name: 'Safwa Islamic Bank',
    nameAr: 'بنك صفوة الإسلامي',
    shortName: 'Safwa',
    domain: 'safwabank.com',
    logoUrl: 'https://logo.clearbit.com/safwabank.com',
    primaryColor: '#009B77',
    sector: 'islamic',
    isHBTF: false,
    description: 'Sharia-compliant banking with Al Ittihad Islamic Investment as controlling shareholder.',
  },
  {
    id: 11,
    ticker: 'IIAB',
    name: 'Islamic International Arab Bank',
    nameAr: 'البنك العربي الإسلامي الدولي',
    shortName: 'IIAB',
    domain: 'iiabank.com.jo',
    logoUrl: 'https://logo.clearbit.com/iiabank.com.jo',
    primaryColor: '#006C35',
    sector: 'islamic',
    isHBTF: false,
    description: 'Wholly owned Islamic banking subsidiary of Arab Bank plc, 47 Jordan branches.',
  },
  {
    id: 12,
    ticker: 'BOJX',
    name: 'Bank of Jordan',
    nameAr: 'بنك الأردن',
    shortName: 'BOJ',
    domain: 'bankofjordan.com',
    logoUrl: 'https://logo.clearbit.com/bankofjordan.com',
    primaryColor: '#003DA5',
    sector: 'conventional',
    isHBTF: false,
    description: "Jordan's second-largest financial institution by assets.",
  },
  {
    id: 13,
    ticker: 'INVB',
    name: 'Invest Bank',
    nameAr: 'بنك الاستثمار',
    shortName: 'InvestBank',
    domain: 'investbank.jo',
    logoUrl: 'https://logo.clearbit.com/investbank.jo',
    primaryColor: '#C8102E',
    sector: 'conventional',
    isHBTF: false,
    description: 'Smaller specialist bank with Palestinian and Gulf family ownership.',
  },
  {
    id: 14,
    ticker: 'ABCO',
    name: 'Bank ABC Jordan',
    nameAr: 'المؤسسة العربية المصرفية',
    shortName: 'Bank ABC',
    domain: 'bank-abc.com',
    logoUrl: 'https://logo.clearbit.com/bank-abc.com',
    primaryColor: '#1D1D1B',
    sector: 'conventional',
    isHBTF: false,
    description: '87% owned by Arab Banking Corporation Bahrain — trade finance specialist.',
  },
  {
    id: 15,
    ticker: 'JCBK',
    name: 'Jordan Commercial Bank',
    nameAr: 'البنك التجاري الأردني',
    shortName: 'JCB',
    domain: 'jcbank.com.jo',
    logoUrl: 'https://logo.clearbit.com/jcbank.com.jo',
    primaryColor: '#8B1A1A',
    sector: 'conventional',
    isHBTF: false,
    description: 'Smallest listed Jordanian bank, majority-owned by Al Saleh Investment.',
  },
]

export const BANK_MAP = Object.fromEntries(BANKS.map(b => [b.id, b]))

export function getBank(id: number): BankConfig | undefined {
  return BANK_MAP[id]
}

export const CONVENTIONAL_BANKS = BANKS.filter(b => b.sector === 'conventional')
export const ISLAMIC_BANKS = BANKS.filter(b => b.sector === 'islamic')
