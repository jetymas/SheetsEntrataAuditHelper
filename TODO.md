# Entrata Lease Audit Assistant: TODO & Method Inventory

## Method Inventory by File

### src/js/AuditController.mjs
- getState()

### src/js/background.mjs
- _runAudit() (unused)

### src/js/popup.mjs
- processAuditFlow()
- [UI event handlers for Start/Stop Audit]

### src/js/updateStatus.mjs
- updateStatus()

### src/js/column-modules/*.mjs
- run() [in each module]
- displayData() [in some modules]

[...additional files and methods to be filled in as inventory proceeds]

## TODO
- [x] Document end-to-end workflow in docs/tracking/audit-workflow-notes.md
- [x] Inventory methods by file (expand as needed)
- [ ] Remove dead code: _runAudit() from background.mjs
- [ ] Continue modularization and refactor for clarity
- [ ] Ensure all tests pass after refactor
- [ ] Update documentation as changes are made

## 2025-04-20: Message Handler Audit
- Completed a full audit of all Chrome message handlers in content, background, and popup scripts.
- All handlers are compliant with Chrome async messaging best practices:
  - Async handlers using sendResponse return `true`.
  - Handlers returning Promises are handled correctly by Chrome.
  - Synchronous handlers using sendResponse do not need to return `true`.
- Added clarifying comments to `src/js/content.mjs` messageHandlers for future maintainers.
- No functional changes required; brief message port closed warnings are benign and not a code bug.
- See also: docs/tracking/MODULARIZATION_CONTENT_PLAN.md for modularization notes.
