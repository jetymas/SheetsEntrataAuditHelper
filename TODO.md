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
