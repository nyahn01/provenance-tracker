/**
 * DealerNetworkChart — who sold to whom, from the Knoedler stock books.
 *
 * A bipartite ribbon diagram, NOT a force-directed graph: sellers on the left,
 * buyers on the right, a ribbon per counted seller→buyer relationship. This is
 * deliberate — every ribbon is a real count of ledger transactions with no
 * pseudo-geometry to over-read, the layout is deterministic, and it reads like
 * the ledger it is. One data hue (the dealer voice) per the three-hue discipline.
 */
import { MARKETING as C, accent } from '@/lib/design-tokens'
import type { BipartiteLayout } from '@/lib/types'
import { ChartFrame } from './ChartFrame'

const W = 900, H = 460, PAD_T = 20, PAD_B = 20
const LEFT_X = 210, RIGHT_X = W - 210
const NODE = 4

export function DealerNetworkChart({ layout }: { layout: BipartiteLayout }) {
  const empty = layout.links.length === 0
  const plotH = H - PAD_T - PAD_B
  const yOf = (t: number) => PAD_T + t * plotH
  const maxCount = Math.max(1, ...layout.links.map(l => l.count))
  const sellerY = new Map(layout.sellers.map(s => [s.name, yOf(s.y)]))
  const buyerY = new Map(layout.buyers.map(b => [b.name, yOf(b.y)]))

  return (
    <ChartFrame
      eyebrow="The dealer network"
      title="Who sold to whom, in the Knoedler ledgers"
      sourceLabel="Getty GPI — Knoedler Stock Books (1872–1970), CC0 1.0"
      empty={empty}
      emptyNote="No seller→buyer relationship meets the display threshold."
      id="network"
      note={`Knoedler stock books only. ${layout.totalSellers.toLocaleString('en-US')} sellers and ${layout.totalBuyers.toLocaleString('en-US')} buyers appear in total; shown are the busiest twelve on each side and the relationships with at least ${layout.minLinkCount} recorded transactions. Ribbon weight is the transaction count.`}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label="Bipartite diagram linking the busiest Knoedler sellers to the busiest buyers, ribbon weight proportional to the number of recorded transactions"
        style={{ display: 'block', minWidth: 680, width: '100%', height: 'auto' }}>
        <text x={LEFT_X} y={12} textAnchor="end" fontFamily="var(--font-ui)" fontSize={9} fontWeight={600} letterSpacing="0.1em" fill={C.textFaint}>SELLERS →</text>
        <text x={RIGHT_X} y={12} textAnchor="start" fontFamily="var(--font-ui)" fontSize={9} fontWeight={600} letterSpacing="0.1em" fill={C.textFaint}>→ BUYERS</text>

        {/* ribbons */}
        {layout.links.map((l, i) => {
          const y1 = sellerY.get(l.seller)!, y2 = buyerY.get(l.buyer)!
          const mx = (LEFT_X + RIGHT_X) / 2
          const sw = 0.6 + (l.count / maxCount) * 5
          const op = 0.22 + (l.count / maxCount) * 0.5
          return (
            <path key={i} d={`M ${LEFT_X} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${RIGHT_X} ${y2}`}
              fill="none" stroke={accent.dealer} strokeWidth={sw} strokeOpacity={op}>
              <title>{`${l.seller} → ${l.buyer}: ${l.count} transactions`}</title>
            </path>
          )
        })}

        {/* seller nodes + labels */}
        {layout.sellers.map(s => {
          const yy = sellerY.get(s.name)!
          return (
            <g key={s.name}>
              <circle cx={LEFT_X} cy={yy} r={NODE} fill={accent.dealer} />
              <text x={LEFT_X - 10} y={yy + 3} textAnchor="end" fontFamily="var(--font-ui)" fontSize={10} fill={C.text}>
                {s.name} <tspan fill={C.textFaint}>{s.count}</tspan>
              </text>
            </g>
          )
        })}
        {/* buyer nodes + labels */}
        {layout.buyers.map(b => {
          const yy = buyerY.get(b.name)!
          return (
            <g key={b.name}>
              <circle cx={RIGHT_X} cy={yy} r={NODE} fill={accent.dealer} />
              <text x={RIGHT_X + 10} y={yy + 3} textAnchor="start" fontFamily="var(--font-ui)" fontSize={10} fill={C.text}>
                {b.name} <tspan fill={C.textFaint}>{b.count}</tspan>
              </text>
            </g>
          )
        })}
      </svg>
    </ChartFrame>
  )
}
