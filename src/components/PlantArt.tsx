import clsx from 'clsx'
import type { PlantStage } from '../lib/types'

/* --------------------------------------------------------------------------
   Garden art. These are hand-tuned bezier silhouettes, not iconography: soft
   leaf bellies, uneven leaf angles and a slight stem lean keep the plants from
   reading as clip art. Every colour comes from a semantic token so the garden
   stays in palette when the theme flips.
   -------------------------------------------------------------------------- */

const GROUND = 108
const FOLIAGE = 'var(--ms-grow-text)'
const STEM = 'var(--ms-grow)'
const BLOOM = 'var(--ms-spark)'
const SOIL = 'var(--ms-ink-3)'

interface Point {
  x: number
  y: number
}

function quadPoint(t: number, p0: Point, p1: Point, p2: Point): Point {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  }
}

/** Leaf outline in local space: base at the origin, tip at (0, -len). */
function leafOutline(len: number, width: number): string {
  const w = Math.max(2, width)
  return [
    'M0 0',
    `C${w} ${-len * 0.26} ${w * 0.82} ${-len * 0.72} 0 ${-len}`,
    `C${-w * 0.82} ${-len * 0.72} ${-w} ${-len * 0.26} 0 0`,
    'Z',
  ].join(' ')
}

function LeafMark({
  x,
  y,
  angle,
  len,
  width,
  opacity = 0.92,
}: {
  x: number
  y: number
  angle: number
  len: number
  width: number
  opacity?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d={leafOutline(len, width)}
        fill={FOLIAGE}
        fillOpacity={opacity}
        stroke={STEM}
        strokeOpacity={0.22}
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
      <path
        d={`M0 ${-len * 0.06} L0 ${-len * 0.84}`}
        stroke={STEM}
        strokeOpacity={0.4}
        strokeWidth={0.9}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  )
}

function Bloom({
  cx,
  cy,
  radius,
  petals,
}: {
  cx: number
  cy: number
  radius: number
  petals: number
}) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {Array.from({ length: petals }, (_, index) => (
        <ellipse
          key={index}
          cx={0}
          cy={-radius * 0.62}
          rx={radius * 0.34}
          ry={radius * 0.62}
          fill={BLOOM}
          fillOpacity={index % 2 === 0 ? 0.92 : 0.72}
          transform={`rotate(${(360 / petals) * index})`}
        />
      ))}
      <circle cx={0} cy={0} r={radius * 0.3} fill={BLOOM} />
      <circle cx={0} cy={0} r={radius * 0.14} fill={STEM} fillOpacity={0.85} />
    </g>
  )
}

