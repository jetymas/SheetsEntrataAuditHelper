import ColumnHelpers from './column-helpers.mjs';

const ColumnJ = {
  id: 'LeaseStartDate',
  name: 'Lease Start Date',
  sheetColumn: 'Lease Start Date',
  resultColumn: 'J',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    // Extract expected value from sheet
    const expected = context.record[this.sheetColumn];
    // Attempt to extract value from PDF (simulate extraction after "Start Date")
    const pdfValue = await ColumnHelpers.extractFieldFromPdf('Start Date');
    // Prompt user for confirmation (UI handled elsewhere)
    const match = pdfValue === expected; // In practice, would prompt user
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

export default ColumnJ;