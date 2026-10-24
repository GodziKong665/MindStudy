/**
 * Motor de audio — todo sintetizado en runtime con Web Audio API.
 * Cero archivos: no hay red que descargar, no hay loops con costura y no hay
 * licencias que negociar.
 *
 * Dos familias:
 *  · ambiente   → ruido filtrado (lluvia, fuego, viento, agua…)
 *  · generativa → notas sintetizadas al azar sobre una escala. No se repiten
 *                 nunca: cada sesión suena distinta, de ahí la "infinidad".
 */

export type SoundFamily = 'ambiente' | 'generativa'

export interface Soundscape {
  id: string
  name: string
  hint: string
  family: SoundFamily
}

export const SOUNDSCAPES: Soundscape[] = [
  // ------------------------------- Ambiente -------------------------------
  { id: 'rain', name: 'Lluvia', hint: 'Filtrada, constante', family: 'ambiente' },
  { id: 'storm', name: 'Lluvia fuerte', hint: 'Sobre el techo', family: 'ambiente' },
  { id: 'brown', name: 'Ruido marrón', hint: 'Graves, sin estímulo', family: 'ambiente' },
  { id: 'pink', name: 'Ruido rosa', hint: 'Equilibrado, suave', family: 'ambiente' },
  { id: 'ocean', name: 'Olas', hint: 'Mareas lentas', family: 'ambiente' },
  { id: 'wind', name: 'Viento', hint: 'Ráfagas abiertas', family: 'ambiente' },
  { id: 'fire', name: 'Chimenea', hint: 'Crepitar leñoso', family: 'ambiente' },
  { id: 'crickets', name: 'Grillos', hint: 'Noche de campo', family: 'ambiente' },
  { id: 'cafe', name: 'Café', hint: 'Murmullo de fondo', family: 'ambiente' },
  { id: 'fan', name: 'Ventilador', hint: 'Zumbido bajo', family: 'ambiente' },
  { id: 'waterfall', name: 'Cascada', hint: 'Agua cayendo', family: 'ambiente' },
  { id: 'night', name: 'Noche', hint: 'Silencio habitado', family: 'ambiente' },
  // ------------------------------ Generativa ------------------------------
  { id: 'piano', name: 'Piano nocturno', hint: 'Notas al azar, sin repetir', family: 'generativa' },
  { id: 'bowls', name: 'Cuencos', hint: 'Resonancias largas', family: 'generativa' },
  { id: 'drift', name: 'Deriva', hint: 'Armonía que se mueve', family: 'generativa' },
  { id: 'cueva', name: 'Cueva', hint: 'Piano lejano, eco largo', family: 'generativa' },
]

/** Los cuatro que aparecen en el panel compacto de Enfoque. */
export const QUICK_IDS = ['rain', 'brown', 'ocean', 'cafe']

export function soundscapeById(id: string): Soundscape {
  return SOUNDSCAPES.find((s) => s.id === id) ?? SOUNDSCAPES[0]
}

export const byFamily = (family: SoundFamily): Soundscape[] =>
  SOUNDSCAPES.filter((s) => s.family === family)

/* ------------------------------------------------------------------------ */
/*  Buffers de ruido                                                         */
/* ------------------------------------------------------------------------ */

const SECONDS = 6

function makeBuffer(ctx: AudioContext): Float32Array<ArrayBuffer> {
  const length = Math.floor(ctx.sampleRate * SECONDS)
  return new Float32Array(length)
}

function toBuffer(ctx: AudioContext, data: Float32Array<ArrayBuffer>): AudioBuffer {
  const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate)
  buffer.copyToChannel(data, 0)
  return buffer
}

function whiteData(ctx: AudioContext): Float32Array<ArrayBuffer> {
  const data = makeBuffer(ctx)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return data
}

/** Ruido marrón: ruido blanco integrado con fuga, para que no derive. */
function brownData(ctx: AudioContext): Float32Array<ArrayBuffer> {
  const data = makeBuffer(ctx)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  return data
}

/** Ruido rosa por aproximación de Paul Kellet: más energía en medios graves. */
function pinkData(ctx: AudioContext): Float32Array<ArrayBuffer> {
  const data = makeBuffer(ctx)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
  return data
}

