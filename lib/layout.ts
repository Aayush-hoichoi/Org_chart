import type { OrgNode } from '@/types'

export const NW = 200
export const NH = 110
export const HG = 22
export const VG = 70

export function computeLayout(nodes: OrgNode[]): Record<string, OrgNode> {
  if (!nodes.length) return {}

  const m: Record<string, OrgNode> = {}
  nodes.forEach(n => { m[n.id] = { ...n, _ch: [], _x: 0, _y: 0 } })

  const roots: string[] = []
  nodes.forEach(n => {
    if (n.parent_id && m[n.parent_id]) {
      m[n.parent_id]._ch!.push(n.id)
    } else {
      roots.push(n.id)
    }
  })

  const sw = (id: string): number => {
    const n = m[id]
    if (!n._ch?.length) return NW
    return Math.max(NW, n._ch.reduce((s, c) => s + sw(c), 0) + HG * (n._ch.length - 1))
  }

  const pos = (id: string, left: number, depth: number): void => {
    const n = m[id]
    const w = sw(id)
    n._x = left + (w - NW) / 2
    n._y = depth * (NH + VG) + 60
    if (n._ch?.length) {
      const cws = n._ch.map(sw)
      const tw = cws.reduce((a, b) => a + b, 0) + HG * (n._ch.length - 1)
      let cx = left + (w - tw) / 2
      n._ch.forEach((cid, i) => {
        pos(cid, cx, depth + 1)
        cx += cws[i] + HG
      })
    }
  }

  let sx = 60
  roots.forEach(r => {
    pos(r, sx, 0)
    sx += sw(r) + HG * 2
  })

  return m
}
