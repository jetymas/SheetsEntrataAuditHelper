/**
 * Column AF Module - Application Signed by Applicant/Guarantor
 * Verifies that the application is signed
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAF = {
  /**
   * Column information
   */
  id: 'applicationSigned',
  name: 'Application Signed by Applicant/Guarantor',
  pdfSelector: 'Signature',
  sheetColumn: 'Application Signed by Applicant/Guarantor',
  resultColumn: 'AF',
  
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
      // First, need to navigate to resident's documents and find the Application
      const wasInPdf = !!context.pdfText;
      
      // Save current state before navigating
      const previousState = {
        pdfText: context.pdfText
      };
      
      // Navigate to the resident's Documents page
      await ColumnHelpers.navigateToPage('Documents');
      
      // Look for and click on the Application document
      const documentFound = await ColumnHelpers.findAndClickDocument('Application');
      
      if (!documentFound) {
        throw new Error('Application document not found');
      }
      
      // Wait for document to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to page 12 as specified in the requirements
      await ColumnHelpers.navigateToPdfPage(12);
      
      // Scroll up 1/4 page to get to the signature area
      await ColumnHelpers.scrollPdfViewer('up', 0.25);
      
      // Look for signature indicators
      const signatureIndicators = [
        'Signature',
        'Applicant Signature',
        'Signed by',
        'Electronically signed by'
      ];
      
      let isSignatureFound = false;
      
      for (const indicator of signatureIndicators) {
        if (await ColumnHelpers.findTextInPdf(indicator)) {
          isSignatureFound = true;
          break;
        }
      }
      
      // This requires user confirmation
      const result = {
        success: true,
        signatureFound: isSignatureFound,
        requiresUserConfirmation: true
      };
      
      // If we were in a PDF before, navigate back to the lease document
      if (wasInPdf) {
        // Go back to documents page
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
        message: 'Please verify if the application is signed by the applicant/guarantor.',
        requiresUserConfirmation: true
      };
    }
    
    return {
      fieldName: this.name,
      message: context.result.signatureFound 
        ? 'Please confirm that you can see the applicant/guarantor signature on the application.'
        : 'Please verify if the application is signed by the applicant/guarantor. No signature indicator was found automatically.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAF;