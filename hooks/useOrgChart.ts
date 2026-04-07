'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { SEED_VERTICALS, SEED_NODES } from '@/lib/seed'
import type { Vertical, OrgNode } from '@/types'

const BATCH = 30

export function useOrgChart() {
  const [verticals, setVerticals] = useState<Vertical[]>([])
  const [nodes, setNodes] = useState<OrgNode[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: verts, error: vErr } = await supabase
        .from('oc_verticals')
        .select('*')
        .order('created_at', { ascending: true })

      if (vErr) throw vErr

      if (!verts || verts.length === 0) {
        await seedAll()
        return
      }

      const { data: nds, error: nErr } = await supabase
        .from('oc_nodes')
        .select('*')
        .order('created_at', { ascending: true })

      if (nErr) throw nErr
      setVerticals(verts)
      setNodes(nds || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const seedAll = async () => {
    setSeeding(true)
    try {
      const { error: vErr } = await supabase
        .from('oc_verticals')
        .upsert(SEED_VERTICALS, { onConflict: 'id' })
      if (vErr) throw vErr

      for (let i = 0; i < SEED_NODES.length; i += BATCH) {
        const { error: nErr } = await supabase
          .from('oc_nodes')
          .upsert(SEED_NODES.slice(i, i + BATCH), { onConflict: 'id' })
        if (nErr) throw nErr
      }

      const { data: verts } = await supabase.from('oc_verticals').select('*').order('created_at')
      const { data: nds } = await supabase.from('oc_nodes').select('*').order('created_at')
      setVerticals(verts || [])
      setNodes(nds || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Seeding failed')
    } finally {
      setSeeding(false)
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [loadData])

  // ── Mutations ────────────────────────────────────────────────────────
  const saveNode = async (node: OrgNode): Promise<boolean> => {
    setSaving(true)
    const { error } = await supabase.from('oc_nodes').upsert([node], { onConflict: 'id' })
    setSaving(false)
    if (error) { setError(error.message); return false }
    setNodes(prev => {
      const exists = prev.find(n => n.id === node.id)
      return exists
        ? prev.map(n => n.id === node.id ? { ...n, ...node } : n)
        : [...prev, node]
    })
    return true
  }

  const deleteNodes = async (ids: Set<string>): Promise<boolean> => {
    const { error } = await supabase.from('oc_nodes').delete().in('id', [...ids])
    if (error) { setError(error.message); return false }
    setNodes(prev => prev.filter(n => !ids.has(n.id)))
    return true
  }

  const saveVertical = async (vertical: Partial<Vertical> & { id: string }): Promise<boolean> => {
    const { error } = await supabase
      .from('oc_verticals')
      .upsert([vertical], { onConflict: 'id' })
    if (error) { setError(error.message); return false }
    setVerticals(prev => {
      const exists = prev.find(v => v.id === vertical.id)
      return exists
        ? prev.map(v => v.id === vertical.id ? { ...v, ...vertical } : v)
        : [...prev, { name: '', notes: '', ...vertical }]
    })
    return true
  }

  const addNode = async (node: OrgNode): Promise<boolean> => {
    const { error } = await supabase.from('oc_nodes').insert([node])
    if (error) { setError(error.message); return false }
    setNodes(prev => [...prev, node])
    return true
  }

  return {
    verticals, nodes, loading, seeding, saving, error,
    saveNode, deleteNodes, saveVertical, addNode, refetch: loadData,
  }
}
