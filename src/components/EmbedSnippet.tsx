'use client'

/**
 * "Embed this timeline" — a copyable <iframe> snippet for /work/[slug]
 * (issue #151). Points at the matching /embed/work/[slug] route.
 */
import { useState } from 'react'
import { MARKETING as C } from '@/lib/design-tokens'

export function EmbedSnippet({ slug, title, siteUrl }: { slug: string; title: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false)
  const snippet = `<iframe src="${siteUrl}/embed/work/${slug}" title="${title} — chain of custody" width="100%" height="600" style="border:0;border-radius:10px" loading="lazy"></iframe>`

  async function copy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ fontSize: '0.78rem', color: C.textMuted, cursor: 'pointer' }}>
        Embed this timeline →
      </summary>
      <div style={{ marginTop: 10 }}>
        <pre
          style={{
            fontSize: '0.72rem',
            color: C.textFaint,
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            overflowX: 'auto',
            marginBottom: 8,
            fontFamily: "'Courier New', monospace",
          }}
        >
          {snippet}
        </pre>
        <button
          onClick={copy}
          style={{
            fontSize: '0.74rem',
            color: copied ? C.sage : C.gold,
            background: 'none',
            border: `1px solid ${copied ? C.sage : C.gold}`,
            borderRadius: 6,
            padding: '5px 12px',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied' : 'Copy snippet'}
        </button>
      </div>
    </details>
  )
}
