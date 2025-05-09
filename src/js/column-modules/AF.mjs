/**
 * Column AF: Application Signed by Applicant/Guarantor
 * Type: {1.Navigate to resident's documents page (check if currently in lease and just need to exit
 * Instructions: or if page is unknown). 2. Click on the "Application" document. 3. Go to page 12
 */

/**
 * Process row data for column AF
 * @param {object} rowData - data of current row
 * @returns {*} - value for column AF
 */
function processAF(_rowData) {
  // TODO: implement based on spec
  return {
    success: false,
    message: "Not implemented or not applicable.",
    requiresUserConfirmation: false
  };
}

export default {
  id: "AF",
  run: processAF
};
