// convo.finance - CBJ nightly national-data harvester
// Runs headless, extracts CBJ statistical DataTables from a Jordanian IP,
// and pushes into the Supabase knowledge base via the guarded ingest RPC.
// Requires: Node 18+ and Playwright  ->  npm i playwright  &&  npx playwright install chromium
//
// REVISION 7 (delivered via self-update; the 9-series harvest is unchanged
// from the verified rev-4/5/6 run of 2026-07-03, 324 upserts):
//  - NEW report-only discovery: bank BRANCHES BY GOVERNORATE - walks the CBJ
//    root catalogue, follows branch-looking tiles (AR/EN), posts structures.
//  - NEW report-only discovery: DoS (dosweb.dos.gov.jo) home census - finds
//    unemployment/CPI/labour links from a Jordanian IP, posts them.
//  - CPI discovery from rev 6 retained (consumer-prices tile structure).
//  - All discoveries are try/catch-isolated and NEVER ingest values; they
//    write temporary '_cf_probe' rows that are read and purged next session.

const { chromium } = require('playwright');
const fs = require('fs');
const { spawnSync } = require('child_process');

const REV = 7;
const SELF_URL = 'https://raw.githubusercontent.com/yazanhowar/nextjs-boilerplate/main/scripts/cf-cbj-harvest.js';

const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkdXBzYmV5bGtpc2ppdGhmbXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTY2NzgsImV4cCI6MjA5NzAzMjY3OH0.E6KJ3f0NHfdnes-p5Xk1ifZ3-mG-1YPFbDHU6oEwko8';
const KEY  = 'd0b879bdcf5bcc4ac54ac399f30aa8aecea357d73f16c295';
const RPC  = 'https://qdupsbeylkisjithfmxe.supabase.co/rest/v1/rpc/ingest_macro';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PROBE_NODES = {
  deposits: 'TzF0YnFWQXBlTzQwcUUyQmNONXNhdz09',
  cpi:      'ajJFMGN4WkUycE4yZFAvS1ZYOXRUUT09'
};

const CPI_STRICT = /\u0623\u0633\u0639\u0627\u0631\s*\u0627\u0644\u0645\u0633\u062a\u0647\u0644\u0643/;
const CPI_RX = /(\u0623\u0633\u0639\u0627\u0631\s*\u0627\u0644\u0645\u0633\u062a\u0647\u0644\u0643|\u0627\u0644\u0631\u0642\u0645\s*\u0627\u0644\u0642\u064a\u0627\u0633\u064a\s*\u0644\u0623\u0633\u0639\u0627\u0631|\u062a\u0636\u062e\u0645|consumer\s*price|CPI|inflation)/i;
const BR_RX = /(\u0641\u0631\u0648\u0639|\u0627\u0644\u0641\u0631\u0648\u0639|branch)/i;
const BANKDOM_RX = /(\u0628\u0646\u0648\u0643|\u0645\u0635\u0627\u0631\u0641|\u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0645\u0635\u0631\u0641\u064a|bank)/i;

