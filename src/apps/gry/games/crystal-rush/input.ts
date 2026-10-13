import { clamp } from './config'
import { arenaViewport, DESKTOP_ARENA, type Arena } from './arena'
import { emptyInput } from './model'
import type { Mode } from './model'

export function worldPoint(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  arena: Arena = DESKTOP_ARENA,
) {
  const view = arenaViewport(rect.width, rect.height, arena)
  return {
    x: clamp((clientX - rect.left - view.x) / view.scale, 0, arena.width),
    y: clamp((clientY - rect.top - view.y) / view.scale, 0, arena.height),
  }
}

/** Each mounted game owns one input binding. Never intercept typing or button activation. */
export function bindInput(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  mode: () => Mode,
  pause: () => void,
  arena: () => Arena = () => DESKTOP_ARENA,
) {
  const input = emptyInput(),
    keys = new Set<string>()
  let pointerId: number | null = null
  const movementKeys = [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ]
  function updateKeys() {
    input.x =
      +(keys.has('KeyD') || keys.has('ArrowRight')) - +(keys.has('KeyA') || keys.has('ArrowLeft'))
    input.y =
      +(keys.has('KeyS') || keys.has('ArrowDown')) - +(keys.has('KeyW') || keys.has('ArrowUp'))
  }
  function clear() {
    keys.clear()
    input.x = 0
    input.y = 0
    input.pointer = null
    input.dash = false
    const oldId = pointerId
    pointerId = null
    if (oldId !== null && canvas.hasPointerCapture(oldId)) canvas.releasePointerCapture(oldId)
  }
  function keyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement
    if (
      !root.contains(document.activeElement) ||
      target.closest('input,select,textarea,[contenteditable="true"]')
    )
      return
    if (
      (event.code === 'KeyP' || event.code === 'Escape') &&
      !event.repeat &&
      (mode() === 'playing' || mode() === 'paused')
    ) {
      event.preventDefault()
      pause()
      return
    }
    if (target.closest('button,a')) return
    if (mode() !== 'playing') return
    if (movementKeys.includes(event.code)) {
      event.preventDefault()
      keys.add(event.code)
      updateKeys()
    }
    if (event.code === 'Space') {
      event.preventDefault()
      if (!event.repeat) input.dash = true
    }
  }
  function keyUp(event: KeyboardEvent) {
    keys.delete(event.code)
    updateKeys()
  }
  function point(event: PointerEvent) {
    input.pointer = worldPoint(
      event.clientX,
      event.clientY,
      canvas.getBoundingClientRect(),
      arena(),
    )
  }
  function pointerDown(event: PointerEvent) {
    if (mode() !== 'playing' || pointerId !== null || event.button !== 0) return
    event.preventDefault()
    pointerId = event.pointerId
    canvas.focus({ preventScroll: true })
    canvas.setPointerCapture(pointerId)
    point(event)
  }
  function pointerMove(event: PointerEvent) {
    if (event.pointerId === pointerId) point(event)
  }
  function pointerEnd(event: PointerEvent) {
    if (event.pointerId !== pointerId) return
    pointerId = null
    input.pointer = null
  }
  window.addEventListener('keydown', keyDown)
  window.addEventListener('keyup', keyUp)
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerEnd)
  canvas.addEventListener('pointercancel', pointerEnd)
  canvas.addEventListener('lostpointercapture', pointerEnd)
  return {
    input,
    clear,
    destroy() {
      clear()
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerEnd)
      canvas.removeEventListener('pointercancel', pointerEnd)
      canvas.removeEventListener('lostpointercapture', pointerEnd)
    },
  }
}
