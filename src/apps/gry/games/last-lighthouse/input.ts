import type { Input, Mode } from './model'
export function bindInput(canvas: HTMLCanvasElement, mode: () => Mode, pause: () => void) {
  const input: Input = { x: 0, y: 0, pointer: null },
    keys = new Set<string>()
  let pointer: number | null = null
  const update = () => {
    input.x =
      Number(keys.has('d') || keys.has('arrowright')) -
      Number(keys.has('a') || keys.has('arrowleft'))
    input.y =
      Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'))
  }
  const clear = () => {
    keys.clear()
    input.x = 0
    input.y = 0
    input.pointer = null
    if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer)
    pointer = null
  }
  function keydown(e: KeyboardEvent) {
    if ((e.target as Element)?.closest('button,a,input,select,textarea,dialog')) return
    const k = e.key.toLowerCase()
    if (k === 'p' || k === 'escape') {
      if (mode() === 'playing') {
        e.preventDefault()
        pause()
      }
      return
    }
    if (
      mode() !== 'playing' ||
      !['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)
    )
      return
    e.preventDefault()
    keys.add(k)
    update()
  }
  function keyup(e: KeyboardEvent) {
    keys.delete(e.key.toLowerCase())
    update()
  }
  function point(e: PointerEvent) {
    const r = canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  function down(e: PointerEvent) {
    if (mode() !== 'playing' || pointer !== null || e.button !== 0) return
    e.preventDefault()
    pointer = e.pointerId
    const p = point(e)
    input.pointer = { origin: p, current: p }
    canvas.setPointerCapture(pointer)
    canvas.focus({ preventScroll: true })
  }
  function move(e: PointerEvent) {
    if (e.pointerId === pointer && input.pointer) input.pointer.current = point(e)
  }
  function up(e: PointerEvent) {
    if (e.pointerId === pointer) clear()
  }
  window.addEventListener('keydown', keydown)
  window.addEventListener('keyup', keyup)
  canvas.addEventListener('pointerdown', down)
  canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up)
  canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('lostpointercapture', up)
  return {
    input,
    clear,
    dispose() {
      clear()
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('lostpointercapture', up)
    },
  }
}
