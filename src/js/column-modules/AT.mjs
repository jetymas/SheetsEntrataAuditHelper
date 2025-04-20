import ColumnHelpers from "./column-helpers.mjs";

const ColumnAT = {
  id: "ScheduledBillingCorrect(Manual)",
  name: "Scheduled Billing Correct (Manual)",
  sheetColumn: "Scheduled Billing Correct (Manual)",
  resultColumn: "AT",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const value = context.record[this.sheetColumn];
    return {
      success: true,
      pdfValue: value,
      expectedValue: value,
      normalizedPdfValue: value,
      normalizedExpectedValue: value,
      match: true,
    };
  },

  displayData(row, col, context) {
    return {
      fieldName: this.name,
      pdfValue: context.result.pdfValue,
      expectedValue: context.result.expectedValue,
      match: true,
    };
  },
};

export default ColumnAT;
