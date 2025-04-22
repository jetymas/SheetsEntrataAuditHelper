# Sorting and Filtering Algorithms

_Last updated: 2025-04-21_

## Google Sheets

- **Filtering:**
  - `filterRecordsForGoogleSheets(records)`
  - Filters records for Lease Audit by: `record["Lease Type"] === "New"`

- **Sorting:**
  - `sortRecordsForGoogleSheets(records)`
  - Sorts filtered records by **Last Name** (ascending), then **First Name** (ascending).
  - Example order: Charlie Anderson, Bob Brown, Alice Smith

## Entrata (UI)

- **Filtering:**
  - Performed via DOM manipulation and UI automation using the module:
    - `src/js/entrata-filter-automation.js`
    - Function: `applyEntrataResidentFilters(options)`
      - Example: `{ status: ['4'], subStatus: ['3'] }` selects Lease Status "Current" and Sub Status "Renewed".
    - Canonical selectors:
      - `#status_filter_items input[type=checkbox][value="<status>"]`
      - `#sub_status_filter_items input[type=checkbox][value="<subStatus>"]`
    - All selectors and UI automation must reference:
      - `docs/webpages/Entrata page 2 - residents list/Entrata page 2 - residents.html`
      - This file is the canonical source for the Entrata residents page structure and selectors.
    - See also: E2E test in `src/js/__tests__/entrata-filter-automation.puppeteer.test.js` for validation.

- **Sorting:**
  - No sorting algorithm is applied in the content script.
  - Entrata UI already sorts records by **Last Name** (ascending) by default.
  - **Reference HTML:** Sorting order and column structure can be verified in the same HTML file above.

## Notes
- Sorting and filtering functions for Sheets are array-based and testable.
- Entrata filtering is UI-driven and not array-based.
- If you need to update or add an algorithm, document it here.
