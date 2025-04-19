/**
 * Column T: Total Contract Amount in DN
 * Type: read-only
 * Instructions: {1.check third page of lease for text after "the sum of $" text. 2. Prompt user with info found in lease and in spreadsheet. 3. Set row U to true if user confirms match.}
 */

/**
 * Process row data for column T
 * @param {object} rowData - data of current row
 * @returns {*} - value for column T
 */
import ColumnHelpers from './column-helpers.js';

const ColumnT = {
  id: 'TotalContractAmount',
  name: 'Total Contract Amount',
  sheetColumn: 'Total Contract Amount',
  resultColumn: 'T',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const expected = context.record[this.sheetColumn];
    const pdfValue = await ColumnHelpers.extractFieldFromPdf('the sum of $', { page: 3 });
    const match = pdfValue === expected;
    return {
      success: true,
      pdfValue,
      expectedValue: expected,
      match,
      requiresUserConfirmation: !match
    };
  },

  displayData(row, col, context) {
    return {
      fieldName: this.name,
      pdfValue: context.result.pdfValue,
      expectedValue: context.result.expectedValue,
      match: context.result.match,
      requiresUserConfirmation: context.result.requiresUserConfirmation
    };
  }
};

export default ColumnT;