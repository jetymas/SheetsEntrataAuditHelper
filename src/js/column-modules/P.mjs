import ColumnHelpers from "./column-helpers.mjs";

const ColumnP = {
  id: "MonthlyConcessions",
  name: "Monthly Concessions",
  sheetColumn: "Monthly Concessions",
  resultColumn: "P",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const expected = context.record[this.sheetColumn];
    const pdfValue =
      await ColumnHelpers.extractFieldFromPdf("Monthly Concession");
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

export default ColumnP;
