/**
 * ConfidenceDot — small colored dot indicating a timeline event's confidence
 * tier (high / medium / low). Extracted verbatim from StoriesApp.tsx.
 */
const CONFIDENCE_DOT: Record<'high' | 'medium' | 'low', { color: string; label: string }> = {
  high:   { color: 'rgba(100,180,100,0.8)', label: 'High confidence' },
  medium: { color: 'rgba(200,160,60,0.8)',  label: 'Medium confidence' },
  low:    { color: 'rgba(154,143,133,0.5)', label: 'Low confidence' },
}

export function ConfidenceDot({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const { color, label } = CONFIDENCE_DOT[confidence]
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        cursor: 'default',
      }}
    />
  )
}
