import { useEffect, useRef, useState } from 'react'

/** Nachzeichnen mit Finger oder Stift. Handschrift verbessert das Wiedererkennen neuer Zeichen. */
export function TraceCanvas({ glyph }: { glyph: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [showTemplate, setShowTemplate] = useState(true)

  function clear() {
    const c = canvas.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = c.clientWidth * dpr
    c.height = c.clientHeight * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 9
    ctx.strokeStyle = getComputedStyle(c).color
  }

  useEffect(clear, [glyph])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }

  return (
    <div className="trace">
      <div className="trace-area">
        {showTemplate && <span className="trace-template">{glyph}</span>}
        <canvas
          ref={canvas}
          onPointerDown={e => {
            drawing.current = true
            canvas.current!.setPointerCapture(e.pointerId)
            const ctx = canvas.current!.getContext('2d')!
            ctx.beginPath()
            ctx.moveTo(...pos(e))
          }}
          onPointerMove={e => {
            if (!drawing.current) return
            const ctx = canvas.current!.getContext('2d')!
            ctx.lineTo(...pos(e))
            ctx.stroke()
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerCancel={() => (drawing.current = false)}
        />
      </div>
      <div className="row gap">
        <button className="ghost small" onClick={clear}>Löschen</button>
        <button className="ghost small" onClick={() => setShowTemplate(v => !v)}>
          {showTemplate ? 'Vorlage ausblenden' : 'Vorlage zeigen'}
        </button>
      </div>
    </div>
  )
}
