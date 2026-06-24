# Swagger Petstore All Endpoints - Test Plan

## Application Overview

Comprehensive test plan derived from Swagger_Petstore_All_Endpoints_TestCases100.csv. Organized by endpoint area (Pet, Store, User) and covering Positive, Negative, Edge Case, Security, and Business Logic scenarios. Assumes access to https://petstore.swagger.io/v2 and a clean test state or unique test IDs.

## Test Scenarios

### 1. Pet endpoints

**Seed:** `seed.spec.ts`

#### 1.1. TC-001 Create pet with valid JSON body

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. Prepare unique pet payload (id, name, category, photoUrls, tags, status).
POST /pet with JSON body.
    - expect: HTTP 200 (or documented success).
    - expect: Response contains created pet id, name and status.
    - expect: GET /pet/{petId} returns the created pet.
  2. Cleanup: DELETE /pet/{petId}
    - expect: DELETE returns success; subsequent GET returns 404.

#### 1.2. TC-002 Reject invalid input for Add a new pet

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /pet with malformed/invalid JSON or unexpected fields.
    - expect: Client error (4xx) or documented API error; no 5xx server crash.

#### 1.3. TC-003 Boundary and unusual values for Add a new pet

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /pet with null fields, extremely long strings, missing optional fields.
    - expect: API gracefully handles inputs; either success or controlled 4xx; no 5xx.

#### 1.4. TC-004 Injection and unauthorized input for Add a new pet

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /pet with SQL injection and XSS payloads in strings.
    - expect: Inputs are sanitized or rejected; no execution of injected content; no sensitive error disclosure.

#### 1.5. TC-005 Pet lifecycle (create, retrieve, update, delete)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. Create pet, GET it, update (PUT) status or fields, verify changes, DELETE, verify not found.
    - expect: Lifecycle operations succeed; deleted pet is not retrievable.

#### 1.6. TC-011 Find pets by status (positive)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. GET /pet/findByStatus?status=available
    - expect: HTTP 200; response is array of pets with status 'available'.

#### 1.7. TC-016 Find pets by tags (positive)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. GET /pet/findByTags?tags=automation
    - expect: HTTP 200; response includes pets with the requested tag.

#### 1.8. TC-021 Get existing pet by ID (positive)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. GET /pet/{petId} for an existing pet id.
    - expect: HTTP 200; response contains pet details matching id.

#### 1.9. TC-026 Update pet using form data (positive)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /pet/{petId} with form fields `name` and `status`.
    - expect: HTTP 200; pet is updated accordingly.

#### 1.10. TC-036 Upload valid image for existing pet

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /pet/{petId}/uploadImage with multipart/form-data containing an image file.
    - expect: HTTP 200; ApiResponse indicates success and upload accepted.

### 2. Store endpoints

**Seed:** `seed.spec.ts`

#### 2.1. TC-041 Get store inventory (positive)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. GET /store/inventory
    - expect: HTTP 200; response is JSON map of inventory counts by status.

#### 2.2. TC-046 Create valid store order

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /store/order with valid order payload (id, petId, quantity, shipDate, status).
    - expect: HTTP 200; response contains order id and fields; GET /store/order/{orderId} returns the order.

#### 2.3. TC-051 Get existing order by ID

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. GET /store/order/{orderId}
    - expect: HTTP 200; response contains expected order details.

#### 2.4. TC-056 Delete existing order by ID

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. DELETE /store/order/{orderId}
    - expect: HTTP 200 or documented success; subsequent GET returns 404.

#### 2.5. TC-Store-Edge and Security Tests

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. Place orders with invalid quantities, extreme values, and injection/XSS payloads.
    - expect: Invalid inputs rejected with 4xx; no 5xx; inputs sanitized and no sensitive error details leaked.

### 3. User endpoints

**Seed:** `seed.spec.ts`

#### 3.1. TC-061 Create user with valid body

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /user with valid user JSON (id, username, firstName, lastName, email, password).
    - expect: HTTP success; user retrievable via GET /user/{username}.

#### 3.2. TC-066 Create multiple users (array/list)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. POST /user/createWithArray or /user/createWithList with multiple user objects.
    - expect: HTTP success; all users are created and retrievable.

#### 3.3. TC-076 Get existing user by username

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. GET /user/{username}
    - expect: HTTP 200; response contains user attributes matching creation payload.

#### 3.4. TC-081 Update existing user (positive)

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. PUT /user/{username} with updated user JSON.
    - expect: HTTP success; GET returns updated fields.

#### 3.5. TC-091 Login and Logout flow

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. Create user with known credentials, GET /user/login?username=&password=, then GET /user/logout.
    - expect: Login returns a success message and session info per API; logout accepted.

#### 3.6. TC-User-Edge and Security Tests

**File:** `specs/petstore-test-plan.md`

**Steps:**
  1. Attempt user creation/update with boundary values, SQL injection and XSS payloads.
    - expect: API rejects or sanitizes malicious input; no sensitive error details returned.
