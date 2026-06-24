// spec: tests/Swagger_Petstore_All_Endpoints_TestCases100.csv

import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Single test that iterates all CSV rows and issues API requests
test.describe('CSV-driven API Tests', () => {
  test('Automate CSV test cases from Swagger_Petstore_All_Endpoints_TestCases100.csv', async ({ request }) => {
    const baseUrl = process.env.TEST_BASE_URL || 'https://petstore.swagger.io/v2';
    const rel = 'Swagger_Petstore_All_Endpoints_TestCases100.csv';
    const candidates = [
      path.resolve(__dirname, rel),
      path.resolve(process.cwd(), rel),
      path.resolve(process.cwd(), 'tests', rel),
      path.resolve(__dirname, '..', rel)
    ];
    let csvPath: string | undefined;
    for (const c of candidates){ if (fs.existsSync(c)){ csvPath = c; break; } }
    if (!csvPath) throw new Error('CSV not found in expected locations: ' + candidates.join(', '));
    const raw = fs.readFileSync(csvPath, 'utf8');

    function parseCSV(content, delimiter=';'){
      const rows = [];
      let cur = '';
      let row = [];
      let inQuotes = false;
      for (let i = 0; i < content.length; i++){
        const ch = content[i];
        if (ch === '"'){
          if (inQuotes && content[i+1] === '"'){
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === delimiter && !inQuotes){
          row.push(cur);
          cur = '';
        } else if ((ch === '\n' || ch === '\r') && !inQuotes){
          if (cur === '' && ch === '\r' && content[i+1] === '\n') continue;
          row.push(cur);
          cur = '';
          if (row.length === 1 && row[0] === ''){
            row = [];
            continue;
          }
          rows.push(row);
          row = [];
        } else {
          cur += ch;
        }
      }
      if (cur !== '' || row.length){
        row.push(cur);
        rows.push(row);
      }
      const header = rows.shift().map(h => h.trim());
      const objects = rows.map(r => {
        const obj = {} as any;
        for (let i = 0; i < header.length; i++){
          obj[header[i]] = (r[i] || '').trim();
        }
        return obj;
      });
      return objects;
    }

    const rows = parseCSV(raw);
    if (!rows || rows.length === 0) {
      throw new Error('No CSV rows parsed');
    }

    const results: any[] = [];

    for (const r of rows){
      const id = r['TestCaseID'] || r['Test Case ID'] || 'NO_ID';
      await test.step(`${id} - ${r['Test Case Title'] || r['Test Case Title']}`, async () => {
        const method = (r.Method || 'GET').toLowerCase();
        let endpoint = (r.Endpoint || '').trim();
        const td = r['Test Data / Request'] || '';
        function findParam(key){
          const kv = new RegExp(key + '\\s*=\\s*(\\d+)', 'i').exec(td) || new RegExp('"' + key + '"\\s*:\\s*(\\d+)', 'i').exec(td);
          if (kv) return kv[1];
          const anyNum = /([0-9]{1,18})/.exec(td);
          return anyNum ? anyNum[1] : undefined;
        }
        endpoint = endpoint.replace(/\{(\w+)\}/g, (_, p) => {
          const found = findParam(p) || findParam('id') || '1';
          return found;
        });

        let url = baseUrl + endpoint;
        if ((td.includes('=') && (endpoint.includes('findBy') || endpoint.includes('?') || td.includes('status=') || td.includes('tags='))) && !endpoint.includes('?')){
          const q = td.split(/\r?\n/).find(line => line.includes('=')) || td;
          if (!q.trim().startsWith('{') && q.includes('=')){
            url += (url.includes('?') ? '&' : '?') + q.trim().replace(/\r|\n/g, '&');
          }
        }

        let options: any = {};
        if (['post','put','patch'].includes(method)){
          const bodyText = td.trim();
          let parsedBody = undefined;
          if (bodyText.startsWith('{') || bodyText.startsWith('[')){
            try { parsedBody = JSON.parse(bodyText); } catch (e){ parsedBody = undefined; }
          } else if (bodyText.includes('=') && !bodyText.includes('{')){
            const form: any = {};
            bodyText.split(/\r?\n/).forEach(line => {
              const [k,v] = line.split('='); if (k) form[k.trim()] = (v || '').trim();
            });
            parsedBody = form;
          }
          if (parsedBody !== undefined){
            options.data = parsedBody;
            options.headers = {'Content-Type': 'application/json'};
          }
        }

        let status = null;
        let responseText = '';
        let ok = false;
        try {
          let response;
          if ((request as any)[method]){
            response = await (request as any)[method](url, options);
          } else {
            response = await request.get(url, options);
          }
          status = response.status();
          try { responseText = await response.text(); } catch (e) { responseText = '<no body>'; }

          const statusField = (r['Expected HTTP Status'] || r['ExpectedHTTPStatus'] || '');
          const m = statusField.match(/(\d{3})/);
          if (m){
            const expected = parseInt(m[1], 10);
            ok = (status === expected);
          } else {
            ok = !(status >= 500);
          }

        } catch (err){
          responseText = String(err);
          ok = false;
        }

        results.push({
          id,
          area: r.Area,
          endpoint: r.Endpoint,
          method: r.Method,
          url,
          expected: r['Expected HTTP Status'],
          status,
          ok,
          response: responseText
        });

      });
    }

    // ensure report folder exists
    const outDir = path.resolve(process.cwd(), 'test-results');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `csv-driven-report-${Date.now()}.json`);
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

    const failures = results.filter(r => !r.ok);
    if (failures.length){
      // include first 5 failures in the error message
      const sample = failures.slice(0,5).map(f => `${f.id} ${f.method} ${f.url} -> expected ${f.expected} got ${f.status}`).join('\n');
      throw new Error(`CSV-driven tests completed with ${failures.length} failures. Report: ${outPath}\nSample:\n${sample}`);
    }

  });
});
