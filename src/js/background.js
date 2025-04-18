import { getCookie, setCookie } from './cookieHelper.js';

// Example: Read and set Entrata sessionId cookie
getCookie('https://www.entrata.com', 'sessionId')
  .then(val => console.log('sessionId cookie:', val))
  .catch(err => console.error('Error reading sessionId cookie:', err));

setCookie({
  url: 'https://www.entrata.com',
  name: 'sessionId',
  value: 'exampleValue',
  expirationDate: Math.floor(Date.now()/1000) + 3600
})
  .then(cookie => console.log('Cookie set:', cookie))
  .catch(err => console.error('Error setting cookie:', err));

// Import audit types - try with both relative and root-relative paths
let LeaseAudit, RenewalAudit;

// Dynamic imports to handle potential path resolution issues
async function importAuditTypes() {
  try {
    // First try with extension root-relative paths
    console.log('Importing audit types with root-relative paths...');
    const leaseModule = await import('/src/js/audit-types/lease-audit.js');
    const renewalModule = await import('/src/js/audit-types/renewal-audit.js');
    
    LeaseAudit = leaseModule.default;
    RenewalAudit = renewalModule.default;
    console.log('Successfully imported audit types with root-relative paths');
  } catch (error) {
    console.error('Error importing with root-relative paths:', error);
    
    try {
      // Fallback to relative paths
      console.log('Trying relative paths...');
      const leaseModule = await import('./audit-types/lease-audit.js');
      const renewalModule = await import('./audit-types/renewal-audit.js');
      
      LeaseAudit = leaseModule.default;
      RenewalAudit = renewalModule.default;
      console.log('Successfully imported audit types with relative paths');
    } catch (fallbackError) {
      console.error('Error importing with relative paths:', fallbackError);
      throw new Error('Failed to import audit types: ' + fallbackError.message);
    }
  }
}

// Import immediately
importAuditTypes().catch(error => {
  console.error('Fatal error importing audit types:', error);
});

// Global state variables
let auditState = {
  status: 'idle',
  spreadsheetId: null,
  auditEngine: null,
  progress: 0,
  entrataTabId: null,
  currentRecordName: '',
  currentFieldName: '',
  lastError: null
};

// Helper to send status updates to the popup
function updateStatus(message, progress = null, status = 'in_progress', details = {}) {
  chrome.runtime.sendMessage({
    type: 'auditStatus',
    message: message,
    progress: progress,
    status: status,
    currentRecord: details.currentRecord || null,
    currentField: details.currentField || null,
    error: details.error || null
  });
}

// Get OAuth token for Google Sheets API
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
      if (chrome.runtime.lastError) {
        console.error('Authentication error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else if (!token) {
        console.error('No token returned');
        reject(new Error('Failed to obtain authentication token'));
      } else {
        console.log('Successfully obtained auth token');
        resolve(token);
      }
    });
  });
}

