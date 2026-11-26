const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

/** 15400 -> "₹15,400" ; -500 -> "-₹500" */
export function formatINR(amount) {
  const n = Number(amount) || 0
  const sign = n < 0 ? '-' : ''
  return `${sign}₹${inr.format(Math.abs(n))}`
}

/** Plain-text version for PDF (built-in PDF fonts have no ₹ glyph) */
export function formatINRPlain(amount) {
  const n = Number(amount) || 0
  const sign = n < 0 ? '-' : ''
  return `${sign}Rs. ${inr.format(Math.abs(n))}`
}

/** Avoid floating point drift when adding money values (half-day wages can have .5) */
export function roundMoney(n) {
  return Math.round((Number(n) || 0) * 100) / 100
}
