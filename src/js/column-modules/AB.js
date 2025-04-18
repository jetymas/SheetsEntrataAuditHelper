/**
 * Column AB Module - One-Time Incentives Verification
 * Prompts user to verify one-time incentives match the lease
 */
import ColumnHelpers from './column-helpers.js';

const ColumnAB = {
  /**
   * Column information
   */
  id: 'oneTimeIncentives',
  name: 'One-Time Incentives',
  pdfSelector: 'One-Time',
  sheetColumn: 'DN Matches Lease?',
  resultColumn: 'AB',
  
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
      // For one-time incentives, we need to check values from multiple columns
      const oneTimeType1 = context.record['One Time #1 Type'] || '';
      const oneTimeValue1 = context.record['One Time #1 Value'] || '';
      const oneTimeType2 = context.record['One Time #2 Type'] || '';
      const oneTimeValue2 = context.record['One Time #2 Value'] || '';
      
      // Get PDF text from the context (should have been set by the page)
      const pdfText = context.pdfText;
      
      if (!pdfText) {
        throw new Error('PDF text not available');
      }
      
      // Navigate to the first page where incentives might appear
      await ColumnHelpers.navigateToPdfPage(1);
      
      // Try to find text related to one-time incentives
      const searchTerms = [
        'One-Time', 
        'One Time',
        'Incentive',
        'Concession',
        'Special Offer'
      ];
      
      let foundSearchTerm = false;
      for (const term of searchTerms) {
        const found = await ColumnHelpers.findTextInPdf(term);
        if (found) {
          foundSearchTerm = true;
          break;
        }
      }
      
      // If nothing found on first page, try page 2 as well
      if (!foundSearchTerm) {
        await ColumnHelpers.navigateToPdfPage(2);
        for (const term of searchTerms) {
          const found = await ColumnHelpers.findTextInPdf(term);
          if (found) {
            foundSearchTerm = true;
            break;
          }
        }
      }
      
      // Create a descriptive message for the user
      let incentiveInfo = '';
      if (oneTimeType1 && oneTimeValue1) {
        incentiveInfo += `Type 1: ${oneTimeType1}, Value: ${oneTimeValue1}`;
      }
      if (oneTimeType2 && oneTimeValue2) {
        if (incentiveInfo) incentiveInfo += '\n';
        incentiveInfo += `Type 2: ${oneTimeType2}, Value: ${oneTimeValue2}`;
      }
      
      if (!incentiveInfo) {
        incentiveInfo = 'No one-time incentives listed in the spreadsheet.';
      }
      
      // This is a user-confirmation field
      return {
        success: true,
        oneTimeType1,
        oneTimeValue1, 
        oneTimeType2,
        oneTimeValue2,
        incentiveInfo,
        foundSearchTerm,
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
        message: 'Please verify if the one-time incentives in the spreadsheet match what appears in the lease.',
        requiresUserConfirmation: true
      };
    }
    
    let message = 'Please verify if the following one-time incentives match what appears in the lease:';
    if (context.result.incentiveInfo) {
      message += `\n${context.result.incentiveInfo}`;
    }
    
    if (!context.result.foundSearchTerm) {
      message += '\n\nNote: No clear one-time incentive terms were automatically found in the lease.';
    }
    
    return {
      fieldName: this.name,
      message,
      requiresUserConfirmation: true
    };
  }
};

export default ColumnAB;