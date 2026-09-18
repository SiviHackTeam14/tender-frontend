# tender-frontend

Angular client for TenderPilot. Requires **Node.js 20 or 22 LTS**.

## Run locally

```bash
git clone <this-repo-url>
cd tender-frontend
npm install
npm start
```

Then open [http://localhost:4200](http://localhost:4200).

`npm start` serves the app on port **4200**. Home (`/`) is Profile Select; `/board` is the Triage Board with the mock dossier drawer and criteria reasoning.

Mock mode is on by default (`useMock: true` in `src/app/environments/environment.ts`). The API URL is `http://localhost:8000`. Do not add Gemini keys, `.env` files, or other secrets to this repo.
