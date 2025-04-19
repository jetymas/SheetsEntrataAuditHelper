import ColumnHelpers from './column-helpers.js';

const ColumnG = {
  id: 'FloorPlan',
  name: 'Floor Plan',
  sheetColumn: 'Floor Plan',
  resultColumn: 'G',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const expected = context.record[this.sheetColumn];
    const found = await ColumnHelpers.findTextInPdf(expected);
    return {
      success: found,
      pdfValue: found ? expected : null,
      expectedValue: expected,
      normalizedPdfValue: found ? expected : null,
      normalizedExpectedValue: expected,
      match: found
    };
  },

  displayData(row, col, context) {
    return { fieldName: this.name, pdfValue: context.result.pdfValue, expectedValue: context.result.expectedValue, match: context.result.match };
  }
};

export default ColumnG;