const TARGETS = [
  { node:'TXlOeEV4NFVJTnl3T1BXTjg2cjJMQT09', col:'first',  min:10000, max:500000, cat:'banking_sector_monthly',   ind:'ODC total assets (monthly)',              ar:'\u0645\u0648\u062c\u0648\u062f\u0627\u062a \u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0625\u064a\u062f\u0627\u0639 \u0627\u0644\u0623\u062e\u0631\u0649 (\u0634\u0647\u0631\u064a)', unit:'JOD m', keep:36 },
  { node:'YXRPbkJkcFdLZXZucGZSL1hFQi9pdz09', col:'first',  min:5000,  max:200000, cat:'banking_sector_quarterly', ind:'ODC credit facilities (quarterly)',        ar:'\u0627\u0644\u062a\u0633\u0647\u064a\u0644\u0627\u062a \u0627\u0644\u0627\u0626\u062a\u0645\u0627\u0646\u064a\u0629 \u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0625\u064a\u062f\u0627\u0639 (\u0631\u0628\u0639\u064a)', unit:'JOD m', keep:36 },
  { node:'MFJUYjZBSXB6Z1htZjRSRjBJRHdMUT09', col:'idx:31', min:0.05,  max:30,     cat:'banking_rates_monthly',    ind:'Weighted avg lending rate (monthly)',      ar:'\u0627\u0644\u0648\u0633\u0637 \u0627\u0644\u0645\u0631\u062c\u062d \u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0648\u0636 \u0648\u0627\u0644\u0633\u0644\u0641 (\u0634\u0647\u0631\u064a)', unit:'%', keep:36 },
  { node:'MFJUYjZBSXB6Z1htZjRSRjBJRHdMUT09', col:'idx:17', min:0.05,  max:30,     cat:'banking_rates_monthly',    ind:'Weighted avg time deposit rate (monthly)', ar:'\u0627\u0644\u0648\u0633\u0637 \u0627\u0644\u0645\u0631\u062c\u062d \u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0641\u0627\u0626\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u0648\u062f\u0627\u0626\u0639 \u0644\u0623\u062c\u0644 (\u0634\u0647\u0631\u064a)', unit:'%', keep:36 },
  { node: 'TzF0YnFWQXBlTzQwcUUyQmNONXNhdz09', col:'keys', cat:'banking_sector_monthly', unit:'JOD m', keep:36, series: [
    { key:'D_252_V_37', min:20000, max:200000, ind:'Total customer deposits (monthly)',                 ar:'\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0648\u062f\u0627\u0626\u0639 (\u0634\u0647\u0631\u064a)' },
    { key:'D_252_V_25', min:10000, max:150000, ind:'Deposits: private sector resident (monthly)',       ar:'\u0648\u062f\u0627\u0626\u0639 \u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u062e\u0627\u0635 \u0627\u0644\u0645\u0642\u064a\u0645 (\u0634\u0647\u0631\u064a)' },
    { key:'D_252_V_29', min:1000,  max:50000,  ind:'Deposits: private sector non-resident (monthly)',   ar:'\u0648\u062f\u0627\u0626\u0639 \u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u062e\u0627\u0635 \u063a\u064a\u0631 \u0627\u0644\u0645\u0642\u064a\u0645 (\u0634\u0647\u0631\u064a)' },
    { key:'D_252_V_1',  min:500,   max:50000,  ind:'Deposits: public sector (monthly)',                 ar:'\u0648\u062f\u0627\u0626\u0639 \u0627\u0644\u0642\u0637\u0627\u0639 \u0627\u0644\u0639\u0627\u0645 (\u0634\u0647\u0631\u064a)' },
    { key:'D_252_V_33', min:50,    max:20000,  ind:'Deposits: other financial corporations (monthly)',  ar:'\u0648\u062f\u0627\u0626\u0639 \u0627\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0627\u0644\u0623\u062e\u0631\u0649 (\u0634\u0647\u0631\u064a)' }
  ] }
];

async function selfUpdate(args) {
  try {
    const r = await fetch(SELF_URL, { cache: 'no-store' });
    if (!r.ok) return;
    const txt = await r.text();
    const m = txt.match(/const REV = (\d+)/);
    if (!m || parseInt(m[1], 10) <= REV) return;
    fs.writeFileSync(__filename, txt);
    console.log('self-update: rev ' + REV + ' -> ' + m[1] + ', relaunching');
    if (!process.env.CF_REEXEC) {
      const c = spawnSync(process.execPath, [__filename].concat(args), { stdio: 'inherit', env: Object.assign({}, process.env, { CF_REEXEC: '1' }) });
      process.exit(c.status === null ? 1 : c.status);
    }
  } catch (e) { }
}

function chunkReport(payload, tag, obj) {
  try {
    var j = JSON.stringify(obj);
    var n = Math.min(Math.ceil(j.length / 380), 12);
    for (var i = 0; i < n; i++) {
      payload.push({ category: '_cf_probe', indicator: tag + '_' + String(i).padStart(2, '0'), indicator_ar: j.slice(i * 380, (i + 1) * 380), period: 'Jul-2026', value: i, unit: 'json', source: 'harvester-rev' + REV });
    }
    console.log(tag + ': reported ' + n + ' chunk(s)');
  } catch (e) { console.error(tag + ' report skipped: ' + String(e).slice(0, 100)); }
}

