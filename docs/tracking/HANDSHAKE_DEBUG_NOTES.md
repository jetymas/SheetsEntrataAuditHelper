# Handshake Debug Notes

## Date: 2025-04-21

### Observations
- Handshake mechanism works, but sometimes the content script handshake times out in the background script.
- Unsure if extra handshake or START_AUDIT messages are being sent.
- Multiple onUpdated events and handshake retries observed in logs.

### Debugging Steps
- Enhanced logging added to both background and content scripts:
  - Log every handshake send/receive, tab IDs, and URLs.
  - Log when onUpdated listener is added and removed.
  - Log every retry and timeout, including the tab URL.
  - Log all current readyTabs after each handshake.
- Added a guard to ensure handshake is only sent once per content script load.
- Added a cleanup for readyTabs when tabs are closed.

### Next Steps
- Reload extension and run audit again.
- Review logs for duplicate handshake or START_AUDIT messages, and for any remaining timeouts.
- If timeouts persist, check if content script is injected on the correct URL and if tab redirects are interfering.

### TODO
- Update this file with findings after next test.
- If needed, add more granular logging or investigate content script injection timing.
