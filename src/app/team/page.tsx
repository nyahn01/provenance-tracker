/**
 * /team — How the Provenance Tracker platform is built and maintained.
 * Shows the 9-agent AI team, the animated build pipeline, and the ship gate.
 * Server component — no client-side JS required.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'How it\'s built — Provenance Tracker',
  description: '10 specialized AI agent profiles, two intake lanes (visitor feedback vs the build queue), a blocking honesty gate, and an automated ship gate. Invoked per session today, autonomous tomorrow.',
}

// OBS palette — marketing base with /team's sage override (#4a7a6a, drift preserved)
const C = { ...MARKETING, sage: '#4a7a6a' }

interface Agent {
  name: string
  role: string
  owns: string
  model: 'OPUS' | 'SONNET'
  isGate?: boolean
}

const AGENTS: Agent[] = [
  {
    name: 'design-director',
    role: 'Visual language & art direction',
    owns: 'Typography, color, motion, restraint. Sets the design system. Others implement to it — never around it.',
    model: 'OPUS',
  },
  {
    name: 'provenance-globe',
    role: 'Globe, sidebar & all front-end',
    owns: 'Globe.gl arcs/pins, sidebar panels, responsive layout, strict design-token fidelity.',
    model: 'SONNET',
  },
  {
    name: 'dataviz-engineer',
    role: 'Information design',
    owns: 'Timeline, movement map, provenance graph — how the journey is shown clearly and beautifully.',
    model: 'SONNET',
  },
  {
    name: 'provenance-data',
    role: 'Data integration & APIs',
    owns: 'Wikidata SPARQL, Met/AIC/Rijks/Europeana/Cleveland/Getty APIs, caching, rate limiting, data contracts.',
    model: 'SONNET',
  },
  {
    name: 'art-historian',
    role: 'Provenance scholarship',
    owns: 'Source credibility ranking, gap characterization, what makes custody evidence trustworthy.',
    model: 'OPUS',
  },
  {
    name: 'art-insurance-advisor',
    role: 'Insurance & underwriting',
    owns: 'What underwriters price, what data they trust, how provenance signals map to real risk models.',
    model: 'OPUS',
  },
  {
    name: 'provenance-strategy',
    role: 'Business, market & customer segments',
    owns: 'Museums, insurers, auction houses, restitution lawyers — what each segment pays for and why.',
    model: 'OPUS',
  },
  {
    name: 'provenance-story',
    role: 'Demo narrative & pitch',
    owns: 'DEMO_SCRIPT.md, the 5-minute video flow, hero-work selection, judging-criteria fit.',
    model: 'OPUS',
  },
  {
    name: 'feedback-triage',
    role: 'Visitor feedback intake',
    owns: 'Reviews feedback issues, writes a sourced triage note, tags them. Reads only — never edits product code, never closes your issue.',
    model: 'SONNET',
  },
  {
    name: 'provenance-honesty-review',
    role: 'Credibility gate — BLOCKING',
    owns: 'Audits every diff for over-claiming, missing sources, faked data. No commit bypasses this gate.',
    model: 'OPUS',
    isGate: true,
  },
]

const PIPELINE_STAGES = [
  { id: 'receive', label: 'Receive task', sub: 'Orchestrator' },
  { id: 'build', label: 'Plan + Build', sub: '3–5 agents' },
  { id: 'gate', label: 'Honesty Review', sub: 'BLOCKING ★', isGate: true },
  { id: 'ship', label: 'Ship Gate', sub: 'ship.mjs' },
  { id: 'live', label: 'Live', sub: 'Vercel' },
]

export default function TeamPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        .flow-dot { animation: flow-along 2.8s linear infinite; }
        .flow-dot-2 { animation-delay: 0.93s; }
        .flow-dot-3 { animation-delay: 1.87s; }
        @keyframes flow-along {
          0%   { opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse-gate {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,83,0); }
          50%       { box-shadow: 0 0 12px 3px rgba(212,168,83,0.18); }
        }
        .gate-pulse { animation: pulse-gate 3s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.5s ease forwards; }
        .agent-card:hover { border-color: ${C.borderMid} !important; background: ${C.surface2} !important; }
        a { text-decoration: none; }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-ui)', color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>← Back to journeys</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Provenance Tracker · Platform</span>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              How it's built
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 400, color: C.text, lineHeight: 1.1, marginBottom: 20 }}>
              Ready when you are.<br />Autonomous by design.
            </h1>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560, marginBottom: 16 }}>
              10 specialized AI agent profiles run this platform on Max. Each owns a domain.
              Each can block a commit. Every fact you see passed a credibility review.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { stage: 'Stage 1 · Active', desc: 'Agents invoked per session in Claude Code', active: true },
                { stage: 'Stage 2 · Scheduled', desc: 'Batch workflow queued via GitHub Issues, human-gated', active: true },
                { stage: 'Stage 3 · Vision', desc: 'Fully event-driven, autonomous monitoring', active: false },
              ].map(s => (
                <div key={s.stage} style={{ padding: '8px 14px', border: `1px solid ${s.active ? C.gold : C.border}`, borderRadius: 6, opacity: s.active ? 1 : 0.5 }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.active ? C.gold : C.textFaint, marginBottom: 2 }}>{s.stage}</div>
                  <div style={{ fontSize: '0.72rem', color: C.textMuted }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: '0.76rem', color: C.textMuted, lineHeight: 1.6 }}>
              See <Link href="/workflow" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }}>how the workflow evolved →</Link> across Stages 1–3.
            </div>
          </div>

          {/* How work enters — two intake lanes */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              How work enters
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, color: C.text, lineHeight: 1.2, marginBottom: 12 }}>
              Two ways in. One gate out.
            </h2>
            <p style={{ fontSize: '0.9rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 600, marginBottom: 32 }}>
              Every change starts as a GitHub issue — but the two kinds of issue travel different roads.
              Your <strong style={{ color: C.sage, fontWeight: 600 }}>feedback</strong> is heard and
              triaged; a <strong style={{ color: C.gold, fontWeight: 600 }}>plan</strong> is built. Both
              meet the same honesty gate, and a human always has the last word.
            </p>

            {/* Two lanes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
              {[
                {
                  accent: C.sage,
                  tag: 'Lane A',
                  title: 'Visitor feedback',
                  chip: 'feedback',
                  steps: [
                    <>You send the in-app <Link href="/feedback" style={{ color: C.sage, borderBottom: `1px solid ${C.border}` }}>feedback form</Link> (email fallback if the service is down).</>,
                    <>It opens a GitHub issue, tagged <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.sage }}>feedback</code>.</>,
                    <>The <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.textMuted }}>feedback-triage</code> agent reviews and documents it, tagging it <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.sage }}>triaged</code>. It <em>reads only</em> — never edits the product, never closes your issue.</>,
                    <>A human decides. Genuine bugs and ideas are <strong style={{ color: C.text }}>promoted into the build queue&nbsp;→</strong></>,
                  ],
                  foot: <>Listened to. A human closes it; a fix references it with <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.sage }}>Addresses&nbsp;#N</code> — never an auto-close.</>,
                },
                {
                  accent: C.gold,
                  tag: 'Lane B',
                  title: 'Build queue · plans & priorities',
                  chip: 'priority',
                  steps: [
                    <>A maintainer — or a Claude Code planning session — writes an issue, tagged <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.gold }}>priority</code> + <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.gold }}>agent:&lt;domain&gt;</code>. (Early ideas start as <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.textMuted }}>proposal</code>; a human promotes them.)</>,
                    <>The batch workflow routes it to the matching <strong style={{ color: C.text }}>specialist agent</strong>.</>,
                    <>It runs the <strong style={{ color: C.text }}>build pipeline</strong> below.</>,
                    <>The agent opens a PR that says <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.gold }}>Closes&nbsp;#N</code> — merging auto-closes the issue.</>,
                  ],
                  foot: <>Acted on. The agent builds; the PR auto-closes the issue on merge — and a human always merges.</>,
                },
              ].map(lane => (
                <div key={lane.tag} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `2px solid ${lane.accent}`, borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: lane.accent, marginBottom: 4 }}>{lane.tag}</div>
                      <div style={{ fontSize: '1rem', fontWeight: 500, color: C.text }}>{lane.title}</div>
                    </div>
                    <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em', color: lane.accent, background: `${lane.accent}1a`, border: `1px solid ${lane.accent}40`, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>{lane.chip}</code>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {lane.steps.map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${lane.accent}66`, background: `${lane.accent}14`, color: lane.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.66rem', fontWeight: 700 }}>{i + 1}</span>
                          {i < lane.steps.length - 1 && <span style={{ width: 1, flex: 1, minHeight: 16, background: C.border, margin: '4px 0' }} />}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.5, paddingBottom: i < lane.steps.length - 1 ? 14 : 6 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: `1px solid ${C.border}`, fontSize: '0.72rem', color: C.textFaint, lineHeight: 1.55 }}>
                    {lane.foot}
                  </div>
                </div>
              ))}
            </div>

            {/* Converge */}
            <div style={{ marginTop: 18, padding: '14px 20px', background: 'rgba(212,168,83,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', color: C.gold, flexShrink: 0 }}>⇣</span>
              <span style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.6 }}>
                Both lanes meet at the same <strong style={{ color: C.gold }}>blocking honesty gate</strong>, and
                a human always merges. Nothing reaches the site without that merge.
              </span>
            </div>

            {/* The explicit difference */}
            <div style={{ marginTop: 28, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, background: C.surface }}>
                Feedback vs. plan issues — the one difference that matters
              </div>
              {[
                { accent: C.sage, label: 'A feedback issue', body: <>is an <strong style={{ color: C.text }}>inbound report</strong> from a visitor. Agents triage it — document and tag <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.sage }}>triaged</code> — but <strong style={{ color: C.text }}>only a human closes it</strong>. Fixes reference it with <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.sage }}>Addresses #N</code>, never <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.textFaint }}>Closes</code>, so it can&apos;t be auto-closed before a human has verified the fix.</> },
                { accent: C.gold, label: 'A plan / priority issue', body: <>is a <strong style={{ color: C.text }}>unit of work</strong> the team builds. An agent implements it and opens a PR that <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.78em', color: C.gold }}>Closes #N</code> — auto-closing the issue the moment it merges. The queue self-cleans.</> },
              ].map(row => (
                <div key={row.label} style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.accent, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ fontSize: '0.84rem', color: C.textMuted, lineHeight: 1.6 }}>
                    <strong style={{ color: row.accent, fontWeight: 600 }}>{row.label}</strong> {row.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              Build pipeline
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6, maxWidth: 560, marginBottom: 28 }}>
              What happens once a task is in the queue — where both lanes above converge.
            </p>

            {/* SVG pipeline diagram */}
            <div style={{ overflowX: 'auto' }}>
              <svg viewBox="0 0 860 110" width="100%" style={{ maxWidth: 860, display: 'block' }}>
                {/* Connector lines */}
                {[0,1,2,3].map(i => {
                  const x1 = 78 + i * 190
                  const x2 = x1 + 120
                  const y = 44
                  const isGateLine = i === 1 // line going TO the gate
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y} x2={x2} y2={y}
                        stroke={isGateLine ? C.gold : C.border}
                        strokeWidth={isGateLine ? 1.5 : 1} />
                      {/* Flowing dots */}
                      {[0,1,2].map(d => (
                        <circle key={d} r={2.5}
                          fill={isGateLine ? C.gold : C.textFaint}
                          className={`flow-dot flow-dot-${d+1}`}>
                          <animateMotion
                            dur={isGateLine ? '2.2s' : '2.8s'}
                            begin={`${d * (isGateLine ? 0.73 : 0.93)}s`}
                            repeatCount="indefinite"
                            path={`M${x1},${y} L${x2},${y}`} />
                        </circle>
                      ))}
                    </g>
                  )
                })}

                {/* Stage nodes */}
                {PIPELINE_STAGES.map((stage, i) => {
                  const cx = 40 + i * 190
                  const isGate = stage.isGate
                  return (
                    <g key={stage.id}>
                      {/* Node circle */}
                      <circle cx={cx} cy={44} r={isGate ? 32 : 28}
                        fill={isGate ? 'rgba(212,168,83,0.08)' : C.surface}
                        stroke={isGate ? C.gold : C.border}
                        strokeWidth={isGate ? 1.5 : 1} />
                      {isGate && (
                        <circle cx={cx} cy={44} r={36}
                          fill="none" stroke={C.gold} strokeWidth={0.5} strokeOpacity={0.3} />
                      )}
                      {/* Label */}
                      <text x={cx} y={isGate ? 38 : 40} textAnchor="middle"
                        fill={isGate ? C.gold : C.text}
                        fontSize={isGate ? 8.5 : 8} fontWeight={600}
                        style={{ fontFamily: 'inherit', letterSpacing: '0.02em' }}>
                        {stage.label}
                      </text>
                      <text x={cx} y={isGate ? 52 : 54} textAnchor="middle"
                        fill={C.textFaint} fontSize={7}
                        style={{ fontFamily: 'inherit' }}>
                        {stage.sub}
                      </text>
                      {/* Number */}
                      <text x={cx} y={96} textAnchor="middle"
                        fill={C.textFaint} fontSize={6.5}
                        style={{ fontFamily: 'inherit' }}>
                        {`0${i+1}`}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </div>

          {/* Agent Cards */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 28 }}>
              The specialists ({AGENTS.length} active agents)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {AGENTS.map((agent) => (
                <div key={agent.name} className="agent-card"
                  style={{
                    background: C.surface,
                    border: `1px solid ${agent.isGate ? 'rgba(212,168,83,0.35)' : C.border}`,
                    borderRadius: 10,
                    padding: '18px 20px',
                    transition: 'border-color 0.2s, background 0.2s',
                    ...(agent.isGate ? { boxShadow: '0 0 24px rgba(212,168,83,0.06)' } : {}),
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.72rem', color: agent.isGate ? C.gold : C.textMuted, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.3 }}>
                      {agent.name}
                      {agent.isGate && <span style={{ marginLeft: 6, fontSize: '0.65rem' }}>★</span>}
                    </div>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3,
                      background: agent.model === 'OPUS' ? 'rgba(212,168,83,0.10)' : 'rgba(74,122,106,0.12)',
                      color: agent.model === 'OPUS' ? C.gold : C.sage,
                      border: agent.model === 'OPUS' ? '1px solid rgba(212,168,83,0.20)' : '1px solid rgba(74,122,106,0.20)',
                      flexShrink: 0, marginLeft: 10,
                    }}>{agent.model}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: C.text, marginBottom: 8, lineHeight: 1.3 }}>
                    {agent.role}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: C.textMuted, lineHeight: 1.55 }}>
                    {agent.owns}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ship Gate Callout */}
          <div style={{ background: 'rgba(212,168,83,0.04)', border: `1px solid rgba(212,168,83,0.20)`, borderRadius: 12, padding: '28px 32px', marginBottom: 72 }} className="gate-pulse">
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
              The ship gate
            </div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.8, marginBottom: 16 }}>
              <div><span style={{ color: C.gold }}>$</span> node scripts/ship.mjs</div>
              <div style={{ color: C.textFaint }}>  ✓ npm run build</div>
              <div style={{ color: C.textFaint }}>  ✓ server starts in &lt; 10s</div>
              <div style={{ color: C.textFaint }}>  ✓ /api/provenance returns valid ProvenanceResponse</div>
              <div style={{ color: C.textFaint }}>  ✓ honesty grep: no "on view", no invented data</div>{/* honesty-ok */}
              <div style={{ color: C.gold }}>  → commit &amp; push</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>
              Agents cannot commit directly. Every change passes an automated build, a server health check,
              and a grep-based honesty audit. The gate commits — not the agent.
            </p>
          </div>

          {/* Data layer callout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 80 }}>
            {[
              { label: 'Museum APIs', desc: 'Met · AIC · Rijksmuseum · Europeana · Wikidata · Cleveland Museum of Art. Every fact sourced, every gap shown honestly.', color: C.sage },
              { label: 'Getty GPI', desc: 'Knoedler Stock Books (1872–1970) + Goupil & Cie (1846–1919). 4,388 pre-museum dealer records with archival scan links. CC0.', color: C.purple },
              { label: 'Honesty contract', desc: 'No invented dates. No live custody claims. Custody ≠ exhibition. Gaps shown explicitly.', color: C.gold },
            ].map(item => (
              <div key={item.label} style={{ padding: '20px 24px', border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.color, marginBottom: 8 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Built with Claude Sonnet &amp; Opus · Anthropic · 2026
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <Link href="/workflow" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                How it works →
              </Link>
              <Link href="/demo" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Our story →
              </Link>
              <Link href="/pricing" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Pricing →
              </Link>
              <Link href="/learn" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Provenance glossary →
              </Link>
              <Link href="/impressum" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Legal notice →
              </Link>
              <Link href="/" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>
                Explore journeys →
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
