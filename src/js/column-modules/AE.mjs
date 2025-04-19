import ColumnHelpers from './column-helpers.mjs';

const ColumnAE = {
  id: 'LeaseSignedbyManager',
  name: 'Lease Signed by Manager',
  sheetColumn: 'Lease Signed by Manager',
  resultColumn: 'AE',

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
      message: 'Please verify Lease Signed by Manager.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAE;