/**
 * InfoIcon — shows a tooltip bubble above the icon on hover.
 * Uses CSS-only approach (no portal) since card overflow is now visible.
 */
export default function InfoIcon({ text }) {
  return (
    <span className="card-info-icon info-icon-wrap">
      i
      <span className="info-tooltip-bubble">{text}</span>
    </span>
  )
}
