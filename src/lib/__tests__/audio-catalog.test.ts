import { describe, expect, it } from 'vitest'
import { QUICK_IDS, SOUNDSCAPES, byFamily, soundscapeById } from '../../audio/ambient'

describe('catálogo de sonidos', () => {
  it('no repite identificadores', () => {
    const ids = SOUNDSCAPES.map((sound) => sound.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no tiene entradas vacías ni sin familia', () => {
    for (const sound of SOUNDSCAPES) {
      expect(sound.name.trim().length, `id "${sound.id}" sin nombre`).toBeGreaterThan(0)
      expect(sound.hint.trim().length, `id "${sound.id}" sin descripción`).toBeGreaterThan(0)
      expect(['ambiente', 'generativa']).toContain(sound.family)
    }
  })

  it('todos los accesos rápidos apuntan a un paisaje real', () => {
    for (const id of QUICK_IDS) {
      expect(
        SOUNDSCAPES.some((sound) => sound.id === id),
        `QUICK_IDS referencia "${id}", que no existe`,
      ).toBe(true)
    }
  })

  it('las dos familias suman el catálogo completo, sin solaparse', () => {
    const ambient = byFamily('ambiente')
    const generative = byFamily('generativa')
    expect(ambient.length + generative.length).toBe(SOUNDSCAPES.length)
    expect(ambient.some((sound) => sound.family === 'generativa')).toBe(false)
  })

  it('cae al primer paisaje cuando el id no existe', () => {
    expect(soundscapeById('no-existe')).toBe(SOUNDSCAPES[0])
  })

  it('incluye Cueva como generativa', () => {
    const cueva = SOUNDSCAPES.find((sound) => sound.id === 'cueva')
    expect(cueva).toBeDefined()
    expect(cueva?.family).toBe('generativa')
  })
})
