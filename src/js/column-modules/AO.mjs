/**
 * Column AO: Proof of Employment/Rental History/International Docs Uploaded
 * Type: {1. Navigate to the resident's Documents tab. 2. Prompt the user to complete this step manually
 * Instructions: and click "Next" when completed.
 */

/**
 * Process row data for column AO
 * @param {object} rowData - data of current row
 * @returns {*} - value for column AO
 */
import ColumnHelpers from "./column-helpers.mjs";

const ColumnAO = {
  id: "ProofOfDocsUploaded",
  name: "Proof of Employment/Rental History/International Docs Uploaded",
  sheetColumn: "Proof of Employment/Rental History/International Docs Uploaded",
  resultColumn: "AO",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(_row, _col, _context) {
    // User confirmation required
    return { success: true, requiresUserConfirmation: true };
  },

  displayData(_row, _col, _context) {
    return {
      fieldName: this.name,
      message:
        "Please verify that proof of employment, rental history, or international documents are uploaded. Navigate to the resident's Documents tab and click Next when completed.",
      requiresUserConfirmation: true,
    };
  },
};

export default ColumnAO;
