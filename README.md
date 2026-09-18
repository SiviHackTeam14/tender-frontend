# TenderPilot — Frontend

**Hackathon:** SiviHack 2026 · Track 2 · Sponsor: Arctis AI
**Team:** XIVate

## What is this product?

A construction company gets ~40 public tenders a week and only has capacity to
bid on ~3 of them. Someone has to read every "Leistungsverzeichnis" (bill of
quantities, LV) PDF by hand just to know whether a tender is even worth
considering — long before anyone can judge whether it's a good *fit* for the
company.

**TenderPilot** is designed as an end-to-end triage assistant: upload/ingest
tenders → extract their requirements → filter out non-starters → let an LLM
explain, in plain bid-manager language, which 3 tenders the estimating team
should spend this week's time on and why the rest were set aside. The insight
behind it: *fit is not similarity* — a tender can match a company's trade
perfectly and still be a hard no (wrong region, budget, missing certification,
unavailable capacity).

This Angular app is the **frontend client**. In its current, working state it
covers the first step of that pipeline:

- Upload a tender ZIP.
- Watch live extraction progress against the backend.
- Preview the 12 extracted requirement fields as JSON.
- Download the extracted JSON.

The triage board (company profiles, BID/MAYBE/REJECT columns, 5-criteria
breakdown) exists in the codebase as components and mock data from the original
design, but is **not currently wired to a live company-profile/reasoning flow**
— see [Current limitations](#current-limitations).

## Setup and running the demo

Requires **Node.js 22.22.3+ or 24.15+** and the matching Angular CLI (pinned in
`package.json`).

```bash
cd frontend
npm install
npm start
```

Open **<http://localhost:4200>**.

This app talks to the backend at `http://localhost:8000`
(`environment.apiUrl`, `useMock: false`). Start the backend first — see
[`../backend/README.md`](../backend/README.md):

```bash
cd ../backend
source .venv/bin/activate
uvicorn app.main:app --port 8000
```

### Demo flow

1. Open <http://localhost:4200> (the old `/board` URL redirects here).
2. Upload a tender ZIP (e.g. a real bundle like the one in
   `../33_61_2026_Ausschreibungsunterlagen`).
3. Watch the status move through `queued → selecting → reading → extracting →
   completed`.
4. Preview the extracted 12-field JSON in the browser and download it.

No company selection or bid/no-bid verdict is part of this flow yet.

### Tests

```bash
npm test
```

Runs the scaffold verification script, the extraction-flow/adapter Node
tests, and an `ng build`.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Angular 22 (standalone components, signals) |
| Language | TypeScript ~6.0 |
| Reactive streams | RxJS |
| Build/dev server | Angular CLI / `@angular/build` (esbuild) |
| HTTP | Angular `HttpClient` (`provideHttpClient()`) |
| Formatting | Prettier |
| Testing | Node's built-in test runner (`node --test`) for scaffold/flow scripts, `ng build` as a smoke test |

## Dataset / API / library used

- **Backend API:** the [FastAPI extraction service](../backend) —
  `POST /api/extractions`, `GET /api/extractions/{id}`,
  `GET /api/extractions/{id}/data`, `GET /api/extractions/{id}/audit`.
  Contract documented in [`../backend/scripts/FRONTEND-INTEGRATION.md`](../backend/scripts/FRONTEND-INTEGRATION.md).
- **LLM (indirect, via backend):** Google Gemini (`gemini-3.8-flash`) —
  the frontend never holds or sends a Gemini key.
- **Sample tender data for manual testing:** the real Rolandbrunnen Nordhausen
  tender documents in `../33_61_2026_Ausschreibungsunterlagen`, and mock
  fixtures under `src/app/data/` (`tenders.json`, `profiles.json`,
  `analyses.json`) left over from the original triage-board design.
- **npm packages** (`package.json`):
  ```json
  "dependencies": {
    "@angular/common": "^22.1.0",
    "@angular/compiler": "^22.1.0",
    "@angular/core": "^22.1.0",
    "@angular/forms": "^22.1.0",
    "@angular/platform-browser": "^22.1.0",
    "@angular/router": "^22.1.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0"
  },
  "devDependencies": {
    "@angular/build": "^22.1.8",
    "@angular/cli": "^22.1.8",
    "@angular/compiler-cli": "^22.1.0",
    "esbuild": "0.28.2",
    "prettier": "^3.8.1",
    "typescript": "~6.0.2"
  }
  ```

## Current limitations

- **Only the extraction step is live.** `ExtractionService` (upload, poll,
  fetch data/audit) is the only flow actually calling the backend.
  `AnalysisService`, `ProfileService`, `TenderService` and the triage-board
  components (`ProfileSelectComponent`, `TriageBoardComponent`,
  `TenderCardComponent`, `TenderDetailDrawerComponent`, etc.) exist but run
  against static mock JSON, not the live Gemini reasoning/hard-filter pipeline
  described in the product vision above.
- **No company profile input yet** in the live flow — extraction results are
  shown per uploaded document, not matched against a company's capabilities.
- **No retry-safe re-upload.** After an uncertain network failure during
  polling, resume the *same* job (`watch(id)`) rather than re-uploading — a
  retry can duplicate a running job and its Gemini calls.
- **Single-user, local-only.** No authentication, no persisted state across
  reloads beyond the in-memory job the backend tracks for one hour.
- **Not mobile-responsive** — desktop demo layout only (explicitly out of
  scope for the hackathon).
