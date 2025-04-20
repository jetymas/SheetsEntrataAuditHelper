import ColumnHelpers from "./column-helpers.mjs";

const ColumnF = {
  id: "Agent",
  name: "Agent",
  sheetColumn: "Agent",
  resultColumn: "F",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  // Alias for tests: evaluate returns simplified result
  async evaluate(context) {
    const expected = context.record[this.sheetColumn];
    const found = await ColumnHelpers.findTextInPdf(expected);
    return { success: found, value: found ? expected : null };
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
      match: found,
    };
  },

  displayData(row, col, context) {
    return {
      fieldName: this.name,
      pdfValue: context.result.pdfValue,
      expectedValue: context.result.expectedValue,
      match: context.result.match,
    };
  },
};

export default ColumnF;
