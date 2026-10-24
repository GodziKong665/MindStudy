// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mountContactForm } from '../../forms/contact-form'

const STORAGE_KEY = 'mindstudy:mensajes:v1'

function setup(): HTMLFormElement {
  document.body.innerHTML = '<div id="contacto-form"></div>'
  localStorage.clear()
  mountContactForm()
  const form = document.querySelector('form')
  if (!form) throw new Error('el formulario no se montó')
  return form
}

function enviar(form: HTMLFormElement): void {
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
}

function campo<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id) as T | null
  if (!el) throw new Error(`falta el campo ${id}`)
  return el
}

describe('formulario de contacto (JS nativo)', () => {
  it('monta la variedad de entradas que pide la consigna', () => {
    setup()
    expect(document.querySelectorAll('input')).toHaveLength(4)
    expect(document.querySelectorAll('select')).toHaveLength(1)
    expect(document.querySelectorAll('textarea')).toHaveLength(1)
  })

  it('intercepta el envío cuando está vacío y marca cada campo', () => {
    const form = setup()
    const evento = new Event('submit', { cancelable: true, bubbles: true })
    form.dispatchEvent(evento)

    // preventDefault se ejecutó: el evento quedó cancelado.
    expect(evento.defaultPrevented).toBe(true)

    const errores = Array.from(document.querySelectorAll('.field-error.is-visible'))
    expect(errores.length).toBeGreaterThan(0)

    const nombre = campo<HTMLInputElement>('cf-nombre')
    expect(nombre.classList.contains('has-error')).toBe(true)
    expect(nombre.getAttribute('aria-invalid')).toBe('true')
  })

  it('rechaza un correo con formato inválido', () => {
    const form = setup()
    campo<HTMLInputElement>('cf-nombre').value = 'Ana'
    campo<HTMLInputElement>('cf-email').value = 'ana-arroba-nada'
    campo<HTMLSelectElement>('cf-motivo').value = 'sugerencia'
    campo<HTMLTextAreaElement>('cf-mensaje').value =
      'Me gustaria poder exportar mis tareas a un archivo.'
    campo<HTMLInputElement>('cf-acepto').checked = true

    enviar(form)

    expect(document.querySelector('[data-error="email"]')?.textContent).toMatch(/válido/i)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('guarda el mensaje cuando todos los campos son válidos', () => {
    const form = setup()
    campo<HTMLInputElement>('cf-nombre').value = 'Ana'
    campo<HTMLInputElement>('cf-email').value = 'ana@ejemplo.com'
    campo<HTMLSelectElement>('cf-motivo').value = 'sugerencia'
    campo<HTMLTextAreaElement>('cf-mensaje').value =
      'Me gustaria poder exportar mis tareas a un archivo.'

    const contador = document.querySelector('[data-counter]')
    expect(contador?.textContent).toBe('0')
    campo<HTMLTextAreaElement>('cf-mensaje').dispatchEvent(new Event('input'))
    expect(Number(contador?.textContent)).toBeGreaterThan(20)

    campo<HTMLInputElement>('cf-acepto').checked = true
    enviar(form)

    const guardado = localStorage.getItem(STORAGE_KEY)
    expect(guardado).not.toBeNull()
    const lista = JSON.parse(guardado ?? '[]') as { nombre: string; motivo: string }[]
    expect(lista).toHaveLength(1)
    expect(lista[0].nombre).toBe('Ana')
    expect(lista[0].motivo).toBe('sugerencia')
  })

  it('limpia los errores al resetear', async () => {
    const form = setup()
    enviar(form)
    expect(document.querySelectorAll('.field-error.is-visible').length).toBeGreaterThan(0)

    form.dispatchEvent(new Event('reset'))
    await new Promise((resolve) => setTimeout(resolve, 5))

    expect(document.querySelectorAll('.field-error.is-visible')).toHaveLength(0)
  })
})
