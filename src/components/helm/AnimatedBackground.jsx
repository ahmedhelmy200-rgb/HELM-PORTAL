import { useEffect, useRef } from 'react'

function hexToRgb(hex, fallback = '#3b82f6') {
  const value = /^#[0-9a-fA-F]{6}$/.test(String(hex || '').trim()) ? String(hex).trim() : fallback
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
  }
}

function rgba(rgb, alpha) {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

export default function AnimatedBackground({
  active = true,
  intensity = 1,
  theme = 'dark',
  primaryColor = '#3b82f6',
  accentColor = '#06b6d4',
}) {
  const canvasRef = useRef(null)
  const intensityRef = useRef(intensity)

  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    if (!active || theme === 'light') return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return undefined

    const primary = hexToRgb(primaryColor, '#3b82f6')
    const accent = hexToRgb(accentColor, '#06b6d4')
    const isMobile = window.innerWidth < 768
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const targetFps = isMobile ? 20 : 30
    const frameInterval = 1000 / targetFps
    const pointCount = isMobile ? 18 : 34

    let width = 0
    let height = 0
    let animationFrame = 0
    let lastFrame = 0
    const pointer = { x: -9999, y: -9999 }

    const points = Array.from({ length: pointCount }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      radius: 0.75 + Math.random() * 0.9,
      accent: index % 3 === 0,
    }))

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const movePointer = (event) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const leavePointer = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    const renderFrame = (time, movePoints = true) => {
      context.clearRect(0, 0, width, height)
      const power = Math.max(0.5, Math.min(2.2, intensityRef.current || 1))
      const connectionDistance = (isMobile ? 82 : 108) * Math.min(1.16, 0.92 + power * 0.08)

      if (movePoints) {
        points.forEach((point) => {
          const dx = pointer.x - point.x
          const dy = pointer.y - point.y
          const distance = Math.hypot(dx, dy)

          if (distance < 170 && distance > 1) {
            const attraction = 0.000025 * (170 - distance) * power
            point.vx += (dx / distance) * attraction
            point.vy += (dy / distance) * attraction
          }

          point.vx *= 0.994
          point.vy *= 0.994
          point.x += point.vx
          point.y += point.vy

          if (point.x < -8) point.x = width + 8
          if (point.x > width + 8) point.x = -8
          if (point.y < -8) point.y = height + 8
          if (point.y > height + 8) point.y = -8
        })
      }

      for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < points.length; rightIndex += 1) {
          const left = points[leftIndex]
          const right = points[rightIndex]
          const distance = Math.hypot(left.x - right.x, left.y - right.y)
          if (distance >= connectionDistance) continue

          const alpha = (1 - distance / connectionDistance) * 0.11 * power
          context.strokeStyle = rgba((left.accent || right.accent) ? accent : primary, alpha)
          context.lineWidth = 0.65
          context.beginPath()
          context.moveTo(left.x, left.y)
          context.lineTo(right.x, right.y)
          context.stroke()
        }
      }

      points.forEach((point, index) => {
        const pulse = reducedMotion ? 1 : 0.88 + Math.sin(time * 0.001 + index) * 0.12
        context.fillStyle = rgba(point.accent ? accent : primary, 0.34 * pulse)
        context.beginPath()
        context.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
        context.fill()
      })
    }

    const loop = (time) => {
      animationFrame = window.requestAnimationFrame(loop)
      if (time - lastFrame < frameInterval) return
      lastFrame = time
      renderFrame(time, true)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })

    if (reducedMotion) {
      renderFrame(0, false)
    } else {
      window.addEventListener('pointermove', movePointer, { passive: true })
      window.addEventListener('pointerleave', leavePointer, { passive: true })
      animationFrame = window.requestAnimationFrame(loop)
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', movePointer)
      window.removeEventListener('pointerleave', leavePointer)
      context.clearRect(0, 0, width, height)
    }
  }, [active, theme, primaryColor, accentColor])

  if (!active || theme === 'light') return null

  return <canvas ref={canvasRef} className="animated-electric-bg" aria-hidden="true" />
}
