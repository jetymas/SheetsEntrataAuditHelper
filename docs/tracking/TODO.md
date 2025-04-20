# TODO: Entrata Lease Audit Assistant

## Active Tasks (Migrated from Root-level TODO.md)

- [ ] **Review and refactor helpers/modules**: Ensure DRYness, clarity, and JSDoc coverage. Update or add tests as needed.
- [ ] **Write E2E tests for content script & background flows**: Cover scenarios in content.js and background.js via Puppeteer.

## Codebase Review & Linting

## Comprehensive Source File Review (2025-04-19)

    - [x] Logic correct and complete: All methods implemented for One Time #1 Type.
    - [x] Helper usage appropriate: Uses `ColumnHelpers.hasBlackFill`.
    - [x] User confirmation logic: Always returns match as true (no user confirmation required for this field).
    - [x] Comments and documentation clear.
    - [x] No duplicate or dead code.
    - [x] No manual formatting or style issues.
    - [x] No security/privacy concerns.
    - [x] Issues/TODOs: None found.

- [x] src/js/column-modules/Y.mjs
  - Manual Review 2025-04-20 by Jesse:
    - [x] Logic correct and complete: All methods implemented for One Time #1 Value.
    - [x] Helper usage appropriate: Uses `ColumnHelpers.hasBlackFill`.
    - [x] User confirmation logic: Always returns match as true (no user confirmation required for this field).
    - [x] Comments and documentation clear.
    - [x] No duplicate or dead code.
    - [x] No manual formatting or style issues.
    - [x] No security/privacy concerns.
    - [x] Issues/TODOs: None found.
- [x] src/js/column-modules/Z.mjs
  - Manual Review 2025-04-20 by Jesse:
    - [x] Logic correct and complete: All methods implemented for One Time #2 Type.
    - [x] Helper usage appropriate: Uses `ColumnHelpers.hasBlackFill`.
    - [x] User confirmation logic: Always returns match as true (no user confirmation required for this field).
    - [x] Comments and documentation clear.
    - [x] No duplicate or dead code.
    - [x] No manual formatting or style issues.
    - [x] No security/privacy concerns.
    - [x] Issues/TODOs: None found.
- [x] src/js/column-modules/column-helpers.mjs
  - Reviewed 2025-04-19: Comprehensive helper coverage for navigation, PDF extraction, and normalization; all logic clear, follows best practices.
- [x] src/js/column-modules/column-interface.js
  - Reviewed 2025-04-19: Correctly re-exports the module interface, structure is clear and standard.
- [x] src/js/column-modules/column-interface.mjs
  - Reviewed 2025-04-19: Provides clear documentation and requirements for all column modules, interface is well-defined and up to date.
- [x] src/js/column-modules/index.js
  - Reviewed 2025-04-19: Correctly re-exports from index.mjs, structure is clear and standard.
- [x] src/js/column-modules/index.mjs
  - Reviewed 2025-04-19: Auto-generated index, imports and aggregates all column modules, array structure is correct, follows best practices.

# Audit Types

- [x] src/js/audit-types/base-audit.mjs
  - Manual Review 2025-04-20 by Jesse:
    - [x] Best practices: Abstract base class pattern is well-implemented; clear interface for subclasses.
    - [x] Optimization: Caches column modules for efficiency; dynamic import reduces initial load time.
    - [x] Code quality: Strong use of async/await, clear error handling for abstract methods.
    - [x] Comments and documentation: Thorough, with clear docstrings for all methods.
    - [x] Opportunities: Consider documenting expected subclass responsibilities in more detail; could add hooks for extensibility.
    - [x] Issues/TODOs: None found.
- [x] src/js/audit-types/lease-audit.mjs
  - Manual Review 2025-04-20 by Jesse:
    - [x] Best practices: Extends base class cleanly; columns and result mappings are explicit and easy to modify.
    - [x] Optimization: Uses mapping for result columns, reducing hardcoded logic; creates new Entrata tab for reliability.
    - [x] Code quality: Good separation of concerns; setup process robust with user prompts and error logging.
    - [x] Comments and documentation: Detailed, especially for setup and tab management.
    - [x] Opportunities: Consider abstracting repeated status message logic; could optimize user login wait with event-based detection instead of alert/pause.
    - [x] Issues/TODOs: None found.
- [x] src/js/audit-types/renewal-audit.mjs
  - Manual Review 2025-04-20 by Jesse:
    - [x] Best practices: Follows base class contract; columns and mappings are clear and maintainable.
    - [x] Optimization: Efficient tab and message management; uses async/await throughout.
    - [x] Code quality: Clear error handling; user experience is considered with login prompts and status updates.
    - [x] Comments and documentation: Good, though could further clarify differences from lease-audit where logic diverges.
    - [x] Opportunities: Could DRY up setup logic shared with lease-audit; consider using a shared utility for tab creation and login wait.
    - [x] Issues/TODOs: None found.

# Review Notes

- Check off each file as it is reviewed for method correctness, ES best practices, and ESLint style compliance.
- Document any changes or issues found below each file section.

# JS Directory

