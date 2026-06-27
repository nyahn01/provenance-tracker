/**
 * /workflow — How the project's workflow evolved: Stage 1 -> 2 -> 3.
 * The presentation-friendly companion to docs/WORKFLOW_STAGES.md (the source of truth).
 * Shows the three-stage autonomy dial, the four closed loops, and GitHub as the project
 * backbone. Server component — no client-side JS. Reuses the /team visual idiom + tokens.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING } from '@/lib/design-tokens'

export const metadata: Metadata = {
  title: 'How it works — the Stage 1 → 2 → 3 workflow',
  description: 'How this project evolved from per-session agents (Stage 1) to a scheduled GitHub-Issues batch (Stage 2) to an event-driven, self-improving system (Stage 3) — one config dial, four closed loops, and a human always at the merge gate.',
}

// OBS palette — marketing base with /team's sage override (#4a7a6a, drift preserved)
const C = { ...MARKETING, sage: '#4a7a6a' }

interface Stage {
  id: string
  tag: string
  title: string
  status: 'Active today' | 'Wired · inert' | 'Vision'
  accent: string
  initiates: string
  queue: string
  builds: string
  loops: string
  gate: string
  active: boolean
}

const STAGES: Stage[] = [
  {
    id: 's1',
    tag: 'Stage 1',
    title: 'Manual · per session',
    status: 'Active today',
    accent: C.sage,
    initiates: 'A human opens a Claude Code session',
    queue: 'Whatever the session is about',
    builds: 'Agents you invoke, in-session',
    loops: 'Act',
    gate: 'Human merges every PR',
    active: true,
  },
  {
    id: 's2',
    tag: 'Stage 2',
    title: 'Scheduled · batch',
    status: 'Wired · inert',
    accent: C.gold,
    initiates: 'A cron schedule fires',
    queue: 'GitHub Issues: priority + agent:<domain>',
    builds: 'The batch squad — one agent per domain',
    loops: 'Act',
    gate: 'Human merges every PR',
    active: false,
  },
  {
    id: 's3',
    tag: 'Stage 3',
    title: 'Event-driven · self-improving',
    status: 'Vision',
    accent: C.purple,
    initiates: 'An event or a self-audit sentinel',
    queue: 'The queue + issues agents file themselves',
    builds: 'The squad + scheduled sentinels',
    loops: 'Sense → Decide → Act → Outcome',
    gate: 'Human merges (auto-on-green: low-risk tiers only)',
    active: false,
  },
]

const ROWS: { key: keyof Stage; label: string }[] = [
  { key: 'initiates', label: 'Initiated by' },
  { key: 'queue', label: 'Work queue' },
  { key: 'builds', label: 'Who builds' },
  { key: 'loops', label: 'Loops closed' },
  { key: 'gate', label: 'Who gates' },
]

const LOOPS = [
  { n: '01', name: 'Sense', accent: C.sage, body: 'Work originates without a human typing it — feedback auto-triage + scheduled self-audit sentinels file issues. Read-only: they route problems, never fix them.' },
  { n: '02', name: 'Decide', accent: C.gold, body: 'A human promotes a proposal issue to priority + agent:<domain>. Ideation stays separate from execution.' },
  { n: '03', name: 'Act', accent: C.purple, body: 'An agent builds and ships through the gate, opening a PR that says Closes #N. The queue self-cleans on merge.' },
  { n: '04', name: 'Outcome', accent: C.clay, body: 'npm run metrics writes an offline health snapshot; the retro agent turns merges + that snapshot into durable lessons in INSIGHTS.md.' },
]

const GITHUB_ROLES = [
  { feature: 'Issues + labels', role: 'The work queue — the only source of truth for what to build', accent: C.gold },
  { feature: 'Projects board', role: 'The phone-readable, at-a-glance view of that queue', accent: C.sage },
  { feature: 'Actions', role: 'Orchestration + the gates (honesty, build, metrics, security)', accent: C.purple },
  { feature: 'Branch protection', role: 'Enforces that agents must PR and can never merge', accent: C.clay },
  { feature: 'Pull requests', role: 'The unit of change; Closes #N makes the queue self-cleaning', accent: C.gold },
]

const LABELS = [
  { chip: 'priority + agent:<domain>', meaning: 'A queued unit of work the batch squad will build', accent: C.gold },
  { chip: 'proposal', meaning: 'A forward-looking idea — not yet queued; a human must promote it', accent: C.purple },
  { chip: 'feedback', meaning: 'An inbound visitor report — triaged, but only a human closes it', accent: C.sage },
  { chip: 'paused', meaning: 'Skip this one issue on the next batch run (per-item kill-switch)', accent: C.clay },
]

export default function WorkflowPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { overflow: auto !important; height: auto !important; }
        body { background: ${C.bg}; }
        @keyframes flow-along { 0% { opacity: 0; } 5% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
        .flow-dot { animation: flow-along 2.8s linear infinite; }
        @keyframes pulse-gate {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,83,0); }
          50%       { box-shadow: 0 0 12px 3px rgba(212,168,83,0.18); }
        }
        .gate-pulse { animation: pulse-gate 3s ease-in-out infinite; }
        @keyframes ring-rotate { to { transform: rotate(360deg); } }
        .ring-spin { transform-origin: 150px 150px; animation: ring-rotate 24s linear infinite; }
        .stage-col:hover { border-color: ${C.borderMid} !important; }
        a { text-decoration: none; }
      ` }} />

      <main style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Pretendard Variable', Pretendard, system-ui, sans-serif", color: C.text }}>

        {/* Nav */}
        <nav style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ color: C.textMuted, fontSize: '0.8rem', letterSpacing: '0.04em' }}>← Back to journeys</Link>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: '0.8rem', color: C.textFaint, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Provenance Tracker · Workflow</span>
        </nav>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 32px 100px' }}>

          {/* Hero */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 16 }}>
              How it works
            </div>
            <h1 style={{ fontFamily: "'Pretendard Variable', serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, color: C.text, lineHeight: 1.1, marginBottom: 20 }}>
              From a session you run<br />to a system that runs itself.
            </h1>
            <p style={{ fontSize: '1rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 600, marginBottom: 12 }}>
              The whole model rests on one line: <strong style={{ color: C.text }}>autonomy is a dial, and the
              thing it turns up is initiation, never veto.</strong> Each stage removes the human as the
              <em> initiator</em> of more of the loop — while keeping the human as the <em>gate</em> on anything
              irreversible. That boundary never moves.
            </p>
            <p style={{ fontSize: '0.82rem', color: C.textFaint, lineHeight: 1.6 }}>
              The full walkthrough with diagrams lives in{' '}
              <a href="https://github.com/nyahn01/provenance-tracker/blob/main/docs/WORKFLOW_STAGES.md" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}` }}>docs/WORKFLOW_STAGES.md</a>.
            </p>
          </div>

          {/* Stage evolution band */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 24 }}>
              The three stages, side by side
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, position: 'relative' }}>
              {STAGES.map((s, i) => (
                <div key={s.id} className="stage-col" style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `2px solid ${s.accent}`, borderRadius: 10, padding: '20px 22px', transition: 'border-color 0.2s', opacity: s.active ? 1 : 0.92 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent }}>{s.tag}</div>
                    <span style={{ fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: `${s.accent}1a`, border: `1px solid ${s.accent}40`, color: s.accent }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: 500, color: C.text, marginBottom: 16 }}>{s.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ROWS.map(row => (
                      <div key={row.key}>
                        <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 3 }}>{row.label}</div>
                        <div style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.45, ...(row.key === 'loops' ? { color: s.accent, fontWeight: 500 } : {}) }}>{s[row.key]}</div>
                      </div>
                    ))}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div aria-hidden style={{ position: 'absolute', display: 'none' }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(212,168,83,0.04)', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.6 }}>
              The current default is the safe one — <strong style={{ color: C.sage }}>Stage 1</strong>. Stages 2 and 3
              are wired but inert: the orchestrate workflow exists, but its guard exits early unless the dial says
              otherwise, and even then its run step is a stub that executes no agents.
            </div>
          </div>

          {/* The dial */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              The one dial
            </div>
            <h2 style={{ fontFamily: "'Pretendard Variable', serif", fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 300, color: C.text, marginBottom: 12 }}>
              One config file switches the stage.
            </h2>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 620, marginBottom: 28 }}>
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.gold }}>.claude/orchestration.json</code>{' '}
              holds two fields that do the work: <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>mode</code> (which
              stage) and <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>paused</code> (the global
              kill-switch). The orchestrate guard no-ops unless <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.textMuted }}>mode</code> is
              scheduled / event-driven <em>and</em> <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.textMuted }}>paused</code> is false.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
              {[
                { mode: 'manual', label: 'Stage 1', accent: C.sage, note: 'Safe default. Orchestrate no-ops.', on: true },
                { mode: 'scheduled', label: 'Stage 2', accent: C.gold, note: 'Cron-initiated batch.', on: false },
                { mode: 'event-driven', label: 'Stage 3', accent: C.purple, note: 'Issue / webhook-initiated.', on: false },
              ].map((m, i) => (
                <div key={m.mode} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ minWidth: 150, background: C.surface, border: `1px solid ${m.on ? m.accent : C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                    <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.72rem', color: m.accent, fontWeight: 700 }}>mode: {m.mode}</code>
                    <div style={{ fontSize: '0.62rem', color: C.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</div>
                    <div style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>{m.note}</div>
                  </div>
                  {i < 2 && <span style={{ color: C.textFaint, fontSize: '1.1rem' }}>→</span>}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: C.textFaint, fontSize: '0.9rem' }}>·</span>
                <div style={{ minWidth: 150, background: 'rgba(200,120,85,0.06)', border: `1px solid ${C.clay}66`, borderRadius: 8, padding: '14px 16px' }}>
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.72rem', color: C.clay, fontWeight: 700 }}>paused: true</code>
                  <div style={{ fontSize: '0.62rem', color: C.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kill-switch</div>
                  <div style={{ fontSize: '0.72rem', color: C.textMuted, marginTop: 6, lineHeight: 1.4 }}>Guard exits early in any mode.</div>
                </div>
              </div>
            </div>
          </div>

          {/* The four loops */}
          <div style={{ marginBottom: 80 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              The four loops
            </div>
            <h2 style={{ fontFamily: "'Pretendard Variable', serif", fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 300, color: C.text, marginBottom: 12 }}>
              What makes Stage 3 <em>improve</em>, not just change.
            </h2>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 620, marginBottom: 32 }}>
              A system with only an <strong style={{ color: C.text }}>Act</strong> loop can change the product but
              never learn. Stage 3 closes three more loops so the next cycle is smarter, not just different.
            </p>

            <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Ring diagram */}
              <svg viewBox="0 0 300 300" width="240" height="240" style={{ flexShrink: 0 }}>
                <circle cx={150} cy={150} r={96} fill="none" stroke={C.border} strokeWidth={1} />
                <g className="ring-spin">
                  <circle cx={150} cy={54} r={4} fill={C.sage} />
                  <circle cx={246} cy={150} r={4} fill={C.gold} />
                  <circle cx={150} cy={246} r={4} fill={C.purple} />
                  <circle cx={54} cy={150} r={4} fill={C.clay} />
                </g>
                {[
                  { x: 150, y: 40, label: 'SENSE', c: C.sage },
                  { x: 260, y: 154, label: 'DECIDE', c: C.gold },
                  { x: 150, y: 266, label: 'ACT', c: C.purple },
                  { x: 40, y: 154, label: 'OUTCOME', c: C.clay },
                ].map(p => (
                  <text key={p.label} x={p.x} y={p.y} textAnchor="middle" fill={p.c} fontSize={11} fontWeight={700} style={{ fontFamily: 'inherit', letterSpacing: '0.06em' }}>{p.label}</text>
                ))}
                <text x={150} y={148} textAnchor="middle" fill={C.textFaint} fontSize={9} style={{ fontFamily: 'inherit', letterSpacing: '0.1em' }}>THE LOOP</text>
                <text x={150} y={163} textAnchor="middle" fill={C.textMuted} fontSize={9} style={{ fontFamily: 'inherit' }}>compounds</text>
              </svg>
              {/* Loop cards */}
              <div style={{ flex: 1, minWidth: 280, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {LOOPS.map(l => (
                  <div key={l.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `2px solid ${l.accent}`, borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: '0.66rem', color: C.textFaint }}>{l.n}</span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600, color: l.accent }}>{l.name}</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: C.textMuted, lineHeight: 1.5 }}>{l.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GitHub as partner */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              GitHub as the project partner
            </div>
            <h2 style={{ fontFamily: "'Pretendard Variable', serif", fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 300, color: C.text, marginBottom: 12 }}>
              No side tools. GitHub is the backbone.
            </h2>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 620, marginBottom: 28 }}>
              There is no separate task tracker and no markdown to-do list. Issues are the queue, labels are its
              grammar, Actions are the gates, and a human always merges.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 28 }}>
              {GITHUB_ROLES.map(r => (
                <div key={r.feature} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', color: r.accent, marginBottom: 5 }}>{r.feature}</div>
                  <div style={{ fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.5 }}>{r.role}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              Labels are the queue&apos;s grammar
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {LABELS.map((l, i) => (
                <div key={l.chip} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 18px', background: C.surface, borderBottom: i < LABELS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.66rem', fontWeight: 700, color: l.accent, background: `${l.accent}1a`, border: `1px solid ${l.accent}40`, borderRadius: 4, padding: '3px 8px', flexShrink: 0, minWidth: 168, textAlign: 'center' }}>{l.chip}</code>
                  <span style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.5 }}>{l.meaning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation: strengths vs strains */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 72 }}>
            <div style={{ background: 'rgba(74,122,106,0.05)', border: `1px solid ${C.sage}40`, borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.sage, marginBottom: 12 }}>Where it shines</div>
              {[
                'One source of truth — the queue is the issues; Closes #N self-cleans it.',
                'Auditable by construction — every change is a gated PR linked to an issue.',
                'Free hosted CI runs the honesty / build / metrics gates on every PR.',
                'Phone-operable — promote, reorder, and merge from the mobile app.',
              ].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.5 }}>
                  <span style={{ color: C.sage, flexShrink: 0 }}>✓</span><span>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(200,120,85,0.05)', border: `1px solid ${C.clay}40`, borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.clay, marginBottom: 12 }}>Where it strains</div>
              {[
                'Cost ceiling — headless CI agent runs aren’t covered; that is why Stages 2/3 stay inert.',
                'No native budget enforcement — token / PR caps live in config, honored by the runner we build.',
                'Label discipline is load-bearing — a missing agent:<domain> makes an issue invisible to the batch.',
                'Issues aren’t a great spec format for rich design work — those still want an ADR or a doc.',
              ].map(t => (
                <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.5 }}>
                  <span style={{ color: C.clay, flexShrink: 0 }}>!</span><span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safe-state callout */}
          <div className="gate-pulse" style={{ background: 'rgba(212,168,83,0.04)', border: `1px solid rgba(212,168,83,0.20)`, borderRadius: 12, padding: '24px 28px', marginBottom: 72 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
              The invariant — even at maximum autonomy
            </div>
            <p style={{ fontSize: '0.88rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 640 }}>
              Branch protection + the blocking honesty gate + a human merge always stand between an agent and{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>main</code>. The{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.textMuted }}>provenance_data</code>,{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.textMuted }}>globe</code>, and{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.textMuted }}>honesty_surface</code> tiers stay
              human-merged forever — the credibility moat, never spent for convenience. To pause: set{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.clay }}>paused: true</code>, or add the{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.clay }}>paused</code> label to one issue.
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.72rem', color: C.textFaint }}>
              Built with Claude Sonnet &amp; Opus · Anthropic · 2026
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Link href="/team" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>The agent team →</Link>
              <Link href="/demo" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Our story →</Link>
              <Link href="/learn" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Provenance glossary →</Link>
              <Link href="/impressum" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Legal notice →</Link>
              <Link href="/" style={{ fontSize: '0.72rem', color: C.textMuted, borderBottom: `1px solid ${C.border}`, paddingBottom: 1 }}>Explore journeys →</Link>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
