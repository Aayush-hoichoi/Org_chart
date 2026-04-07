'use client'
import { useState, useEffect, useRef } from 'react'
import type { OrgNode, StatusType } from '@/types'

const DA = '#e8e6e4', DB = '#ffffff', DT = '#141414', DD = '#d8d5d2'

interface Props {
  node: OrgNode | null
  allNodes: OrgNode[]
  verticalId: string
  saving: boolean
  onSave: (n: OrgNode) => void
  onAddChild: () => void
  onAddSibling: () => void
  onDelete: (ids: Set<string>) => void
}

export default function NodeEditor({ node, allNodes, verticalId, saving, onSave, onAddChild, onAddSibling, onDelete }: Props) {
  const [name,   setName]   = useState('')
  const [desg,   setDesg]   = useState('')
  const [dept,   setDept]   = useState('')
  const [res,    setRes]    = useState('')
  const [parentId, setParentId] = useState('')
  const [showDept, setShowDept] = useState(true)
  const [status,   setStatus]   = useState<StatusType>(null)
  const [acc,  setAcc]  = useState(DA)
  const [bg,   setBg]   = useState(DB)
  const [txt,  setTxt]  = useState(DT)
  const [bdr,  setBdr]  = useState(DD)
  const [delConfirm, setDelConfirm] = useState(false)
  const delTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!node) return
    setName(node.name || '')
    setDesg(node.desg || '')
    setDept(node.dept || '')
    setRes(node.res || '')
    setParentId(node.parent_id || '')
    setShowDept(node.show_dept)
    setStatus(node.status)
    setAcc(node.acc || DA)
    setBg(node.bg || DB)
    setTxt(node.txt || DT)
    setBdr(node.bdr || DD)
    setDelConfirm(false)
  }, [node])

  if (!node) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 20px', gap: 8 }}>
        <div style={{ fontSize: 22, color: '#aaa8a6', marginBottom: 4 }}>↖</div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Select a node to edit</span>
        <p style={{ fontSize: 12, color: '#6f6d6b', lineHeight: 1.7 }}>Click any box on the chart to view and edit it here.</p>
      </div>
    )
  }

  const handleSave = () => {
    onSave({
      ...node,
      name:      name.trim() || 'Unnamed',
      desg:      desg.trim(),
      dept:      dept.trim(),
      res:       res.trim(),
      parent_id: parentId || null,
      show_dept: showDept,
      status,
      acc: acc !== DA ? acc : null,
      bg:  bg  !== DB ? bg  : null,
      txt: txt !== DT ? txt : null,
      bdr: bdr !== DD ? bdr : null,
    })
  }

  const handleDelete = () => {
    if (!delConfirm) {
      setDelConfirm(true)
      clearTimeout(delTimer.current)
      delTimer.current = setTimeout(() => setDelConfirm(false), 3000)
      return
    }
    const toDelete = new Set([node.id])
    let changed = true
    while (changed) {
      changed = false
      allNodes.forEach(n => {
        if (n.parent_id && toDelete.has(n.parent_id) && !toDelete.has(n.id)) {
          toDelete.add(n.id); changed = true
        }
      })
    }
    onDelete(toDelete)
  }

  // Exclude self + descendants from parent dropdown
  const desc = new Set([node.id])
  let chg = true
  while (chg) {
    chg = false
    allNodes.forEach(n => {
      if (n.parent_id && desc.has(n.parent_id) && !desc.has(n.id)) { desc.add(n.id); chg = true }
    })
  }
  const parentOptions = allNodes.filter(n => !desc.has(n.id))

  const fi: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', color: '#141414', fontSize: 12, outline: 'none', display: 'block', fontFamily: 'inherit' }
  const fl: React.CSSProperties = { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: '#6f6d6b', marginBottom: 5 }
  const fg: React.CSSProperties = { marginBottom: 12 }
  const cp: React.CSSProperties = { width: 36, height: 28, border: '1px solid #d8d5d2', borderRadius: 7, cursor: 'pointer', padding: 2, background: '#fff' }

  return (
    <>
      <div style={{ padding: '10px 15px', borderBottom: '1px solid #d8d5d2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 11.5, color: '#6f6d6b' }}>{saving ? 'Saving to Supabase…' : 'Editing node'}</span>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '4px 10px', border: '1px solid #141414', borderRadius: 7, background: '#141414', color: '#fff', fontSize: 11.5, cursor: 'pointer', opacity: saving ? .6 : 1, fontFamily: 'inherit' }}>
          {saving ? '…' : 'Save'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '13px 15px' }}>
        <div style={{ ...fl, marginBottom: 8 }}>Content</div>
        <div style={fg}><div style={fl}>Name</div><input style={fi} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma" /></div>
        <div style={fg}><div style={fl}>Designation</div><input style={fi} value={desg} onChange={e => setDesg(e.target.value)} placeholder="e.g. Head of Content" /></div>
        <div style={fg}>
          <div style={fl}>Department</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{ ...fi, flex: 1 }} value={dept} onChange={e => setDept(e.target.value)} placeholder="e.g. Content" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#6f6d6b', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <input type="checkbox" checked={showDept} onChange={e => setShowDept(e.target.checked)} style={{ accentColor: '#141414', cursor: 'pointer' }} /> Show
            </label>
          </div>
        </div>
        <div style={fg}><div style={fl}>Resources</div><textarea style={{ ...fi, resize: 'vertical', minHeight: 54 }} value={res} onChange={e => setRes(e.target.value)} placeholder="e.g. 8 team · ₹50L budget" /></div>
        <div style={fg}>
          <div style={fl}>Reports to</div>
          <select style={{ ...fi, cursor: 'pointer' }} value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">— Root (no parent) —</option>
            {parentOptions.map(n => <option key={n.id} value={n.id}>{n.name} · {n.desg}</option>)}
          </select>
        </div>

        <div style={fg}>
          <div style={fl}>Employment status</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([null, 'payroll', 'consultant'] as StatusType[]).map(s => {
              const labels = { null: '—', payroll: '● Payroll', consultant: '● Consultant' }
              const active = status === s
              const styles: Record<string, React.CSSProperties> = {
                null:       active ? { background: '#f0f0f0', borderColor: '#999', color: '#333' } : {},
                payroll:    active ? { background: '#dbeafe', borderColor: '#93c5fd', color: '#1e40af' } : {},
                consultant: active ? { background: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' } : {},
              }
              return (
                <button key={String(s)} onClick={() => setStatus(s)}
                  style={{ padding: '4px 9px', border: '1px solid #d8d5d2', borderRadius: 20, background: '#fff', color: '#6f6d6b', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', ...styles[String(s)] }}>
                  {labels[String(s) as keyof typeof labels]}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: .5, color: '#aaa8a6', margin: '14px 0 9px', paddingBottom: 6, borderBottom: '1px solid #eceae8' }}>Appearance</div>

        {([['Accent bar', acc, setAcc, DA], ['Box background', bg, setBg, DB], ['Name text', txt, setTxt, DT], ['Border', bdr, setBdr, DD]] as [string, string, (v: string) => void, string][]).map(([label, val, setter, def]) => (
          <div style={fg} key={label}>
            <div style={fl}>{label}</div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
              <input type="color" style={cp} value={val} onChange={e => setter(e.target.value)} />
              <button onClick={() => setter(def)} style={{ padding: '3px 8px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', color: '#141414', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '11px 15px', borderTop: '1px solid #d8d5d2', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button onClick={onAddChild} style={{ padding: '5px 11px', border: '1px solid #141414', borderRadius: 7, background: '#141414', color: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add child node</button>
        <button onClick={onAddSibling} style={{ padding: '5px 11px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', color: '#141414', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add sibling node</button>
        <button onClick={handleDelete} style={{ padding: '5px 11px', border: '1px solid #fca5a5', borderRadius: 7, background: '#fff', color: '#b91c1c', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          {delConfirm ? 'Confirm delete?' : 'Delete node'}
        </button>
      </div>
    </>
  )
}
