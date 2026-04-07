export interface Vertical {
  id: string
  name: string
  notes: string
  created_at?: string
  updated_at?: string
}

export interface OrgNode {
  id: string
  vertical_id: string
  name: string
  desg: string
  dept: string
  res: string
  parent_id: string | null
  show_dept: boolean
  status: 'payroll' | 'consultant' | null
  acc: string | null
  bg: string | null
  txt: string | null
  bdr: string | null
  created_at?: string
  updated_at?: string
  // layout computed fields (not stored)
  _x?: number
  _y?: number
  _ch?: string[]
}

export type StatusType = 'payroll' | 'consultant' | null