/** Species 0 — a leafy sprig that fills out as it grows. */
function LeafySprig({ stage }: { stage: PlantStage }) {
  const height = [38, 54, 71, 88][stage]
  const lean = [5, 7, 9, 11][stage]
  const p0 = { x: 50, y: GROUND }
  const p1 = { x: 50 + lean, y: GROUND - height * 0.52 }
  const p2 = { x: 50 + lean * 0.35, y: GROUND - height }
  const count = 2 + stage * 2

  return (
    <g>
      <path
        d={`M${p0.x} ${p0.y} Q${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
        stroke={STEM}
        strokeWidth={2.2 + stage * 0.35}
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({ length: count }, (_, index) => {
        const t = 0.18 + (index / Math.max(1, count - 1)) * 0.72
        const at = quadPoint(t, p0, p1, p2)
        const side = index % 2 === 0 ? 1 : -1
        const len = 12.5 + stage * 2.6 + (index % 3) * 0.9
        return (
          <LeafMark
            key={index}
            x={at.x}
            y={at.y}
            angle={side * (44 + (index % 3) * 9)}
            len={len}
            width={len * 0.36}
            opacity={index % 2 === 0 ? 0.95 : 0.8}
          />
        )
      })}
      <LeafMark x={p2.x} y={p2.y + 1} angle={10} len={12 + stage} width={4.4} />
      {stage >= 3 && (
        <LeafMark x={p2.x - 1} y={p2.y + 1} angle={-26} len={9.5} width={3.6} opacity={0.85} />
      )}
    </g>
  )
}

/** Species 1 — a tall stalk with opposite leaf pairs. */
function PairedStalk({ stage }: { stage: PlantStage }) {
  const height = [30, 49, 69, 90][stage]
  const pairs = 1 + stage
  const top = { x: 50.5, y: GROUND - height }

  return (
    <g>
      <path
        d={`M50 ${GROUND} Q49.2 ${GROUND - height * 0.5} ${top.x} ${top.y}`}
        stroke={STEM}
        strokeWidth={2.4 + stage * 0.3}
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({ length: pairs }, (_, index) => {
        const f = pairs === 1 ? 0.56 : 0.24 + (index / (pairs - 1)) * 0.58
        const y = GROUND - height * f
        const len = 16 + stage * 2.2 - index * 1.5
        return (
          <g key={index}>
            <LeafMark
              x={50}
              y={y}
              angle={64}
              len={len}
              width={len * 0.34}
              opacity={index % 2 === 0 ? 0.94 : 0.84}
            />
            <LeafMark
              x={50}
              y={y}
              angle={-60}
              len={len * 0.94}
              width={len * 0.32}
              opacity={index % 2 === 0 ? 0.94 : 0.84}
            />
          </g>
        )
      })}
      <LeafMark x={top.x} y={top.y + 2} angle={26} len={10 + stage} width={3.7} />
      <LeafMark x={top.x} y={top.y + 2} angle={-26} len={10 + stage} width={3.7} opacity={0.86} />
    </g>
  )
}

/** Species 2 — a small, round-leaved sprout. */
function Sprout({ stage }: { stage: PlantStage }) {
  const height = [17, 28, 39, 50][stage]
  const top = { x: 51, y: GROUND - height }
  const pairs = Math.max(0, stage - 1)

  return (
    <g>
      <path
        d={`M50 ${GROUND} Q${48.6} ${GROUND - height * 0.55} ${top.x} ${top.y}`}
        stroke={STEM}
        strokeWidth={2.3}
        strokeLinecap="round"
        fill="none"
      />
      <LeafMark x={top.x} y={top.y + 1} angle={74} len={11 + stage * 0.8} width={7.6} />
      <LeafMark
        x={top.x}
        y={top.y + 1}
        angle={-74}
        len={11 + stage * 0.8}
        width={7.6}
        opacity={0.86}
      />
      {Array.from({ length: pairs }, (_, index) => {
        const y = GROUND - height * (0.44 - index * 0.18)
        const len = 8.5 - index * 1.2
        return (
          <g key={index}>
            <LeafMark x={50.4} y={y} angle={56} len={len} width={len * 0.6} opacity={0.9} />
            <LeafMark x={50.4} y={y} angle={-56} len={len} width={len * 0.6} opacity={0.8} />
          </g>
        )
      })}
      {stage === 3 && <circle cx={top.x} cy={top.y - 4} r={2.4} fill={BLOOM} fillOpacity={0.85} />}
    </g>
  )
}

function Frond({
  height,
  lean,
  originX,
  count,
  thickness,
}: {
  height: number
  lean: number
  originX: number
  count: number
  thickness: number
}) {
  const p0 = { x: originX, y: GROUND }
  const p1 = { x: originX + lean * 0.3, y: GROUND - height * 0.55 }
  const p2 = { x: originX + lean, y: GROUND - height }

  return (
    <g>
      <path
        d={`M${p0.x} ${p0.y} Q${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
        stroke={STEM}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({ length: count }, (_, index) => {
        const t = 0.16 + (index / count) * 0.78
        const at = quadPoint(t, p0, p1, p2)
        const side = index % 2 === 0 ? 1 : -1
        const len = 6.5 + Math.sin(Math.PI * t) * 5.2
        return (
          <LeafMark
            key={index}
            x={at.x}
            y={at.y}
            angle={side * (62 + Math.sin(Math.PI * t) * 14)}
            len={len}
            width={len * 0.3}
            opacity={index % 2 === 0 ? 0.9 : 0.76}
          />
        )
      })}
    </g>
  )
}

/** Species 3 — a fern: a long frond with a shorter one tucked behind it. */
function FernFrond({ stage }: { stage: PlantStage }) {
  const height = [40, 58, 76, 93][stage]
  const lean = [9, 13, 17, 21][stage]

  return (
    <g>
      {stage >= 2 && (
        <Frond
          height={height * 0.66}
          lean={-9 - stage}
          originX={53}
          count={4 + stage}
          thickness={1.5}
        />
      )}
      <Frond height={height} lean={lean} originX={47} count={4 + stage * 2} thickness={1.8 + stage * 0.15} />
    </g>
  )
}

/** Species 4 — a flowering stem: bud first, then a full bloom. */
function FloweringStem({ stage }: { stage: PlantStage }) {
  const height = [36, 52, 68, 85][stage]
  const top = { x: 50, y: GROUND - height }
  const pairs = stage === 0 ? 0 : stage === 1 ? 1 : 2
  const radius = [0, 0, 8.5, 10.5][stage]

  return (
    <g>
      <path
        d={`M50 ${GROUND} Q${46.5} ${GROUND - height * 0.55} ${top.x} ${top.y}`}
        stroke={STEM}
        strokeWidth={2.5 + stage * 0.3}
        strokeLinecap="round"
        fill="none"
      />
      {Array.from({ length: pairs }, (_, index) => {
        const y = GROUND - height * (0.32 + index * 0.22)
        const len = 13.5 - index * 2
        return (
          <g key={index}>
            <LeafMark x={49} y={y} angle={54} len={len} width={len * 0.34} opacity={0.92} />
            <LeafMark x={49} y={y} angle={-50} len={len * 0.9} width={len * 0.31} opacity={0.8} />
          </g>
        )
      })}

      {stage <= 1 && (
        <g>
          <LeafMark x={top.x} y={top.y + 3} angle={30} len={7.5} width={2.5} />
          <LeafMark x={top.x} y={top.y + 3} angle={-30} len={7.5} width={2.5} opacity={0.85} />
        </g>
      )}
      {stage === 1 && (
        <ellipse
          cx={top.x}
          cy={top.y - 1}
          rx={3.6}
          ry={6}
          fill={BLOOM}
          fillOpacity={0.9}
          transform={`rotate(8 ${top.x} ${top.y - 1})`}
        />
      )}
      {stage >= 2 && <Bloom cx={top.x} cy={top.y + 2} radius={radius} petals={stage === 3 ? 6 : 5} />}
      {stage === 3 && (
        <Bloom cx={top.x + 11} cy={top.y + 14} radius={4.6} petals={5} />
      )}
    </g>
  )
}

export function PlantArt({
  species,
  stage,
  className,
}: {
  species: number
  stage: PlantStage
  className?: string
}) {
  const variant = ((species % 5) + 5) % 5

  return (
    <svg
      viewBox="0 0 100 120"
      className={clsx('h-full w-full', className)}
      aria-hidden="true"
    >
      <ellipse cx={50} cy={GROUND + 3.5} rx={23} ry={3.6} fill={SOIL} fillOpacity={0.13} />
      <path
        d={`M26 ${GROUND + 1} Q39 ${GROUND - 2.5} 52 ${GROUND + 1} T74 ${GROUND + 1}`}
        stroke={SOIL}
        strokeOpacity={0.45}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      {variant === 0 && <LeafySprig stage={stage} />}
      {variant === 1 && <PairedStalk stage={stage} />}
      {variant === 2 && <Sprout stage={stage} />}
      {variant === 3 && <FernFrond stage={stage} />}
      {variant === 4 && <FloweringStem stage={stage} />}
    </svg>
  )
}
