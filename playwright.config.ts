import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30000,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://petstore.swagger.io/v2',
    extraHTTPHeaders: { 'Accept': 'application/json' }
  }
});
