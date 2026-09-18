# tender-frontend

Angular client for TenderPilot. Requires **Node.js 22.22.3+ or 24.15+**, matching
the installed Angular CLI; Node 24 is used for the extraction-flow tests.

## Run locally

```bash
git clone <this-repo-url>
cd tender-frontend
npm install
npm start
```

Then open [http://localhost:4200](http://localhost:4200).

`npm start` serves the app on port **4200**. Home (`/`) uploads a tender ZIP,
shows extraction progress, previews the extracted JSON and downloads the data.
The old `/board` URL redirects to extraction. No company selection or suitability
verdict is part of this flow; filtering and reasoning will be connected later.

The API URL is `http://localhost:8000` (`useMock: false` in
`src/app/environments/environment.ts`). Run the backend with
`uvicorn app.main:app --port 8000` and configure Gemini on the server. Do not add
Gemini keys, `.env` files, or other secrets to this repo.

`ExtractionService.upload(file)` returns a job ID; `watch(id)` polls progress.
`data(id)` fetches the 12 extracted fields from `/api/extractions/{id}/data`, and
`dataUrl(id)` links to the JSON download. The result view uses `job.result.fields`
directly, preserving nulls and arrays without notice-value fallbacks. The separate
audit contains source evidence and data-quality notes, not suitability decisions.
After a polling connection error, Resume checks the same job without re-uploading.

The reasoning types and legacy notice adapter remain available for future stages;
the active extraction service no longer offers `extractForTender` or imports them.
