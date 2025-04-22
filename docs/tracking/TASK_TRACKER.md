# DEVELOPMENT TASK TRACKER for Entrata Lease Audit Assistant

## Task Migration Log

- **2025-04-20:** Migrated all completed checklist items and reviewed file entries from `TODO.md` to `docs/tracking/complete/TODO_complete.md`. `TODO.md` now tracks only active/incomplete tasks. Migration performed by Cascade as part of regular audit workflow and documentation best practices.

## High-level Milestones

1. Project Setup
2. Core Audit Logic
3. Content Script
4. Column Modules
5. Front-end (Popup) UI
6. Testing (Unit, Integration, E2E)
7. CI/CD Pipeline
8. Documentation
9. Packaging & Release
10. Manual QA & Validation

---

## 1. Project Setup

1.1. Create `manifest.json` with version, permissions (`tabs`, `activeTab`, `identity`, etc.).
1.2. Configure build tooling (webpack or Rollup) to bundle `src/js` into `dist/` folder.
1.3. Add linting/formatting (ESLint, Prettier) and pre-commit hooks.
1.4. Ensure `reference/webpages` served via local HTTP server for tests.

## 2. Core Audit Logic

- [x] 2.1. Finalize `BaseAuditType` abstract methods and error handling.
- [x] 2.2. Implement `LeaseAudit`:
  - Filter records by date and status.
  - Navigate Entrata pages (create tab, login prompt, wait, validate tab).
  - Send/receive messages for ping and setupAudit flows.
- [x] 2.3. Implement `RenewalAudit` with similar structure but different columns and filters.
- [x] 2.4. Refine state management and progress reporting.

## 3. Content Script

3.1. Create `content-script.js` to handle messages:

- `ping` → respond immediately.
- `setupAudit` → sort/filter DOM elements, return success.
- `processField` → extract data for a given column.
  3.2. Write selectors based on `reference/webpages` HTML.
  3.3. Test message listeners and DOM interactions.

## 4. Column Modules

4.1. Under `src/js/column-modules/`, create module for each column letter (e.g., `G.js`, `J.js`, …).
4.2. Each exports:

- `isApplicable(record)`
- `run(tabId, record)` → uses `chrome.tabs.sendMessage` to content script.
  4.3. Write unit tests for each module using jsdom-loaded HTML fixtures.

## 5. Front-end (Popup) UI

5.1. Design `popup.html` with Start/Stop buttons and progress display.
5.2. Implement `popup.mjs` to send messages to background (controller).
5.3. Style UI; show error and success messages.
5.4. Test popup interactions.

## 6. Testing

- [x] 6.1 **Unit Tests** (Jest):
  - Sheets API error paths.
  - AuditController start/stop flows and error injection.
  - BaseAuditType methods (skip, marking, dynamic import failures).
- [x] 6.2 **Integration Tests** (jsdom):
  - Load HTML from `reference/webpages` via jsdom.
  - Test content-script message handlers and DOM updates.
- [x] 6.3 **E2E Tests** (Puppeteer):
  - [x] Scaffold Puppeteer harness (`tests/e2e/audit.e2e.test.js`)
  - [x] Embed static server for `reference/webpages`
  - [x] Add JSON fixture for Sheets API (`tests/fixtures/sheetResponse.json`)
  - [x] Write assertions for flow completion
- [x] 6.4 Add fixtures under `tests/fixtures/` for spreadsheets and HTML.

## 7. CI/CD Pipeline

- [ ] 7.1 GitHub Actions:
  - [ ] `lint` & `unit tests` on pull request
  - [ ] `integration tests` on merge to main
  - [ ] `E2E tests` nightly or on tag
- [ ] 7.2 Enforce coverage ≥90%.

## 8. Documentation

8.1. Update `README.md`:

- Installation
- Build & Run
- Testing
- Directory Structure
  8.2. Add `CONTRIBUTING.md` guidelines.
  8.3. Diagram architecture in `docs/`.

## 9. Packaging & Release

9.1. Bundle extension assets into `.zip` or `.crx`.
9.2. Bump version in `manifest.json` and `package.json`.
9.3. Publish to Chrome Web Store; update changelog.

## 10. Manual QA & Validation

10.1. Install unpacked extension locally; test audit flows.
10.2. Verify with real Entrata staging pages.
10.3. Test edge cases: slow network, tab closure, popup interactions.
10.4. Log issues and iterate.

## Methods by File

- **src/js/sheets.js**

  - `getAuthToken()`
  - `fetchSheetData(spreadsheetId, sheetName = 'Lease Audit', headerRow = 8)`
  - `updateSheetCell(spreadsheetId, sheetName, cellRef, value)`
  - `addSheetComment(spreadsheetId, sheetName, cellRef, comment)`

- **src/js/AuditController.js**

  - `constructor()`
  - `getState()`
  - `start({ spreadsheetId, auditType })`
  - `stop()`

- **src/js/audit-types/base-audit.js**

  - `constructor(spreadsheetId, sheetName)`
  - `setUp()`
  - `findNext()`
  - `nextField()`
  - `markFieldProcessed(columnLetter, status)`
  - `isFieldApplicable(field, record)`
  - `filterRecords(records)`
  - `hasBlackFill(record, columnLetter)`

- **src/js/audit-types/lease-audit.js**

  - `constructor(spreadsheetId, sheetName)`
  - `setUp()`
  - `findNext()`

- **src/js/audit-types/renewal-audit.js**
  - `constructor(spreadsheetId, sheetName)`
  - `setUp()`
  - `findNext()`
  - `filterRecords(records)`
  - `getCheckboxColumn(dataColumn)`
