/**
 * Column AG: Guarantor Form Signed
 * Type: {1. Return to resident's Documents page. 2. Select Lease - Signed. 3. On page 29
 * Instructions: find text "(Guarantor)". 3. Prompt the user to acknowledge if the page is signed. 4. If the user acknowledges
 */

/**
 * Process row data for column AG
 * @param {object} rowData - data of current row
 * @returns {*} - value for column AG
 */
function processAG(_rowData) {
  // TODO: implement based on spec
  return {
    success: false,
    message: "Not implemented or not applicable.",
    requiresUserConfirmation: false
  };
}

export default {
  id: "AG",
  run: processAG
};