async function extract(page, spec) {
  return await page.evaluate((spec) => {
    const $ = window.jQuery;
    if (!$ || !$.fn || !$.fn.dataTable) return { err: 'no datatables' };
    let dt = null, best = 0;
    $('table').each(function () {
      if ($.fn.dataTable.isDataTable(this)) {
        const d = $(this).DataTable(); const c = d.rows().count();
        if (c > best) { best = c; dt = d; }
      }
    });
    if (!dt || best < 10) return { err: 'no table, best=' + best };

    const arr = dt.rows().data().toArray();
    const last = arr[arr.length - 1];
    const cols = (dt.settings()[0].aoColumns) || [];
    const PERIOD_NAME  = /^(year|month|yearmonth|quarter|date|period)$/i;
    const PERIOD_TITLE = /(year|month|date|period|quarter|\u0634\u0647\u0631|\u0633\u0646\u0629|\u062a\u0627\u0631\u064a\u062e|\u0627\u0644\u0641\u062a\u0631\u0629)/i;

    function rowsFor(keys) {
      return arr.map(function (r) {
        const ym = String(r.YearMonth || ''); const mo = parseInt(ym.slice(5, 7), 10);
        if (!ym || !mo) return null;
        const vals = {};
        keys.forEach(function (k) { const v = Number(r[k]); if (isFinite(v)) vals[k] = v; });
        return { ym: ym.slice(0,4) + '-' + String(mo).padStart(2,'0'), mo: mo, y: ym.slice(0,4), vals: vals };
      }).filter(Boolean);
    }

    if (spec.col === 'keys') {
      const missing = spec.keys.filter(function (k) { return !(k in last); });
      if (missing.length) return { err: 'missing keys: ' + missing.join(',') };
      return { rows: rowsFor(spec.keys), colKey: spec.keys.join('+') };
    }

    let key = null;
    if (spec.col === 'first') {
      for (let i = 0; i < cols.length && !key; i++) {
        const dn = String((cols[i] && cols[i].data) || '');
        if (/^D_\d+_V_\d+$/.test(dn) && isFinite(Number(last[dn]))) key = dn;
      }
      if (!key) {
        for (let i = 0; i < cols.length && !key; i++) {
          const dn = String((cols[i] && cols[i].data) || '');
          const tt = String((cols[i] && (cols[i].sTitle || cols[i].title)) || '');
          if (!dn || PERIOD_NAME.test(dn) || PERIOD_TITLE.test(tt)) continue;
          if (isFinite(Number(last[dn]))) key = dn;
        }
      }
    } else if (spec.col.indexOf('idx:') === 0) {
      const i = parseInt(spec.col.slice(4), 10);
      key = String((cols[i] && cols[i].data) || '');
    }

    if (!key) return { err: 'no col key' };
    if (PERIOD_NAME.test(key)) return { err: 'refusing period-like column: ' + key };
    const rows = rowsFor([key]).map(function (r) { return { ym: r.ym, mo: r.mo, y: r.y, v: r.vals[key] }; }).filter(function (r) { return isFinite(r.v); });
    return { rows: rows, colKey: key };
  }, spec);
}

