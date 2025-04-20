# Modularization Plan: popup.mjs

## 1. Problem Analysis
The `popup.mjs` file for the Entrata Lease Audit Assistant Chrome extension currently contains all popup UI logic, audit orchestration, and direct DOM manipulation in a single, monolithic script. This makes the code difficult to test, maintain, and extend. The file mixes UI concerns, audit workflow orchestration, and communication with both background scripts and content scripts.

## 2. Goals
- **Separation of Concerns:** Break out UI logic, audit orchestration, and Chrome API communication into dedicated modules.
- **Testability:** Enable unit testing for audit orchestration and UI logic independently.
- **Maintainability:** Make it easy to update UI, audit flow, or communication logic without risk of breaking unrelated features.
- **Documentation:** Provide clear rationale and tracking for each modularization step.

## 3. Breakdown of popup.mjs Responsibilities
- **UI Initialization & DOM Event Binding** (initPopup)
- **Audit Flow Orchestration** (processAuditFlow)
- **Audit State Management** (currentAuditState, updateStatusUI)
- **Chrome Extension Messaging** (chrome.runtime.sendMessage, onMessage)
- **User Confirmation Dialog Workflow** (showVerificationDialog)
- **Helpers for Spreadsheet ID Extraction, Validation, and Storage**

## 4. Proposed Modular Structure
- `popup-ui.js` — Handles all DOM querying, event binding, and UI updates (status, progress, errors, dialogs).
- `popup-orchestrator.js` — Manages the audit flow, invokes column modules, and coordinates between UI and background.
- `popup-messaging.js` — Encapsulates Chrome extension messaging (sendMessage, onMessage, background communication).
- `popup-state.js` — Maintains and exposes audit state (status, current record, etc.) for UI and orchestrator.
- `popup-utils.js` — Utility functions for spreadsheet ID extraction, validation, and storage (chrome.storage).

## 5. Step-by-Step Modularization Plan
1. **Extract UI Logic:**
   - Move all DOM queries, event listeners, and UI update functions (e.g., updateStatusUI, showVerificationDialog) into `popup-ui.js`.
   - UI module should expose functions for updating status, errors, progress, and dialogs.
2. **Extract State Management:**
   - Move `currentAuditState` and related state helpers into `popup-state.js`.
   - Ensure state is updated only through this module.
3. **Extract Messaging Logic:**
   - Move all `chrome.runtime.sendMessage` and `onMessage` logic into `popup-messaging.js`.
   - Messaging module should expose functions for sending and receiving audit-related messages.
4. **Extract Audit Orchestration:**
   - Move `processAuditFlow` and related orchestration logic into `popup-orchestrator.js`.
   - Orchestrator should interact with state, UI, and messaging modules only via their interfaces.
5. **Extract Utilities:**
   - Move spreadsheet ID extraction, validation, and chrome.storage helpers into `popup-utils.js`.
6. **Refactor Main Entry:**
   - Refactor `popup.mjs` to only initialize the UI and wire together the orchestrator, state, UI, and messaging modules.
7. **Testing:**
   - Add Jest unit tests for UI, state, and orchestration modules.
   - Add Puppeteer integration tests for the popup UI flow.
8. **Documentation:**
   - Update this tracking document after each milestone.
   - Summarize rationale, challenges, and results.

## 6. Risks & Considerations
- **Chrome Extension Context:** Ensure that all modules interact with the DOM and Chrome APIs only in ways allowed by the popup context.
- **State Synchronization:** UI and orchestrator must always reflect the latest audit state.
- **Backward Compatibility:** All existing features and user flows must remain intact after refactor.

## 7. Next Steps
- [ ] Begin with UI logic extraction to `popup-ui.js`.
- [ ] Update this document after each extraction/refactor step.
- [ ] Track issues, blockers, and rationale for architectural decisions.

---

**Last updated:** 2025-04-20T04:24:34-04:00

---

Good vibes only! Modularization is the key to maintainable Chrome extensions. 😎
