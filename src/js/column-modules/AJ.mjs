import ColumnHelpers from "./column-helpers.mjs";

const ColumnAJ = {
  id: "Credit",
  name: "Credit",
  sheetColumn: "Credit",
  resultColumn: "AJ",

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(_row, _col, _context) {
    // User confirmation required
    return { success: true, requiresUserConfirmation: true };
  },

  displayData(_row, _col, _context) {
    return {
      fieldName: this.name,
      message: "Please verify Credit.",
      requiresUserConfirmation: true,
    };
  },
};

export default ColumnAJ;
