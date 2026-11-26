// Simple inline SVG pictures (no image files to download – fast on slow mobile data)

/** App logo: a worker with a yellow hard hat */
export function WorkerLogo({ className = 'size-14' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M8 63c0-13 11-20 24-20s24 7 24 20z" fill="#15803d" />
      <path d="M25 43.5 32 53l7-9.5" fill="#fff" />
      <path d="M28.5 45h7l-3.5 5z" fill="#16a34a" />
      <circle cx="32" cy="29" r="11.5" fill="#16a34a" />
      <rect x="23.5" y="31" width="17" height="7.5" rx="3.75" fill="#fff" />
      <path d="M17.5 25c0-11 6.5-15.5 14.5-15.5S46.5 14 46.5 25z" fill="#facc15" />
      <rect x="14.5" y="23" width="35" height="5" rx="2.5" fill="#eab308" />
      <rect x="29.5" y="9.5" width="5" height="12" rx="2" fill="#fde047" />
    </svg>
  )
}

/** Light green city + crane line drawing for the bottom of auth pages */
export function Skyline({ className = '' }) {
  const buildings = [
    [0, 58, 22], [24, 40, 18], [44, 66, 26], [72, 30, 16], [90, 50, 20], [112, 22, 24], [138, 46, 18], [158, 60, 22],
    [182, 34, 20], [204, 52, 16], [222, 26, 22], [246, 44, 18], [266, 62, 26], [294, 38, 20], [316, 54, 18],
    [336, 30, 22], [360, 48, 18], [380, 64, 20],
  ]
  return (
    <svg viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice" className={`w-full ${className}`} aria-hidden="true">
      {buildings.map(([x, h, w], i) => (
        <rect key={i} x={x} y={100 - h} width={w} height={h} rx="1.5" fill={i % 2 ? '#dcfce7' : '#bbf7d0'} />
      ))}
      {/* crane */}
      <g stroke="#86efac" strokeWidth="2" fill="none">
        <path d="M300 100V14M308 100V14M300 30l8-8M300 46l8-8M300 62l8-8M300 78l8-8M300 94l8-8" />
        <path d="M250 14h100M262 14l42-10 40 10" />
        <path d="M262 14v26" />
      </g>
      <rect x="0" y="96" width="400" height="4" fill="#bbf7d0" />
    </svg>
  )
}

/** Landing page picture: two workers looking at a building site */
export function WorkersScene({ className = '' }) {
  return (
    <svg viewBox="0 0 320 220" className={className} aria-hidden="true">
      {/* background buildings */}
      <g fill="#e2e8f0">
        <rect x="8" y="92" width="34" height="110" rx="2" />
        <rect x="46" y="70" width="28" height="132" rx="2" />
        <rect x="250" y="80" width="30" height="122" rx="2" />
        <rect x="284" y="104" width="30" height="98" rx="2" />
      </g>
      <g fill="#f8fafc">
        {[0, 1, 2, 3, 4, 5].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={14 + c * 14} y={100 + r * 15} width="8" height="8" rx="1" />))}
        {[0, 1, 2, 3, 4, 5, 6].map((r) => <rect key={`b${r}`} x={54} y={78 + r * 16} width="12" height="8" rx="1" />)}
        {[0, 1, 2, 3, 4, 5].map((r) => <rect key={`c${r}`} x={258} y={88 + r * 17} width="14" height="8" rx="1" />)}
      </g>
      {/* building under construction */}
      <g stroke="#94a3b8" strokeWidth="2.5" fill="none">
        <path d="M150 202V96h86v106M150 124h86M150 152h86M150 180h86M172 96v106M194 96v106M216 96v106" />
      </g>
      {/* crane */}
      <g stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M228 202V22M240 202V22" />
        <path d="M228 40l12-12M228 64l12-12M228 88l12-12M228 112l12-12M228 136l12-12M228 160l12-12M228 184l12-12" />
        <path d="M96 22h178M110 22l124-16 40 16" />
        <path d="M130 22v40" strokeWidth="1.5" />
      </g>
      <rect x="122" y="62" width="16" height="10" rx="1.5" fill="#f59e0b" />
      {/* ground */}
      <path d="M0 196c60-12 120-14 160-10s110 8 160-2v36H0z" fill="#bbf7d0" />
      <path d="M0 206c80-8 180-6 320-4v18H0z" fill="#86efac" />

      {/* worker 1 (orange vest) */}
      <g>
        <path d="M58 220c0-36 14-60 46-60s46 24 46 60z" fill="#475569" />
        <path d="M72 220c0-30 10-52 32-52s32 22 32 52z" fill="#f97316" />
        <path d="M76 196h56M74 208h60" stroke="#fde047" strokeWidth="5" />
        <path d="M104 168v52" stroke="#ea580c" strokeWidth="2" />
        <rect x="96" y="146" width="16" height="16" rx="5" fill="#a16207" />
        <circle cx="104" cy="136" r="17" fill="#1f2937" />
        <path d="M84 134c0-16 9-24 20-24s20 8 20 24z" fill="#facc15" />
        <rect x="80" y="131" width="48" height="6" rx="3" fill="#eab308" />
      </g>
      {/* worker 2 (blue shirt, green vest) */}
      <g>
        <path d="M150 220c0-34 14-56 44-56s44 22 44 56z" fill="#2563eb" />
        <path d="M164 220c0-28 10-48 30-48s30 20 30 48z" fill="#a3e635" />
        <path d="M166 198h56M165 210h58" stroke="#f8fafc" strokeWidth="4.5" />
        <rect x="186" y="150" width="16" height="16" rx="5" fill="#92400e" />
        <circle cx="194" cy="141" r="16" fill="#111827" />
        <path d="M175 139c0-15 8-23 19-23s19 8 19 23z" fill="#facc15" />
        <rect x="171" y="136" width="46" height="6" rx="3" fill="#eab308" />
      </g>
    </svg>
  )
}
