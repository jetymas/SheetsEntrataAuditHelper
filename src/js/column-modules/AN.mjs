import ColumnHelpers from "./column-helpers.mjs";

const ColumnAN = {
  id: "Leap-Correct\"StudentwithLeap\"RelationshipUsed",
  name: "Leap - Correct \"Student with Leap\" Relationship Used",
  sheetColumn: "Leap - Correct \"Student with Leap\" Relationship Used",
  resultColumn: "AN",

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
      message:
        "Please verify Leap - Correct \"Student with Leap\" Relationship Used.",
      requiresUserConfirmation: true,
    };
  },
};

export default ColumnAN;
