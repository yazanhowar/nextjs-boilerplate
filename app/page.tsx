import { getBanks, getBankTariffs, getLatestRates } from '../lib/queries'

export default async function Dashboard() {
  let banks = []
  let tariffs = []
  let rates = []

  try {
    banks = await getBanks()
    tariffs = await getBankTariffs()
    rates = await getLatestRates()
  } catch (e) {
    console.error('Data fetch error:', e)
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <header className="border-b border-[#1f2937] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-[#4a9eff] uppercase mb-1">
            Housing Bank — HBTF
          </div>
          <h1 className="text-xl font-bold text-white">Rapid Intelligence Platform</h1>
        </div>
        <div className="text-xs text-[#4b5563]">
          Jordan Banking Sector · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <div className="px-8 py-8 max-w-[1400px] mx-auto">

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Banks Tracked', value: banks.length || 15 },
            { label: 'Tariff Records', value: tariffs.length || 0 },
            { label: 'Rate Records', value: rates.length || 0 },
            { label: 'Data Sources', value: '40+' },
          ].map((s) => (
            <div key={s.label} className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
              <div className="text-3xl font-bold text-[#4a9eff] tabular-nums">{s.value}</div>
              <div className="text-xs text-[#4b5563] mt-1 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Banks Table */}
          <div className="col-span-2 bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1f2937] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">All 15 Banks</span>
              <span className="text-xs text-[#4b5563]">Jordan Banking Sector</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1f2937]">
                    {['Bank', 'Type', 'Website', 'Tariff Data', 'Rate Data'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-[#4b5563] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank, i) => {
                    const hasTariff = tariffs.some(t => t.bank_id === bank.id)
                    const hasRate = rates.some(r => r.bank_id === bank.id)
                    return (
                      <tr key={bank.id} className="border-b border-[#1f2937] hover:bg-[#0a0f1e] transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white text-sm">{bank.short_name}</div>
                          <div className="text-xs text-[#4b5563] mt-0.5">{bank.name_en}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            bank.bank_type === 'islamic'
                              ? 'bg-[#1a2e1a] text-[#22c55e]'
                              : 'bg-[#1e3a5f] text-[#4a9eff]'
                          }`}>
                            {bank.bank_type === 'islamic' ? 'Islamic' : 'Conventional'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <a href={bank.website_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[#4a9eff] hover:underline">
                            {bank.website_url?.replace('https://', '').replace('www.', '')}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium ${hasTariff ? 'text-[#22c55e]' : 'text-[#4b5563]'}`}>
                            {hasTariff ? '✓ Available' : '— Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium ${hasRate ? 'text-[#22c55e]' : 'text-[#4b5563]'}`}>
                            {hasRate ? '✓ Available' : '— Pending'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex flex-col gap-6">

            {/* Tariff Summary */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1f2937]">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Tariff Coverage</span>
              </div>
              <div className="p-6">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-[#4a9eff]">{tariffs.length}</span>
                  <span className="text-sm text-[#4b5563] mb-1">of 15 banks</span>
                </div>
                <div className="w-full bg-[#1f2937] rounded-full h-2 mb-4">
                  <div
                    className="bg-[#4a9eff] h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((tariffs.length / 15) * 100, 100)}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {tariffs.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center justify-between">
                      <span className="text-xs text-[#9ca3af]">{t.banks?.short_name}</span>
                      <span className="text-xs text-[#22c55e]">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1f2937]">
                <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Quick Navigation</span>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { label: 'Rate Comparison', href: '/rates', desc: 'Compare lending & deposit rates' },
                  { label: 'Fee Comparison', href: '/tariffs', desc: 'Service fees across banks' },
                  { label: 'Sector Rankings', href: '/rankings', desc: 'Assets, profit, deposits' },
                  { label: 'Announcements', href: '/news', desc: 'AGM results & press releases' },
                ].map(link => (
                  <a key={link.href} href={link.href}
                    className="block p-3 rounded-lg bg-[#0a0f1e] border border-[#1f2937] hover:border-[#4a9eff] transition-colors group">
                    <div className="text-sm font-medium text-white group-hover:text-[#4a9eff] transition-colors">{link.label}</div>
                    <div className="text-xs text-[#4b5563] mt-0.5">{link.desc}</div>
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
