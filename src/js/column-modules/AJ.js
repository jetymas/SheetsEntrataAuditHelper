import ColumnHelpers from './column-helpers.js';

const ColumnAJ = {
  id: 'Credit',
  name: 'Credit',
  sheetColumn: 'Credit',
  resultColumn: 'AJ',

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
      message: 'Please verify Credit.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAJ;