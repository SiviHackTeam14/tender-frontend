import '@angular/compiler';
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { Injector, runInInjectionContext } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { of, Subject } from 'rxjs';

// Compile the real component/service for Node; no browser, Gemini or fake UI code.
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(join(root, '.extraction-test-'));
after(() => rm(temp, { recursive: true, force: true }));
await build({
  stdin: {
    contents: `export { TenderExtraction } from './src/app/components/tender-extraction/tender-extraction';
export { ExtractionService } from './src/app/services/extraction.service';`,
    resolveDir: root, loader: 'ts',
  },
  bundle: true, packages: 'external', platform: 'node', format: 'esm',
  outfile: join(temp, 'flow.mjs'), tsconfig: join(root, 'tsconfig.json'),
});
const { TenderExtraction, ExtractionService } = await import(pathToFileURL(join(temp, 'flow.mjs')));

const fields = {
  trade_type: 'Malerarbeiten', certifications_required: [], role_required: null,
  construction_window_start: null, construction_window_end: null,
  references_required: null, eigenleistung_min_pct: null,
  guarantee_required_eur: null, estimated_value_eur: null,
  complexity_markers: [], hidden_blockers: [],
};
const job = (status = 'completed') => ({
  id: 'job-1', filename: 'tender.zip', model: 'test', status,
  progress: { completed_chunks: 1, total_chunks: 1 }, error: null,
  result: status === 'completed' ? { fields, requires_review: true, evidence: {} } : null,
});

function fixture() {
  const upload = new Subject();
  const polls = [];
  const uploads = [];
  const api = {
    upload(file) { uploads.push(file); return upload; },
    watch(id) { const stream = new Subject(); polls.push({ id, stream }); return stream; },
  };
  const injector = Injector.create({ providers: [
    { provide: ExtractionService, useValue: api },
  ] });
  const component = runInInjectionContext(injector, () => new TenderExtraction());
  const choose = (file = new File(['zip'], 'tender.zip')) => component.selectFile({ target: { files: [file] } });
  const accept = () => upload.next({ id: 'job-1', status_url: '/api/extractions/job-1',
    audit_url: '/api/extractions/job-1/audit', data_url: '/api/extractions/job-1/data' });
  return { component, upload, polls, uploads, choose, accept,
    destroy: () => injector.destroy() };
}

test('upload and completion expose only document fields, including unknown nulls', () => {
  const f = fixture();
  f.choose();
  f.component.start();
  f.component.start();
  assert.equal(f.uploads.length, 1);
  assert.equal(f.component.busy(), true);
  f.accept();
  f.polls[0].stream.next(job('reading'));
  assert.equal(f.component.statusLabel(), 'Reading PDF pages');
  f.polls[0].stream.next(job());
  assert.equal(f.component.busy(), false);
  assert.deepEqual(JSON.parse(f.component.json()), fields);
  assert.equal(JSON.parse(f.component.json()).estimated_value_eur, null);
  assert.doesNotMatch(f.component.json(), /verdict|requires_review|evidence/);
  f.destroy();
});

test('polling errors resume the same job without another upload', () => {
  const f = fixture();
  f.choose(); f.component.start(); f.accept();
  f.polls[0].stream.error(new HttpErrorResponse({ status: 0 }));
  assert.equal(f.component.canResume(), true);
  f.component.start();
  assert.equal(f.uploads.length, 1);
  f.component.resume();
  assert.equal(f.polls.length, 2);
  assert.equal(f.polls[1].id, 'job-1');
  f.polls[1].stream.next(job());
  assert.equal(f.component.canResume(), false);
  assert.equal(f.component.error(), null);
  f.destroy();
});

test('expired jobs allow a fresh upload instead of endless resuming', () => {
  const f = fixture();
  f.choose(); f.component.start(); f.accept();
  f.polls[0].stream.error(new HttpErrorResponse({ status: 404,
    error: { detail: { message: 'Job not found or expired' } } }));
  assert.equal(f.component.canResume(), false);
  assert.equal(f.component.error(), 'Job not found or expired');
  assert.equal(f.component.jobId(), null);
  f.component.start();
  assert.equal(f.uploads.length, 2);
  f.destroy();
});

test('failed extraction shows its error and offers no data', () => {
  const f = fixture();
  f.choose(); f.component.start(); f.accept();
  f.polls[0].stream.next({ ...job('failed'), error: { code: 'failed', message: 'OCR required' } });
  assert.equal(f.component.error(), 'OCR required');
  assert.equal(f.component.busy(), false);
  assert.equal(f.component.canResume(), false);
  assert.equal(f.component.json(), '');
  f.destroy();
});

test('invalid uploads never reach the backend', () => {
  const f = fixture();
  f.choose(new File(['pdf'], 'tender.pdf'));
  f.component.start();
  assert.equal(f.uploads.length, 0);
  assert.match(f.component.error(), /ZIP/);
  f.choose({ name: 'large.zip', size: 51 * 1024 * 1024 });
  f.component.start();
  assert.equal(f.uploads.length, 0);
  assert.match(f.component.error(), /50 MiB/);
  f.destroy();
});

test('destroying the component stops polling updates', () => {
  const f = fixture();
  f.choose(); f.component.start(); f.accept();
  f.destroy();
  f.polls[0].stream.next(job());
  assert.equal(f.component.job(), null);
});

test('service uploads only the document and fetches JSON from the data endpoint', () => {
  const calls = [];
  const injector = Injector.create({ providers: [{ provide: HttpClient, useValue: {
    post(url, body) { calls.push({ url, body }); return of({ id: 'job-1' }); },
    get(url) { calls.push({ url }); return of(fields); },
  } }] });
  const service = runInInjectionContext(injector, () => new ExtractionService());
  const file = new File(['zip'], 'tender.zip');
  service.upload(file).subscribe();
  assert.equal(calls[0].url, 'http://localhost:8000/api/extractions');
  assert.deepEqual([...calls[0].body.keys()], ['file']);
  assert.equal(calls[0].body.get('file').name, file.name);
  service.data('job/1').subscribe(data => assert.deepEqual(data, fields));
  assert.equal(calls[1].url, 'http://localhost:8000/api/extractions/job%2F1/data');
  assert.equal(service.auditUrl('job/1'), 'http://localhost:8000/api/extractions/job%2F1/audit');
  assert.equal(service.extractForTender, undefined);
});
