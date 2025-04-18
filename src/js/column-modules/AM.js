/**
 * Column AM Module - Leap Declaration Page Uploaded
 * Prompts user to manually verify if the Leap Declaration Page has been uploaded
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAM = {
  /**
   * Column information
   */
  id: 'leapDeclarationPage',
  name: 'Leap Declaration Page Uploaded',
  pdfSelector: null, // No specific selector as this is a manual check
  sheetColumn: 'Leap Declaration Page Uploaded',
  resultColumn: 'AM',
  
  /**
   * Check if this column is applicable to the given record
   * @param {Object} record - The spreadsheet record
   * @returns {boolean} - True if applicable
   */
  isApplicable(record) {
    // Check if this column should be skipped (has black fill)
    return !ColumnHelpers.hasBlackFill(record, this.sheetColumn);
  },
  
  /**
   * Performs the audit check for this column
   * @param {string} row - The row number in the spreadsheet
   * @param {string} col - The column letter in the spreadsheet
   * @param {Object} context - The context object containing references to Entrata
   * @returns {Promise<Object>} - The verification result
   */
  async run(row, col, context) {
    try {
      // This is a manual verification step - just return success with user confirmation required
      return {
        success: true,
        requiresUserConfirmation: true
      };
    } catch (error) {
      console.error(`Error in Column ${col} run:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  /**
   * Prepares data for user display
   * @param {string} row - The row number in the spreadsheet
   * @param {string} col - The column letter in the spreadsheet
   * @param {Object} context - The context object
   * @returns {Object} - Data for display in the UI
   */
  displayData(row, col, context) {
    return {
      fieldName: this.name,
      message: 'Please manually verify if the Leap Declaration Page has been uploaded. When completed, click "Mark as Verified" to continue.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAM;