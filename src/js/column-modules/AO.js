/**
 * Column AO Module - Proof of Employment/Rental History/International Docs Uploaded
 * Prompts user to manually verify if the required documents have been uploaded
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAO = {
  /**
   * Column information
   */
  id: 'proofDocuments',
  name: 'Proof of Employment/Rental History/International Docs Uploaded',
  pdfSelector: null, // No specific selector as this is a manual check on Documents tab
  sheetColumn: 'Proof of Employment/Rental History/International Docs Uploaded',
  resultColumn: 'AO',
  
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
      
      // Navigate to the Documents tab to show all resident documents
      await ColumnHelpers.navigateToPage('Documents');
      
      // Wait for the page to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This is a manual verification step
      const result = {
        success: true,
        requiresUserConfirmation: true
      };
      
      // If we were in a PDF before, navigate back to it after user confirmation
      if (wasInPdf) {
        // Don't immediately navigate back - we'll wait for user confirmation first
        result.returnToPdf = true;
        result.previousState = previousState;
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
        message: 'Please verify if the required employment, rental history, or international documents have been uploaded.',
        requiresUserConfirmation: true
      };
    }
    
    return {
      fieldName: this.name,
      message: 'Please manually verify if the resident has uploaded the required proof of employment, rental history, or international documents. When completed, click "Mark as Verified" to continue.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAO;