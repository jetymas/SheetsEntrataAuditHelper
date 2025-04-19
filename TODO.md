# Project TODOs

- [x] **TOP PRIORITY: Robustly mock chrome.identity and Google login in all E2E tests**  
    Ensure no E2E test ever triggers a real Google login screen. Automatically inject chrome.identity stubs and intercept all Google OAuth/Sheets requests in every Puppeteer page (popup, background, content, new tabs, etc). Make this the default for all tests. Document and automate this approach.
- [x] Columns F-Q: Refactored for PDF validation or user confirmation
- [x] Implement `extractFieldFromPdf` helper in `src/js/column-modules/column-helpers.js`
- [x] Write Jest tests for `extractFieldFromPdf` in `tests/column-helpers.test.js`
- [x] **Implement remaining column modules (R–AO) via TDD**: All columns R–AO are implemented and tested. See notes/column-modules/list.md for tracking.
- [x] **Integrate helpers into Chrome extension (content script)**: All column modules and helpers are now dynamically loaded and invoked in the content script. User confirmation workflow for AO and similar columns is functional. See notes/todo.md for details.
- [ ] **Integrate helpers into popup UI**: Connect column modules and helpers to popup UI, including user confirmation flows. See notes/popup-ui.md for progress.
  - [ ] Validate user confirmation dialogs for Column AO via simulated events.
- [ ] **Review and refactor helpers/modules**: Ensure DRYness, clarity, and JSDoc coverage. Update or add tests as needed.
- [x] **Add E2E tests with Puppeteer**: Validate user flows in the extension. Track Puppeteer test files and coverage here. (e.g., `tests/e2e/audit.e2e.test.js` passing)
- [ ] **Write E2E tests for content script & background flows**: Cover scenarios in content.js and background.js via Puppeteer.
- [ ] **Update project documentation**: Keep notes and TODOs current. Add/expand documentation for new helpers/modules.
- [ ] **Complete codebase refactor**: Finish refactoring tests and source files, extract helpers, streamline setup/teardown, and enforce consistent coding patterns across the project. Create a refactor document in the notes/refactors directory for each file, and then check off items in the refactor-checklist.md file once they have been completed.

## Completed Tasks
### Popup UI Integration
- [x] Wire up popup.js to invoke column-modules and audit handlers on button clicks.
- [x] Add Jest unit tests for popup.js logic (e.g., spreadsheet URL parsing, button states.)
