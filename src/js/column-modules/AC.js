import ColumnHelpers from './column-helpers.js';

const ColumnAC = {
  id: 'SpecialProvisions/LeaseNotes/One-TimeIncentives-specifyifapplicable',
  name: 'Special Provisions / Lease Notes / One-Time Incentives - specify if applicable',
  sheetColumn: 'Special Provisions / Lease Notes / One-Time Incentives - specify if applicable',
  resultColumn: 'AC',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const value = context.record[this.sheetColumn];
    return { success: true, pdfValue: value, expectedValue: value, normalizedPdfValue: value, normalizedExpectedValue: value, match: true };
  },

  displayData(row, col, context) {
    return { fieldName: this.name, pdfValue: context.result.pdfValue, expectedValue: context.result.expectedValue, match: true };
  }
};

export default ColumnAC;