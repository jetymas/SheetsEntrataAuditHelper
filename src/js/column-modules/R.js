/**
 * Column R Module - Total Rate in DN
 * Verifies the total monthly payment rate in Entrata (DN) against the lease document
 */
import ColumnHelpers from './column-helpers.js';

const ColumnR = {
  /**
   * Column information
   */
  id: 'totalRate',
  name: 'Total Rate in DN',
  pdfSelector: 'TOTAL INSTALLMENT',
  sheetColumn: 'Total Rate in DN',
  resultColumn: 'R',
  resultCheckboxColumn: 'S', // Linked to column S for checkbox
  
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
      // Extract the expected value from context
      const expectedValue = context.record[this.sheetColumn];
      
      // Get PDF text from the context (should have been set by the page)
      const pdfText = context.pdfText;
      
      if (!pdfText) {
        throw new Error('PDF text not available');
      }
      
      // Navigate to the first page where this information typically appears
      await ColumnHelpers.navigateToPdfPage(1);
      
      // Find the value in the PDF by searching for various total-related terms
      const searchTerms = ['TOTAL INSTALLMENT', 'Total Monthly Payment', 'Total Monthly Rent'];
      let pdfValue = null;
      
      for (const term of searchTerms) {
        await ColumnHelpers.findTextInPdf(term);
        
        // Use regex to extract the value after each term
        const regex = new RegExp(`${term}[:\\s]+(\\$?[\\d,]+\\.?\\d*)`, 'i');
        const match = pdfText.match(regex);
        
        if (match && match[1]) {
          pdfValue = match[1].trim();
          break;
        }
      }
      
      // If still not found, try a more general search for currency values near relevant terms
      if (!pdfValue) {
        const lines = pdfText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (searchTerms.some(term => lines[i].toLowerCase().includes(term.toLowerCase()))) {
            // Found a line with a total-related term, look for currency values in this line or next few lines
            const currencyRegex = /\$?\d{1,3}(,\d{3})*(\.\d{2})?/;
            
            // Check current line and next few lines
            for (let j = i; j < Math.min(i + 3, lines.length); j++) {
              const currencyMatch = lines[j].match(currencyRegex);
              if (currencyMatch) {
                pdfValue = currencyMatch[0].trim();
                break;
              }
            }
            
            if (pdfValue) break;
          }
        }
      }
      
      // Normalize both values for comparison (currency values)
      const normalizedPdfValue = ColumnHelpers.normalizeValue(pdfValue, 'currency');
      const normalizedExpectedValue = ColumnHelpers.normalizeValue(expectedValue, 'currency');
      
      return {
        success: true,
        pdfValue,
        expectedValue,
        normalizedPdfValue,
        normalizedExpectedValue,
        match: normalizedPdfValue === normalizedExpectedValue
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
        pdfValue: 'Not found',
        expectedValue: context.record[this.sheetColumn] || 'N/A',
        match: false
      };
    }
    
    return {
      fieldName: this.name,
      pdfValue: context.result.pdfValue || 'Not found',
      expectedValue: context.result.expectedValue || 'N/A',
      match: context.result.match
    };
  }
};

export default ColumnR;