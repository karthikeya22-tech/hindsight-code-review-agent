# 🧠 CodeMind — Hindsight-Powered AI Code Review Agent (Prototype)

> **"CodeMind doesn't just review code. It remembers how our team reviews code and uses that knowledge in future reviews."**

CodeMind is a functional prototype demonstrating one clear capability: an AI code reviewer that **recalls team knowledge from Hindsight, generates a personalized review, learns from developer feedback via retain, and produces more team-specific reviews over time.**

This is NOT a production GitHub review platform. It is a demo-ready prototype of the Hindsight memory loop:

```
CODE → RECALL → HINDSIGHT → LLM REVIEW → SHOW REVIEW + MEMORY USED
  → ACCEPT/REJECT/TEACH → RETAIN → SIMILAR CODE → UPDATED MEMORY → PERSONALIZED REVIEW
```

## Why Hindsight

Hindsight by Vectorize is the long-term memory layer — not a cache or a log store:

- **retain** stores durable team knowledge (preferences, accepted/rejected review decisions).
- **recall** retrieves relevant memories per review using multi-strategy search (semantic, keyword, graph, temporal with reranking).
- The LLM receives actual recalled memories in its prompt; `memory_based=true` is only set when a real memory grounded the recommendation.
- The UI honestly distinguishes "No relevant team memories found" from "N memories used", and only reports "learned" after retain actually succeeds.

## Architecture

```
React/Vite/TS/Tailwind (frontend/)
   ↓  POST /api/review | /api/memory/teach | /api/feedback | GET /api/memory | /api/health
       POST /api/project | GET /api/project
FastAPI backend (backend/)
   ├── services/hindsight_service.py   # ONLY place that touches Hindsight (+recall_split, retain_project)
   ├── services/project_service.py     # active-project snapshot + knowledge-text builder
   ├── services/llm_service.py         # OpenAI-compatible LLM + transparent heuristic fallback
   ├── services/review_service.py      # project+team Recall → LLM orchestration
   ├── prompts/review_prompt.py        # project/team recall queries + structured prompt
   └── routes/{review,memory,feedback,project}.py
        ├── LLM (OpenAI-compatible, configured via env)
        └── Hindsight (bank: codemind-team)
```

Project vs team knowledge are distinguished by actual Hindsight context labels
(`project context` vs `team coding convention` / review-decision labels) plus
supported `tags` (`kind:project` / `kind:team`) — one bank, no duplicate systems.

## Hindsight integration (verified)

SDK: `hindsight-client==0.10.1` (`pip install hindsight-client`). Verified against official docs at `https://hindsight.vectorize.io/sdks/python`:

```python
from hindsight_client import Hindsight
client = Hindsight(base_url="http://localhost:8888", timeout=30.0)  # api_key=... optional
client.retain(bank_id="codemind-team", content="...", context="team coding convention")
results = client.recall(bank_id="codemind-team", query="...", max_tokens=2048, budget="mid")
for r in results.results:  # r.text, r.type, r.context, r.id, ...
    ...
client.create_bank(bank_id="codemind-team", name="CodeMind Team", mission="...")
client.list_memories(bank_id="codemind-team", limit=20)
```

All Hindsight access is isolated in `backend/services/hindsight_service.py`.

## How Recall works

1. `POST /api/review` builds a recall query from language + context + code snippet (`prompts/review_prompt.py::build_recall_query`).
2. `hindsight_service.recall()` calls Hindsight `recall` on the `codemind-team` bank.
3. Returned facts (`text/type/context`) are passed verbatim into the LLM prompt and returned to the UI as `memories_used`.

## How Retain works

- **Teach:** `POST /api/memory/teach` → `retain(content, context="team coding convention")`.
- **Feedback:** `POST /api/feedback` converts accept/reject (+ optional comment, issue title/recommendation) into a sentence like *"The team accepted the recommendation to use early returns…"* and retains it with context `accepted/rejected review decision`.
- Success is only reported when Hindsight's retain actually returns success.

## How feedback becomes memory

Each issue has **✓ Accept / ✕ Reject** (+ optional note). The decision text is retained in Hindsight, so the next similar review recalls *both* the original preference *and* the previous decision — visibly moving the review from generic to team-specific.

## Setup

### 1. Hindsight

Run a Hindsight server locally (Docker) or use Hindsight Cloud, then point the backend at it:

```bash
cp .env.example .env
# edit HINDSIGHT_BASE_URL (+ HINDSIGHT_API_KEY if your server needs it)
```

Local server (see https://hindsight.vectorize.io/developer/installation for current instructions):

```bash
docker run -p 8888:8888 vectorize/hindsight-api  # example; check docs for exact image/tag
```

The `codemind-team` bank is auto-created on first use.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxies /api → :8000)
```

### Environment variables (`.env`)

| Var | Purpose | Default |
|---|---|---|
| `HINDSIGHT_BASE_URL` | Hindsight API URL | `http://localhost:8888` |
| `HINDSIGHT_API_KEY` | Bearer token if required | _(empty)_ |
| `HINDSIGHT_BANK_ID` | Memory bank | `codemind-team` |
| `LLM_API_KEY` | OpenAI-compatible key; if empty, a labeled heuristic reviewer is used | _(empty)_ |
| `LLM_BASE_URL` | LLM endpoint | `https://api.openai.com/v1` |
| `LLM_MODEL` | Model name | `gpt-4o-mini` |

Never commit real keys. No secrets exist in frontend code (verify: `grep -ri "api_key\|api-key" frontend/src` returns nothing).

## Demo flow (the money slide)

**Project-aware review:**
1. **Project Setup:** create "E-Commerce Platform" (React, TypeScript, FastAPI, PostgreSQL; thin routes, service-layer logic) → retained in Hindsight as `project context`.
2. **Fat route:** review the "Route ⚡" sample (`create_order` doing `db.add/commit`) → 🟡 **Team Convention** issue grounded in the recalled project memory.
3. **Generic baseline:** review Sample 1 (`process_user`, nested ifs) → generic `suggestion`, no relevant memories.
4. **Teach:** *"Our team prefers early returns…"* → Remember → retained.
5. **Similar code:** review Sample 2 → 🟡 **Team Convention** with "Why?".
6. **Accept** → decision retained; re-review recalls preference **+** decision.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | status + Hindsight/LLM availability (+ active project) |
| POST | `/api/project` | create/update project → Hindsight retain (`project context`) |
| GET | `/api/project` | active project snapshot + memory status |
| POST | `/api/review` | `{code, language, context?}` → project-aware review + split memories |
| POST | `/api/memory/teach` | `{content}` → Hindsight retain |
| POST | `/api/feedback` | `{review_id, issue_id, decision, comment?}` → Hindsight retain |
| GET | `/api/memory` | learned-memories panel (list_memories, recall fallback) |

## Known limitations (prototype)

- No auth, no persistence beyond Hindsight + in-session history; review store is in-process.
- LLM is OpenAI-compatible only; without `LLM_API_KEY` a deterministic heuristic reviewer stands in (clearly labeled, memory-aware, so the loop still demos).
- Hindsight must be reachable for memory features; otherwise the app degrades honestly with "Hindsight unavailable" states.
- Review history is session-local; the "What CodeMind Learned" panel reflects real Hindsight data only.
