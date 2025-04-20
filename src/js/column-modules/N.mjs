import ColumnHelpers from "./column-helpers.mjs";

const ColumnN = {
  id: "BaseRate",
  name: "Base Rate",
  sheetColumn: "Base Rate",
  resultColumn: "N",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    const expected = context.record[this.sheetColumn];
    const pdfValue = await ColumnHelpers.extractFieldFromPdf("Rent");
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

export default ColumnN;
