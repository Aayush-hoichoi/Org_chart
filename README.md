# Hoichoi Org Chart — Next.js + Supabase

Organisation chart for **Hoichoi**, **Hoichoi BD**, **LoglineAI**, and **Sooper**,
built with Next.js 14 (App Router), TypeScript, and Supabase.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On first load the app will seed all org data into Supabase automatically.
Subsequent loads read live from the database.

---

## Environment variables

`.env.local` is pre-configured and ready to use:

```
NEXT_PUBLIC_SUPABASE_URL=https://orsudggdzqqniwmxgomc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

To use a different Supabase project, update both values and run the
migration in `supabase/migrations/` against the new project.

---

## Database tables (already migrated)

| Table | Purpose |
|---|---|
| `oc_verticals` | Companies / verticals + per-vertical notes |
| `oc_nodes` | Every person / open role, with hierarchy, colours, status |

Both tables have RLS enabled with open `allow_all` policies — suitable for
an internal HR tool. Tighten policies for public-facing use.

---

## Features

- **Pan & zoom** — two-finger swipe to pan, pinch or Ctrl+scroll to zoom
- **Node editor** — edit name, designation, department, resources, reporting line, employment status (payroll / consultant), and all box colours
- **Auto-save to Supabase** — every Save press upserts only the changed node
- **Department filter** — click any department in the legend to highlight it; shows headcount per dept
- **Overview tab** — per-vertical notes (debounced auto-save) + live headcount table with dept breakdown bars
- **Status badges** — blue (payroll) / amber (consultant) dot on each card
- **Add / delete nodes** — child, sibling, or delete with cascade (children deleted too)
- **+ Vertical** — add new companies at runtime; root node created automatically

---

## Deployment (Vercel)

```bash
npm run build          # verify build locally first
vercel                 # deploy
```

Set the two `NEXT_PUBLIC_*` env vars in the Vercel dashboard under
Settings → Environment Variables. They match `.env.local`.

---

## Project structure

```
app/
  layout.tsx           Root layout
  page.tsx             Main orchestrator (tabs, modals, state)
  globals.css          Base styles

components/
  OrgCanvas.tsx        Pan/zoom canvas + SVG orthogonal arrows (two-pass height measurement)
  NodeCard.tsx         Individual org box
  NodeEditor.tsx       Form: content + status + appearance
  Overview.tsx         Headcount table + notes
  Sidebar.tsx          Tabbed sidebar container

hooks/
  useOrgChart.ts       All Supabase reads + upsert / delete mutations

lib/
  supabase.ts          createClient wrapper
  layout.ts            Tree layout engine (typed)
  seed.ts              Seed data (120+ nodes)

types/
  index.ts             OrgNode, Vertical, StatusType
```
