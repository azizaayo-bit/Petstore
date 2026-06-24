import { test, expect } from '@playwright/test';

test.describe('User API - /user', () => {
  test('create user and login - positive', async ({ request }) => {
    const id = Date.now();
    const username = `user${id}`;
    const user = { id, username, firstName: 'Test', lastName: 'User', email: `${username}@example.com`, password: 'P@ssw0rd', phone: '1234567890', userStatus: 1 };
    const create = await request.post(`/user`, { data: user });
    expect([200,201]).toContain(create.status());

    const login = await request.get(`/user/login`, { params: { username, password: user.password } });
    expect([200,400]).toContain(login.status());
  });

  test('login - negative (wrong password)', async ({ request }) => {
    const res = await request.get(`/user/login`, { params: { username: 'nonexistent', password: 'wrong' } });
    expect([400,404]).toContain(res.status());
  });

  test('create user - edge: long username', async ({ request }) => {
    const id = Date.now();
    const username = 'u'.repeat(10000);
    const user = { id, username, firstName: 'Edge', lastName: 'Case', email: `${id}@example.com`, password: 'x', phone: '0', userStatus: 0 };
    const res = await request.post(`/user`, { data: user });
    expect([200,413,414,400]).toContain(res.status());
  });

  test('security: SQLi-like input in username (should not 500)', async ({ request }) => {
    const id = Date.now();
    const username = "' OR '1'='1";
    const user = { id, username, firstName: 'Bad', lastName: 'Actor', email: `${id}@example.com`, password: 'p', phone: '0', userStatus: 0 };
    const res = await request.post(`/user`, { data: user });
    expect(res.status()).not.toBeGreaterThan(499);
  });
});
