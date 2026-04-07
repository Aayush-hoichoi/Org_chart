'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useOrgChart } from '@/hooks/useOrgChart'
import OrgCanvas from '@/components/OrgCanvas'
import Sidebar from '@/components/Sidebar'
import type { OrgNode, StatusType } from '@/types'

function gId() {
  return '_' + Math.random().toString(36).slice(2, 9)
}

function showToast(msg = 'Saved ✓') {
  if (typeof document === 'undefined') return
  let el = document.getElementById('__toast')
  if (!el) {
    el = document.createElement('div')
    el.id = '__toast'
    el.className = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('show')
  setTimeout(() => el!.classList.remove('show'), 2200)
}

export default function Page() {
  const { verticals, nodes, loading, seeding, saving, error, saveNode, deleteNodes, saveVertical, addNode } = useOrgChart()

  const [active, setActive]       = useState('hoichoi')
  const [selected, setSelected]   = useState<string | null>(null)
  const [deptFilter, setDeptFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusType>(null)
  const [fitSignal, setFitSignal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [newVertName, setNewVertName] = useState('')
  const transformRef = useRef({ x: 0, y: 0, k: 1 })

  // When active vertical changes, deselect and refit
  useEffect(() => {
    setSelected(null)
    setDeptFilter(null)
    setStatusFilter(null)
    setFitSignal(s => s + 1)
  }, [active])

  // Fit after initial load
  useEffect(() => {
    if (!loading && !seeding) setFitSignal(s => s + 1)
  }, [loading, seeding])

  const activeNodes = nodes.filter(n => n.vertical_id === active)

  // ── Save node ──────────────────────────────────────────────────────
  const handleSave = useCallback(async (n: OrgNode) => {
    const ok = await saveNode(n)
    if (ok) showToast('Saved to Supabase ✓')
  }, [saveNode])

  // ── Add child ──────────────────────────────────────────────────────
  const handleAddChild = useCallback(async () => {
    if (!selected) return
    const par = activeNodes.find(n => n.id === selected)
    const nn: OrgNode = {
      id: gId(), vertical_id: active,
      name: 'New role', desg: 'Designation',
      dept: par?.dept || 'General', res: '',
      parent_id: selected, show_dept: true,
      acc: null, bg: null, txt: null, bdr: null, status: null,
    }
    const ok = await addNode(nn)
    if (ok) { setSelected(nn.id); showToast('Node added ✓') }
  }, [selected, active, activeNodes, addNode])

  // ── Add sibling ────────────────────────────────────────────────────
  const handleAddSibling = useCallback(async () => {
    if (!selected) return
    const cur = activeNodes.find(n => n.id === selected)
    const nn: OrgNode = {
      id: gId(), vertical_id: active,
      name: 'New role', desg: 'Designation',
      dept: cur?.dept || 'General', res: '',
      parent_id: cur?.parent_id || null, show_dept: true,
      acc: null, bg: null, txt: null, bdr: null, status: null,
    }
    const ok = await addNode(nn)
    if (ok) { setSelected(nn.id); showToast('Node added ✓') }
  }, [selected, active, activeNodes, addNode])

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (ids: Set<string>) => {
    const ok = await deleteNodes(ids)
    if (ok) { setSelected(null); showToast('Deleted ✓') }
  }, [deleteNodes])

  // ── Save notes ─────────────────────────────────────────────────────
  const handleSaveNotes = useCallback(async (notes: string) => {
    const vert = verticals.find(v => v.id === active)
    if (!vert) return
    await saveVertical({ id: active, name: vert.name, notes })
  }, [active, verticals, saveVertical])

  // ── Add vertical ───────────────────────────────────────────────────
  const handleAddVertical = useCallback(async () => {
    const name = newVertName.trim()
    if (!name) return
    const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const rootId = gId()
    await saveVertical({ id: key, name, notes: '' })
    await addNode({
      id: rootId, vertical_id: key,
      name: name + ' Head', desg: 'Head', dept: 'Leadership', res: '',
      parent_id: null, show_dept: false,
      acc: null, bg: null, txt: null, bdr: null, status: null,
    })
    setActive(key)
    setNewVertName('')
    setShowModal(false)
    showToast(`${name} added ✓`)
  }, [newVertName, saveVertical, addNode])

  // ── Loading / error screens ────────────────────────────────────────
  if (loading || seeding) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ width: 32, height: 32, border: '2px solid #e8e6e4', borderTopColor: '#141414', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ fontSize: 13, color: '#6f6d6b' }}>
          {seeding ? 'Seeding org data into Supabase…' : 'Connecting to Supabase…'}
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
        <span style={{ fontSize: 13, color: '#b91c1c', fontWeight: 600 }}>Connection error</span>
        <span style={{ fontSize: 12, color: '#6f6d6b', maxWidth: 380, textAlign: 'center', lineHeight: 1.6 }}>{error}</span>
        <button onClick={() => window.location.reload()}
          style={{ marginTop: 8, padding: '6px 16px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 46,
        background: '#fff', borderBottom: '1px solid #d8d5d2',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, zIndex: 10,
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -.3, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Org chart
        </span>

        {/* Vertical tabs */}
        <div style={{ display: 'flex', gap: 3, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {verticals.map(v => (
            <button key={v.id}
              onClick={() => setActive(v.id)}
              style={{
                padding: '5px 13px', borderRadius: 7,
                border: '1px solid transparent',
                cursor: 'pointer', fontSize: 12, fontWeight: 500,
                color: v.id === active ? '#fff' : '#6f6d6b',
                background: v.id === active ? '#141414' : 'transparent',
                whiteSpace: 'nowrap', transition: 'all .13s',
              } as React.CSSProperties}>
              {v.name}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button onClick={() => setFitSignal(s => s + 1)}
            style={{ padding: '5px 11px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
            Fit
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ padding: '5px 11px', border: '1px solid #141414', borderRadius: 7, background: '#141414', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
            + Vertical
          </button>
        </div>

        {/* Supabase badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#aaa8a6', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Supabase live
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ position: 'absolute', top: 46, bottom: 0, left: 0, right: 0, display: 'flex' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', minWidth: 0 }}>

        <VerticalInfoCard
          vertical={verticals.find(v => v.id === active)}
          count={activeNodes.length}
          onSaveNotes={handleSaveNotes}
        />

        <OrgCanvas
          nodes={activeNodes}
          selected={selected}
          deptFilter={deptFilter}
          statusFilter={statusFilter}
          onSelect={id => { setSelected(id); setDeptFilter(null); setStatusFilter(null) }}
          onDeselect={() => { setSelected(null); setDeptFilter(null); setStatusFilter(null) }}
          transformRef={transformRef}
          onTransformChange={() => {}}
          fitSignal={fitSignal}
        />
        </div>

        <Sidebar
          selected={selected}
          nodes={nodes}
          verticals={verticals}
          activeVertical={active}
          deptFilter={deptFilter}
          saving={saving}
          onSave={handleSave}
          onAddChild={handleAddChild}
          onAddSibling={handleAddSibling}
          onDelete={handleDelete}
          onSaveNotes={handleSaveNotes}
          onDeptFilter={setDeptFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
        />
      </div>

      {/* ── Add Vertical modal ── */}
      {showModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.25)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '22px 24px', width: 316, border: '1px solid #d8d5d2' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Add new vertical</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, color: '#6f6d6b', marginBottom: 5 }}>Vertical name</div>
              <input
                autoFocus
                value={newVertName}
                onChange={e => setNewVertName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddVertical()}
                placeholder="e.g. Hoichoi Global"
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #d8d5d2', borderRadius: 7, fontSize: 12, outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button onClick={() => { setShowModal(false); setNewVertName('') }}
                style={{ padding: '5px 11px', border: '1px solid #d8d5d2', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
                Cancel
              </button>
              <button onClick={handleAddVertical}
                style={{ padding: '5px 11px', border: '1px solid #141414', borderRadius: 7, background: '#141414', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                Add vertical
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Per-vertical chat-style notes card ─────────────────────────────
interface ChatMsg { id: string; text: string; ts: number }

function parseMessages(notes: string | undefined): ChatMsg[] {
  if (!notes) return []
  try {
    const parsed = JSON.parse(notes)
    if (Array.isArray(parsed)) return parsed.filter(m => m && typeof m.text === 'string')
  } catch {}
  return notes.trim() ? [{ id: 'legacy', text: notes, ts: Date.now() }] : []
}

function VerticalInfoCard({
  vertical, count, onSaveNotes,
}: {
  vertical: { id: string; name: string; notes: string } | undefined
  count: number
  onSaveNotes: (notes: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(parseMessages(vertical?.notes))
    setDraft('')
  }, [vertical?.id, vertical?.notes])

  useEffect(() => {
    if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  if (!vertical) return null

  const send = () => {
    const text = draft.trim()
    if (!text) return
    const next = [...messages, { id: Math.random().toString(36).slice(2, 9), text, ts: Date.now() }]
    setMessages(next)
    setDraft('')
    onSaveNotes(JSON.stringify(next))
  }

  const remove = (id: string) => {
    const next = messages.filter(m => m.id !== id)
    setMessages(next)
    onSaveNotes(JSON.stringify(next))
  }

  return (
    <div style={{
      position: 'absolute', bottom: 12, right: 16, zIndex: 5,
      background: '#fff', border: '1px solid #d8d5d2', borderRadius: 12,
      width: open ? 300 : 'auto',
      boxShadow: '0 4px 14px rgba(20,20,20,.08)', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      maxHeight: open ? 380 : 'auto',
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '9px 12px', cursor: 'pointer',
          borderBottom: open ? '1px solid #ececea' : 'none', background: '#fafaf9',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#141414', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            💬 {vertical.name}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: '#141414', color: '#fff', flexShrink: 0 }}>
            {count}
          </span>
          {messages.length > 0 && (
            <span style={{ fontSize: 10.5, color: '#6f6d6b' }}>· {messages.length} note{messages.length === 1 ? '' : 's'}</span>
          )}
        </div>
        <span style={{ color: '#6f6d6b', fontSize: 13, lineHeight: 1 }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <>
          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7, minHeight: 90, maxHeight: 240 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11.5, color: '#aaa8a6', textAlign: 'center', padding: '18px 0' }}>
                No notes yet. Add one below.
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ alignSelf: 'flex-start', maxWidth: '92%', background: '#f3f1ef', border: '1px solid #ececea', borderRadius: 10, padding: '6px 9px', position: 'relative' }}>
                <div style={{ fontSize: 11.5, color: '#141414', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
                  <span style={{ fontSize: 9.5, color: '#aaa8a6' }}>
                    {new Date(m.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button onClick={() => remove(m.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#aaa8a6', fontSize: 10, padding: 0 }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '1px solid #ececea', background: '#fff' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Write a note…"
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #d8d5d2', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#141414' }}
            />
            <button onClick={send} disabled={!draft.trim()}
              style={{ padding: '6px 12px', border: '1px solid #141414', borderRadius: 7, background: '#141414', color: '#fff', fontSize: 11.5, cursor: draft.trim() ? 'pointer' : 'not-allowed', opacity: draft.trim() ? 1 : .5, fontFamily: 'inherit' }}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