async function probeNode(page) {
  return await page.evaluate(() => {
    const $ = window.jQuery;
    let dt = null, best = 0;
    if ($ && $.fn && $.fn.dataTable) {
      $('table').each(function () {
        if ($.fn.dataTable.isDataTable(this)) {
          const d = $(this).DataTable(); const c = d.rows().count();
          if (c > best) { best = c; dt = d; }
        }
      });
    }
    if (!dt) {
      const seen = {}; const listing = [];
      function hashFrom(s) { const m = String(s || '').match(/node=([A-Za-z0-9+\/=%]+)/); return m ? decodeURIComponent(m[1]) : null; }
      const linkish = Array.prototype.slice.call(document.querySelectorAll('a[href*="node="], [onclick*="node="]'));
      linkish.forEach(function (a) {
        const node = hashFrom(a.getAttribute && a.getAttribute('href')) || hashFrom(a.getAttribute && a.getAttribute('onclick'));
        if (!node || seen[node]) return;
        let title = (a.innerText || '').replace(/\s+/g, ' ').trim();
        if (!title) {
          const holder = a.closest ? (a.closest('table') || a.closest('td') || a.closest('div')) : null;
          if (holder) title = (holder.innerText || '').replace(/\s+/g, ' ').trim();
        }
        seen[node] = 1;
        listing.push({ title: title.slice(0, 70), node: node });
      });
      const all = Array.prototype.slice.call(document.querySelectorAll('table'));
      const census = all.map(function (tb) {
        const trs = tb.querySelectorAll('tr');
        const firstCells = trs[0] ? Array.prototype.slice.call(trs[0].cells, 0, 10).map(function (c) { return c.innerText.trim().slice(0, 30); }) : [];
        return { rows: trs.length, cols: trs[0] ? trs[0].cells.length : 0, headers: firstCells, id: tb.id || '' };
      }).sort(function (a, b) { return (b.rows * b.cols) - (a.rows * a.cols); }).slice(0, 4);
      return { err: 'no datatable', tablesOnPage: all.length, listing: listing, tableCensus: census };
    }
    const cols = (dt.settings()[0].aoColumns || []).map(function (c, i) {
      return { i: i, data: String(c.data || ''), title: String((c.sTitle || c.title || '')).replace(/<[^>]+>/g, '').trim().slice(0, 48) };
    });
    const arr = dt.rows().data().toArray();
    const sampleRows = arr.slice(-2).map(function (r) {
      const o = {}; Object.keys(r).forEach(function (k) { o[k] = r[k]; }); return o;
    });
    const selects = Array.prototype.map.call(document.querySelectorAll('select'), function (s) {
      return { id: s.id || s.name || '(unnamed)', options: s.options.length, sample: Array.prototype.slice.call(s.options, 0, 5).map(function (o) { return o.text.trim().slice(0, 32); }) };
    });
    return { rowCount: arr.length, columns: cols, sampleRows: sampleRows, variableSelectors: selects };
  });
}

async function gotoAndProbe(page, node) {
  await page.goto('https://statisticaldb.cbj.gov.jo/?node=' + node, { waitUntil: 'domcontentloaded', timeout: 60000 });
  let out = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(3000);
    out = await probeNode(page);
    if (out && (out.columns || out.listing)) break;
  }
  return out;
}

async function nightlyCpiDiscovery(page, payload) {
  try {
    const cat = await gotoAndProbe(page, PROBE_NODES.cpi);
    if (!cat || !cat.listing || !cat.listing.length) { console.log('cpi discovery: catalogue not readable, skipped'); return; }
    const tile = cat.listing.filter(function (e) { return CPI_STRICT.test(e.title); })[0];
    if (!tile) { console.log('cpi discovery: no consumer-prices tile matched, skipped'); return; }
    const child = await gotoAndProbe(page, tile.node);
    chunkReport(payload, 'cpi_structure', {
      rev: REV, tile: tile.title, node: tile.node,
      cols: ((child && child.columns) || []).map(function (c) { return { d: c.data, t: c.title }; }).slice(0, 60),
      sel: ((child && child.variableSelectors) || []).slice(0, 6),
      rc: child && child.rowCount
    });
  } catch (e) { console.error('cpi discovery skipped: ' + String(e).slice(0, 120)); }
}

