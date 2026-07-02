/**
 * JsonLd — renders a schema.org structured-data block.
 *
 * Server-safe (no hooks, no browser APIs). Honesty rule: the object passed in
 * must contain only facts that already appear, sourced, on the page — JSON-LD
 * is a machine-readable mirror of the visible content, never an extra claim.
 */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // `<` escaped so painting titles/credits can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
