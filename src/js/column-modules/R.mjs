/**
 * Column R: Total Rate in DN
 * Type: read-only
 * Instructions: {1.check first page of lease for text after "TOTAL INSTALLMENT" field. 2. Prompt user with info found in lease and in spreadsheet. 3. Set row S to true if user confirms match.}
 */

/**
 * Process row data for column R
 * @param {object} rowData - data of current row
 * @returns {*} - value for column R
 */
import ColumnHelpers from './column-helpers.js';

const ColumnR = {
  id: 'TotalRate',
  name: 'Total Rate',
  sheetColumn: 'Total Rate',
  resultColumn: 'R',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const expected = context.record[this.sheetColumn];
    const pdfValue = await ColumnHelpers.extractFieldFromPdf('TOTAL INSTALLMENT');
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

export default ColumnR;