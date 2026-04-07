'use client'
import { useState } from 'react'
import type { OrgNode, Vertical } from '@/types'
import NodeEditor from './NodeEditor'
import Overview from './Overview'

interface Props {
  selected: string | null
  nodes: OrgNode[]
  verticals: Vertical[]
  activeVertical: string
  deptFilter: string | null
  saving: boolean
  onSave: (n: OrgNode) => void
  onAddChild: () => void
  onAddSibling: () => void
  onDelete: (ids: Set<string>) => void
  onSaveNotes: (notes: string) => void
  onDeptFilter: (dept: string | null) => void
}

export default function Sidebar({
  selected, nodes, verticals, activeVertical, deptFilter,
  saving, onSave, onAddChild, onAddSibling, onDelete, onSaveNotes, onDeptFilter,
}: Props) {
  const [tab, setTab] = useState(0)

  const activeNodes = nodes.filter(n => n.vertical_id === activeVertical)
  const curNode = activeNodes.find(n => n.id === selected) || null
  const vert = verticals.find(v => v.id === activeVertical)

  const deptCount: Record<string, number> = {}
  activeNodes.forEach(n => { deptCount[n.dept] = (deptCount[n.dept] || 0) + 1 })
  const sortedDepts = Object.keys(deptCount).sort()

  const tabBtn = (label: string, i: number) => (
    <button key={i} onClick={() => setTab(i)}
      style={{ flex: 1, padding: '11px 6px', fontSize: 12, fontWeight: tab === i ? 600 : 500, border: 'none', background: tab === i ? '#141414' : 'transparent', color: tab === i ? '#fff' : '#6f6d6b', cursor: 'pointer', fontFamily: 'inherit', borderRight: i === 0 ? '1px solid #d8d5d2' : 'none' }}>
      {label}
    </button>
  )

  return (
    <div style={{ width: 290, borderLeft: '1px solid #d8d5d2', background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #d8d5d2', flexShrink: 0 }}>
        {['Node editor', 'Overview'].map(tabBtn)}
      </div>

      {/* Tab 0 — Node editor */}
      {tab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <NodeEditor
            node={curNode}
            allNodes={activeNodes}
            verticalId={activeVertical}
            saving={saving}
            onSave={onSave}
            onAddChild={onAddChild}
            onAddSibling={onAddSibling}
            onDelete={onDelete}
          />

          {/* Dept legend */}
          <div style={{ padding: '11px 15px', borderTop: '1px solid #d8d5d2', flexShrink: 0, maxHeight: 190, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: '#aaa8a6', marginBottom: 7 }}>
              Departments <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(click to filter)</span>
            </div>
            {deptFilter && (
              <button onClick={() => onDeptFilter(null)}
                style={{ fontSize: 11, background: '#f7f6f5', border: '1px solid #d8d5d2', borderRadius: 7, padding: '3px 8px', cursor: 'pointer', marginBottom: 6, fontFamily: 'inherit' }}>
                ✕ Clear filter
              </button>
            )}
            {sortedDepts.map(d => {
              const isAct = deptFilter === d
              return (
                <div key={d}
                  onClick={() => onDeptFilter(isAct ? null : d)}
                  onMouseEnter={e => { if (!isAct) (e.currentTarget as HTMLDivElement).style.background = '#f0eeec' }}
                  onMouseLeave={e => { if (!isAct) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 7px', borderRadius: 7, cursor: 'pointer', background: isAct ? '#141414' : 'transparent', marginBottom: 2 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: isAct ? '#fff' : '#d4d1ce', border: `1px solid ${isAct ? 'transparent' : '#d8d5d2'}`, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: isAct ? '#fff' : '#6f6d6b' }}>{d}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: isAct ? 'rgba(255,255,255,.8)' : '#aaa8a6' }}>{deptCount[d]}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 1 — Overview */}
      {tab === 1 && (
        <Overview vertical={vert} nodes={activeNodes} onSaveNotes={onSaveNotes} />
      )}
    </div>
  )
}
