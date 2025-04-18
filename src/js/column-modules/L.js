/**
 * Column L Module - Lease End Date in DN
 * Verifies the lease end date in Entrata (DN) against the lease document
 */
import ColumnHelpers from './column-helpers.js';

const ColumnL = {
  /**
   * Column information
   */
  id: 'leaseEndDate',
  name: 'Lease End Date in DN',
  pdfSelector: 'End Date',
  sheetColumn: 'Lease End Date in DN',
  resultColumn: 'L',
  resultCheckboxColumn: 'M', // Linked to column M for checkbox
  
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
      
      // Find the value in the PDF by searching for the selector
      await ColumnHelpers.findTextInPdf(this.pdfSelector);
      
      // Use regex to extract the value after "End Date:"
      const regex = new RegExp(`${this.pdfSelector}[:\\s]+(.*?)(?=[\\n\\r]|$)`, 'i');
      const match = pdfText.match(regex);
      
      let pdfValue = null;
      if (match && match[1]) {
        pdfValue = match[1].trim();
      } else {
        // If not found with regex, try analyzing lines that contain the selector
        const lines = pdfText.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(this.pdfSelector)) {
            // Found a line with the selector, try to extract the value
            const parts = lines[i].split(':');
            if (parts.length > 1) {
              pdfValue = parts[1].trim();
              break;
            }
            
            // If the value is on the next line
            if (i + 1 < lines.length) {
              pdfValue = lines[i + 1].trim();
              break;
            }
          }
        }
      }
      
      // Normalize both values for comparison (especially dates)
      const normalizedPdfValue = ColumnHelpers.normalizeValue(pdfValue, 'date');
      const normalizedExpectedValue = ColumnHelpers.normalizeValue(expectedValue, 'date');
      
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

export default ColumnL;