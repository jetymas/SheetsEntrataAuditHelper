/**
 * BaseAuditType - Abstract base class for all audit types
 * Defines the interface that all audit types must implement
 */
class BaseAuditType {
  constructor(spreadsheetId, sheetName = 'Lease Audit') {
    this.spreadsheetId = spreadsheetId;
    this.sheetName = sheetName;
    this.headerRow = 8; // Fixed header row as per requirements
    this.records = [];
    this.currentRecordIndex = 0;
    this.fields = [];
    this.currentFieldIndex = 0;
    // Mapping of column letters to validation status
    this.columnStatus = {};
    // Cache for dynamically loaded column modules
    this.columnModuleCache = {};
  }

  /**
   * Sets up the Entrata environment for the audit
   * @returns {Promise<{success: boolean, tabId: number}>} - Setup result with tab ID if successful
   */
  async setUp() {
    // Abstract method, must be implemented by subclasses
    throw new Error('setUp() method must be implemented by subclass');
  }

  /**
   * Locates and opens the next resident record in Entrata
   * @returns {Promise<Object|null>} - The resident record, or null if no more records
   */
  async findNext() {
    // Abstract method, must be implemented by subclasses
    throw new Error('findNext() method must be implemented by subclass');
  }

  /**
   * Determines which field (column) to verify next for the current resident
   * @returns {Promise<Object|null>} - The field to verify next, or null if all fields verified
   */
  async nextField() {
    if (this.currentRecordIndex >= this.records.length) {
      return null;
    }
    
    const record = this.records[this.currentRecordIndex];
    const recordName = `${record['First Name']} ${record['Last Name']}`;
    
    // Send a status update that we're processing fields for this record
    chrome.runtime.sendMessage({
      type: 'auditStatus',
      message: `Processing record ${this.currentRecordIndex + 1} of ${this.records.length}`,
      progress: Math.floor(30 + (this.currentRecordIndex / this.records.length) * 70),
      status: 'in_progress',
      currentRecord: recordName,
      currentField: 'Finding next field...'
    });
    
    // Find next unverified column
    while (this.currentFieldIndex < this.columns.length) {
      const columnLetter = this.columns[this.currentFieldIndex];
      this.currentFieldIndex++;
      
      try {
        // Update status with current column being checked
        chrome.runtime.sendMessage({
          type: 'auditStatus',
          message: `Processing record ${this.currentRecordIndex + 1} of ${this.records.length}`,
          progress: Math.floor(30 + (this.currentRecordIndex / this.records.length) * 70),
          status: 'in_progress',
          currentRecord: recordName,
          currentField: `Checking column ${columnLetter}`
        });
        
        // Check if this column has already been processed for this record
        const columnKey = `${this.currentRecordIndex}_${columnLetter}`;
        if (this.columnStatus[columnKey]) {
          continue;
        }
        
        // Check if the cell has a black fill (indicating it should be skipped)
        const blackFillKey = `_blackFill_${columnLetter}`;
        if (record[blackFillKey] === true) {
          // Skip this column and mark it as processed
          this.columnStatus[columnKey] = 'skipped';
          console.log(`Column ${columnLetter} has black fill, skipping`);
          continue;
        }
        
        // Dynamically import the column module if not already cached
        if (!this.columnModuleCache[columnLetter]) {
          try {
            console.log(`Loading column module ${columnLetter}...`);
            const module = await import(`../column-modules/${columnLetter}.js`);
            this.columnModuleCache[columnLetter] = module.default;
            console.log(`Successfully loaded column module ${columnLetter}`);
          } catch (error) {
            console.warn(`Column module ${columnLetter}.js not found or error:`, error);
            // Update status with the error
            chrome.runtime.sendMessage({
              type: 'auditStatus',
              message: `Error loading column module ${columnLetter}`,
              progress: Math.floor(30 + (this.currentRecordIndex / this.records.length) * 70),
              status: 'in_progress',
              currentRecord: recordName,
              currentField: `Column ${columnLetter}`,
              error: error.message
            });
            continue;
          }
        }
        
        const columnModule = this.columnModuleCache[columnLetter];
        
        // Check if this column is applicable to the current record
        if (columnModule.isApplicable(record)) {
          console.log(`Column ${columnLetter} is applicable, proceeding to verification`);
          return {
            column: columnLetter,
            module: columnModule,
            record: record
          };
        } else {
          // Mark non-applicable columns as processed
          this.columnStatus[columnKey] = 'not-applicable';
          console.log(`Column ${columnLetter} is not applicable for this record`);
        }
      } catch (error) {
        console.warn(`Error processing column ${columnLetter}:`, error);
        
        // Update status with the error
        chrome.runtime.sendMessage({
          type: 'auditStatus',
          message: `Error processing column ${columnLetter}`,
          progress: Math.floor(30 + (this.currentRecordIndex / this.records.length) * 70),
          status: 'in_progress',
          currentRecord: recordName,
          currentField: `Column ${columnLetter}`,
          error: error.message
        });
        continue;
      }
    }
    
    // No more fields to verify for this record
    console.log(`All fields processed for record ${recordName}`);
    return null;
  }
  
  /**
   * Mark a field as processed
   * @param {string} columnLetter - The column letter
   * @param {string} status - The status of the column (verified, skipped, etc.)
   */
  markFieldProcessed(columnLetter, status = 'verified') {
    const columnKey = `${this.currentRecordIndex}_${columnLetter}`;
    this.columnStatus[columnKey] = status;
  }
  
  /**
   * Helper to determine if a field is applicable for the current record
   * @param {Object} field - The field configuration
   * @param {Object} record - The current record
   * @returns {boolean} - True if field is applicable
   */
  isFieldApplicable(field, record) {
    if (!field.condition) {
      return true;
    }
    return field.condition(record);
  }
  
  /**
   * Filters records based on audit type - must be implemented by subclasses
   * @param {Array} records - All records from the spreadsheet
   * @returns {Array} - Filtered records for this audit type
   */
  filterRecords(records) {
    throw new Error('filterRecords() method must be implemented by subclass');
  }
  
  /**
   * Check if a cell has a black fill indicating it should be skipped
   * @param {Object} record - The spreadsheet record
   * @param {string} columnLetter - The column letter to check
   * @returns {boolean} - True if the cell has a black fill
   */
  hasBlackFill(record, columnLetter) {
    // In a real implementation, this would check for a specific property in the record
    // For now, we'll assume black filled cells are marked with a property like "_blackFill_columnLetter"
    const blackFillKey = `_blackFill_${columnLetter}`;
    return record[blackFillKey] === true;
  }
}

export default BaseAuditType;