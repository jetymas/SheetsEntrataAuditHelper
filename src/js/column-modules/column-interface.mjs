/**
 * Column Module Interface
 *
 * This file defines the structure and methods that every column module should implement.
 * Each column module represents a specific spreadsheet column and encapsulates the logic
 * for verifying that column's data against Entrata.
 */

/**
 * Example implementation template:
 *
 * export default {
 *   // Column metadata
 *   id: 'uniqueId', // e.g. 'leaseStartDate'
 *   name: 'Human-readable name', // e.g. 'Lease Start Date'
 *   pdfSelector: 'Text to search for in PDF', // e.g. 'Start Date'
 *   sheetColumn: 'Column header in spreadsheet', // e.g. 'Lease Start Date'
 *   resultColumn: 'Letter of verification column', // e.g. 'J'
 *
 *   // Check if this module applies to the current record
 *   isApplicable(record) {
 *     // Should return true if this column should be verified for this record
 *     // Example: return record['Monthly Concessions'] && record['Monthly Concessions'] !== '0.00';
 *     return true;
 *   },
 *
 *   // Main verification logic
 *   async run(row, col, context) {
 *     // Perform verification by finding data in Entrata/PDF and comparing to spreadsheet
 *     // Returns a result object with success flag, values found, and match status
 *     return {
 *       success: true,
 *       pdfValue: 'Value from PDF',
 *       expectedValue: 'Value from spreadsheet',
 *       match: true/false
 *     };
 *   },
 *
 *   // Prepare data for display in the UI
 *   displayData(row, col, context) {
 *     // Return an object with data to display to the user
 *     return {
 *       fieldName: this.name,
 *       pdfValue: context.result.pdfValue || 'Not found',
 *       expectedValue: context.result.expectedValue || 'N/A',
 *       match: context.result.match
 *     };
 *   }
 * };
 */

/**
 * Column Module Requirements
 *
 * Each column module must export an object with the following properties and methods:
 *
 * 1. Metadata properties:
 *    - id: Unique identifier for this column/field
 *    - name: Human-readable name for the UI
 *    - pdfSelector: Text pattern to search for in PDFs
 *    - sheetColumn: Name of the column in Google Sheets
 *    - resultColumn: Letter of the column to check/update
 *
 * 2. Methods:
 *    - isApplicable(record): Determines if this column applies to the current record
 *    - run(row, col, context): Performs the verification logic
 *    - displayData(row, col, context): Prepares data for user display
 *
 * The 'context' parameter will include:
 *    - record: The current spreadsheet record
 *    - pdfText: The text content of the PDF, if available
 *    - result: The result from the run method (when passed to displayData)
 *    - scrollToPdfText: Function to scroll to text in the PDF
 */

// This file serves as documentation only
