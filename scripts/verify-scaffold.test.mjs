import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

describe('fresh clone run', () => {
  it('documents npm install && npm start on port 4200', () => {
    const pkg = JSON.parse(read('package.json'));
    const readme = read('README.md');
    assert.match(pkg.scripts.start, /ng serve --port 4200/);
    assert.match(readme, /npm install/);
    assert.match(readme, /npm start/);
    assert.match(readme, /localhost:4200/);
    assert.match(readme, /Node\.js 22\.22\.3\+ or 24\.15\+/);
  });
});

describe('home route', () => {
  it('maps / to document extraction', () => {
    const routes = read('src/app/app.routes.ts');
    const html = read('src/app/components/tender-extraction/tender-extraction.html');
    assert.match(routes, /path:\s*''[\s\S]*TenderExtraction/);
    assert.match(html, /Extracted JSON/);
    assert.doesNotMatch(html, /ACCEPT|BID|MAYBE|REJECT|profile-select/);
    assert.match(read('src/app/app.html'), /router-outlet/);
  });
});

describe('board route', () => {
  it('redirects the old board URL to extraction', () => {
    const routes = read('src/app/app.routes.ts');
    assert.match(routes, /path:\s*'board',\s*redirectTo:\s*''/);
    assert.doesNotMatch(routes, /TriageBoard|ProfileSelect/);
  });
});

describe('folder layout', () => {
  it('tracks models, data, services, component stubs, and environment', () => {
    const required = [
      'src/app/models/extraction.ts',
      'src/app/data/.gitkeep',
      'src/app/services/extraction.service.ts',
      'src/app/components/tender-extraction/tender-extraction.ts',
      'src/app/components/profile-select/profile-select.ts',
      'src/app/components/triage-board/triage-board.ts',
      'src/app/components/tender-card/.gitkeep',
      'src/app/components/tender-detail-drawer/.gitkeep',
      'src/app/environments/environment.ts',
    ];
    for (const rel of required) {
      assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
    }
    const env = read('src/app/environments/environment.ts');
    assert.match(env, /apiUrl:\s*'http:\/\/localhost:8000'/);
    assert.match(env, /useMock:\s*false/);
  });
});

describe('design tokens', () => {
  it('loads Inter and defines Stitch color CSS variables', () => {
    const index = read('src/index.html');
    const css = read('src/styles.css');
    assert.match(index, /fonts\.googleapis\.com[\s\S]*Inter/);
    assert.match(css, /--primary:/);
    assert.match(css, /--background:/);
    assert.match(css, /--bid:/);
    assert.match(css, /--maybe:/);
    assert.match(css, /--reject:/);
    assert.match(css, /font-family:\s*Inter,\s*system-ui/);
  });
});
