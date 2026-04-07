'use client'
import { useEffect, useRef } from 'react'
import type { OrgNode, Vertical, StatusType } from '@/types'

interface Props {
  vertical: Vertical | undefined
  nodes: OrgNode[]
  onSaveNotes: (notes: string) => void
  statusFilter: StatusType
  onStatusFilter: (s: StatusType) => void
}

export default function Overview({ vertical, nodes, onSaveNotes, statusFilter, onStatusFilter }: Props) {
  const total = nodes.length
  const deptCount: Record<string, number> = {}
  const stCount = { payroll: 0, consultant: 0 }

  nodes.forEach(n => {
    deptCount[n.dept] = (deptCount[n.dept] || 0) + 1
    if (n.status === 'payroll') stCount.payroll++
    if (n.status === 'consultant') stCount.consultant++
  })

  const sortedDepts = Object.entries(deptCount).sort((a, b) => b[1] - a[1])

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const handleNotes = (val: string) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSaveNotes(val), 800)
  }

  const fl: React.CSSProperties = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: '#aaa8a6', marginBottom: 6 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '11px 15px', borderBottom: '1px solid #d8d5d2', flexShrink: 0 }}>
        <div style={fl}>{vertical?.name}</div>
        <textarea
          key={vertical?.id}
          defaultValue={vertical?.notes || ''}
          onChange={e => handleNotes(e.target.value)}
          placeholder="Add notes for this vertical…"
          style={{ width: '100%', padding: '6px 10px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', color: '#141414', fontSize: 12, outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '11px 15px' }}>
        <div style={fl}>Headcount</div>

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1.5px solid #d8d5d2', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{total}</span>
        </div>

        {/* Status pills */}
        {(stCount.payroll + stCount.consultant) > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '7px 0', borderBottom: '1px solid #d8d5d2', flexWrap: 'wrap', alignItems: 'center' }}>
            {stCount.payroll > 0 && (
              <button
                onClick={() => onStatusFilter(statusFilter === 'payroll' ? null : 'payroll')}
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                  border: statusFilter === 'payroll' ? '1px solid #1e40af' : '1px solid transparent',
                  background: statusFilter === 'payroll' ? '#1e40af' : '#dbeafe',
                  color: statusFilter === 'payroll' ? '#fff' : '#1e40af',
                  fontFamily: 'inherit', fontWeight: 600,
                }}>
                ● Payroll {stCount.payroll}
              </button>
            )}
            {stCount.consultant > 0 && (
              <button
                onClick={() => onStatusFilter(statusFilter === 'consultant' ? null : 'consultant')}
                style={{
                  fontSize: 11, padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                  border: statusFilter === 'consultant' ? '1px solid #92400e' : '1px solid transparent',
                  background: statusFilter === 'consultant' ? '#92400e' : '#fef3c7',
                  color: statusFilter === 'consultant' ? '#fff' : '#92400e',
                  fontFamily: 'inherit', fontWeight: 600,
                }}>
                ● Consultant {stCount.consultant}
              </button>
            )}
            {statusFilter && (
              <button onClick={() => onStatusFilter(null)}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, background: '#f7f6f5', border: '1px solid #d8d5d2', cursor: 'pointer', color: '#6f6d6b', fontFamily: 'inherit' }}>
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* Per-dept rows */}
        {sortedDepts.map(([d, c]) => (
          <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #f0eeec' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d}</div>
              <div style={{ height: 3, borderRadius: 2, background: '#e8e6e4', marginTop: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(c / total * 100)}%`, background: '#141414', borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6f6d6b', marginLeft: 12, flexShrink: 0 }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
