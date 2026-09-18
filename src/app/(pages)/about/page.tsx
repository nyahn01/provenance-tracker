/**
 * /about — the colophon. How this platform was built: the origin story, the
 * AI agent team, and the autonomy model. Folds the former /demo (origin),
 * /team (agent team), and /workflow (autonomy model) pages into one page —
 * see ADR docs/decisions/0004-timeline-led-hero.md and proposal #123 for why.
 * Static server component — no client JS. Reuses the /team + /workflow tokens.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { MARKETING } from '@/lib/design-tokens'
import { PageShell, Eyebrow, DisplayHeading, Prose, Card, CTALink, Callout, FooterNav } from '@/components/ui'

export const metadata: Metadata = {
  title: 'About — Provenance Tracker',
  description: 'How this platform was built: the origin story, the 10-profile AI agent team, the blocking honesty gate, the ship gate, and the Stage 1 → 2 → 3 autonomy model. A human always merges.',
}

// MARKETING base with the /about sage override (#4a7a6a) — preserved drift, see design-tokens.ts
const C = { ...MARKETING, sage: '#4a7a6a' }

interface Agent {
  name: string
  role: string
  owns: string
  model: 'OPUS' | 'SONNET'
  isGate?: boolean
}

const AGENTS: Agent[] = [
  { name: 'design-director', role: 'Visual language & art direction', owns: 'Typography, color, motion, restraint. Sets the design system. Others implement to it — never around it.', model: 'OPUS' },
  { name: 'provenance-globe', role: 'Globe, sidebar & all front-end', owns: 'Globe.gl arcs/pins, sidebar panels, responsive layout, strict design-token fidelity.', model: 'SONNET' },
  { name: 'dataviz-engineer', role: 'Information design', owns: 'Timeline, movement map, provenance graph — how the journey is shown clearly and beautifully.', model: 'SONNET' },
  { name: 'provenance-data', role: 'Data integration & APIs', owns: 'Wikidata SPARQL, Met/AIC/Rijks/Europeana/Cleveland/Getty APIs, caching, rate limiting, data contracts.', model: 'SONNET' },
  { name: 'art-historian', role: 'Provenance scholarship', owns: 'Source credibility ranking, gap characterization, what makes custody evidence trustworthy.', model: 'OPUS' },
  { name: 'art-insurance-advisor', role: 'Insurance & underwriting', owns: 'What underwriters price, what data they trust, how provenance signals map to real risk models.', model: 'OPUS' },
  { name: 'provenance-strategy', role: 'Business, market & customer segments', owns: 'Museums, insurers, auction houses, restitution lawyers — what each segment pays for and why.', model: 'OPUS' },
  { name: 'provenance-story', role: 'Demo narrative & pitch', owns: 'DEMO_SCRIPT.md, the 5-minute video flow, hero-work selection, judging-criteria fit.', model: 'OPUS' },
  { name: 'feedback-triage', role: 'Visitor feedback intake', owns: 'Reviews feedback issues, writes a sourced triage note, tags them. Reads only — never edits product code, never closes your issue.', model: 'SONNET' },
  { name: 'provenance-honesty-review', role: 'Credibility gate — BLOCKING', owns: 'Audits every diff for over-claiming, missing sources, faked data. No commit bypasses this gate.', model: 'OPUS', isGate: true },
]

const STAGES = [
  { tag: 'Stage 1', title: 'Manual · per session', status: 'Active today', accent: C.sage, body: 'A human opens a Claude Code session. Agents are invoked in-session against whatever that session is about. A human merges every PR.' },
  { tag: 'Stage 2', title: 'Scheduled · sense only', status: 'Active · weekly', accent: C.gold, body: 'A weekly cron runs six read-only sentinels over main. They file issues and rank proposals; they never write code. Building is still a human-opened session, and a human still merges every PR.' },
  { tag: 'Stage 3', title: 'Event-driven · autonomous build', status: 'Not wired', accent: C.purple, body: 'An event or a sentinel files the issue and an agent builds it unprompted. The workflow exists and stays switched off: a first review found the queue held no issue a coding agent could finish in one PR. A human would still merge.' },
]

const LOOPS = [
  { n: '01', name: 'Sense', accent: C.sage, body: 'Work originates without a human typing it — feedback auto-triage + scheduled self-audit sentinels file issues. Read-only: they route problems, never fix them.' },
  { n: '02', name: 'Decide', accent: C.gold, body: 'A human promotes a proposal issue to priority + agent:<domain>. Ideation stays separate from execution.' },
  { n: '03', name: 'Act', accent: C.purple, body: 'An agent builds and ships through the gate, opening a PR that says Closes #N. The queue self-cleans on merge. Every build so far was started by a human opening a session.' },
  { n: '04', name: 'Outcome', accent: C.clay, body: 'npm run metrics writes an offline health snapshot of the custody chains and flags regressions in CI. Feeding that snapshot back into durable lessons is still done by hand: the retro agent is written but not scheduled.' },
]

const LABELS = [
  { chip: 'priority + agent:<domain>', meaning: 'A queued unit of work the batch squad will build', accent: C.gold },
  { chip: 'proposal', meaning: 'A forward-looking idea — not yet queued; a human must promote it', accent: C.purple },
  { chip: 'feedback', meaning: 'An inbound visitor report — triaged, but only a human closes it', accent: C.sage },
  { chip: 'paused', meaning: 'Skip this one issue on the next batch run (per-item kill-switch)', accent: C.clay },
]

export default function AboutPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .agent-card:hover { border-color: ${C.borderMid} !important; background: ${C.surface2} !important; }
      ` }} />

      <PageShell width={1100}>

          {/* Hero */}
          <div style={{ marginBottom: 72 }}>
            <Eyebrow>About</Eyebrow>
            <DisplayHeading size="hero">
              How this was built.
            </DisplayHeading>
            <Prose maxWidth={620}>
              The colophon: why this platform exists, the AI agent team that builds it, and the
              autonomy model it runs under. The provenance product itself lives at{' '}
              <Link href="/" style={{ color: C.gold, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>the globe</Link>,{' '}
              <Link href="/learn" style={{ color: C.gold, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>the glossary</Link>, and{' '}
              <Link href="/case/adele-bloch-bauer-i" style={{ color: C.gold, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>a full restitution chain</Link> — this page is about the making, not the art.
            </Prose>
          </div>

          {/* ── §01 Origin ───────────────────────────────────────────────── */}
          <div style={{ marginBottom: 80, borderBottom: `1px solid ${C.border}`, paddingBottom: 56 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              01 — Origin
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 400, color: C.text, lineHeight: 1.2, marginBottom: 20 }}>
              A gift for a curator
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.8, maxWidth: 640, marginBottom: 20 }}>
              A friend debuted curating at the National Gallery, London. His dream: curate all the
              great museums — the Louvre, the National Gallery, and beyond. He&apos;d travel between
              cities and say:{' '}
              <em style={{ color: C.text, fontStyle: 'italic' }}>
                &ldquo;that painting was here last time — where did it go?&rdquo;
              </em>{' '}
              This platform began as an answer to that question.
            </p>
            <p style={{ fontSize: '0.88rem', color: C.textFaint, lineHeight: 1.75, maxWidth: 600 }}>
              Built by a data professional working in insurance — someone who understood that
              unlike electronics, art <em>appreciates</em> with documented provenance. Inspired by
              FlightRadar24: invisible journeys, made legible to anyone with a browser. It was also
              the founder&apos;s first time using an AI agent team — agents handle data integration,
              globe engineering, design, strategy, and narrative in parallel, overnight; the human
              reviews, redirects, and merges.
            </p>
          </div>

          {/* ── §02 The agent team ───────────────────────────────────────── */}
          <div style={{ marginBottom: 80, borderBottom: `1px solid ${C.border}`, paddingBottom: 56 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              02 — How it&apos;s built
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 400, color: C.text, lineHeight: 1.2, marginBottom: 20 }}>
              Ready when you are.<br />Autonomous by design.
            </h2>
            <p style={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.8, maxWidth: 640, marginBottom: 32 }}>
              10 specialized AI agent profiles run this platform on Max. Each owns a domain. Each
              can block a commit. Every fact you see passed a credibility review.
            </p>

            {/* Two intake lanes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
              <Card padding="18px 20px" accentColor={C.sage} accentSide="top">
                <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.sage, marginBottom: 6 }}>Lane A · feedback</div>
                <div style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6 }}>
                  You send the in-app <Link href="/feedback" style={{ color: C.sage, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>feedback form</Link>. It opens a GitHub issue tagged{' '}
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.sage }}>feedback</code>; the{' '}
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.textMuted }}>feedback-triage</code> agent reviews and documents it — reads only, never edits the product, never closes your issue. A human decides what gets promoted.
                </div>
              </Card>
              <Card padding="18px 20px" accentColor={C.gold} accentSide="top">
                <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, marginBottom: 6 }}>Lane B · build queue</div>
                <div style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.6 }}>
                  A maintainer — or a Claude Code planning session — writes an issue tagged{' '}
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.gold }}>priority</code> +{' '}
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.gold }}>agent:&lt;domain&gt;</code>. It routes to the matching specialist agent, which builds and opens a PR that says{' '}
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.gold }}>Closes&nbsp;#N</code> — merging auto-closes it.
                </div>
              </Card>
            </div>
            <p style={{ fontSize: '0.78rem', color: C.textFaint, lineHeight: 1.6, marginBottom: 40 }}>
              Both lanes meet at the same blocking honesty gate, and a human always merges. Nothing reaches the site without that merge.
            </p>

            {/* Agent cards */}
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 20 }}>
              The specialists ({AGENTS.length} active agents)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 40 }}>
              {AGENTS.map((agent) => (
                <div key={agent.name} className="agent-card"
                  style={{
                    background: C.surface,
                    border: `1px solid ${agent.isGate ? 'rgba(212,168,83,0.35)' : C.border}`,
                    borderRadius: 10, padding: '16px 18px',
                    transition: 'border-color 0.2s, background 0.2s',
                    ...(agent.isGate ? { boxShadow: '0 0 24px rgba(212,168,83,0.06)' } : {}),
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.7rem', color: agent.isGate ? C.gold : C.textMuted, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.3 }}>
                      {agent.name}{agent.isGate && <span style={{ marginLeft: 6, fontSize: '0.65rem' }}>★</span>}
                    </div>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '2px 6px', borderRadius: 3,
                      background: agent.model === 'OPUS' ? 'rgba(212,168,83,0.10)' : 'rgba(74,122,106,0.12)',
                      color: agent.model === 'OPUS' ? C.gold : C.sage,
                      border: agent.model === 'OPUS' ? '1px solid rgba(212,168,83,0.20)' : '1px solid rgba(74,122,106,0.20)',
                      flexShrink: 0, marginLeft: 10,
                    }}>{agent.model}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.text, marginBottom: 6, lineHeight: 1.3 }}>{agent.role}</div>
                  <div style={{ fontSize: '0.73rem', color: C.textMuted, lineHeight: 1.5 }}>{agent.owns}</div>
                </div>
              ))}
            </div>

            {/* Ship gate */}
            <Callout pulse padding="24px 28px">
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
                The ship gate
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.8, marginBottom: 14 }}>
                <div><span style={{ color: C.gold }}>$</span> node scripts/ship.mjs</div>
                <div style={{ color: C.textFaint }}>  ✓ npm run build</div>
                <div style={{ color: C.textFaint }}>  ✓ server starts in &lt; 10s</div>
                <div style={{ color: C.textFaint }}>  ✓ /api/provenance returns valid ProvenanceResponse</div>
                <div style={{ color: C.textFaint }}>  ✓ honesty grep: no invented data</div>{/* honesty-ok */}
                <div style={{ color: C.gold }}>  → commit &amp; push</div>
              </div>
              <p style={{ fontSize: '0.82rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 560 }}>
                Agents cannot commit directly. Every change passes an automated build, a server
                health check, and a grep-based honesty audit. The gate commits — not the agent.
              </p>
            </Callout>
          </div>

          {/* ── §03 The autonomy model ───────────────────────────────────── */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 10 }}>
              03 — The autonomy model
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 400, color: C.text, lineHeight: 1.2, marginBottom: 20 }}>
              From a session you run<br />to a system that runs itself.
            </h2>
            <p style={{ fontSize: '0.9rem', color: C.textMuted, lineHeight: 1.75, maxWidth: 640, marginBottom: 12 }}>
              The whole model rests on one line: <strong style={{ color: C.text }}>autonomy is a dial, and the
              thing it turns up is initiation, never veto.</strong> Each stage removes the human as
              the <em>initiator</em> of more of the loop, while keeping the human as the <em>gate</em> on
              anything irreversible. That boundary never moves.
            </p>
            <p style={{ fontSize: '0.78rem', color: C.textFaint, lineHeight: 1.6, marginBottom: 36 }}>
              The full walkthrough lives in{' '}
              <a href="https://github.com/nyahn01/provenance-tracker/blob/main/docs/WORKFLOW_STAGES.md" style={{ color: C.textMuted, borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>docs/WORKFLOW_STAGES.md</a>.
              One config file switches the stage —{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.gold }}>.claude/orchestration.json</code>{' '}
              holds <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>mode</code> (which stage) and{' '}
              <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>paused</code> (the global kill-switch). The current default is Stage 1, the safe one — Stage 2/3 code exists but stays inert until a human flips the dial.
            </p>

            {/* Stage cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 44 }}>
              {STAGES.map(s => (
                <Card key={s.tag} padding="18px 20px" accentColor={s.accent} accentSide="top">
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: s.accent }}>{s.tag}</span>
                    <span style={{ fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: `${s.accent}1a`, border: `1px solid ${s.accent}40`, color: s.accent }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, color: C.text, marginBottom: 10 }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.55 }}>{s.body}</div>
                </Card>
              ))}
            </div>

            {/* Four loops */}
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 8 }}>
              The four loops
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 620, marginBottom: 20 }}>
              A system with only an <strong style={{ color: C.text }}>Act</strong> loop can change the product but never learn. Stage 3 closes three more loops so the next cycle is smarter, not just different.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 44 }}>
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

            {/* GitHub as backbone */}
            <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 8 }}>
              GitHub is the backbone
            </div>
            <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 640, marginBottom: 20 }}>
              There is no separate task tracker and no markdown to-do list. Issues are the queue,
              labels are its grammar, GitHub Actions run the honesty / build / metrics gates on
              every PR, branch protection enforces that agents must PR and can never merge, and a
              human always merges.
            </p>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 44 }}>
              {LABELS.map((l, i) => (
                <div key={l.chip} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 18px', background: C.surface, borderBottom: i < LABELS.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.64rem', fontWeight: 700, color: l.accent, background: `${l.accent}1a`, border: `1px solid ${l.accent}40`, borderRadius: 4, padding: '3px 8px', flexShrink: 0, minWidth: 168, textAlign: 'center' }}>{l.chip}</code>
                  <span style={{ fontSize: '0.8rem', color: C.textMuted, lineHeight: 1.5 }}>{l.meaning}</span>
                </div>
              ))}
            </div>

            {/* Strengths vs strains */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 44 }}>
              <div style={{ background: 'rgba(74,122,106,0.05)', border: `1px solid ${C.sage}40`, borderRadius: 10, padding: '18px 22px' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.sage, marginBottom: 10 }}>Where it shines</div>
                {[
                  'One source of truth — the queue is the issues; Closes #N self-cleans it.',
                  'Auditable by construction — every change is a gated PR linked to an issue.',
                  'Free hosted CI runs the honesty / build / metrics gates on every PR.',
                  'Phone-operable — promote, reorder, and merge from the mobile app.',
                ].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.5 }}>
                    <span style={{ color: C.sage, flexShrink: 0 }}>✓</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(200,120,85,0.05)', border: `1px solid ${C.clay}40`, borderRadius: 10, padding: '18px 22px' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.clay, marginBottom: 10 }}>Where it strains</div>
                {[
                  'Cost ceiling — headless CI agent runs aren’t covered; that is why Stages 2/3 stay inert.',
                  'No native budget enforcement — token / PR caps live in config, honored by the runner we build.',
                  'Label discipline is load-bearing — a missing agent:<domain> makes an issue invisible to the batch.',
                  'Issues aren’t a great spec format for rich design work — those still want an ADR or a doc.',
                ].map(t => (
                  <div key={t} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: '0.78rem', color: C.textMuted, lineHeight: 1.5 }}>
                    <span style={{ color: C.clay, flexShrink: 0 }}>!</span><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safe-state invariant */}
            <Callout pulse padding="22px 26px">
              <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold, marginBottom: 12 }}>
                The invariant — even at maximum autonomy
              </div>
              <p style={{ fontSize: '0.85rem', color: C.textMuted, lineHeight: 1.7, maxWidth: 640 }}>
                Branch protection, the blocking honesty gate, and a human merge always stand
                between an agent and <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.85em', color: C.text }}>main</code>. The credibility moat is never spent for
                convenience. To pause any of it: set{' '}
                <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.clay }}>paused: true</code> in the orchestration config, or add the{' '}
                <code style={{ fontFamily: "'Courier New', monospace", fontSize: '0.82em', color: C.clay }}>paused</code> label to one issue.
              </p>
            </Callout>
          </div>

          <FooterNav note="Built with Claude Sonnet & Opus · Anthropic · 2026">
            <CTALink href="/" tone="gold">
              Next: explore journeys &rarr;
            </CTALink>
            <span style={{ width: 1, height: 14, background: C.border }} />
            <CTALink href="/demo/source" size="0.72rem">
              Full source doc
            </CTALink>
            <CTALink href="/feedback" size="0.72rem">
              Feedback
            </CTALink>
            <CTALink href="/impressum" size="0.72rem">
              Legal notice
            </CTALink>
          </FooterNav>

      </PageShell>
    </>
  )
}
