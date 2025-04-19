import ColumnHelpers from './column-helpers.mjs';

const ColumnAB = {
  id: 'DNMatchesLease?',
  name: 'DN Matches Lease?',
  sheetColumn: 'DN Matches Lease?',
  resultColumn: 'AB',

  isApplicable(record) {
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },

  async run(row, col, context) {
    // User confirmation required
    return { success: true, requiresUserConfirmation: true };
  },

  displayData(row, col, context) {
    return {
      fieldName: this.name,
      message: 'Please verify DN Matches Lease?.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAB;