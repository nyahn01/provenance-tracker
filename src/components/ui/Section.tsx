/**
 * Section — vertical rhythm + optional Eyebrow head. The spacing every page
 * previously restated per-section.
 */
import { Eyebrow } from './Eyebrow'
import type { PaletteName } from './palette'

export function Section({
  eyebrow,
  children,
  palette = 'marketing',
  marginBottom = 56,
  id,
}: {
  eyebrow?: React.ReactNode
  children: React.ReactNode
  palette?: PaletteName
  marginBottom?: number
  id?: string
}) {
  return (
    <section id={id} style={{ marginBottom }}>
      {eyebrow && (
        <Eyebrow as="h2" palette={palette} marginBottom={18}>
          {eyebrow}
        </Eyebrow>
      )}
      {children}
    </section>
  )
}