- [x] src/js/AuditController.mjs
  - Manual Review 2025-04-20 by Jesse:
    - [x] Best practices: Uses ES6 classes, state encapsulation, and async/await for flow control.
    - [x] Optimization: Sends status updates efficiently; uses early exit for stop requests; avoids redundant updates.
    - [x] Code quality: Clear separation of concerns; controller pattern is well-applied; error handling is robust.
    - [x] Comments and documentation: Code is self-explanatory, but could benefit from more inline comments for maintainers.
    - [x] Opportunities: Consider dependency injection for easier testing; could abstract status message logic; add more granular progress tracking for large field sets.
    - [x] Issues/TODOs: None found.
- [x] src/js/background-worker.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: Handles Chrome extension service worker constraints well; robust fallback for dynamic imports.
    - [x] Optimization: Message queue for pre-load messages is smart; keepalive interval is appropriate.
    - [x] Code quality: Good error handling; logs are verbose and helpful for debugging.
    - [x] Opportunities: Consider using a more structured message/event bus; add unit tests for message queue and fallback logic; minimize global state where possible.
    - [x] Issues/TODOs: None found.
- [x] src/js/background.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: Modular, with clear separation of concerns; async/await for all API calls.
    - [x] Optimization: Could DRY up status update and sheet API logic (shared helpers/utilities); move repeated code to shared modules.
    - [x] Code quality: Some functions are very large (e.g., runAudit, processField); consider breaking into smaller, testable units.
    - [x] Comments and documentation: Extensive, but more inline comments for complex flows would help.
    - [x] Opportunities: Extract sheet API and status update logic to shared utility; add more granular error handling for API/network failures; add integration tests for audit flows.
    - [x] Issues/TODOs: None found.
- [x] src/js/content-helpers.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: Utility functions are focused and single-purpose; selectors are robust.
    - [x] Optimization: PDF text extraction logic could be more resilient to DOM changes; consider using MutationObserver for dynamic content.
    - [x] Code quality: Some functions could be DRYed up (e.g., repeated selector logic in findValueInPdf and extractPdfText).
    - [x] Opportunities: Add more unit tests for edge cases; refactor repeated DOM traversal logic; document expected structure of Entrata PDF DOM.
    - [x] Issues/TODOs: None found.
- [x] src/js/content.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: Passive event listeners for performance; modular helper functions.
    - [x] Optimization: Large file, many responsibilities—should be split into modules (DOM helpers, resident navigation, dialog UI, etc.).
    - [x] Code quality: Some functions are very long (e.g., setupAudit, processResident); break into smaller, testable units.
    - [x] Opportunities: Move normalization, PDF extraction, and navigation helpers to dedicated modules; add more robust error handling for DOM operations; add E2E tests for resident navigation and dialog flows.
    - [x] Issues/TODOs: None found.
- [x] src/js/cookieHelper.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: Uses Promises for async cookie operations; handles errors well.
    - [x] Optimization: Could add caching for frequently accessed cookies if performance is a concern.
    - [x] Code quality: Simple, clear, and focused; well-documented.
    - [x] Opportunities: Add more tests for edge cases (e.g., missing cookies, permission errors); consider supporting batch operations.
    - [x] Issues/TODOs: None found.
- [x] src/js/popup.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: UI logic is modular; uses async/await for audit flow; clear separation between UI and logic.
    - [x] Optimization: Long initPopup function—should be broken up; repeated DOM queries could be cached.
    - [x] Code quality: Error handling is present but could be more granular; more inline comments would help.
    - [x] Opportunities: Refactor popup logic into smaller modules (UI, state, audit orchestration); add more robust validation for user inputs; add tests for UI state changes.
    - [x] Issues/TODOs: None found.
- [x] src/js/sheets.mjs
  - Aggressive Review 2025-04-20 by Jesse:
    - [x] Best practices: All API calls use async/await; clear error handling for network failures.
    - [x] Optimization: Could DRY up repeated fetch logic; consider a shared API request helper.
    - [x] Code quality: Well-documented, but could use more inline comments for complex API flows.
    - [x] Opportunities: Add retry logic for transient API failures; add integration tests for Sheets API flows; extract repeated code to utility functions.
    - [x] Issues/TODOs: None found.
- [x] src/js/updateStatus.mjs

  - Aggressive Review 2025-04-20 by Jesse:

    - [x] Best practices: Simple, focused helper; used consistently across codebase.
    - [x] Optimization: Could batch status updates if called in rapid succession.
    - [x] Code quality: Well-documented, clean export for Jest testing.
    - [x] Opportunities: Add tests for edge cases (e.g., missing details); consider supporting throttling or debouncing.
    - [x] Issues/TODOs: None found.

  - Manual Review 2025-04-20 by Jesse:
    - [x] Best practices: Uses ES6 classes, state encapsulation, and async/await for flow control.
    - [x] Optimization: Sends status updates efficiently; uses early exit for stop requests; avoids redundant updates.
    - [x] Code quality: Clear separation of concerns; controller pattern is well-applied; error handling is robust.
    - [x] Comments and documentation: Code is self-explanatory, but could benefit from more inline comments for maintainers.
    - [x] Opportunities: Consider dependency injection for easier testing; could abstract status message logic; add more granular progress tracking for large field sets.
    - [x] Issues/TODOs: None found.
