/**
 * Column AE Module - Lease Signed by Manager
 * Verifies that the lease is signed by the manager
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAE = {
  /**
   * Column information
   */
  id: 'leaseSignedByManager',
  name: 'Lease Signed by Manager',
  pdfSelector: 'Manager Signature',
  sheetColumn: 'Lease Signed by Manager',
  resultColumn: 'AE',
  
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
      // Get PDF text from the context
      const pdfText = context.pdfText;
      
      if (!pdfText) {
        throw new Error('PDF text not available');
      }
      
      // Navigate to the last page of the lease where signatures typically appear
      // We'll need to determine total pages first
      const pageMatch = pdfText.match(/Page\s+\d+\s+of\s+(\d+)/i);
      let lastPage = 10; // Default fallback
      
      if (pageMatch && pageMatch[1]) {
        lastPage = parseInt(pageMatch[1], 10);
      }
      
      await ColumnHelpers.navigateToPdfPage(lastPage);
      
      // Look for manager signature indicators
      const signatureIndicators = [
        'Manager Signature',
        'Manager:',
        'Property Manager',
        'Lessor:',
        'Landlord Signature',
        'Owner/Agent',
        'Management'
      ];
      
      let isSignatureFound = false;
      
      for (const indicator of signatureIndicators) {
        if (await ColumnHelpers.findTextInPdf(indicator)) {
          // Found signature text, now check if there is something that looks like a signature
          isSignatureFound = true;
          break;
        }
      }
      
      // If not found, try checking the previous page as well
      if (!isSignatureFound && lastPage > 1) {
        await ColumnHelpers.navigateToPdfPage(lastPage - 1);
        
        for (const indicator of signatureIndicators) {
          if (await ColumnHelpers.findTextInPdf(indicator)) {
            isSignatureFound = true;
            break;
          }
        }
      }
      
      // At this point, the UI will be showing the signature area (or lack thereof)
      // We'll need user confirmation since actual signature detection is difficult
      
      return {
        success: true,
        signatureFound: isSignatureFound,
        // No direct match check since this is a user-confirmation field
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
    if (!context.result || !context.result.success) {
      return {
        fieldName: this.name,
        message: 'Please confirm if the lease is signed by the manager.',
        requiresUserConfirmation: true
      };
    }
    
    return {
      fieldName: this.name,
      message: context.result.signatureFound 
        ? 'Please confirm that you can see the manager signature on this page.'
        : 'Please verify if the lease is signed by the manager. No signature indicator was found automatically.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAE;