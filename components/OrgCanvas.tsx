'use client'
import { useRef, useEffect, useState, useCallback, type MouseEvent, type WheelEvent } from 'react'
import type { OrgNode, StatusType } from '@/types'
import { computeLayout, NW, NH } from '@/lib/layout'
import NodeCard from './NodeCard'

interface Transform { x: number; y: number; k: number }

interface Props {
  nodes: OrgNode[]
  selected: string | null
  deptFilter: string | null
  statusFilter: StatusType
  onSelect: (id: string) => void
  onDeselect: () => void
  transformRef: React.MutableRefObject<Transform>
  onTransformChange: (t: Transform) => void
  fitSignal: number
}

export default function OrgCanvas({
  nodes, selected, deptFilter, statusFilter, onSelect, onDeselect,
  transformRef, onTransformChange, fitSignal,
}: Props) {
  const cwRef = useRef<HTMLDivElement>(null)
  const [t, setT] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const [pan, setPan] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [divHeights, setDivHeights] = useState<Record<string, number>>({})
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const applyT = useCallback((nt: Transform) => {
    setT(nt)
    transformRef.current = nt
    onTransformChange(nt)
  }, [transformRef, onTransformChange])

  const m = computeLayout(nodes)

  // Measure heights after render
  useEffect(() => {
    const h: Record<string, number> = {}
    Object.keys(nodeRefs.current).forEach(id => {
      const el = nodeRefs.current[id]
      if (el) h[id] = el.offsetHeight
    })
    setDivHeights(h)
  }, [nodes])

  // Fit chart in view
  const fit = useCallback(() => {
    if (!nodes.length || !cwRef.current) return
    const ns = Object.values(m)
    const rect = cwRef.current.getBoundingClientRect()
    const W = rect.width, H = rect.height
    const minX = Math.min(...ns.map(n => n._x!))
    const maxX = Math.max(...ns.map(n => n._x! + NW))
    const minY = Math.min(...ns.map(n => n._y!))
    const maxY = Math.max(...ns.map(n => n._y! + NH))
    const tw = maxX - minX + 120, th = maxY - minY + 120
    const k = Math.min(W / tw, H / th, 1.1)
    applyT({ k, x: (W - tw * k) / 2 - minX * k + 60 * k, y: (H - th * k) / 2 - minY * k + 60 * k })
  }, [nodes, m, applyT]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setTimeout(fit, 150) }, [fitSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel: pinch/ctrl = zoom, swipe = pan
  useEffect(() => {
    const el = cwRef.current
    if (!el) return
    const onWheel = (e: globalThis.WheelEvent) => {
      e.preventDefault()
      setT(prev => {
        let nt: Transform
        if (e.ctrlKey) {
          const rect = el.getBoundingClientRect()
          const mx = e.clientX - rect.left, my = e.clientY - rect.top
          const d = e.deltaY > 0 ? .88 : 1.14
          const nk = Math.min(2.5, Math.max(.2, prev.k * d))
          nt = { k: nk, x: mx - (mx - prev.x) * (nk / prev.k), y: my - (my - prev.y) * (nk / prev.k) }
        } else {
          nt = { ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }
        }
        transformRef.current = nt
        return nt
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [transformRef])

  const onMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-node]')) return
    setPan(true)
    setPanStart({ x: e.clientX - t.x, y: e.clientY - t.y })
  }
  const onMouseMove = (e: MouseEvent) => {
    if (!pan) return
    const nt = { ...t, x: e.clientX - panStart.x, y: e.clientY - panStart.y }
    applyT(nt)
  }
  const onMouseUp = () => setPan(false)

  const maxX = Object.values(m).reduce((a, n) => Math.max(a, (n._x || 0) + NW), 0) + 80
  const maxY = Object.values(m).reduce((a, n) => Math.max(a, (n._y || 0) + NH), 0) + 80

  return (
    <div
      ref={cwRef}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        cursor: pan ? 'grabbing' : 'grab',
        background: '#f7f6f5',
        backgroundImage: 'radial-gradient(circle, #ddd9d6 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={e => { if (!(e.target as HTMLElement).closest('[data-node]')) onDeselect() }}
    >
      <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${t.x}px,${t.y}px) scale(${t.k})` }}>
        <div style={{ position: 'relative', width: maxX, height: maxY }}>

          {/* SVG connectors */}
          <svg style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }} width={maxX} height={maxY}>
            <defs>
              <marker id="ah" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
                <path d="M0,1 L10,5 L0,9 L3,5 Z" fill="#c0bdb9" />
              </marker>
            </defs>
            {Object.values(m).map(n => {
              if (!n.parent_id || !m[n.parent_id]) return null
              const p = m[n.parent_id]
              const ph = divHeights[n.parent_id] || NH
              const x1 = Math.round((p._x || 0) + NW / 2)
              const y1 = (p._y || 0) + ph
              const x2 = Math.round((n._x || 0) + NW / 2)
              const y2 = n._y || 0
              const midY = Math.round(y1 + (y2 - y1) / 2)
              const d = Math.abs(x1 - x2) < 2
                ? `M ${x1} ${y1} L ${x2} ${y2}`
                : `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`
              return (
                <path key={`arr-${n.id}`} d={d} fill="none" stroke="#c8c5c2"
                  strokeWidth="1.5" strokeLinejoin="round" markerEnd="url(#ah)" />
              )
            })}
          </svg>

          {/* Node cards */}
          {Object.values(m).map(n => (
            <div key={n.id} data-node="1">
              <NodeCard
                node={n}
                selected={selected === n.id}
                dimmed={(!!deptFilter && n.dept !== deptFilter) || (!!statusFilter && n.status !== statusFilter)}
                nodeRef={el => { nodeRefs.current[n.id] = el }}
                onClick={() => onSelect(n.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 5 }}>
        {(['+', '−', '1:1'] as const).map((l, i) => (
          <button key={i}
            style={{ width: 30, height: 30, border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: i < 2 ? 16 : 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => {
              setT(prev => {
                const nt = i === 0 ? { ...prev, k: Math.min(2.5, prev.k * 1.2) }
                  : i === 1 ? { ...prev, k: Math.max(.2, prev.k * .85) }
                  : { ...prev, k: 1 }
                transformRef.current = nt
                return nt
              })
            }}
          >{l}</button>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 11, color: '#aaa8a6', pointerEvents: 'none', userSelect: 'none' }}>
        pinch / ctrl+scroll = zoom · two-finger swipe = pan
      </div>
    </div>
  )
}
