/**
 * Column AJ Module - Credit Check
 * Verifies the credit check status
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAJ = {
  /**
   * Column information
   */
  id: 'creditCheck',
  name: 'Credit Check',
  pdfSelector: 'Pass',
  sheetColumn: 'Credit',
  resultColumn: 'AJ',
  
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
      // Check if we've already processed the Screening Decision Summary for the criminal check (col AI)
      // If so, we can reuse the same result and avoid redundant navigation
      if (context.screeningAlreadyChecked) {
        return {
          success: true,
          passFound: context.screeningPassFound || false,
          requiresUserConfirmation: true
        };
      }
      
      // First, need to navigate to resident's documents and find the Screening Decision Summary
      const wasInPdf = !!context.pdfText;
      
      // Save current state before navigating
      const previousState = {
        pdfText: context.pdfText
      };
      
      // Navigate to the resident's Documents page
      await ColumnHelpers.navigateToPage('Documents');
      
      // Look for and click on the Screening Decision Summary Letter
      const documentFound = await ColumnHelpers.findAndClickDocument('Screening Decision Summary');
      
      if (!documentFound) {
        throw new Error('Screening Decision Summary document not found');
      }
      
      // Wait for document to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract text from the document
      const screeningText = document.body.innerText || document.body.textContent;
      
      // Look for "Pass" related to credit check
      const creditSections = [
        'Credit Check',
        'Credit Score',
        'Credit History',
        'Credit Report'
      ];
      
      let passFound = false;
      const lines = screeningText.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        if (creditSections.some(section => lines[i].includes(section))) {
          // Found a credit section, look for "Pass" in this line and next few lines
          for (let j = i; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].includes('Pass')) {
              passFound = true;
              break;
            }
          }
          
          if (passFound) break;
        }
      }
      
      // If specific sections weren't found, check for general "Pass" text
      if (!passFound) {
        passFound = screeningText.includes('Pass') || screeningText.includes('PASS');
      }
      
      // Store the result for potential reuse by other columns
      context.screeningAlreadyChecked = true;
      context.screeningPassFound = passFound;
      
      // This requires user confirmation
      const result = {
        success: true,
        passFound,
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
        message: 'Please verify if the credit check was passed.',
        requiresUserConfirmation: true
      };
    }
    
    return {
      fieldName: this.name,
      message: context.result.passFound 
        ? 'Found "Pass" in the Screening Decision Summary. Please confirm if the credit check was passed.'
        : 'Could not find "Pass" for credit check. Please verify manually.',
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAJ;