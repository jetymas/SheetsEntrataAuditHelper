/**
 * Column AN Module - Leap - Correct "Student with Leap" Relationship Used
 * Verifies the correct relationship for students with Leap is used
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAN = {
  /**
   * Column information
   */
  id: 'leapRelationship',
  name: 'Leap - Correct "Student with Leap" Relationship Used',
  pdfSelector: null, // No specific selector as we're navigating to the Household tab
  sheetColumn: 'Leap - Correct "Student with Leap" Relationship Used',
  resultColumn: 'AN',
  
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
      // Save current state if we were in a document
      const wasInPdf = !!context.pdfText;
      const previousState = {
        pdfText: context.pdfText
      };
      
      // Navigate to the Household page
      await ColumnHelpers.navigateToPage('Household');
      
      // Wait for the page to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This is mainly for user confirmation, as we can't easily determine
      // programmatically if the correct relationship is used
      const result = {
        success: true,
        requiresUserConfirmation: true
      };
      
      // If we were in a PDF before, navigate back to it
      if (wasInPdf) {
        // Go back to Documents page
        await ColumnHelpers.navigateToPage('Documents');
        
        // Click on lease document
        await ColumnHelpers.findAndClickDocument('Lease - Signed');
        
        // Restore previous PDF state
        context.pdfText = previousState.pdfText;
      }
      
      return result;
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
    if (!context.result || !context.result.success) {
      return {
        fieldName: this.name,
        message: 'Please verify if the correct "Student with Leap" relationship is used.',
        requiresUserConfirmation: true
      };
    }
    
    return {
      fieldName: this.name,
      message: 'Please check if the correct "Student with Leap" relationship is used. If correct, click "Mark as Verified".',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAN;