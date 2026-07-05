'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

/* Housing Bank Group — geographic footprint by country of operation.
   Source: Housing Bank 2025 Environment Analysis, p.26.
   Country geometry: world-atlas 110m (Natural Earth), matched by ISO 3166-1 numeric id.
   Bahrain is too small to render as a filled polygon at world scale, so it is shown
   as a labelled marker at its centroid. */

type MetricKey = 'deposits' | 'assets' | 'credit';

interface Market {
  id: number;
  name: string;
  lon: number;
  lat: number;
  deposits: number;
  assets: number;
  credit: number;
}

const MARKETS: Market[] = [
  { id: 400, name: 'Jordan',         lon: 36.2,  lat: 31.0,  deposits: 82.5, assets: 78.9, credit: 75.4 },
  { id: 275, name: 'Palestine',      lon: 35.25, lat: 31.9,  deposits: 7.4,  assets: 5.5,  credit: 6.4 },
  { id: 12,  name: 'Algeria',        lon: 2.6,   lat: 28.2,  deposits: 4.1,  assets: 5.4,  credit: 5.4 },
  { id: 826, name: 'United Kingdom', lon: -1.6,  lat: 52.8,  deposits: 3.0,  assets: 4.5,  credit: 4.9 },
  { id: 48,  name: 'Bahrain',        lon: 50.55, lat: 26.05, deposits: 1.8,  assets: 5.4,  credit: 7.7 },
  { id: 760, name: 'Syria',          lon: 38.5,  lat: 35.0,  deposits: 1.3,  assets: 0.3,  credit: 0.2 },
];

const METRIC_LABEL: Record<MetricKey, string> = {
  deposits: 'group deposits',
  assets: 'group assets',
  credit: 'group credit',
};

const W = 820;
const H = 405;

const BY_ID: Record<number, Market> = {};
MARKETS.forEach((m) => { BY_ID[m.id] = m; });

function shade(share: number, maxShare: number): string {
  const t = Math.sqrt(Math.max(share, 0)) / Math.sqrt(maxShare || 1);
  const a = [222, 232, 244];
  const b = [15, 42, 74];
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

export default function HbFootprintMap() {
  const [metric, setMetric] = useState<MetricKey>('deposits');
  const [features, setFeatures] = useState<any[] | null>(null);
  const [err, setErr] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let ok = true;
    fetch('/world-110m.json')
      .then((r) => { if (!r.ok) throw new Error('map'); return r.json(); })
      .then((topo: any) => {
        const fc: any = (feature as any)(topo, topo.objects.countries);
        if (ok) setFeatures(fc.features);
      })
      .catch(() => { if (ok) setErr(true); });
    return () => { ok = false; };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: any) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [expanded]);

  const proj = useMemo(() => {
    if (!features) return null;
    return geoNaturalEarth1().fitExtent(
      [[10, 8], [W - 10, H - 12]],
      { type: 'FeatureCollection', features } as any
    );
  }, [features]);

  const path = useMemo(() => (proj ? geoPath(proj as any) : null), [proj]);

  const ranked = [...MARKETS].sort((x, y) => y[metric] - x[metric]);
  const maxShare = ranked[0][metric];
  const bahrain = BY_ID[48];
  const bh = proj ? (proj as any)([bahrain.lon, bahrain.lat]) : null;

  const tab = (key: MetricKey, label: string) => {
    const on = metric === key;
    return (
      <button
        key={key}
        onClick={() => setMetric(key)}
        style={{
          fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
          border: '1px solid ' + (on ? 'var(--cf-ink, #0f2a4a)' : 'var(--cf-line, #e5eaf2)'),
          background: on ? 'var(--cf-ink, #0f2a4a)' : 'transparent',
          color: on ? '#ffffff' : 'var(--cf-ink2, #3d4f66)', transition: 'all .15s',
        }}
      >{label}</button>
    );
  };

  const iconBtnStyle: any = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 28,
    borderRadius: 7, cursor: 'pointer', border: '1px solid var(--cf-line, #e5eaf2)',
    background: 'transparent', color: 'var(--cf-ink2, #3d4f66)', transition: 'all .15s',
  };

  const maximizeIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1={21} y1={3} x2={14} y2={10} />
      <line x1={3} y1={21} x2={10} y2={14} />
    </svg>
  );

  const controls = (inModal: boolean) => (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {tab('deposits', 'Deposits')}
      {tab('assets', 'Assets')}
      {tab('credit', 'Credit')}
      {inModal ? (
        <button onClick={() => setExpanded(false)} title="Close" style={{ ...iconBtnStyle, fontSize: 15, lineHeight: 1 }}>✕</button>
      ) : (
        <button onClick={() => setExpanded(true)} title="Expand" aria-label="Expand map" style={iconBtnStyle}>{maximizeIcon}</button>
      )}
    </div>
  );

  const header = (inModal: boolean) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: inModal ? 15 : 13, fontWeight: 700, color: 'var(--cf-ink, #0f2a4a)' }}>International Footprint</div>
        <div style={{ fontSize: 11, color: 'var(--cf-ink3, #6b7a90)', marginTop: 2 }}>Share of {METRIC_LABEL[metric]} across 6 markets</div>
      </div>
      {controls(inModal)}
    </div>
  );

  const placeholder = (msg: string) => (
    <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--cf-ink3, #6b7a90)', border: '1px dashed var(--cf-line, #e5eaf2)', borderRadius: 10 }}>{msg}</div>
  );

  const mapSvg = (svgStyle: any) => {
    if (err) return placeholder('Map data unavailable');
    if (!features || !path) return placeholder('Loading map…');
    return (
      <svg viewBox={'0 0 ' + W + ' ' + H} width="100%" style={svgStyle} role="img" aria-label="Housing Bank Group geographic footprint">
        {features.map((f: any, i: number) => {
          const id = parseInt(f.id, 10);
          const mk = BY_ID[id];
          const hi = !!mk;
          const val = mk ? mk[metric] : 0;
          return (
            <path
              key={i}
              d={path(f) || undefined}
              fill={hi ? shade(val, maxShare) : '#e9eef5'}
              stroke={hi ? 'var(--cf-gold, #c9a227)' : '#d6dfea'}
              strokeWidth={hi ? 1 : 0.5}
              strokeLinejoin="round"
            >
              <title>{hi ? mk.name + ' — ' + val + '%' : ((f.properties && f.properties.name) || '')}</title>
            </path>
          );
        })}
        {bh && (
          <g>
            <circle cx={bh[0]} cy={bh[1]} r={9} fill="none" stroke="var(--cf-gold, #c9a227)" strokeWidth={0.9} opacity={0.55} />
            <circle cx={bh[0]} cy={bh[1]} r={5} fill={shade(bahrain[metric], maxShare)} stroke="var(--cf-gold, #c9a227)" strokeWidth={1.4}>
              <title>Bahrain — {bahrain[metric]}%</title>
            </circle>
          </g>
        )}
      </svg>
    );
  };

  const legend = (big: boolean) => (
    <div style={{ flex: big ? '0 0 auto' : '1 1 210px', minWidth: 196, display: 'flex', flexDirection: big ? 'row' : 'column', flexWrap: big ? 'wrap' : 'nowrap', gap: big ? 18 : 9, justifyContent: big ? 'center' : 'flex-start' }}>
      {ranked.map((mk) => {
        const val = mk[metric];
        const w = Math.max((val / maxShare) * 100, 2);
        return (
          <div key={mk.id} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: big ? 250 : undefined }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: shade(val, maxShare), border: '1px solid var(--cf-gold, #c9a227)', flex: '0 0 auto' }} />
            <span style={{ fontSize: 12, color: 'var(--cf-ink2, #3d4f66)', width: 96, flex: '0 0 auto' }}>{mk.name}</span>
            <span style={{ flex: '1 1 auto', height: 6, background: '#eef2f7', borderRadius: 4, overflow: 'hidden', minWidth: big ? 96 : undefined }}>
              <span style={{ display: 'block', height: '100%', width: w + '%', background: 'var(--cf-ink, #0f2a4a)', borderRadius: 4 }} />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cf-ink, #0f2a4a)', width: 42, textAlign: 'right', flex: '0 0 auto' }}>{val.toFixed(1)}%</span>
          </div>
        );
      })}
    </div>
  );

  const caption = (
    <div style={{ fontSize: 10, color: 'var(--cf-ink3, #6b7a90)', marginTop: 12 }}>
      Source: Housing Bank 2025 Environment Analysis, p.26 · shares by country of operation
    </div>
  );

  return (
    <>
      <div style={{ background: 'var(--cf-surface, #fff)', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 12, padding: 16 }}>
        {header(false)}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2 1 440px', minWidth: 300, direction: 'ltr' }}>
            {mapSvg({ display: 'block' })}
          </div>
          {legend(false)}
        </div>
        {caption}
      </div>

      {expanded && (
        <div onClick={() => setExpanded(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,42,74,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ background: 'var(--cf-surface, #fff)', border: '1px solid var(--cf-line, #e5eaf2)', borderRadius: 14, padding: 20, width: 'min(1200px, 94vw)', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(15,42,74,0.35)' }}>
            {header(true)}
            <div style={{ direction: 'ltr', textAlign: 'center' }}>
              {mapSvg({ display: 'block', width: '100%', height: 'auto', maxHeight: '64vh', margin: '0 auto' })}
            </div>
            <div style={{ marginTop: 14 }}>
              {legend(true)}
            </div>
            {caption}
          </div>
        </div>
      )}
    </>
  );
}
