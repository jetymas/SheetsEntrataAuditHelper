# Project TODOs

- [x] **TOP PRIORITY: Robustly mock chrome.identity and Google login in all E2E tests**  
    Ensure no E2E test ever triggers a real Google login screen. Automatically inject chrome.identity stubs and intercept all Google OAuth/Sheets requests in every Puppeteer page (popup, background, content, new tabs, etc). Make this the default for all tests. Document and automate this approach.
- [x] Columns F-Q: Refactored for PDF validation or user confirmation
- [x] Implement `extractFieldFromPdf` helper in `src/js/column-modules/column-helpers.js`
- [x] Write Jest tests for `extractFieldFromPdf` in `tests/column-helpers.test.js`
- [x] **Implement remaining column modules (R–AO) via TDD**: All columns R–AO are implemented and tested. See notes/column-modules/list.md for tracking.
- [x] **Integrate helpers into Chrome extension (content script)**: All column modules and helpers are now dynamically loaded and invoked in the content script. User confirmation workflow for AO and similar columns is functional. See notes/todo.md for details.
- [x] **Integrate helpers into popup UI**: Connect column modules and helpers to popup UI, including user confirmation flows. See notes/popup-ui.md for progress.
  - *Completed*: Wiring popup.js, unit tests, and confirmation dialogs.
- [ ] **Review and refactor helpers/modules**: Ensure DRYness, clarity, and JSDoc coverage. Update or add tests as needed.
- [x] **Add E2E tests with Puppeteer**: Validate user flows in the extension. Track Puppeteer test files and coverage here. (e.g., `tests/e2e/audit.e2e.test.js` passing)
- [ ] **Write E2E tests for content script & background flows**: Cover scenarios in content.js and background.js via Puppeteer.
- [x] **Update project documentation**: Keep notes and TODOs current. Add/expand documentation for new helpers/modules.
- [x] **Documentation Migration and Repo Cleanup**
- [x] Migrate all documentation from `notes/` and `reference/` to `docs/`
- [x] Replace all stubs and placeholders in `docs/` with full content
- [x] Archive obsolete/historical files in `archive/`
- [x] Move images and supporting reference material to `docs/images/`
- [x] Final review and polish

### 2025-04-19: Migration & Archival Complete
- All documentation, guides, trackers, and images have been migrated to `docs/`.
- All stubs and placeholders have been replaced with full original content.
- The following have been archived in `archive/` for historical reference:
  - Entire `notes/` directory (all implementation notes, refactors, module notes)
  - Entire `reference/` directory (old requirements, persistent, error logs, images, webpages)
  - All legacy/historical files and migration notes
- Directory structure has been reviewed and is clean.
- No further stubs or placeholders remain in the repo.
- [ ] **Complete codebase refactor**: Finish refactoring tests and source files, extract helpers, streamline setup/teardown, and enforce consistent coding patterns across the project. Create a refactor document in the notes/refactors directory for each file, and then check off items in the refactor-checklist.md file once they have been completed.

## Completed Tasks
### Popup UI Integration
- [x] Integrate column modules and helpers into `popup.js`, including user confirmation dialogs for AO.
### Audit
- [x] Wire up popup.js to invoke column-modules and audit handlers on button clicks.
- [x] Add Jest unit tests for popup.js logic (e.g., spreadsheet URL parsing, button states.)
