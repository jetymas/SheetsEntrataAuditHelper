import ColumnHelpers from "./column-helpers.mjs";

const ColumnB = {
  id: "Count/Remove",
  name: "Count/Remove",
  sheetColumn: "Count/Remove",
  resultColumn: "B",

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

export default ColumnB;
