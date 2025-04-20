# Suggested Improvements: Impact vs. Ease Ranking

## Highest Impact, Easiest to Implement

1. **Extract Shared Utilities for Status Updates and Sheet API Logic**
   - *Impact*: High (reduces code duplication, improves maintainability, enables easier bug fixes and enhancements)
   - *Ease*: Easy (move repeated logic from `background.mjs`, `sheets.mjs`, `updateStatus.mjs` into shared utility modules)

2. **Break Up Large Functions into Smaller, Testable Units**
   - *Impact*: High (improves readability, testability, and debugging)
   - *Ease*: Easy/Moderate (identify large functions in `background.mjs`, `content.mjs`, `popup.mjs` and refactor into smaller helpers)

3. **Add More Inline Comments for Complex Flows**
   - *Impact*: Medium (aids onboarding and maintenance)
   - *Ease*: Easy (add comments explaining logic in complex or multi-step functions)

## High Impact, Moderate Effort

4. **Split Large Files into Focused Modules**
   - *Impact*: High (improves modularity, enables parallel development, easier to test and maintain)
   - *Ease*: Moderate (split `content.mjs` into DOM helpers, navigation, dialog UI, etc.; split `popup.mjs` logic)

5. **Add Unit and Integration Tests for Edge Cases and Flows**
   - *Impact*: High (increases reliability, prevents regressions, supports TDD)
   - *Ease*: Moderate (requires test scaffolding, especially for DOM and async flows)

## Medium Impact, Easy to Moderate Effort

6. **Refactor Repeated DOM Traversal and Selector Logic**
   - *Impact*: Medium (reduces bugs, improves maintainability)
   - *Ease*: Easy/Moderate (move repeated logic in `content-helpers.mjs` and `content.mjs` to utilities)

7. **Add More Robust Validation for User Inputs in Popup**
   - *Impact*: Medium (prevents user errors, improves UX)
   - *Ease*: Easy (add checks for spreadsheet URLs, audit type selection, etc.)

8. **Add More Granular Error Handling for API/Network Failures**
   - *Impact*: Medium (improves reliability, easier debugging)
   - *Ease*: Moderate (wrap API calls in try/catch, provide user feedback)

## Medium to Low Impact, Easy Effort

9. **Cache Frequently Accessed Cookies (if performance is an issue)**
   - *Impact*: Low/Medium (may improve performance in some scenarios)
   - *Ease*: Easy (add in-memory cache to `cookieHelper.mjs`)

10. **Batch or Debounce Status Updates**
    - *Impact*: Low/Medium (reduces message overhead in rapid-fire scenarios)
    - *Ease*: Easy (wrap status update calls in debounce/batch logic)

## Longer-Term, Higher Effort

11. **Add Retry Logic for Transient API Failures**
    - *Impact*: Medium/High (improves reliability for Sheets API and network calls)
    - *Ease*: Moderate/Hard (requires retry logic, exponential backoff, error reporting)

12. **Use MutationObserver for Dynamic PDF Content Extraction**
    - *Impact*: Medium (improves robustness against DOM changes in Entrata)
    - *Ease*: Moderate (requires new logic for observing DOM changes)

13. **Adopt a Structured Message/Event Bus for Background Workers**
    - *Impact*: Medium (enables more scalable, maintainable background logic)
    - *Ease*: Moderate/Hard (requires architectural changes)

---

## Prioritization Table

| Rank | Improvement                                           | Impact      | Ease     |
|------|-------------------------------------------------------|-------------|----------|
| 1    | Extract shared utilities (status/sheet API)           | High        | Easy     |
| 2    | Break up large functions                              | High        | Easy/Mod |
| 3    | Add more inline comments                              | Medium      | Easy     |
| 4    | Split large files into modules                        | High        | Moderate |
| 5    | Add more tests (unit/integration)                     | High        | Moderate |
| 6    | Refactor repeated DOM traversal/selector logic         | Medium      | Easy/Mod |
| 7    | More robust popup validation                          | Medium      | Easy     |
| 8    | Granular error handling for API/network               | Medium      | Moderate |
| 9    | Cache frequently accessed cookies                     | Low/Medium  | Easy     |
| 10   | Batch/debounce status updates                         | Low/Medium  | Easy     |
| 11   | Retry logic for API failures                          | Med/High    | Mod/Hard |
| 12   | MutationObserver for PDF extraction                   | Medium      | Moderate |
| 13   | Structured message/event bus for background workers   | Medium      | Mod/Hard |

---

**Recommendation:**
Start with the highest-impact, easiest improvements (utilities, function refactors, comments). Tackle modularization and more tests next. Plan for architectural changes (retry logic, event bus) as part of longer-term technical debt reduction.

---

_Manual ranking by Jesse, 2025-04-20. For each improvement, see TODO.md for context and rationale._
