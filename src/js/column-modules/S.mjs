import ColumnHelpers from "./column-helpers.mjs";

const ColumnS = {
  id: "DNMatchesLease?",
  name: "DN Matches Lease?",
  sheetColumn: "DN Matches Lease?",
  resultColumn: "S",

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
      message: "Please verify DN Matches Lease?.",
      requiresUserConfirmation: true,
    };
  },
};

export default ColumnS;
