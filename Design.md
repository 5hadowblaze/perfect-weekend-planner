# Perfect Weekend Planner — Product Design Document

Hackathon submission for **Multiagents Hackathon (June 2026)**. Built for the **Prometheux track**: deterministic constraint filtering with Vadalog before any LLM formatting.

> **Cursor instruction:** Keep this file updated as features land. When adding endpoints, env vars, or pipeline steps, update the relevant sections here.

---

## Hackathon goal

Build a **deterministic autonomous agent** that plans a verified weekend itinerary from user constraints. The agent must:

1. Query **live web data** (Tavily) for events and restaurants.
2. Filter candidates **deterministically** with Prometheux / Vadalog — **the core differentiator** (no LLM in the filter gate).
3. Format a human-readable itinerary with **Gemini** using **only** Prometheux-verified rows.
4. Publish a **cited markdown table** to `cited.md` showing filter stats + verified candidates + itinerary.
5. Expose **Langfuse traces** for every tool, generation, and agent step.
6. *(Optional scaffold)* MPP micro-payments on the Next.js API route — **disabled by default** (`SKIP_MPP=true`).

### Acceptance criteria

| # | Criterion |
|---|-----------|
| 1 | User submits location, budget, diet, activities (+ optional accessibility) via Next.js form |
| 2 | Backend returns `{ itinerary, cited_path, trace_id, filter_stats }` — no wallet required when `SKIP_MPP=true` |
| 3 | `filter_stats` reports `candidates_in`, `candidates_out`, `filter_method: sdk` |
| 4 | `cited.md` shows Prometheux filter summary, verified candidate table, and itinerary with source URLs |
| 5 | Langfuse trace shows nested `agent` → `tool` / `generation` observations |
| 6 | Gemini never receives unfiltered Tavily candidates (Prometheux gate) |

---

## Prometheux / Vadalog ontology

### Input facts (from Tavily)

Each search result becomes a Vadalog fact:

```vadalog
candidate("evt_1", "event", "Jazz Fest", "https://...", 25, "Austin, TX", "outdoor,music", "Weekend jazz...").
candidate("rst_1", "restaurant", "Green Bowl", "https://...", 18, "Austin, TX", "vegan", "Plant-based...").
```

### Constraint facts (from user request)

```vadalog
max_budget(150).
target_location("austin").
has_diet_constraints.
required_diet_token("vegan").
has_activity_constraints.
required_activity_token("music").
has_access_constraints.
required_access_token("wheelchair").
```

### Rules (deterministic gate)

| Rule | Logic |
|------|-------|
| `budget_ok` | `Price =< max_budget` |
| `loc_ok` | `target_location` substring in `Loc` or `Title` |
| `diet_ok` | If diet constraints exist, at least one `required_diet_token` matches tags/title/snippet |
| `activity_ok` | If activity constraints exist, at least one `required_activity_token` matches |
| `access_ok` | If accessibility constraints exist, at least one `required_access_token` matches |
| `matches` | All of the above must hold |

Output predicate: `@output("matches")`.

### SDK usage (`prometheux_chain`) — required

Prometheux is **SDK-only**. There is no REST or Python offline mirror — the backend fails with a clear error if the SDK or token is misconfigured.

```python
import prometheux_chain as px

px.config.set("PMTX_TOKEN", os.environ["PMTX_TOKEN"])
# Optional if SDK docs require it:
# px.config.set("JARVISPY_URL", "https://platform.prometheux.ai/jarvispy/{org}/{username}")
px.save_concept(project_id="weekend-planner", code=vadalog_program)
result = px.run_concept(project_id="weekend-planner", concept_name="matches")
```

#### Token setup