/** Chasquidos dispersos para la chimenea, con decaimiento exponencial. */
function crackleData(ctx: AudioContext): Float32Array<ArrayBuffer> {
  const data = makeBuffer(ctx)
  let amplitude = 0
  for (let i = 0; i < data.length; i++) {
    if (Math.random() < 0.0012) amplitude = Math.random() * 0.8 + 0.2
    data[i] = amplitude * (Math.random() * 2 - 1)
    amplitude *= 0.985
  }
  return data
}

/* ------------------------------------------------------------------------ */
/*  Definición de las generativas                                            */
/* ------------------------------------------------------------------------ */

interface GenerativeSpec {
  base: number
  scale: number[]
  dur: number
  level: number
  gapMin: number
  gapMax: number
  drone: number
  /** Ataque en segundos: corto = campana, largo = colchón. */
  attack: number
  /** Nivel relativo de cada armónico (índice 0 = fundamental). Define el timbre. */
  partials: number[]
}

const GENERATIVE: Record<string, GenerativeSpec> = {
  piano: {
    base: 220,
    scale: [0, 2, 4, 7, 9, 12, 14, 16],
    dur: 3.4,
    level: 0.16,
    gapMin: 1.6,
    gapMax: 4.2,
    drone: 0.022,
    attack: 0.06,
    partials: [1, 0.12, 0.04],
  },
  bowls: {
    base: 146.83,
    scale: [0, 5, 7, 12, 17],
    dur: 7.5,
    level: 0.13,
    gapMin: 4.5,
    gapMax: 9,
    drone: 0.045,
    attack: 0.02,
    partials: [1, 0.3, 0.12, 0.05],
  },
  drift: {
    base: 174.61,
    scale: [0, 3, 5, 7, 10, 12],
    dur: 5.5,
    level: 0.12,
    gapMin: 2.8,
    gapMax: 6.5,
    drone: 0.05,
    attack: 0.35,
    partials: [1, 0.06],
  },
  /**
   * Cueva: el clima de una banda sonora de exploración. Fundamental grave,
   * ataque suave, tercer armónico apenas presente y silencios larguísimos.
   * Es música original: no cita ninguna melodía existente.
   */
  cueva: {
    base: 110,
    scale: [0, 3, 5, 7, 10, 12, 15],
    dur: 8,
    level: 0.1,
    gapMin: 3.5,
    gapMax: 8.5,
    drone: 0.055,
    attack: 0.14,
    partials: [1, 0.16, 0.05],
  },
}

/* ------------------------------------------------------------------------ */
/*  Motor                                                                    */
/* ------------------------------------------------------------------------ */

