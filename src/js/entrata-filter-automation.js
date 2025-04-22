/* global $, define */
// Entrata Residents Filtering Automation\n// This module automates filter selection on the Entrata residents page.\n// All selectors are referenced from the canonical Entrata residents HTML.\n\n/**\n * Apply resident filters in Entrata UI.\n * Example: Select Lease Status 'Current' and Sub Status 'Renewed'\n * @param {Object} options - e.g. { status: ['4'], subStatus: ['3'] }\n * @returns {Promise<void>}\n */\n/**
/* Apply resident filters in Entrata UI.
 * Example: Select Lease Status 'Current' and Sub Status 'Renewed'
 * @param {Object} options - e.g. { status: ['4'], subStatus: ['3'] }
 * @returns {Promise<void>}
 *
 * Canonical selectors and structure referenced from:
 * docs/webpages/Entrata page 2 - residents list/Entrata page 2 - residents.html
 * - #status_filter_items input[type=checkbox][value="<status>"]
 * - #sub_status_filter_items input[type=checkbox][value="<subStatus>"]
 */
function applyEntrataResidentFilters(options = {}) {

  // Lease Status:
  //   - Checkbox value '4' = Current
  // Sub Status:
  //   - Checkbox value '3' = Renewed

  // Status checkboxes
  const statusValues = options.status || [];
  statusValues.forEach(val => {
    const checkbox = document.querySelector(
      `#status_filter_items input[type="checkbox"][value="${val}"]`
    );
    if (checkbox && !checkbox.checked) checkbox.click();
  });

  // Sub Status checkboxes
  const subStatusValues = options.subStatus || [];
  subStatusValues.forEach(val => {
    const checkbox = document.querySelector(
      `#sub_status_filter_items input[type="checkbox"][value="${val}"]`
    );
    if (checkbox && !checkbox.checked) checkbox.click();
  });

  // Trigger filterchange events
  const statusFilter = document.getElementById("status_filter");
  if (statusFilter) $(statusFilter).trigger("filterchange");
  const subStatusFilter = document.getElementById("sub_status_filter");
  if (subStatusFilter) $(subStatusFilter).trigger("filterchange");

  // Optionally: trigger the report generation
  // const submitBtn = document.querySelector('.generate-report.submit-filter');
  // if (submitBtn) submitBtn.click();
}

// UMD export: CommonJS, ESM, or browser global
if (typeof module === "object" && typeof module.exports === "object") {
  module.exports = applyEntrataResidentFilters;
} else if (typeof define === "function" && define.amd) {
  define(function() { return applyEntrataResidentFilters; });
} else if (typeof window !== "undefined") {
  window.applyEntrataResidentFilters = applyEntrataResidentFilters;
}
