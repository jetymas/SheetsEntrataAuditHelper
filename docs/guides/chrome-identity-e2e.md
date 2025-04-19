# Task: Detect and Handle Chrome Identity Automation Issues in E2E Tests

**Priority:** Highest (see TODO.md)

## Objective
Ensure E2E tests for the Entrata Lease Audit Assistant Chrome extension are robust against Google login/Chrome identity automation issues by:
- Detecting when the Google login page appears during tests.
- Automatically injecting stubs/mocks for the Chrome identity API so tests are never blocked by authentication prompts.
- Ensuring the extension's OAuth/identity-dependent flows are reliably testable in CI and local runs.

---

## Best Practices & Action Plan

### 1. Detection
- Detect Google login screens by URL pattern (`accounts.google.com`) or page selectors (e.g., `input[type=email]`).
- Add a helper in Puppeteer test setup to check for login screens after navigation or on network idle.

### 2. Stubbing/Mocking Chrome Identity
- Always inject a robust stub for `chrome.identity` (and related APIs) before running any test that triggers OAuth/identity flows.
- Stub should:
  - Return a fake OAuth token or user info.
  - Simulate successful authentication.
  - Log all calls for debugging.
- Ensure stubs are injected in both background and popup contexts if needed.

### 3. Automation
- Add logic to E2E helpers to automatically detect and bypass login screens by injecting the stub if a login page is detected.
- Optionally, auto-close login tabs/popups if they appear.

### 4. Test Coverage
- Add a dedicated E2E test that purposely triggers a login prompt and verifies the stub is used and the flow is unblocked.
- Document stub logic and how to extend it for future identity APIs.

---

## Implementation Steps
1. Create a reusable `chrome-identity-stub.js` for Puppeteer injection.
2. Update E2E test helpers to:
    - Detect login screens.
    - Inject the stub before/after navigation as needed.