1. Sign up at [platform.prometheux.ai](https://platform.prometheux.ai).
2. Copy your API token into `PMTX_TOKEN` in `.env.local` (repo root) or `backend/.env`.
3. If the SDK requires it, set `JARVISPY_URL` to  
   `https://platform.prometheux.ai/jarvispy/{org}/{username}` (use your org and username from the platform).
4. Leave `PMTX_PROJECT_ID=weekend-planner` — the SDK creates/uses this namespace automatically; no manual project setup.

---

## Constraint schema

Request body for `POST /plan` (and frontend form):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | string | yes | City or area (e.g. `"Austin, TX"`) |
| `budget` | number | yes | Max spend per item / day (USD) |
| `diet` | string | yes | Dietary constraints (e.g. `"vegan, gluten-free"`) |
| `activities` | string | yes | Activity preferences (e.g. `"outdoor, music, museums"`) |
| `accessibility` | string | no | Accessibility needs (e.g. `"wheelchair accessible"`) |

### Normalized candidate schema (Tavily → Prometheux)

```json
{
  "id": "evt_1",
  "type": "event" | "restaurant",
  "title": "Jazz Fest",
  "url": "https://...",
  "snippet": "...",
  "price_estimate": 25,
  "location": "Austin",
  "tags": "outdoor,music"
}
```

---

## Data flow

```mermaid
sequenceDiagram
    participant User
    participant NextUI as NextJS_page
    participant API as api_plan_route
    participant FastAPI as backend_main
    participant Agent as agent_py
    participant Tavily
    participant Prometheux
    participant Gemini
    participant Langfuse
    participant File as cited_md

    User->>NextUI: location, budget, constraints
    NextUI->>API: POST /api/plan
    Note over API: SKIP_MPP=true by default
    API->>FastAPI: POST /plan
    FastAPI->>Agent: run_weekend_planner()
    Agent->>Tavily: parallel events + restaurants search
    Agent->>Prometheux: inject facts + Vadalog filter
    Note over Agent,Langfuse: @observe on each step
    Agent->>Gemini: format verified rows only
    Agent->>File: write cited.md
    Agent-->>FastAPI: itinerary + filter_stats
    FastAPI-->>API: 200 + body
    API-->>NextUI: plan result
```

### Tool pipeline

1. **Tavily** — two parallel searches (weekend events + restaurants matching diet/budget).
2. **Fact injection** — Tavily JSON → Vadalog `candidate(...)` facts + constraint facts.
3. **Prometheux Vadalog** — deterministic `matches` predicate; only passing rows continue.
4. **Gemini** (`gemini-3.1-pro-preview`) — narrative / structured JSON from **verified rows only**.
5. **`cited.md`** — filter stats + verified candidates table + itinerary + Sources section.

---

## Prometheux track — judge demo script

1. Show form submit → UI displays `16 → 5` style filter stats with `filter_method: sdk`.
2. Open Langfuse trace: highlight `filter-with-prometheux` between Tavily and Gemini.
3. Open `cited.md`: point to **Verified candidates** section (Vadalog-passed rows).
4. Explain: changing budget/diet in the form changes which rows survive — **deterministic**, not prompt luck.
5. *(Optional)* Set `SKIP_MPP=false` to show MPP scaffold on `/api/plan`.

---

## Architecture

| Layer | Path | Technology |
|-------|------|------------|
| UI | `frontend/` | Next.js, TypeScript, Tailwind |
| API proxy | `frontend/app/api/plan/route.ts` | Direct proxy (MPP optional) |
| Agent API | `backend/main.py` | FastAPI on `:8000` |
| Orchestrator | `backend/agent.py` | Tavily + Prometheux + Gemini + Langfuse |
| Filter | `backend/prometheux_filter.py` | Vadalog via `prometheux_chain` |
| Output | `backend/format_output.py` | `cited.md` writer |

---

## Environment variables

Copy root `.env.example` to `.env.local` (frontend keys) and `backend/.env` (Python keys).

| Variable | Service | Used by |
|----------|---------|---------|
| `SKIP_MPP` | — | Next.js API — `true` (default) skips MPP |
| `NEXT_PUBLIC_SKIP_MPP` | — | Browser client — mirrors server default |
| `MPP_SECRET_KEY` | MPP (optional) | Next.js API route when `SKIP_MPP=false` |
| `MPP_RECIPIENT` | MPP (optional) | Next.js API route |
| `MPP_CURRENCY` | MPP (optional) | Next.js API route |
| `BACKEND_URL` | — | Next.js → FastAPI (default `http://localhost:8000`) |
| `GEMINI_API_KEY` | Google AI | `agent.py` — itinerary generation |
| `TAVILY_API_KEY` | Tavily | `agent.py` — live search |
| `PMTX_TOKEN` | Prometheux | **Required** — `prometheux_filter.py` SDK auth |
| `JARVISPY_URL` | Prometheux | Optional JarvisPy endpoint if SDK requires it |
| `PMTX_PROJECT_ID` | Prometheux | Project namespace (default `weekend-planner`) |
| `LANGFUSE_PUBLIC_KEY` | Langfuse | Auto-configured SDK |
| `LANGFUSE_SECRET_KEY` | Langfuse | Auto-configured SDK |
| `LANGFUSE_HOST` | Langfuse | Default `https://cloud.langfuse.com` |

**MPP:** Scaffolded only. `SKIP_MPP=true` is the default — no wallet for hackathon demo. Set `SKIP_MPP=false` + MPP keys to enable the payment gate.

---

## Local runbook

```bash
# Terminal 1 — backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Health check: `curl http://localhost:8000/health` → `{ "ok": true }`

---

## Risk mitigations

| Risk | Mitigation |
|------|------------|
| MPP wallet not configured | `SKIP_MPP=true` default; route proxies directly to backend |
| Prometheux latency / SDK issues | Clear HTTP 502/503 errors with setup hints; no offline mirror |
| Gemini invents venues | Prometheux filter is gate; prompt forbids invented venues |
| Wrong `cited.md` path | `Path(__file__).resolve().parent.parent / "cited.md"` |
| Langfuse SDK drift | `from langfuse import observe, propagate_attributes` |
