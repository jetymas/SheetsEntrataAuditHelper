import ColumnHelpers from "./column-helpers.mjs";

const ColumnAI = {
  id: "Criminal",
  name: "Criminal",
  sheetColumn: "Criminal",
  resultColumn: "AI",

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
      message: "Please verify Criminal.",
      requiresUserConfirmation: true,
    };
  },
};

export default ColumnAI;
