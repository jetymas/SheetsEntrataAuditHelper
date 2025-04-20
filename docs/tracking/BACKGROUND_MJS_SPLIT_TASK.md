# Task: Splitting `background.mjs` for Maintainability and Reduced Complexity

**Date:** 2025-04-20
**Author:** Cascade

---

## 1. Problem Analysis

The file `src/js/background.mjs` is extremely large (~950 lines, 30kB+) and contains several functions that far exceed recommended cognitive complexity. Deeply nested logic, multiple responsibilities, and global state make it difficult to maintain, test, and extend. IDE and linter warnings highlight the need for refactor and modularization.

### Key Problems

- **Cognitive Complexity:** Multiple functions (lines 142, 466, 715, 760, 870) exceed allowed complexity (up to 31).
- **Deep Nesting:** Functions nested >4 levels deep.
- **Mixed Responsibilities:** Handles Chrome messaging, audit orchestration, tab management, content script injection, Google Sheets API, and UI prompts all in one file.
- **Global State:** Uses a single `auditState` object for all audit-related state.
- **Difficult Testing:** Monolithic structure makes mocking and unit testing challenging.

---

## 2. Structure and Responsibilities (Current)

### Major Functional Areas

- **Imports:** Cookie helpers, audit types, status updater, Sheets API helpers.
- **Audit Orchestration:**
  - `startAudit(spreadsheetId, auditType)`: Main entry point for starting audits.
  - `runAudit()`, `processField()`, `updateSheetWithResult()`: Core audit logic and record/field handling.
- **Tab and Content Script Management:**
  - `ensureContentScriptLoaded(tabId)`: Ensures Entrata tab is ready and content script is injected.
  - Tab creation, validation, and user login handling.
- **Chrome Messaging:**
  - `chrome.runtime.onMessage.addListener`: Handles all extension messages (start/stop/skip audit, get state, etc).
- **State Management:**
  - Global `auditState` object used throughout.
- **Miscellaneous:**
  - Cookie management, permission checks, status updates, logging.

---

## 3. Proposed Modularization Plan

### A. **background-controller.js**

- Main audit orchestration: `startAudit`, `runAudit`, `processField`, `updateSheetWithResult`.
- State management for audit (could encapsulate `auditState` in a class or module).

### B. **background-messaging.js**

- All Chrome message listeners and message routing logic.
- Handles actions like `startAudit`, `stopAudit`, `skipRecord`, `getAuditState`, etc.

### C. **background-tabs.js**

- Tab creation, validation, Entrata tab management.
- Content script and CSS injection, tab existence checks.

### D. **background-permissions.js**

- Permission checks and error handling for Chrome APIs.

### E. **background-utils.js**

- Utility functions: status updates, cookie helpers, logging wrappers.

### F. **types/audit-state.js** (optional)

- Define and export the audit state shape/type for consistency and testability.

---

## 4. Refactor Steps

1. **Extract Tab/Content Script Logic:** Move all tab and content script management to `background-tabs.js`.
2. **Extract Messaging Logic:** Move all message listeners and handlers to `background-messaging.js`.
3. **Extract Permissions Logic:** Move permission checking to `background-permissions.js`.
4. **Encapsulate State:** Move `auditState` and related logic to a dedicated module or class.
5. **Extract Utilities:** Move status, logging, and cookie helpers to `background-utils.js`.
6. **Update Imports/Exports:** Refactor all imports/exports for new modules.
7. **Test After Each Step:** Run Jest and E2E tests to ensure no regressions.
8. **Document Each Change:** Log progress and rationale in this tracking file and update TODO.md.

---

## 5. Additional Recommendations

- **Reduce Cognitive Complexity:** After splitting, refactor large functions into smaller, purpose-driven helpers.
- **Improve Testability:** With smaller modules, add/expand unit tests for each responsibility.
- **Type Safety:** Consider using JSDoc or TypeScript for audit state and message types.
- **Documentation:** Add JSDoc comments for all new modules and exported functions.

---

## 7. Progress Log

### 2025-04-20: Extract Permissions Logic to `background-permissions.js`

**Rationale:**

- Permissions checking is a distinct responsibility and should be isolated from audit orchestration logic.
- Modularizing permissions logic enables better testability and future extension (e.g., requesting permissions dynamically).

**Summary of Changes:**

- Created `src/js/background-permissions.js`.
- Moved all Chrome permissions check/request logic to the new module.
- Refactored `background.mjs` to use `hasRequiredPermissions` from the new module.
- Updated imports/exports and resolved all related lint warnings.

### 2025-04-20: Extract Utility Functions to `background-utils.js`

**Rationale:**

- Utility functions (logging, error handling, sleep) are cross-cutting concerns and should be reusable across modules.
- Modularization improves clarity and reduces duplication.

**Summary of Changes:**

- Created `src/js/background-utils.js`.
- Added `logWithTimestamp`, `handleError`, and `sleep` utilities.
- Refactored imports in `background.mjs` (only import when used to avoid lint warnings).

---

**Next Steps:**

- Replace direct logging/error handling in `background.mjs` and related modules with utilities as further refactoring occurs.
- Continue modularization for any remaining helpers or logic in `background.mjs` (e.g., encapsulate auditState, further reduce cognitive complexity in large functions).
- Run Jest and Puppeteer tests to ensure all modularized code works as intended.
- Document each change and rationale in this tracking file and update TODO.md.

---

### 2025-04-20: Extract Tab/Content Script Logic to `background-tabs.js`

**Rationale:**

- Tab management and content script injection are distinct responsibilities from audit orchestration and messaging.
- Extracting this logic reduces cognitive complexity in `background.mjs` and enables easier testing and future enhancements (e.g., supporting multiple Entrata environments).

**Summary of Changes:**

- Created `src/js/background-tabs.js`.
- Moved all logic related to:
  - Ensuring content script and CSS are loaded in a tab (`ensureContentScriptLoaded`)
  - Creating a new Entrata tab (`createEntrataTab`)
  - Validating tab existence (`isTabValid`)
- Added JSDoc comments for clarity and future maintainability.
- Updated modularization plan and TODO.md to reflect progress.

**Next Steps:**

- Refactor `background.mjs` to import and use these new helpers.
- Continue with extraction of messaging logic to `background-messaging.js`.
- Run all Jest and Puppeteer tests to ensure no regressions.
- Review code for further simplification opportunities and document each change.

---

## 6. Next Steps

- [ ] Confirm modularization plan with Jesse.
- [ ] Begin with extracting tab/content script management (`background-tabs.js`).
- [ ] Update this file and TODO.md as each step is completed.

---

_Good vibes only! If you want a joke about Chrome extensions, just ask!_
