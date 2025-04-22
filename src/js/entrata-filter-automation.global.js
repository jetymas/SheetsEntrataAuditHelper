/* global $ */
// Entrata Residents Filtering Automation (Global build for Puppeteer E2E)
// This file attaches applyEntrataResidentFilters to window, no module/UMD/ESM

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
  if (statusFilter && typeof $ === "function") $(statusFilter).trigger("filterchange");
  const subStatusFilter = document.getElementById("sub_status_filter");
  if (subStatusFilter && typeof $ === "function") $(subStatusFilter).trigger("filterchange");

  // Optionally: trigger the report generation
  // const submitBtn = document.querySelector('.generate-report.submit-filter');
  // if (submitBtn) submitBtn.click();
}

window.applyEntrataResidentFilters = applyEntrataResidentFilters;
