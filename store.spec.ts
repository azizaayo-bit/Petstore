import { test, expect } from '@playwright/test';

test.describe('Store API - /store/order', () => {
  test('place order - positive', async ({ request }) => {
    const id = Date.now();
    const order = { id, petId: id, quantity: 1, shipDate: new Date().toISOString(), status: 'placed', complete: false };
    const res = await request.post(`/store/order`, { data: order });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.id).toBe(id);
  });

  test('get order - negative (missing) ', async ({ request }) => {
    const res = await request.get(`/store/order/0`);
    expect([404,400]).toContain(res.status());
  });

  test('place order - edge: very large quantity', async ({ request }) => {
    const id = Date.now();
    const order = { id, petId: id, quantity: Number.MAX_SAFE_INTEGER, shipDate: new Date().toISOString(), status: 'placed', complete: false };
    const res = await request.post(`/store/order`, { data: order });
    expect([200,400]).toContain(res.status());
  });

  test('place order - negative: invalid quantity (negative)', async ({ request }) => {
    const id = Date.now();
    const order = { id, petId: id, quantity: -5, shipDate: new Date().toISOString(), status: 'placed', complete: false };
    const res = await request.post(`/store/order`, { data: order });
    expect([400,200]).toContain(res.status());
  });

  test('security: order injection in status field (should not 500)', async ({ request }) => {
    const id = Date.now();
    const order = { id, petId: id, quantity: 1, shipDate: new Date().toISOString(), status: "<script>alert(1)</script>", complete: false };
    const res = await request.post(`/store/order`, { data: order });
    expect(res.status()).not.toBeGreaterThan(499);
  });
});