async function nightlyBranchesDiscovery(page, payload) {
  try {
    await page.goto('https://statisticaldb.cbj.gov.jo/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    var root = null;
    for (var i = 0; i < 10; i++) { await page.waitForTimeout(3000); root = await probeNode(page); if (root && root.listing && root.listing.length) break; }
    if (!root || !root.listing || !root.listing.length) { console.log('branches discovery: root unreadable, skipped'); return; }
    var hits = root.listing.filter(function (e) { return BR_RX.test(e.title); }).slice(0, 2);
    if (!hits.length) {
      var doms = root.listing.filter(function (e) { return BANKDOM_RX.test(e.title); }).slice(0, 2);
      for (var d = 0; d < doms.length && hits.length < 2; d++) {
        var sub = await gotoAndProbe(page, doms[d].node);
        chunkReport(payload, 'bankdom_listing_' + d, { dom: doms[d].title, node: doms[d].node, titles: ((sub && sub.listing) || []).map(function (e) { return { t: e.title, n: e.node }; }).slice(0, 40) });
        if (sub && sub.listing) sub.listing.forEach(function (e) { if (hits.length < 2 && BR_RX.test(e.title)) hits.push(e); });
      }
    }
    for (var h = 0; h < hits.length; h++) {
      var child = await gotoAndProbe(page, hits[h].node);
      chunkReport(payload, 'branches_structure_' + h, { tile: hits[h].title, node: hits[h].node, cols: ((child && child.columns) || []).map(function (c) { return { d: c.data, t: c.title }; }).slice(0, 60), sel: ((child && child.variableSelectors) || []).slice(0, 6), rc: child && child.rowCount, listing: ((child && child.listing) || []).slice(0, 30) });
    }
    if (!hits.length) chunkReport(payload, 'cbj_root_listing', { titles: root.listing.map(function (e) { return { t: e.title, n: e.node }; }).slice(0, 40) });
  } catch (e) { console.error('branches discovery skipped: ' + String(e).slice(0, 120)); }
}

async function nightlyDosDiscovery(page, payload) {
  try {
    await page.goto('https://dosweb.dos.gov.jo/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    var home = await page.evaluate(function () {
      var links = Array.prototype.slice.call(document.querySelectorAll('a[href]')).map(function (a) { return { t: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), h: String(a.getAttribute('href') || '').slice(0, 120) }; }).filter(function (l) { return l.t; });
      var KEY_RX = /(unemploy|labou?r|cpi|consumer|price|inflation|\u0628\u0637\u0627\u0644\u0629|\u0623\u0633\u0639\u0627\u0631|\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u0642\u064a\u0627\u0633\u064a|\u0627\u0644\u0639\u0645\u0644|\u062a\u0636\u062e\u0645)/i;
      return { title: document.title.slice(0, 80), nLinks: links.length, hits: links.filter(function (l) { return KEY_RX.test(l.t) || KEY_RX.test(l.h); }).slice(0, 25) };
    });
    chunkReport(payload, 'dos_home', home);
  } catch (e) { console.error('dos discovery skipped: ' + String(e).slice(0, 120)); }
}

async function runProbe(arg) {
  const node = PROBE_NODES[arg] || arg;
  if (!node) { console.error('usage: --probe <deposits|cpi|nodehash>'); process.exit(1); }
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  try {
    const out = await gotoAndProbe(page, node);
    console.log('=== PROBE ' + (PROBE_NODES[arg] ? arg + ' ' : '') + node + ' ===');
    if (out && out.listing && !out.columns) {
      console.log('CATALOGUE PAGE - ' + out.listing.length + ' linked series:');
      out.listing.forEach(function (e, i) { console.log('  [' + i + '] ' + e.title + '  ->  ' + e.node); });
      if (arg === 'cpi') {
        const cands = out.listing.filter(function (e) { return CPI_RX.test(e.title); }).slice(0, 2);
        if (!cands.length) { console.log('No CPI-looking tiles matched; run: node cf-cbj-harvest.js --probe <node hash>'); }
        for (const c of cands) {
          console.log('\n=== CPI CANDIDATE: ' + c.title + '  (' + c.node + ') ===');
          const child = await gotoAndProbe(page, c.node);
          console.log(JSON.stringify(child, null, 2));
        }
      }
    } else {
      console.log(JSON.stringify(out, null, 2));
    }
  } catch (e) {
    console.error('probe error: ' + String(e).slice(0, 200));
  }
  await browser.close();
}

