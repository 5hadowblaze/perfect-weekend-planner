# Perfect Weekend Planner Agent

**Multiagents Hackathon (June 2026)** — deterministic autonomous agent for verified weekend itineraries.

## Core differentiator: Prometheux / Vadalog

Most agents let an LLM decide what’s “valid.” This project **separates search from verification**:

1. **Tavily** — live web search for events + restaurants (non-deterministic retrieval).
2. **Prometheux / Vadalog** — **deterministic constraint gate** over normalized facts (budget, location, diet, activities, accessibility). Only rows that pass Vadalog rules continue.
3. **Gemini** — formats a human-readable itinerary from **Prometheux-verified rows only** (no invented venues).
4. **Langfuse** — full trace of agent → tools → generation.
5. **`cited.md`** — published table showing filter stats, verified candidates, and cited sources.

```
Tavily (search) → Prometheux/Vadalog (deterministic filter) → Gemini (format only) → cited.md
```

### Vadalog ontology (judge-friendly)

| Fact / rule | Purpose |
|-------------|---------|
| `candidate(id, type, title, url, price, loc, tags, snippet)` | Tavily rows injected as facts |
| `max_budget(N)` | Per-item budget ceiling |
| `target_location("austin")` | Location substring match in `loc` or `title` |
| `required_diet_token("vegan")` | Diet keyword match in tags/title/snippet |
| `required_activity_token("music")` | Activity tag match |
| `required_access_token("wheelchair")` | Accessibility keyword match |
| `matches(...)` | Output predicate — only passing rows |

Filter method is always `sdk` via `prometheux_chain` — no REST or Python fallback.

## Prometheux track — demo talking points

1. **Anti-hallucination gate** — Gemini never sees raw Tavily results; only Vadalog `matches` rows.
2. **Explainable constraints** — Rules are explicit Datalog, not prompt engineering.
3. **`prometheux_chain` SDK** — `px.config.set("PMTX_TOKEN", …)`, `save_concept`, `run_concept` on concept `matches`.
4. **Observable filter stats** — API returns `filter_stats: { candidates_in, candidates_out, filter_method }`.
5. **`cited.md` audit trail** — Shows which candidates passed Vadalog rules before itinerary formatting.

## Stack

| Layer | Technology |
| --- | --- |
| UI | Next.js, TypeScript, Tailwind CSS |
| Live search | Tavily AI |
| **Deterministic filter** | **Prometheux / Vadalog** (`prometheux_chain`) |
| Itinerary formatting | Gemini (`gemini-3.1-pro-preview`) |
| Observability | Langfuse |
| Agentic payments | MPP — **scaffolded only, optional** (`SKIP_MPP=true` default) |
| Backend | Python FastAPI |

## Project structure

```
frontend/     # Next.js form + /api/plan proxy (MPP optional)
backend/      # agent.py: Tavily → Prometheux → Gemini → cited.md
cited.md      # Generated output at repo root
Design.md     # Full PDD + architecture
```

## Prometheux setup (required)

The deterministic filter **requires** the Prometheux SDK and a valid API token. There is no offline mirror.

1. **Sign up** at [platform.prometheux.ai](https://platform.prometheux.ai).
2. **Copy your API token** into `PMTX_TOKEN` in `.env.local` at the repo root.
3. **Set `JARVISPY_URL`** if the SDK docs require it:  
   `https://platform.prometheux.ai/jarvispy/{org}/{username}`
4. **Leave `PMTX_PROJECT_ID=weekend-planner`** — default namespace; no manual project creation.

Restart the backend after updating env vars.

## Getting started

Copy `.env.example` to `.env.local` (repo root). **MPP is off by default** — no wallet setup needed for the demo.

```bash
# Terminal 1 — backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000`, submit constraints, and check:

- UI shows Prometheux filter stats (`candidates_in` → `candidates_out`)
- `cited.md` at repo root lists verified candidates + itinerary
- Langfuse trace: `search-weekend-options` → `filter-with-prometheux` → `build-itinerary`

### Required keys

| Variable | Required | Notes |
|----------|----------|-------|
| `GEMINI_API_KEY` | yes | Itinerary formatting |
| `TAVILY_API_KEY` | yes | Live search |
| `PMTX_TOKEN` | yes | Prometheux SDK — Vadalog filter gate |
| `JARVISPY_URL` | maybe | JarvisPy endpoint if SDK requires it |
| `PMTX_PROJECT_ID` | no | Defaults to `weekend-planner` |
| `LANGFUSE_*` | optional | Tracing |
| `MPP_*` | optional | Set `SKIP_MPP=false` to enable payment gate |

## License

Private hackathon submission.
