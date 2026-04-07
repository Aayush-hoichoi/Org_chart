'use client'
import type { OrgNode } from '@/types'

const DA = '#e8e6e4'
const DB = '#ffffff'
const DT = '#141414'
const DD = '#d8d5d2'

const ST_META = {
  payroll:    { dot: '#3b82f6', bg: '#dbeafe', label: 'Payroll' },
  consultant: { dot: '#f59e0b', bg: '#fef3c7', label: 'Consultant' },
}

interface Props {
  node: OrgNode
  selected: boolean
  dimmed: boolean
  nodeRef: (el: HTMLDivElement | null) => void
  onClick: () => void
}

export default function NodeCard({ node, selected, dimmed, nodeRef, onClick }: Props) {
  const bg  = node.bg  || DB
  const col = node.txt || DT
  const acc = node.acc || DA
  const bdr = node.bdr || DD
  const st  = node.status ? ST_META[node.status] : null

  return (
    <div
      ref={nodeRef}
      onClick={e => { e.stopPropagation(); onClick() }}
      style={{
        position:    'absolute',
        left:        node._x,
        top:         node._y,
        width:       210,
        background:  bg,
        border:      selected ? `1.5px solid #141414` : `1px solid ${bdr}`,
        borderRadius: 10,
        cursor:      'pointer',
        overflow:    'hidden',
        userSelect:  'none',
        opacity:     dimmed ? 0.2 : 1,
        pointerEvents: dimmed ? 'none' : 'auto',
        boxShadow:   selected ? '0 0 0 3px rgba(20,20,20,.08)' : undefined,
        transition:  'border-color .13s, box-shadow .13s, opacity .15s',
      }}
    >
      {/* Accent strip */}
      <div style={{ height: 3, background: acc }} />

      <div style={{ padding: '10px 13px 12px' }}>
        {node.show_dept && (
          <div style={{ fontSize: 9.5, fontWeight: 500, color: '#aaa8a6', letterSpacing: .4, textTransform: 'uppercase', marginBottom: 2 }}>
            {node.dept}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: col, lineHeight: 1.3, marginBottom: 3 }}>
          {node.name}
        </div>
        <div style={{ fontSize: 11.5, color: '#6f6d6b', lineHeight: 1.4 }}>
          {node.desg}
        </div>
        {node.res && (
          <div style={{ fontSize: 10.5, color: '#aaa8a6', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0edea', lineHeight: 1.5 }}>
            {node.res}
          </div>
        )}
        {st && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 9.5, fontWeight: 500, padding: '1px 6px 1px 4px',
            borderRadius: 20, background: st.bg, color: st.dot, marginTop: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, flexShrink: 0 }} />
            {st.label}
          </span>
        )}
      </div>
    </div>
  )
}
