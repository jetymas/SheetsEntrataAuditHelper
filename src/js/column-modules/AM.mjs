import ColumnHelpers from './column-helpers.mjs';

const ColumnAM = {
  id: 'LeapDeclarationPageUploaded',
  name: 'Leap Declaration Page Uploaded',
  sheetColumn: 'Leap Declaration Page Uploaded',
  resultColumn: 'AM',

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
      message: 'Please verify Leap Declaration Page Uploaded.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAM;