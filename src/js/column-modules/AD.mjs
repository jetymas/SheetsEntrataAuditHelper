import ColumnHelpers from "./column-helpers.mjs";

const ColumnAD = {
  id: "LeaseSignedbyResident",
  name: "Lease Signed by Resident",
  sheetColumn: "Lease Signed by Resident",
  resultColumn: "AD",

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
      message: "Please verify Lease Signed by Resident.",
      requiresUserConfirmation: true,
    };
  },
};

export default ColumnAD;
