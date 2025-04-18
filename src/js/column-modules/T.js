/**
 * Column T Module - Total Contract Amount in DN
 * Verifies the total contract amount in Entrata (DN) against the lease document
 */
import ColumnHelpers from './column-helpers.js';

const ColumnT = {
  /**
   * Column information
   */
  id: 'totalContractAmount',
  name: 'Total Contract Amount in DN',
  pdfSelector: 'the sum of $',
  sheetColumn: 'Total Contract Amount in DN',
  resultColumn: 'T',
  resultCheckboxColumn: 'U', // Linked to column U for checkbox
  
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
      
      // This information is on the third page of the lease
      await ColumnHelpers.navigateToPdfPage(3);
      
      // Find the text "the sum of $" and extract the value
      await ColumnHelpers.findTextInPdf(this.pdfSelector);
      
      // Use regex to extract the currency value after "the sum of $"
      const regex = new RegExp(`${this.pdfSelector}([\\d,]+\\.?\\d*)`, 'i');
      const match = pdfText.match(regex);
      
      let pdfValue = null;
      if (match && match[1]) {
        pdfValue = '$' + match[1].trim();
      } else {
        // If not found with regex, try a different approach
        const lines = pdfText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(this.pdfSelector)) {
            // Found a line with "the sum of $", extract currency value
            const currencyMatch = lines[i].match(/\$?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
            if (currencyMatch) {
              pdfValue = '$' + currencyMatch[1].trim();
              break;
            }
            
            // If not on this line, check the next few lines
            for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
              const nextLineCurrencyMatch = lines[j].match(/\$?(\d{1,3}(,\d{3})*(\.\d{2})?)/);
              if (nextLineCurrencyMatch) {
                pdfValue = '$' + nextLineCurrencyMatch[1].trim();
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

export default ColumnT;