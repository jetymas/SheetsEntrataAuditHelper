/**
 * RenewalAudit - Audit implementation for lease renewals
 * Handles verification of renewal lease records
 */
import BaseAuditType from './base-audit.js';

class RenewalAudit extends BaseAuditType {
  constructor(spreadsheetId, sheetName = 'Lease Audit') {
    super(spreadsheetId, sheetName);
    // Define the columns to check for renewal audit type
    this.columns = [
      'G',  // Floor Plan
      'J',  // Lease Start Date in DN
      'L',  // Lease End Date in DN
      'N',  // Base Rate in DN
      'R',  // Total Rate in DN
      'T',  // Total Contract Amount in DN
      'AB', // One-Time Incentives (DN Matches Lease?)
      'AD', // Lease Signed by Resident
      'AE', // Lease Signed by Manager
      'AI', // Criminal Background Check
      'AJ'  // Credit Check
    ];
    
    // Mapping of column letters to their checkbox/result columns
    this.columnResultMappings = {
      'J': 'K', // J (Lease Start Date) is verified in column K
      'L': 'M', // L (Lease End Date) is verified in column M
      'N': 'O', // N (Base Rate) is verified in column O
      'R': 'S', // R (Total Rate) is verified in column S
      'T': 'U', // T (Total Contract Amount) is verified in column U
    };
  }

  /**
   * Sets up the Entrata environment for the audit
   * Opens the residents page and ensures records are sorted correctly
   * @returns {Promise<{success: boolean, tabId: number}>} - Setup result with tab ID
   */
  async setUp() {
    try {
      // Always create a new Entrata tab for stability
      const activeTab = await chrome.tabs.create({ 
        url: 'https://preiss.entrata.com/?module=customers_systemxxx'
      });
      
      // Wait for user to log in if needed
      await new Promise(resolve => {
        chrome.runtime.sendMessage({
          type: 'auditStatus',
          message: 'Waiting for Entrata login...',
          status: 'in_progress'
        });
        
        // Alert user to log in if needed
        alert('Please log in to Entrata if prompted, then click OK');
        resolve();
      });
      
      // Wait for Entrata to load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Sort the residents by name (first name + last name)
      await chrome.tabs.sendMessage(activeTab.id, {
        action: 'setupAudit',
        auditType: 'renewal'
      });
      
      return {
        success: true,
        tabId: activeTab.id
      };
    } catch (error) {
      console.error('Error setting up RenewalAudit:', error);
      return {
        success: false,
        tabId: null
      };
    }
  }

  /**
   * Locates and opens the next resident record in Entrata
   * @returns {Promise<Object|null>} - The resident record, or null if no more records
   */
  async findNext() {
    // Check if we're done with all records
    if (this.currentRecordIndex >= this.records.length) {
      return null;
    }
    
    const record = this.records[this.currentRecordIndex];
    
    try {
      // Get the active Entrata tab
      const tabs = await chrome.tabs.query({ 
        url: 'https://*.entrata.com/*',
        active: true, 
        currentWindow: true 
      });
      
      if (tabs.length === 0) {
        throw new Error('No active Entrata tab found');
      }
      
      const activeTab = tabs[0];
      
      // Send message to content script to find and open the resident
      const response = await new Promise(resolve => {
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'processResident',
          resident: {
            firstName: record['First Name'],
            lastName: record['Last Name'],
            property: record['Property']
          },
          record: record
        }, resolve);
      });
      
      if (!response || !response.success) {
        // If resident not found, move to next record
        this.currentRecordIndex++;
        return this.findNext();
      }
      
      // Reset field index for the new record
      this.currentFieldIndex = 0;
      
      // Reset column status for this record
      this.columnStatus = {};
      
      return record;
    } catch (error) {
      console.error('Error finding next resident:', error);
      // Move to next record despite the error
      this.currentRecordIndex++;
      return this.findNext();
    }
  }
  
  /**
   * Filters records based on audit type
   * @param {Array} records - All records from the spreadsheet
   * @returns {Array} - Filtered records for this audit type
   */
  filterRecords(records) {
    return records
      .filter(record => record['Lease Type'] === 'Renewals')
      .sort((a, b) => {
        const nameA = `${a['First Name']} ${a['Last Name']}`.toLowerCase();
        const nameB = `${b['First Name']} ${b['Last Name']}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }
  
  /**
   * Gets the appropriate checkbox column for a given data column
   * @param {string} dataColumn - The data column letter
   * @returns {string} - The checkbox column letter
   */
  getCheckboxColumn(dataColumn) {
    return this.columnResultMappings[dataColumn] || dataColumn;
  }
}

export default RenewalAudit;