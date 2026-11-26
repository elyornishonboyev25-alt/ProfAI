import { useEffect, useRef, useState } from 'react'
const interactive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('input,textarea,select,button,a[href],summary,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="slider"],[role="textbox"]'))
export function usePushToTalk(enabled: boolean, begin: () => void, end: (cancel?: boolean) => void) {
  const callbacks = useRef({ begin, end }); callbacks.current = { begin, end }
  const down = useRef(false), [held, setHeld] = useState(false)
  const press = () => { if (!enabled || down.current) return; down.current = true; setHeld(true); window.dispatchEvent(new Event('nova:interrupt')); callbacks.current.begin() }
  const release = (cancel = false) => { if (!down.current) return; down.current = false; setHeld(false); callbacks.current.end(cancel) }
  useEffect(() => {
    if (!enabled) { release(true); return }
    const keyDown = (event: KeyboardEvent) => { if (event.code === 'Space' && event.repeat && down.current) { event.preventDefault(); return } if (event.defaultPrevented || event.isComposing || event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || interactive(event.target)) return; event.preventDefault(); press() }
    const keyUp = (event: KeyboardEvent) => { if (event.code === 'Space' && down.current) { event.preventDefault(); release() } }
    const blur = () => release(true)
    const visibility = () => { if (document.hidden) release(true) }
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility)
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); release(true) }
  }, [enabled])
  return { held, press, release }
}
