# Popup UI Integration Plan

This document outlines the integration of column modules and audit helpers into the `popup.mjs` UI logic.

## Objectives

- Invoke column-module functions from the popup when audit starts or skips records.
- Display and handle user confirmation dialogs triggered by certain columns (e.g., AO).
- Provide immediate UI feedback (validation, progress) using helper functions.

## Components

- **popup.mjs**: Main UI script, entry point via `initPopup()`.
- **Column Modules** (`src/js/column-modules/*.mjs`): Exports functions like `processColumnA(record)`, etc.
- **Helpers** (`src/js/column-modules/column-helpers.js`): Shared utilities (e.g., PDF parsing, verification dialogs).

## Integration Steps

1. **Import Modules and Helpers**
   - In `popup.mjs`, require or import a module index (e.g., `const modules = require('../column-modules');`).
2. **Audit Start Handler**
   - After extracting `spreadsheetId` and sending `startAudit` to background, also initialize column workflow:
     ```js
     const auditRecords = await fetchRecords(spreadsheetId);
     for (const record of auditRecords) {
       const result = await modules[`column${currentColumn}`](record);
       if (result.requiresConfirmation) {
         await showVerificationDialog(result.prompt);
       }
       updateStatusUI({ progress: ..., message: result.message });
     }
     ```
3. **Skip/Stop Actions**
   - Wire `skipRecordButton` and `stopAuditButton` to notify modules or helpers to abort/skip current processing.
4. **Unit Tests**
   - Add tests for `initPopup`, mocking modules and simulating click events.
   - Validate that the dialog and helpers are invoked with correct parameters.

## Next: Prototype Import and Invoke

- Add module index `src/js/column-modules/index.js` exporting all column functions.
