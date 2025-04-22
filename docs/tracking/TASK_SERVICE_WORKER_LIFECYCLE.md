# Investigation: Service Worker/Background Script Lifecycle & Tab Loading Timing

## Objective
Determine if the background script (service worker) is being unloaded before the Entrata tab finishes loading, or if the tab never reaches 'complete' status—either of which would prevent the START_AUDIT message from being sent and could cause the port warning.

## Investigation Plan
1. **Check if service worker is still alive after tab creation:**
   - Add logging at the start and end of the onUpdated listener to detect if the listener is ever triggered.
   - Add a keep-alive mechanism (if needed) to ensure the service worker stays alive until the tab loads.

2. **Check if Entrata tab reaches 'complete' status:**
   - Log all invocations of the onUpdated listener and the status of the tab.
   - If the listener is never called, the tab may not be loading as expected or the listener is lost due to service worker unload.

3. **Check for race conditions:**
   - Confirm that the onUpdated listener is registered before any possibility of service worker shutdown.

## Next Steps
- Add detailed logging to background.mjs for service worker lifecycle and tab loading events.
- Test and capture logs to determine if/when the listener is triggered and if the tab reaches 'complete'.
- Update the main investigation tracking document with findings.

---

## Related Files
- src/js/background.mjs
- docs/tracking/TASK_ENTRATA_TAB_NOT_OPENING.md

## Notes
- If the service worker is unloading too early, consider implementing a keep-alive workaround (e.g., using a dummy port connection from the content script or popup).
- If the tab never reaches 'complete', investigate possible causes (network, permissions, etc.).
