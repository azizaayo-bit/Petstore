# Petstore Playwright Tests

This project contains Playwright tests generated from `tests/Swagger_Petstore_All_Endpoints_TestCases100.csv`.

Setup:

```bash
npm install
npx playwright install
```

Run the CSV-driven test:

```bash
# run only the CSV-driven spec
npm run test:csv

# run all tests
npm test
```

You can override the API base URL with `TEST_BASE_URL` environment variable:

```bash
TEST_BASE_URL=https://your-api.test npm run test:csv
```
