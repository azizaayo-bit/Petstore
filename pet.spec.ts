import { test, expect } from '@playwright/test';

test.describe('Pet API - /pet and /pet/{petId}', () => {
  test('create pet - positive', async ({ request }) => {
    const id = Date.now();
    const body = { id, name: `Dog-${id}`, photoUrls: [], status: 'available' };
    const res = await request.post(`/pet`, { data: body });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(id);
    expect(json.name).toBe(body.name);
  });

  test('get pet by id - positive', async ({ request }) => {
    const id = Date.now();
    const name = `Cat-${id}`;
    await request.post(`/pet`, { data: { id, name, photoUrls: [], status: 'available' } });
    const res = await request.get(`/pet/${id}`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name).toBe(name);
  });

  test('get pet - negative (not found)', async ({ request }) => {
    const res = await request.get(`/pet/0`);
    expect([404, 400]).toContain(res.status());
  });

  test('create pet - edge: very long name', async ({ request }) => {
    const id = Date.now();
    const longName = 'x'.repeat(10000);
    const res = await request.post(`/pet`, { data: { id, name: longName, photoUrls: [], status: 'available' } });
    expect([200,413,414]).toContain(res.status());
  });

  test('create pet - security: injection-like name (should not 500)', async ({ request }) => {
    const id = Date.now();
    const malicious = "'; DROP TABLE pets; --";
    const res = await request.post(`/pet`, { data: { id, name: malicious, photoUrls: [], status: 'available' } });
    expect(res.status()).not.toBeGreaterThan(499);
  });
});
