import ColumnHelpers from './column-helpers.js';

const ColumnAS = {
  id: 'FutureStatusinEntrata(Manual)',
  name: 'Future Status in Entrata (Manual)',
  sheetColumn: 'Future Status in Entrata (Manual)',
  resultColumn: 'AS',

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

export default ColumnAS;