// Fetch data from Google Sheets API
async function fetchSheetData(spreadsheetId, sheetName = 'Lease Audit', headerRow = 8) {
  try {
    console.log(`Fetching sheet data from ${spreadsheetId}, sheet ${sheetName}, header row ${headerRow}`);
    const token = await getAuthToken();
    
    // First, fetch header row to get column names
    const headerRange = `${sheetName}!${headerRow}:${headerRow}`;
    console.log(`Fetching headers from range ${headerRange}`);
    
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}`;
    console.log(`API URL: ${headerUrl}`);
    
    const headerResponse = await fetch(
      headerUrl,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log(`Header response status: ${headerResponse.status} ${headerResponse.statusText}`);
    
    if (!headerResponse.ok) {
      throw new Error(`Failed to fetch headers: ${headerResponse.status} ${headerResponse.statusText}`);
    }
    
    const headerData = await headerResponse.json();
    console.log('Header data received:', headerData);
    
    if (!headerData.values || !headerData.values[0]) {
      throw new Error('No header values found in the specified row');
    }
    
    const headers = headerData.values[0];
    
    // Now, fetch data rows (everything after header row)
    const dataRange = `${sheetName}!${headerRow + 1}:1000`;
    const dataResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${dataRange}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!dataResponse.ok) {
      throw new Error(`Failed to fetch data: ${dataResponse.statusText}`);
    }
    
    const data = await dataResponse.json();
    const rows = data.values || [];
    
    // Convert raw data to records (array of objects)
    const records = rows.map((row, rowIndex) => {
      const record = {
        // Store row number for reference
        _row: (rowIndex + headerRow + 1).toString()
      };
      headers.forEach((header, index) => {
        record[header] = index < row.length ? row[index] : '';
      });
      return record;
    });
    
    return {
      headers,
      records
    };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// Update a cell in the Google Sheet
async function updateSheetCell(spreadsheetId, sheetName, cellRef, value) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${cellRef}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [[value]]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update cell: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating sheet cell:', error);
    throw error;
  }
}

// Add a comment to a cell in the Google Sheet
async function addSheetComment(spreadsheetId, sheetName, cellRef, comment) {
  try {
    const token = await getAuthToken();
    
    // First, need to get the sheet ID
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!sheetsResponse.ok) {
      throw new Error(`Failed to get sheet info: ${sheetsResponse.statusText}`);
    }
    
    const sheetsData = await sheetsResponse.json();
    const sheetId = sheetsData.sheets.find(s => s.properties.title === sheetName)?.properties.sheetId;
    
    if (!sheetId) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    // Parse the cell reference to get row and column indices
    const colMatch = cellRef.match(/[A-Z]+/);
    const rowMatch = cellRef.match(/\d+/);
    
    if (!colMatch || !rowMatch) {
      throw new Error(`Invalid cell reference: ${cellRef}`);
    }
    
    const colLetters = colMatch[0];
    const rowIndex = parseInt(rowMatch[0], 10) - 1; // 0-based
    
    // Convert column letters to 0-based index
    let colIndex = 0;
    for (let i = 0; i < colLetters.length; i++) {
      colIndex = colIndex * 26 + colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
    }
    colIndex--; // Make 0-based
    
    // Now, add the comment
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              updateCells: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: colIndex,
                  endColumnIndex: colIndex + 1
                },
                rows: [
                  {
                    values: [
                      {
                        note: comment
                      }
                    ]
                  }
                ],
                fields: 'note'
              }
            }
          ]
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding sheet comment:', error);
    // Don't throw here, just log - comments can fail but we want to continue the audit
    return { success: false, error: error.message };
  }
}

// Function to ensure content script is loaded in a tab
async function ensureContentScriptLoaded(tabId) {
  try {
    console.log(`Checking if content script is loaded in tab ${tabId}...`);
    
    // Try to ping the content script first
    const pingResult = await new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve({ loaded: false, error: 'Ping timed out' });
      }, 2000);
      
      try {
        chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
          clearTimeout(timeoutId);
          
          if (chrome.runtime.lastError) {
            console.warn('Ping error:', chrome.runtime.lastError);
            resolve({ loaded: false, error: chrome.runtime.lastError.message });
          } else if (!response) {
            console.warn('No ping response');
            resolve({ loaded: false, error: 'No response' });
          } else {
            console.log('Ping response received:', response);
            resolve({ loaded: true, debug: response.debug });
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error during ping:', error);
        resolve({ loaded: false, error: error.message });
      }
    });
    
    if (pingResult.loaded) {
      console.log('Content script is already loaded');
      return true;
    }
    
    console.log('Content script not loaded, attempting to inject it...');
    
    // Get the tab details
    const tab = await new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
    
    if (!tab) {
      throw new Error('Tab not found');
    }
    
    if (!tab.url.includes('entrata.com')) {
      throw new Error('Tab is not on Entrata website');
    }
    
    // Inject content script manually
    console.log('Injecting content script...');
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/js/content.js']
    });
    
    console.log('Injecting content CSS...');
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['src/css/content.css']
    });
    
    // Wait for content script to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify content script is now loaded
    const verifyResult = await new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(false);
      }, 2000);
      
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        clearTimeout(timeoutId);
        resolve(!!response);
      });
    });
    
    if (!verifyResult) {
      console.error('Content script injection failed');
      return false;
    }
    
    console.log('Content script successfully injected');
    return true;
  } catch (error) {
    console.error('Error ensuring content script loaded:', error);
    return false;
  }
}

// Start the audit process
async function startAudit(spreadsheetId, auditType) {
  try {
    updateStatus('Starting audit...', 10);
    
    console.log('===== STARTING AUDIT PROCESS =====');
    console.log(`Starting audit with spreadsheetId: ${spreadsheetId}, type: ${auditType}`);
    
    // Add browser information for debugging
    try {
      const browser = navigator.userAgent;
      console.log('Browser user agent:', browser);
      console.log('Runtime ID:', chrome.runtime.id);
    } catch (e) {
      console.error('Error getting browser info:', e);
    }
    
    if (!spreadsheetId) {
      throw new Error('Invalid spreadsheet ID');
    }
    
    // Make sure the audit type modules are loaded
    if (!LeaseAudit || !RenewalAudit) {
      console.log('Audit types not loaded yet, waiting for import to complete...');
      
      try {
        // Try to import them again if they're not loaded
        await importAuditTypes();
        
        // Check again after import attempt
        if (!LeaseAudit || !RenewalAudit) {
          throw new Error('Failed to load audit types. Please reload the extension.');
        }
      } catch (error) {
        console.error('Error loading audit types:', error);
        throw new Error('Failed to load audit modules: ' + error.message);
      }
    }
    
    // Verify we have required permissions
    console.log('Checking permissions...');
    const permissions = {
      permissions: ['tabs', 'scripting'],
      origins: ['https://*.entrata.com/*']
    };
    
    const hasPermissions = await new Promise(resolve => {
      chrome.permissions.contains(permissions, result => {
        console.log('Permission check result:', result);
        resolve(result);
      });
    });
    
    if (!hasPermissions) {
      console.error('Missing required permissions');
      throw new Error('Extension is missing required permissions. Please reset the extension permissions.');
    }
    
    // Reset audit state
    auditState = {
      status: 'in_progress',
      spreadsheetId,
      auditEngine: null,
      progress: 10,
      entrataTabId: null,
      currentRecordName: '',
      currentFieldName: '',
      lastError: null
    };
    
    // Create the appropriate audit engine based on type
    let auditEngine;
    try {
      if (auditType === 'new') {
        console.log('Creating LeaseAudit instance');
        auditEngine = new LeaseAudit(spreadsheetId);
      } else if (auditType === 'renewal') {
        console.log('Creating RenewalAudit instance');
        auditEngine = new RenewalAudit(spreadsheetId);
      } else {
        throw new Error(`Unknown audit type: ${auditType}`);
      }
    } catch (error) {
      console.error('Error creating audit engine:', error);
      throw error;
    }
    
    auditState.auditEngine = auditEngine;
    
    // Fetch data from Google Sheet
    updateStatus('Fetching audit data from Google Sheet...', 20);
    console.log('Calling fetchSheetData...');
    
    // Use Lease Audit as the sheet name and row 8 for headers
    let records;
    try {
      const result = await fetchSheetData(spreadsheetId, 'Lease Audit', 8);
      records = result.records;
      console.log(`Fetched ${records.length} records from spreadsheet`);
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
    
    // Filter records based on audit type
    console.log('Filtering records by audit type');
    const filteredRecords = auditEngine.filterRecords(records);
    console.log(`Filtered to ${filteredRecords.length} ${auditType} leases`);
    
    if (filteredRecords.length === 0) {
      updateStatus(`No ${auditType === 'new' ? 'new' : 'renewal'} leases found in the sheet`, 100, 'complete');
      return;
    }
    
    // Set records in the audit engine
    auditEngine.records = filteredRecords;
    
    updateStatus(`Ready to audit ${filteredRecords.length} ${auditType === 'new' ? 'new' : 'renewal'} leases`, 30);
    
    // Manually create an Entrata tab before setting up environment
    console.log('Creating Entrata tab...');
    let entrataTab;
    try {
      entrataTab = await new Promise((resolve, reject) => {
        chrome.tabs.create({ 
          url: 'https://preiss.entrata.com/?module=customers_systemxxx',
          active: true
        }, tab => {
          if (chrome.runtime.lastError) {
            reject(new Error('Failed to create tab: ' + chrome.runtime.lastError.message));
          } else if (!tab) {
            reject(new Error('No tab returned from create'));
          } else {
            resolve(tab);
          }
        });
      });
      console.log('Successfully created Entrata tab with ID:', entrataTab?.id);
    } catch (error) {
      console.error('Error creating Entrata tab:', error);
      throw new Error('Failed to open Entrata tab: ' + error.message);
    }
    
    if (!entrataTab || !entrataTab.id) {
      throw new Error('Failed to create Entrata tab - no tab ID returned');
    }
    
    // Wait a moment for the tab to start loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Inform user to login if needed
    updateStatus('Please log in to Entrata if prompted...', 30, 'in_progress');
    console.log('Prompting user to login');
    
    // Alert in the new tab
    try {
      await chrome.scripting.executeScript({
        target: { tabId: entrataTab.id },
        func: () => {
          alert('Please log in to Entrata if prompted, then click OK');
        }
      });
    } catch (error) {
      console.error('Error showing login alert:', error);
      // Continue anyway, the alert might fail but the tab should still be open
    }
    
    // Wait for page to load and user to login
    console.log('Waiting for user to login and page to load...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Store the tab ID
    auditState.entrataTabId = entrataTab.id;
    
    // Verify tab is still valid
    try {
      await new Promise((resolve, reject) => {
        chrome.tabs.get(entrataTab.id, tab => {
          if (chrome.runtime.lastError) {
            reject(new Error('Tab no longer exists: ' + chrome.runtime.lastError.message));
          } else if (!tab) {
            reject(new Error('Tab not found'));
          } else {
            console.log('Tab is still valid, URL:', tab.url);
            resolve(tab);
          }
        });
      });
    } catch (error) {
      console.error('Tab validation error:', error);
      throw new Error('Entrata tab is no longer valid. Please try again.');
    }
    
    // Wait a bit longer for page to fully render
    updateStatus('Waiting for Entrata page to load...', 30, 'in_progress');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Ensure content script is loaded
    console.log('Ensuring content script is loaded...');
    const contentScriptLoaded = await ensureContentScriptLoaded(entrataTab.id);
    if (!contentScriptLoaded) {
      console.error('Content script not loaded');
      throw new Error('Could not load content script in Entrata tab. Please try refreshing the tab or reinstalling the extension.');
    }
    
    console.log('Content script is loaded');
    
    try {
      // Set up the Entrata environment for audit
      updateStatus('Setting up Entrata environment...', 30, 'in_progress');
      console.log('Setting up Entrata environment');
      
      // Now set up audit through content script
      const setupResponse = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Setup timeout - no response from content script'));
        }, 15000);
        
        chrome.tabs.sendMessage(entrataTab.id, {
          action: 'setupAudit',
          auditType: auditType
        }, (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            reject(new Error('Error setting up audit: ' + chrome.runtime.lastError.message));
          } else if (!response) {
            reject(new Error('No response from content script during setup'));
          } else {
            resolve(response);
          }
        });
      });
      
      console.log('Setup response:', setupResponse);
      
      if (!setupResponse.success) {
        throw new Error(setupResponse.error || 'Failed to set up Entrata environment');
      }
    } catch (error) {
      console.error('Error in setup:', error);
      throw new Error('Failed to set up Entrata environment: ' + error.message);
    }
    
    // Start the audit process
    console.log('Setup successful, starting audit process');
    await runAudit();
    
  } catch (error) {
    console.error('Error starting audit:', error);
    console.error('Stack trace:', error.stack);
    auditState.lastError = error.message;
    updateStatus(`Error: ${error.message}`, null, 'error', {
      error: error.message
    });
  }
}

// Check if the content script is responsive
async function isContentScriptAlive(tabId) {
  try {
    return await new Promise((resolve) => {
      // Set a timeout for the ping response
      const timeout = setTimeout(() => {
        console.warn('Content script ping timed out');
        resolve(false);
      }, 5000);
      
      // Send a ping message
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          console.warn('Content script ping error:', chrome.runtime.lastError);
          resolve(false);
        } else {
          console.log('Content script responded to ping:', response);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Error pinging content script:', error);
    return false;
  }
}

// Main audit execution loop
async function runAudit() {
  try {
    const { auditEngine } = auditState;
    
    // Process records one by one
    while (auditState.status === 'in_progress') {
      // Check if the content script is responsive before continuing
      if (!await isContentScriptAlive(auditState.entrataTabId)) {
        // Content script not responding, try to reload the page
        updateStatus(
          'Content script not responding, attempting to recover...',
          auditState.progress,
          'in_progress',
          {
            error: 'Tab not responding - attempting to recover'
          }
        );
        
        try {
          // Force reload the tab
          await new Promise((resolve) => {
            chrome.tabs.reload(auditState.entrataTabId, {}, resolve);
          });
          
          // Wait for reload
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Check if it's now responsive
          if (!await isContentScriptAlive(auditState.entrataTabId)) {
            throw new Error('Could not recover content script - tab still not responding');
          }
          
          updateStatus(
            'Recovery successful, continuing audit',
            auditState.progress,
            'in_progress'
          );
        } catch (error) {
          console.error('Tab recovery failed:', error);
          throw new Error('Could not recover from unresponsive content script: ' + error.message);
        }
      }
      
      // Find and open the next record
      let record;
      try {
        record = await Promise.race([
          auditEngine.findNext(),
          // Timeout after 60 seconds - prevent eternal waiting
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for findNext')), 60000))
        ]);
      } catch (error) {
        console.error('Error or timeout finding next resident:', error);
        
        // If it's a timeout, try to skip to the next record and continue
        if (error.message.includes('timed out')) {
          updateStatus(
            `Timeout finding resident. Skipping to next record...`,
            auditState.progress,
            'in_progress',
            {
              error: 'Timeout - skipping to next record'
            }
          );
          
          auditEngine.currentRecordIndex++;
          continue; // Skip to next iteration of the loop
        } else {
          throw error; // Re-throw other errors
        }
      }
      
      // If no more records, we're done
      if (!record) {
        updateStatus('Audit completed successfully', 100, 'complete');
        auditState.status = 'idle';
        return;
      }
      
      // Update progress based on current record index
      const progress = Math.floor(30 + (auditEngine.currentRecordIndex / auditEngine.records.length) * 70);
      auditState.progress = progress;
      
      // Update the current record name for status tracking
      const currentRecordName = `${record['First Name']} ${record['Last Name']}`;
      auditState.currentRecordName = currentRecordName;
      
      updateStatus(
        `Processing record ${auditEngine.currentRecordIndex + 1} of ${auditEngine.records.length}: ${currentRecordName}`, 
        progress,
        'in_progress',
        { currentRecord: currentRecordName }
      );
      
      // Add a record timeout mechanism for safety
      const recordStartTime = Date.now();
      const MAX_RECORD_TIME = 300000; // 5 minutes max per record
      
      // Process each field for the current record
      let fieldResult;
      try {
        while ((fieldResult = await auditEngine.nextField()) !== null) {
          // Check for record timeout
          if (Date.now() - recordStartTime > MAX_RECORD_TIME) {
            console.warn(`Record processing exceeded time limit of ${MAX_RECORD_TIME}ms, moving to next record`);
            updateStatus(
              `Record processing took too long - moving to next record`,
              progress,
              'in_progress',
              {
                currentRecord: currentRecordName,
                error: 'Processing timeout - moving to next record'
              }
            );
            break; // Exit field processing loop
          }
          
          // Get the column module and process the field
          const { column, module, record } = fieldResult;
          
          // Update the current field name for status tracking
          auditState.currentFieldName = module.name;
          
          // Update status with field information
          updateStatus(
            `Verifying ${module.name} for ${currentRecordName}`,
            progress,
            'in_progress',
            { 
              currentRecord: currentRecordName,
              currentField: module.name
            }
          );
          
          // Get the result from the content script's verification
          let verificationResult;
          try {
            verificationResult = await Promise.race([
              processField(column, module, record),
              // Field processing timeout
              new Promise((_, reject) => setTimeout(() => reject(new Error('Field verification timed out')), 40000))
            ]);
          } catch (error) {
            console.error('Field verification error or timeout:', error);
            updateStatus(
              `Error verifying field ${module.name}: ${error.message}`,
              progress,
              'in_progress',
              {
                currentRecord: currentRecordName,
                currentField: module.name,
                error: error.message
              }
            );
            continue; // Skip to next field
          }
          
          // Update the sheet based on verification result
          if (verificationResult) {
            await updateSheetWithResult(verificationResult, record);
          }
        }
      } catch (error) {
        console.error('Error processing fields for record:', error);
        updateStatus(
          `Error processing fields: ${error.message}. Moving to next record.`,
          progress,
          'in_progress',
          {
            currentRecord: currentRecordName,
            error: error.message
          }
        );
        // Continue to next record despite error
      }
      
      // Move to next record after all fields are processed or on error
      auditEngine.currentRecordIndex++;
    }
  } catch (error) {
    console.error('Fatal error running audit:', error);
    auditState.lastError = error.message;
    updateStatus(
      `Fatal error: ${error.message}`, 
      auditState.progress, 
      'error',
      {
        currentRecord: auditState.currentRecordName,
        currentField: auditState.currentFieldName,
        error: error.message
      }
    );
    auditState.status = 'idle';
  }
}

// Process a single field 
async function processField(column, module, record) {
  return new Promise((resolve) => {
    // Use the stored entrataTabId instead of querying for the active tab
    const { entrataTabId } = auditState;
    
    if (!entrataTabId) {
      console.error('No Entrata tab ID found');
      auditState.lastError = 'No Entrata tab ID found';
      resolve(null);
      return;
    }
    
    // Ensure the tab still exists
    chrome.tabs.get(entrataTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        console.error('Entrata tab no longer exists', chrome.runtime.lastError);
        auditState.lastError = 'Entrata tab no longer exists';
        resolve(null);
        return;
      }
      
      // Make sure the tab is active and focused
      chrome.tabs.update(entrataTabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          console.error('Could not activate Entrata tab', chrome.runtime.lastError);
          resolve(null);
          return;
        }
        
        // Set up a one-time listener for the field verification result
        const listener = function(message, sender, sendResponse) {
          if (message.action === 'fieldVerified' && message.result) {
            // Remove the listener once we get a response
            chrome.runtime.onMessage.removeListener(listener);
            resolve(message.result);
          }
        };
        
        chrome.runtime.onMessage.addListener(listener);
        
        // Send message to content script to verify the field
        chrome.tabs.sendMessage(entrataTabId, {
          action: 'verifyField',
          column,
          module: {
            id: module.id,
            name: module.name,
            pdfSelector: module.pdfSelector
          },
          expectedValue: record[module.sheetColumn],
          sheetColumn: module.sheetColumn
        });
      });
    });
  });
}

// Update the sheet based on verification result
async function updateSheetWithResult(result, record) {
  // First, verify the audit is still active - prevent unwanted changes if audit expires
  if (auditState.status !== 'in_progress') {
    console.warn('Audit no longer active, skipping sheet update');
    return;
  }
  
  try {
    const { spreadsheetId, auditEngine } = auditState;
    
    // Verify we have valid data before proceeding
    if (!spreadsheetId) {
      console.error('No valid spreadsheet ID for update');
      return;
    }
    
    if (!auditEngine) {
      console.error('No audit engine available');
      return;
    }
    
    // Calculate the cell reference for the result
    const rowNumber = record._row;
    const column = result.column || result.field?.resultColumn;
    
    if (!column || !rowNumber) {
      console.error('Missing column or row information for update');
      return;
    }
    
    // Double check that the row number is valid
    if (isNaN(parseInt(rowNumber)) || parseInt(rowNumber) < 9) { // Header row is 8, so data starts at 9
      console.error(`Invalid row number: ${rowNumber}`);
      return;
    }
    
    // The checkbox column might be different from the data column
    // Use the mapping from the audit engine if available
    let checkboxColumn = result.checkboxColumn || column;
    if (auditEngine.getCheckboxColumn && typeof auditEngine.getCheckboxColumn === 'function') {
      checkboxColumn = auditEngine.getCheckboxColumn(column);
    }
    
    console.log(`Updating sheet cell ${checkboxColumn}${rowNumber} with action: ${result.action}`);
    
    // Update the sheet based on verification result
    if (result.action === 'confirm') {
      await updateSheetCell(spreadsheetId, 'Lease Audit', `${checkboxColumn}${rowNumber}`, 'TRUE');
    } else if (result.action === 'flag') {
      await updateSheetCell(spreadsheetId, 'Lease Audit', `${checkboxColumn}${rowNumber}`, 'FALSE');
      if (result.comment) {
        await addSheetComment(spreadsheetId, 'Lease Audit', `${checkboxColumn}${rowNumber}`, 
          `Mismatch: Lease shows "${result.pdfValue}", sheet has "${result.sheetValue}". ${result.comment}`);
      }
    } else if (result.action === 'skip') {
      await updateSheetCell(spreadsheetId, 'Lease Audit', `${checkboxColumn}${rowNumber}`, 'FALSE');
      if (result.comment) {
        await addSheetComment(spreadsheetId, 'Lease Audit', `${checkboxColumn}${rowNumber}`, `Skipped: ${result.comment}`);
      }
    } else {
      console.warn(`Unknown action: ${result.action}, not updating sheet`);
    }
  } catch (error) {
    console.error('Error updating sheet with result:', error);
    // Don't allow spreadsheet update errors to crash the audit
    auditState.lastError = `Spreadsheet update error: ${error.message}`;
    updateStatus(
      'Warning: Spreadsheet update failed, but continuing audit',
      auditState.progress,
      'in_progress',
      {
        currentRecord: auditState.currentRecordName,
        currentField: auditState.currentFieldName,
        error: `Spreadsheet update error: ${error.message}`
      }
    );
  }
}

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'startAudit') {
    startAudit(message.spreadsheetId, message.auditType);
    sendResponse({ status: 'started' });
  } 
  else if (message.action === 'stopAudit') {
    // Reset audit state
    auditState.status = 'idle';
    updateStatus('Audit stopped by user.', 0, 'error');
    sendResponse({ status: 'stopped' });
  }
  else if (message.action === 'skipRecord') {
    // Manual intervention to skip the current record
    const { auditEngine } = auditState;
    
    if (auditState.status === 'in_progress' && auditEngine) {
      // Log the skip
      console.log(`Manually skipping record ${auditEngine.currentRecordIndex + 1}`);
      
      // Update the UI
      updateStatus(
        `Manually skipping record ${auditEngine.currentRecordIndex + 1}`,
        auditState.progress,
        'in_progress',
        {
          currentRecord: auditState.currentRecordName,
          error: 'Manually skipped by user'
        }
      );
      
      // Move to the next record
      auditEngine.currentRecordIndex++;
      
      // Clear field index to start fresh with next record
      auditEngine.currentFieldIndex = 0;
      
      sendResponse({ status: 'record_skipped' });
    } else {
      sendResponse({ status: 'no_active_audit' });
    }
  }
  else if (message.action === 'getAuditState') {
    // Return current audit state to popup
    const { status, progress, auditEngine, entrataTabId, currentRecordName, currentFieldName, lastError } = auditState;
    let message = '';
    
    if (status === 'in_progress' && auditEngine) {
      message = `Processing record ${auditEngine.currentRecordIndex + 1} of ${auditEngine.records.length}`;
      if (currentRecordName) {
        message += `: ${currentRecordName}`;
      }
      if (currentFieldName) {
        message += ` - ${currentFieldName}`;
      }
    }
    
    sendResponse({
      status,
      message,
      progress,
      entrataTabId,
      currentRecord: currentRecordName,
      currentField: currentFieldName,
      error: lastError,
      recordCount: auditEngine?.records?.length || 0,
      currentRecordIndex: auditEngine?.currentRecordIndex || 0
    });
  }
  else if (message.action === 'fieldVerified') {
    // This is handled by the one-time listener in processField
    sendResponse({ status: 'acknowledged' });
  }
  
  // Return true to indicate we'll respond asynchronously
  return true;
});