export class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private aux: DelayNode | null = null
  private sources: AudioBufferSourceNode[] = []
  private nodes: AudioNode[] = []
  private timers: number[] = []
  private volume = 0.5
  private active: string | null = null

  get preset(): string | null {
    return this.active
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)

      // Espacio: delay con realimentación para las generativas.
      const delay = this.ctx.createDelay(1.2)
      delay.delayTime.value = 0.42
      const feedback = this.ctx.createGain()
      feedback.gain.value = 0.34
      const wet = this.ctx.createGain()
      wet.gain.value = 0.5
      delay.connect(feedback).connect(delay)
      delay.connect(wet).connect(this.master)
      this.aux = delay
    }
    void this.ctx.resume()
    return this.ctx
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value))
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume * 0.6, this.ctx.currentTime, 0.08)
    }
  }

  /** Cortar todo lo agendado: timers, fuentes y nodos. Sin fugas. */
  private teardown(): void {
    for (const id of this.timers) window.clearTimeout(id)
    this.timers = []

    for (const source of this.sources) {
      try {
        source.stop()
        source.disconnect()
      } catch {
        /* ya estaba detenida */
      }
    }
    this.sources = []

    for (const node of this.nodes) {
      try {
        node.disconnect()
      } catch {
        /* ya estaba desconectado */
      }
    }
    this.nodes = []
  }

  stop(): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const master = this.master
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.12)
    const pending = this.sources
    const nodes = this.nodes
    window.setTimeout(() => {
      for (const source of pending) {
        try {
          source.stop()
          source.disconnect()
        } catch {
          /* ya estaba detenida */
        }
      }
      for (const node of nodes) {
        try {
          node.disconnect()
        } catch {
          /* ya estaba desconectado */
        }
      }
    }, 460)
    for (const id of this.timers) window.clearTimeout(id)
    this.timers = []
    this.sources = []
    this.nodes = []
    this.active = null
  }

  toggle(id: string): void {
    if (this.active === id) this.stop()
    else this.play(id)
  }

  play(id: string): void {
    const ctx = this.ensureContext()
    this.teardown()
    if (!this.master) return
    this.active = id

    if (GENERATIVE[id]) {
      this.startGenerative(id, ctx)
    } else {
      this.startAmbient(id, ctx)
    }

    this.master.gain.setTargetAtTime(this.volume * 0.6, ctx.currentTime, 0.3)
  }

  /* ----------------------------- Ambiente ------------------------------ */

  private noiseSource(ctx: AudioContext, data: Float32Array<ArrayBuffer>): AudioBufferSourceNode {
    const source = ctx.createBufferSource()
    source.buffer = toBuffer(ctx, data)
    source.loop = true
    return source
  }

  private filter(
    ctx: AudioContext,
    type: BiquadFilterType,
    frequency: number,
    q = 0.7,
  ): BiquadFilterNode {
    const node = ctx.createBiquadFilter()
    node.type = type
    node.frequency.value = frequency
    node.Q.value = q
    return node
  }

  private lfo(ctx: AudioContext, rate: number, depth: number, target: AudioParam): OscillatorNode {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = rate
    const gain = ctx.createGain()
    gain.gain.value = depth
    osc.connect(gain).connect(target)
    osc.start()
    return osc
  }

  private startAmbient(id: string, ctx: AudioContext): void {
    const master = this.master!
    const chain: AudioNode[] = []
    const source = this.noiseSource(
      ctx,
      id === 'brown' || id === 'ocean' || id === 'fire' || id === 'night'
        ? brownData(ctx)
        : id === 'pink'
          ? pinkData(ctx)
          : id === 'crickets'
            ? whiteData(ctx)
            : whiteData(ctx),
    )

    switch (id) {
      case 'rain':
        chain.push(this.filter(ctx, 'highpass', 420), this.filter(ctx, 'lowpass', 7200))
        break

      case 'storm':
        chain.push(this.filter(ctx, 'lowpass', 3400), this.filter(ctx, 'highpass', 120))
        break

      case 'brown':
        chain.push(this.filter(ctx, 'lowpass', 620))
        break

      case 'pink':
        chain.push(this.filter(ctx, 'lowpass', 2400))
        break

      case 'ocean': {
        const lp = this.filter(ctx, 'lowpass', 520)
        this.nodes.push(this.lfo(ctx, 0.075, 340, lp.frequency))
        chain.push(lp)
        break
      }

      case 'wind': {
        const bp = this.filter(ctx, 'bandpass', 520, 0.6)
        this.nodes.push(this.lfo(ctx, 0.05, 240, bp.frequency))
        chain.push(bp, this.filter(ctx, 'lowpass', 1800))
        break
      }

      case 'fire': {
        // Lecho grave + chasquidos filtrados, en paralelo.
        const bed = this.filter(ctx, 'lowpass', 500)
        const crackle = this.noiseSource(ctx, crackleData(ctx))
        const crackleFilter = this.filter(ctx, 'bandpass', 1600, 1.4)
        const crackleGain = ctx.createGain()
        crackleGain.gain.value = 0.5
        crackle.connect(crackleFilter).connect(crackleGain).connect(master)
        crackle.start()
        this.sources.push(crackle)
        this.nodes.push(crackleFilter, crackleGain)
        chain.push(bed)
        break
      }

      case 'crickets': {
        const bp = this.filter(ctx, 'bandpass', 4200, 9)
        const gate = ctx.createGain()
        gate.gain.value = 0.28
        this.nodes.push(this.lfo(ctx, 6.5, 0.22, gate.gain))
        chain.push(bp, gate)
        const bed = this.filter(ctx, 'lowpass', 900)
        const bedGain = ctx.createGain()
        bedGain.gain.value = 0.18
        chain.push(bed, bedGain)
        break
      }

      case 'cafe': {
        const bp = this.filter(ctx, 'bandpass', 780, 0.9)
        const tremolo = ctx.createGain()
        tremolo.gain.value = 0.85
        this.nodes.push(this.lfo(ctx, 2.7, 0.12, tremolo.gain))
        chain.push(bp, tremolo)
        break
      }

      case 'fan': {
        chain.push(this.filter(ctx, 'lowpass', 420))
        const hum = ctx.createOscillator()
        hum.type = 'sine'
        hum.frequency.value = 92
        const humGain = ctx.createGain()
        humGain.gain.value = 0.012
        hum.connect(humGain).connect(master)
        hum.start()
        this.nodes.push(hum, humGain)
        break
      }

      case 'waterfall':
        chain.push(this.filter(ctx, 'lowpass', 2800), this.filter(ctx, 'highpass', 180))
        break

      case 'night':
        chain.push(this.filter(ctx, 'lowpass', 850))
        break

      default:
        chain.push(this.filter(ctx, 'lowpass', 4000))
    }

    let previous: AudioNode = source
    for (const node of chain) {
      previous.connect(node)
      previous = node
    }
    previous.connect(master)

    source.start()
    this.sources.push(source)
    this.nodes.push(...chain)
  }

  /* ---------------------------- Generativa ----------------------------- */

  /**
   * Una nota = una envolvente compartida por varios osciladores armónicos.
   * El timbre lo define `partials`: un seno puro suena a timbre de prueba,
   * tres armónicos suenan a instrumento.
   */
  private note(
    ctx: AudioContext,
    frequency: number,
    when: number,
    duration: number,
    level: number,
    attack: number,
    partials: number[],
  ): void {
    const envelope = ctx.createGain()
    envelope.gain.setValueAtTime(0.0001, when)
    envelope.gain.linearRampToValueAtTime(level, when + attack)
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration)
    envelope.connect(this.master!)
    if (this.aux) envelope.connect(this.aux)

    partials.forEach((amount, index) => {
      if (amount <= 0) return
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = frequency * (index + 1)
      const mix = ctx.createGain()
      mix.gain.value = amount
      osc.connect(mix).connect(envelope)
      osc.start(when)
      osc.stop(when + duration + 0.1)
    })
  }

  private startGenerative(id: string, ctx: AudioContext): void {
    const spec = GENERATIVE[id]
    const master = this.master!

    // Colchón armónico: dos senos desafinados que respiran.
    const droneGain = ctx.createGain()
    droneGain.gain.value = spec.drone
    droneGain.connect(master)

    const droneA = ctx.createOscillator()
    droneA.type = 'sine'
    droneA.frequency.value = spec.base / 2

    const droneB = ctx.createOscillator()
    droneB.type = 'sine'
    droneB.frequency.value = (spec.base / 2) * 1.006

    droneA.connect(droneGain)
    droneB.connect(droneGain)
    droneA.start()
    droneB.start()
    this.nodes.push(droneA, droneB, droneGain)

    const tick = (): void => {
      if (this.active !== id || !this.ctx) return
      const now = ctx.currentTime
      const semitone = spec.scale[Math.floor(Math.random() * spec.scale.length)]
      const octave = Math.random() < 0.28 ? 2 : 1
      const frequency = spec.base * Math.pow(2, semitone / 12) * octave
      const duration = spec.dur * (0.75 + Math.random() * 0.5)
      this.note(
        ctx,
        frequency,
        now + 0.02,
        duration,
        spec.level * (0.7 + Math.random() * 0.3),
        spec.attack,
        spec.partials,
      )

      const gap = spec.gapMin + Math.random() * (spec.gapMax - spec.gapMin)
      this.timers.push(window.setTimeout(tick, gap * 1000))
    }

    tick()
  }

  /* ------------------------------ Campana ------------------------------ */

  /** Dos tonos suaves: cierra un bloque sin sobresaltar. */
  chime(): void {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    ;[659.25, 987.77].forEach((frequency, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency
      const start = now + index * 0.16
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 1.6)
    })
  }
}

export const ambientEngine = new AmbientEngine()
