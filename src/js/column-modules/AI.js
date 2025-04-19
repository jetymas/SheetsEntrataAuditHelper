import ColumnHelpers from './column-helpers.js';

const ColumnAI = {
  id: 'Criminal',
  name: 'Criminal',
  sheetColumn: 'Criminal',
  resultColumn: 'AI',

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
      message: 'Please verify Criminal.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAI;