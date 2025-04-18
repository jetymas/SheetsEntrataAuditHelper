/**
 * Column AG Module - Guarantor Form Signed
 * Verifies that the guarantor form is signed
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAG = {
  /**
   * Column information
   */
  id: 'guarantorFormSigned',
  name: 'Guarantor Form Signed',
  pdfSelector: '(Guarantor)',
  sheetColumn: 'Guarantor Form Signed',
  resultColumn: 'AG',
  
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
      // First check if we're already in a lease document, if not navigate there
      const wasInPdf = !!context.pdfText;
      
      // Save current state before navigating
      const previousState = {
        pdfText: context.pdfText
      };
      
      // If we weren't in a PDF, navigate to the documents page and click on the lease
      if (!wasInPdf) {
        // Navigate to the resident's Documents page
        await ColumnHelpers.navigateToPage('Documents');
        
        // Look for and click on the Lease document
        const documentFound = await ColumnHelpers.findAndClickDocument('Lease - Signed');
        
        if (!documentFound) {
          throw new Error('Lease document not found');
        }
        
        // Wait for document to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Navigate to page 29 as specified in the requirements
      await ColumnHelpers.navigateToPdfPage(29);
      
      // Look for the "(Guarantor)" text as specified in the requirements
      let guarantorTextFound = await ColumnHelpers.findTextInPdf(this.pdfSelector);
      
      // If not found on page 29, try nearby pages
      if (!guarantorTextFound) {
        // Try page 28
        await ColumnHelpers.navigateToPdfPage(28);
        guarantorTextFound = await ColumnHelpers.findTextInPdf(this.pdfSelector);
        
        if (!guarantorTextFound) {
          // Try page 30
          await ColumnHelpers.navigateToPdfPage(30);
          guarantorTextFound = await ColumnHelpers.findTextInPdf(this.pdfSelector);
        }
      }
      
      // Look for signature indicators near the guarantor section
      const signatureIndicators = [
        'Signature',
        'Guarantor Signature',
        'Signed by',
        'Electronically signed by'
      ];
      
      let isSignatureFound = false;
      if (guarantorTextFound) {
        for (const indicator of signatureIndicators) {
          if (await ColumnHelpers.findTextInPdf(indicator)) {
            isSignatureFound = true;
            break;
          }
        }
      }
      
      // In some cases, the guarantor section might not exist if not applicable
      const result = {
        success: true,
        guarantorSectionFound: guarantorTextFound,
        signatureFound: isSignatureFound,
        requiresUserConfirmation: true
      };
      
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
        message: 'Please verify if the guarantor form is signed.',
        requiresUserConfirmation: true
      };
    }
    
    let message;
    if (!context.result.guarantorSectionFound) {
      message = 'No guarantor section was found in the lease. Please verify if a guarantor is required for this lease.';
    } else if (context.result.signatureFound) {
      message = 'Please confirm that you can see the guarantor signature on this page.';
    } else {
      message = 'Guarantor section found, but no signature was detected. Please verify if the form is signed.';
    }
    
    return {
      fieldName: this.name,
      message,
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAG;