# Content Script Handshake Failure Tracking

## Problem Statement
The content script fails to complete the handshake with the background script when loading the Entrata Lease Audit Assistant extension. This results in a timeout and prevents the extension from functioning as intended.

## Error Log Analysis
### Entrata Site Console (`consoleoutput.log`)
- `chrome-extension://.../content.mjs:22 Uncaught SyntaxError: Cannot use import statement outside a module`
  - Indicates that the content script is being loaded in a context that does not support ES module syntax, or the script is not marked as a module in the manifest.

### Popup Console (`popupoutput.log`)
- Handshake attempts are repeatedly logged as retries (20 down to 1), followed by:
  - `[Entrata Audit][ERROR] Timeout waiting for content script handshake in tab ...`
- The popup loads, but no handshake is received from the content script.

### Worker Console (`workeroutput.log`)
- Similar pattern: handshake attempts and eventual timeout.

## Possible Causes
- **Content script is not executing due to a syntax error:** The `Uncaught SyntaxError: Cannot use import statement outside a module` means the browser is rejecting the script before any code runs, so no handshake message is sent.
- **Manifest configuration issue:** The content script may not be marked as `type: "module"` in the manifest, which is required for ES module syntax (import/export) in Chrome extensions.
- **Incorrect build output or file reference:** The content script file may be referenced incorrectly or not built/transpiled for the correct environment.

## Immediate Next Steps
1. **Check manifest.json:**
   - Ensure the content script entry uses `"type": "module"`.
   - Example:
     ```json
     "content_scripts": [
       {
         "matches": ["<all_urls>"],
         "js": ["src/js/content.mjs"],
         "type": "module"
       }
     ]
     ```
2. **Verify content.mjs syntax:**
   - Confirm that all `import` statements are valid and that the file is not being loaded as a classic script.
3. **Check for build/transpile step:**
   - If using a bundler or transpiler, ensure the output is compatible with Chrome's module support.

## Notes
- This is a blocking issue for extension functionality.
- See related modularization notes in `MODULARIZATION_CONTENT_PLAN.md`.

---
**Last updated:** 2025-04-22

---
**Action Items:**
- [ ] Check and update manifest.json for module content script support.
- [ ] Fix any ES module syntax or build issues.
- [ ] Re-test handshake and update this document with findings.
