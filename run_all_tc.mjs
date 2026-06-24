#!/usr/bin/env node
// Runs all test cases from Swagger_Petstore_All_Endpoints_TestCases100.csv
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import fetch from 'node-fetch';

const CSV = './Swagger_Petstore_All_Endpoints_TestCases100.csv';
const BASE = 'https://petstore.swagger.io/v2';

function parseExpectedStatuses(s) {
  if (!s) return [];
  const lowered = s.toLowerCase();
  if (lowered.includes('default')) return []; // treat as no explicit expected codes
  return s.split(/[,/]+/).map(x => x.trim()).map(tok => {
    const m = tok.match(/(\d{3})/);
    return m ? Number(m[1]) : null;
  }).filter(Boolean);
}

function tryParseJSON(s) {
  if (!s) return null;
  const t = s.trim();
  if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
    try { return JSON.parse(t.replace(/""/g, '"')); } catch(e) { return null; }
  }
  return null;
}

function parseKeyValueLines(s) {
  if (!s) return null;
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const obj = {};
  let found = false;
  for (const l of lines) {
    const m = l.match(/^([^=]+)=(.*)$/);
    if (m) { obj[m[1].trim()] = m[2].trim(); found = true; }
  }
  return found ? obj : null;
}

function buildRequest(record) {
  const method = (record.Method || 'GET').toUpperCase();
  const endpoint = (record.Endpoint || '').trim();
  const rawData = (record['Test Data / Request'] || '').trim();

  const jsonBody = tryParseJSON(rawData);
  const kv = parseKeyValueLines(rawData);

  // default headers
  const headers = { Accept: 'application/json' };
  let body = null;

  if (['POST','PUT','PATCH'].includes(method)) {
    if (jsonBody) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(jsonBody); }
    else if (kv) { headers['Content-Type'] = 'application/x-www-form-urlencoded'; body = Object.entries(kv).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); }
    else if (rawData) {
      // try JSON parse fallback
      try { JSON.parse(rawData); headers['Content-Type'] = 'application/json'; body = rawData; } catch(e) { body = rawData; }
    }
  }

  return { method, endpoint, headers, body, rawData, jsonBody, kv };
}

function buildUrl(endpoint, kv, rawData) {
  let url = BASE + endpoint;
  // replace path params {param} using kv if present or search rawData for param=val
  const params = (kv) ? kv : {};
  if (rawData) {
    const extraKv = parseKeyValueLines(rawData);
    if (extraKv) Object.assign(params, extraKv);
    // handle inline query string like username=abc&password=xyz
    const inlineQs = rawData.includes('&') && rawData.includes('=') ? rawData.split(/\s+|\n/).find(p=>p.includes('&') && p.includes('=')) : null;
    if (inlineQs) {
      // will append to URL if GET
      if (!url.includes('?') && inlineQs) url += (url.includes('?') ? '&' : '?') + inlineQs;
    }
  }

  const pathParamMatches = url.match(/\{([^}]+)\}/g) || [];
  for (const ph of pathParamMatches) {
    const key = ph.replace(/[{}]/g, '');
    const val = params[key] || '';
    url = url.replace(ph, encodeURIComponent(val));
  }

  return url;
}

(async function main(){
  const raw = await fs.readFile(CSV, 'utf8');
  const records = parse(raw, { delimiter: ';', columns: true, skip_empty_lines: true });

  const results = [];

  for (const rec of records) {
    const testId = (rec.TestCaseID || rec['TestCaseID'] || '').trim();
    const title = (rec['Test Case Title'] || rec['Test Case Title'] || '').trim();
    const expected = parseExpectedStatuses(rec['Expected HTTP Status'] || rec['Expected HTTP Status']);

    const req = buildRequest(rec);
    const url = buildUrl(req.endpoint, req.kv || req.jsonBody, req.rawData);

    const opts = { method: req.method, headers: req.headers };
    if (req.body) opts.body = req.body;

    let status = null, bodyText = null, ok = false, error = null;
    try {
      const resp = await fetch(url, opts);
      status = resp.status;
      bodyText = await resp.text();
      let parsed = null;
      try { parsed = JSON.parse(bodyText); } catch(_) { parsed = bodyText; }

      if (expected.length) ok = expected.includes(status);
      else ok = status >= 200 && status < 400;

      results.push({ testId, title, method: opts.method, url, status, ok, expected, response: parsed });
      console.log(`${testId} ${opts.method} ${url} -> ${status} ${ok ? 'PASS':'FAIL'}`);
    } catch (e) {
      error = String(e);
      results.push({ testId, title, method: opts.method, url, status: null, ok: false, expected, error });
      console.log(`${testId} ${opts.method} ${url} -> ERROR ${error}`);
    }
  }

  await fs.writeFile('test_results_all.json', JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
  const passed = results.filter(r=>r.ok).length;
  console.log(`\nCompleted ${results.length} tests: ${passed} passed, ${results.length - passed} failed. Results in test_results_all.json`);
})();
