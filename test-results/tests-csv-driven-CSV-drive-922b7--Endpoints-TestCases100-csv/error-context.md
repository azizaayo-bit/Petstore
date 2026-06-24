# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\csv-driven.spec.ts >> CSV-driven API Tests >> Automate CSV test cases from Swagger_Petstore_All_Endpoints_TestCases100.csv
- Location: tests\csv-driven.spec.ts:9:7

# Error details

```
Error: CSV-driven tests completed with 55 failures. Report: c:\Users\aziayo\petstore-playwright-tests\tests\test-results\csv-driven-report-1781862362134.json
Sample:
TC-002 POST https://petstore.swagger.io/v2/pet -> expected 400 / 404 / default error expected got 500
TC-003 POST https://petstore.swagger.io/v2/pet -> expected 200 or controlled 4xx got 415
TC-005 POST https://petstore.swagger.io/v2/pet -> expected 200 or controlled business error got 415
TC-007 PUT https://petstore.swagger.io/v2/pet -> expected 400 / 404 / default error expected got 500
TC-008 PUT https://petstore.swagger.io/v2/pet -> expected 200 or controlled 4xx got 415
```

# Test source

```ts
  72  |     }
  73  | 
  74  |     const results: any[] = [];
  75  | 
  76  |     for (const r of rows){
  77  |       const id = r['TestCaseID'] || r['Test Case ID'] || 'NO_ID';
  78  |       await test.step(`${id} - ${r['Test Case Title'] || r['Test Case Title']}`, async () => {
  79  |         const method = (r.Method || 'GET').toLowerCase();
  80  |         let endpoint = (r.Endpoint || '').trim();
  81  |         const td = r['Test Data / Request'] || '';
  82  |         function findParam(key){
  83  |           const kv = new RegExp(key + '\\s*=\\s*(\\d+)', 'i').exec(td) || new RegExp('"' + key + '"\\s*:\\s*(\\d+)', 'i').exec(td);
  84  |           if (kv) return kv[1];
  85  |           const anyNum = /([0-9]{1,18})/.exec(td);
  86  |           return anyNum ? anyNum[1] : undefined;
  87  |         }
  88  |         endpoint = endpoint.replace(/\{(\w+)\}/g, (_, p) => {
  89  |           const found = findParam(p) || findParam('id') || '1';
  90  |           return found;
  91  |         });
  92  | 
  93  |         let url = baseUrl + endpoint;
  94  |         if ((td.includes('=') && (endpoint.includes('findBy') || endpoint.includes('?') || td.includes('status=') || td.includes('tags='))) && !endpoint.includes('?')){
  95  |           const q = td.split(/\r?\n/).find(line => line.includes('=')) || td;
  96  |           if (!q.trim().startsWith('{') && q.includes('=')){
  97  |             url += (url.includes('?') ? '&' : '?') + q.trim().replace(/\r|\n/g, '&');
  98  |           }
  99  |         }
  100 | 
  101 |         let options: any = {};
  102 |         if (['post','put','patch'].includes(method)){
  103 |           const bodyText = td.trim();
  104 |           let parsedBody = undefined;
  105 |           if (bodyText.startsWith('{') || bodyText.startsWith('[')){
  106 |             try { parsedBody = JSON.parse(bodyText); } catch (e){ parsedBody = undefined; }
  107 |           } else if (bodyText.includes('=') && !bodyText.includes('{')){
  108 |             const form: any = {};
  109 |             bodyText.split(/\r?\n/).forEach(line => {
  110 |               const [k,v] = line.split('='); if (k) form[k.trim()] = (v || '').trim();
  111 |             });
  112 |             parsedBody = form;
  113 |           }
  114 |           if (parsedBody !== undefined){
  115 |             options.data = parsedBody;
  116 |             options.headers = {'Content-Type': 'application/json'};
  117 |           }
  118 |         }
  119 | 
  120 |         let status = null;
  121 |         let responseText = '';
  122 |         let ok = false;
  123 |         try {
  124 |           let response;
  125 |           if ((request as any)[method]){
  126 |             response = await (request as any)[method](url, options);
  127 |           } else {
  128 |             response = await request.get(url, options);
  129 |           }
  130 |           status = response.status();
  131 |           try { responseText = await response.text(); } catch (e) { responseText = '<no body>'; }
  132 | 
  133 |           const statusField = (r['Expected HTTP Status'] || r['ExpectedHTTPStatus'] || '');
  134 |           const m = statusField.match(/(\d{3})/);
  135 |           if (m){
  136 |             const expected = parseInt(m[1], 10);
  137 |             ok = (status === expected);
  138 |           } else {
  139 |             ok = !(status >= 500);
  140 |           }
  141 | 
  142 |         } catch (err){
  143 |           responseText = String(err);
  144 |           ok = false;
  145 |         }
  146 | 
  147 |         results.push({
  148 |           id,
  149 |           area: r.Area,
  150 |           endpoint: r.Endpoint,
  151 |           method: r.Method,
  152 |           url,
  153 |           expected: r['Expected HTTP Status'],
  154 |           status,
  155 |           ok,
  156 |           response: responseText
  157 |         });
  158 | 
  159 |       });
  160 |     }
  161 | 
  162 |     // ensure report folder exists
  163 |     const outDir = path.resolve(process.cwd(), 'test-results');
  164 |     if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  165 |     const outPath = path.join(outDir, `csv-driven-report-${Date.now()}.json`);
  166 |     fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  167 | 
  168 |     const failures = results.filter(r => !r.ok);
  169 |     if (failures.length){
  170 |       // include first 5 failures in the error message
  171 |       const sample = failures.slice(0,5).map(f => `${f.id} ${f.method} ${f.url} -> expected ${f.expected} got ${f.status}`).join('\n');
> 172 |       throw new Error(`CSV-driven tests completed with ${failures.length} failures. Report: ${outPath}\nSample:\n${sample}`);
      |             ^ Error: CSV-driven tests completed with 55 failures. Report: c:\Users\aziayo\petstore-playwright-tests\tests\test-results\csv-driven-report-1781862362134.json
  173 |     }
  174 | 
  175 |   });
  176 | });
  177 | 
```