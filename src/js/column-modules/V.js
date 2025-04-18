/**
 * Column V Module - Security Deposit in DN
 * Verifies the security deposit amount in Entrata (DN) against the lease document
 */
import ColumnHelpers from './column-helpers.js';

const ColumnV = {
  /**
   * Column information
   */
  id: 'securityDeposit',
  name: 'Security Deposit in DN',
  pdfSelector: 'Security Deposit',
  sheetColumn: 'Security Deposit in DN',
  resultColumn: 'V',
  resultCheckboxColumn: 'W', // Linked to column W for checkbox
  
  /**
   * Check if this column is applicable to the given record
   * @param {Object} record - The spreadsheet record
   * @returns {boolean} - True if applicable
   */
  isApplicable(record) {
    // Check if this column should be skipped (has black fill)
    if (ColumnHelpers.hasBlackFill(record, this.sheetColumn)) {
      return false;
    }
    
    // Check if qualifying method is 'Deposit Waived' - if so, skip this column
    if (record['Qualifying Method'] === 'Deposit Waived') {
      return false;
    }
    
    return true;
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
      
      // Find the value in the PDF by searching for security deposit terms
      const searchTerms = ['Security Deposit', 'Damage Deposit'];
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
      
      // If still not found, try a more general search
      if (!pdfValue) {
        const depositRegex = /(security|damage)\s+deposit[:\s]+(\$?[\d,]+\.?\d*)/i;
        const match = pdfText.match(depositRegex);
        
        if (match && match[2]) {
          pdfValue = match[2].trim();
        }
      }
      
      // If still not found, search line by line for deposit-related text
      if (!pdfValue) {
        const lines = pdfText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes('security deposit') ||
              lines[i].toLowerCase().includes('damage deposit')) {
            
            // Look for currency values in this line
            const currencyMatch = lines[i].match(/\$?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
            if (currencyMatch) {
              pdfValue = currencyMatch[0].trim();
              break;
            }
            
            // Check the next few lines if not in this one
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
              const nextLineMatch = lines[j].match(/\$?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
              if (nextLineMatch) {
                pdfValue = nextLineMatch[0].trim();
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

export default ColumnV;