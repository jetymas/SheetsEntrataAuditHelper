/**
 * Column V: Security Deposit in DN
 * Type: read-only
 * Instructions: {1.check first page of lease for text after "Security Deposit" field. 2. Prompt user with info found in lease and in spreadsheet. 3. Set row W to true if user confirms match.}
 */

/**
 * Process row data for column V
 * @param {object} rowData - data of current row
 * @returns {*} - value for column V
 */
import ColumnHelpers from "./column-helpers.mjs";

const ColumnV = {
  id: "SecurityDeposit",
  name: "Security Deposit",
  sheetColumn: "Security Deposit",
  resultColumn: "V",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const expected = context.record[this.sheetColumn];
    const pdfValue =
      await ColumnHelpers.extractFieldFromPdf("Security Deposit");
    const match = pdfValue === expected;
    return {
      success: true,
      pdfValue,
      expectedValue: expected,
      match,
      requiresUserConfirmation: !match,
    };
  },

  displayData(row, col, context) {
    return {
      fieldName: this.name,
      pdfValue: context.result.pdfValue,
      expectedValue: context.result.expectedValue,
      match: context.result.match,
      requiresUserConfirmation: context.result.requiresUserConfirmation,
    };
  },
};

export default ColumnV;
