# Modularization Plan: content.mjs

**File under review:** `src/js/content.mjs`
**Date:** 2025-04-20

## Modularization Plan for content.mjs

### Status (2025-04-20)
- **Message handling is now fully modularized.**
- All legacy/duplicate onMessage handler code has been removed from `content.mjs`.
- Only the modular `registerContentMessaging(messageHandlers)` and the `messageHandlers` object remain.
- All braces and structure have been verified and fixed.
- **ESLint passes with no syntax or parsing errors.**

### Rationale
- Prevents duplicate/legacy logic from causing syntax errors.
- Ensures maintainability and clarity of the content script.
- Aligns with project-wide modularization and best practices.

### Next Steps
- Continue modularizing field verification and helpers as planned.
- Maintain this structure for future features and refactors.

---

*Last updated: 2025-04-20 by Cascade AI*

## Rationale

- `content.mjs` is very large (~42KB) and likely contains mixed concerns (UI, messaging, business logic, PDF/text extraction).
- Modularizing will improve maintainability, testability, and clarity, and make onboarding and future enhancements easier.

## Current Responsibilities in content.mjs

- DOM/UI manipulation (dialogs, highlights, overlays, etc.)
- Chrome messaging (send/receive messages to/from background and popup)
- PDF/text extraction and parsing
- Field verification and audit business logic
- Possibly utility/helper functions

## Proposed Modules

| Module File             | Responsibility                                                  |
| ----------------------- | --------------------------------------------------------------- |
| `content-ui.js`         | All DOM querying, UI updates, dialog creation, overlays         |
| `content-messaging.js`  | All Chrome messaging (send/receive, message handlers)           |
| `pdf-utils.js`          | PDF parsing, text extraction, and related helpers               |
| `field-verification.js` | Business logic for verifying fields, record/field state machine |
| `content-helpers.js`    | Utility functions (if not already covered by existing helpers)  |

## Modularization Steps

1. **Audit `content.mjs`** for functions/sections matching the above responsibilities.
2. **Move** UI-related code to `content-ui.js`.
3. **Move** messaging code to `content-messaging.js`.
4. **Move** PDF/text extraction logic to `pdf-utils.js`.
5. **Move** field verification logic to `field-verification.js`.
6. **Move** utility/helper code to `content-helpers.js` (if not already modularized).
7. **Update imports/exports** in `content.mjs` to use new modules.
8. **Ensure all Jest/Puppeteer tests are updated or added for new modules.**
9. **Document rationale, changes, and next steps in this tracking file.**

## Next Steps

- Complete the above steps iteratively, committing and testing after each major move.
- Regularly update this document with progress, blockers, and rationale.

---

**Tracking file:** `docs/tracking/MODULARIZATION_CONTENT_PLAN.md`
**Add to TODO.md:**

- [ ] Modularize `content.mjs` per `docs/tracking/MODULARIZATION_CONTENT_PLAN.md`