function pushSeries(payload, kept, cat, unit, ind, ar) {
  for (const r of kept) {
    payload.push({ category: cat, indicator: ind, indicator_ar: ar, period: MONTHS[r.mo - 1] + '-' + r.y, value: Math.round(r.v * 100) / 100, unit: unit, source: 'CBJ statistical DB' });
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const payload = [];
  let sanityFailures = 0;
  for (const t of TARGETS) {
    try {
      await page.goto('https://statisticaldb.cbj.gov.jo/?node=' + t.node, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const spec = t.col === 'keys' ? { col: 'keys', keys: t.series.map(function (s) { return s.key; }) } : { col: t.col };
      let got = null;
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(3000);
        got = await extract(page, spec);
        if (got && got.rows && got.rows.length) break;
      }
      if (!got || !got.rows) { console.error('[' + (t.ind || 'deposits block') + '] ' + (got && got.err)); continue; }

      if (t.col === 'keys') {
        for (const s of t.series) {
          const rowsS = got.rows.map(function (r) { return { ym: r.ym, mo: r.mo, y: r.y, v: r.vals[s.key] }; }).filter(function (r) { return isFinite(r.v); });
          if (!rowsS.length) { console.error('[' + s.ind + '] no finite values for ' + s.key); continue; }
          const kept = rowsS.slice(-t.keep);
          const latest = kept[kept.length - 1];
          if ((s.min != null && latest.v < s.min) || (s.max != null && latest.v > s.max)) {
            console.error('[' + s.ind + '] SANITY FAIL: latest ' + latest.v + ' outside [' + s.min + ', ' + s.max + '] (col ' + s.key + ') - series NOT ingested');
            sanityFailures++;
            continue;
          }
          pushSeries(payload, kept, t.cat, t.unit, s.ind, s.ar);
          console.log('[' + s.ind + '] ' + kept.length + ' rows, latest ' + MONTHS[latest.mo-1] + '-' + latest.y + '=' + latest.v + ' (col ' + s.key + ')');
        }
        continue;
      }

      const kept = got.rows.slice(-t.keep);
      const latest = kept[kept.length - 1];
      if ((t.min != null && latest.v < t.min) || (t.max != null && latest.v > t.max)) {
        console.error('[' + t.ind + '] SANITY FAIL: latest ' + latest.v + ' outside [' + t.min + ', ' + t.max + '] (col ' + got.colKey + ') - series NOT ingested');
        sanityFailures++;
        continue;
      }
      pushSeries(payload, kept, t.cat, t.unit, t.ind, t.ar);
      console.log('[' + t.ind + '] ' + kept.length + ' rows, latest ' + MONTHS[latest.mo-1] + '-' + latest.y + '=' + latest.v + ' (col ' + got.colKey + ')');
    } catch (e) { console.error('[' + (t.ind || 'deposits block') + '] ' + String(e).slice(0, 160)); }
  }

  await nightlyCpiDiscovery(page, payload);
  await nightlyBranchesDiscovery(page, payload);
  await nightlyDosDiscovery(page, payload);

  await browser.close();
  if (!payload.length) { console.error('nothing extracted; aborting'); process.exit(1); }
  const res = await fetch(RPC, { method: 'POST', headers: { apikey: ANON, Authorization: 'Bearer ' + ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: payload, k: KEY }) });
  const txt = await res.text();
  console.log('ingest ' + res.status + ': ' + txt);
  if (!res.ok || (txt.indexOf('"ok": true') < 0 && txt.indexOf('"ok":true') < 0)) process.exit(1);
  if (sanityFailures) { console.error('completed with ' + sanityFailures + ' series skipped by sanity gate'); process.exit(1); }
  console.log('done ' + new Date().toISOString());
}

(async function boot() {
  const argv = process.argv.slice(2);
  await selfUpdate(argv);
  if (argv[0] === '--probe') { await runProbe(argv[1]); } else { await main(); }
})().catch(function (e) { console.error(e); process.exit(1); });
