# RIGOROUS TEST PLAN for Entrata Lease Audit Assistant

## 1. Objective
Ensure the Chrome extension and its audit logic work reliably and handle real-world Entrata pages, diverse data sets, and edge cases.

## 2. Scope
- Unit tests (logic, error handling)
- Integration tests (API mocks, data flows)
- End-to-end tests (with reference HTML pages)
- Manual test plan
- Performance & reliability checks
- Continuous integration & coverage

---

## 3. Unit Testing
- **Sheets module**: cover fetchSheetData, updateSheetCell, addSheetComment error paths (HTTP 4xx/5xx, token errors, malformed JSON).
- **AuditController**: simulate start/stop, verify state transitions, error injection in fetch/update calls.
- **BaseAuditType**: methods nextField, markFieldProcessed, hasBlackFill under varied record shapes.
- **Audit types (LeaseAudit/RenewalAudit)**: stub chrome APIs; test setUp branches (login prompt, tab invalid, ping fail, setupAudit timeout).

### Tools: Jest + jest-fetch-mock

---

## 4. Integration Testing
- Use jsdom to load `reference/webpages/**/*.html` into DOM.
- Mock `chrome.tabs.create`, `.get`, `.sendMessage`, and `chrome.runtime.sendMessage` to interact with DOM.
- Verify that selectors and messages in audit types match actual page structure.
- Test HTML parsing and element interactions (e.g., sorting, filtering, form submission flows).

### Tools: Jest + jsdom-global or Puppeteer with headless Chromium

---

## 5. End-to-End (E2E) Testing
- Automate real browser runs:
  - Install extension in headless Chrome (use Puppeteer).
  - Load sample Google Sheet data and reference Entrata pages locally (serve via local webserver).
  - Execute full audit flow: login prompt, tab creation, content script injection, field verification, sheet updates.
  - Capture logs, screenshots, and network traces.

### Tools: Puppeteer, Selenium, Playwright

---

## 6. Manual Testing Checklist
1. Install extension in developer mode.
2. Load mock sheet (with test records) and open Entrata reference pages.
3. Trigger audit; confirm alerts and prompts.
4. Verify sheet updates and comments match expected results.
5. Test stop mid-audit and resume behavior.
6. Validate error messages on failures (network down, content script missing).

---

## 7. Performance & Reliability
- Measure total execution time for N records (e.g., 10, 100, 500).
- Test under slow network (throttle API calls).
- Ensure no memory leaks and error recovery (retry logic).

---

## 8. Continuous Integration
- Integrate Jest coverage report (>90% statements).
- Add GitHub Actions workflow:
  - Run lint, unit, integration tests on PR.
  - Build and run E2E tests on merge to main.

---

## 9. Test Data & Fixtures
- Create sample spreadsheets with:
  - Complete records, missing fields, black-fill flags.
  - Renewal vs. new lease scenarios.
- Store fixtures under `__tests__/fixtures/`.

---

## 10. Maintenance & Review
- Review tests after any DOM update in Entrata.
- Update selectors and timeouts accordingly.
- Schedule periodic run against live Entrata pages in staging.
