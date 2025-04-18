document.addEventListener('DOMContentLoaded', function() {
  const startAuditButton = document.getElementById('startAudit');
  const stopAuditButton = document.getElementById('stopAudit');
  const skipRecordButton = document.getElementById('skipRecord');
  const spreadsheetUrlInput = document.getElementById('spreadsheetUrl');
  const auditTypeSelect = document.getElementById('auditType');
  const statusDiv = document.getElementById('status');
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('statusText');
  const recordInfo = document.getElementById('recordInfo');
  const fieldInfo = document.getElementById('fieldInfo');
  const errorInfo = document.getElementById('errorInfo');
  
  // Track current audit state
  let currentAuditState = {
    status: 'idle',
    currentRecordIndex: 0,
    recordCount: 0
  };
  
  // Load saved spreadsheet URL if available
  chrome.storage.local.get(['spreadsheetUrl'], function(result) {
    if (result.spreadsheetUrl) {
      spreadsheetUrlInput.value = result.spreadsheetUrl;
    }
  });
  
  // Start Audit button click handler
  startAuditButton.addEventListener('click', function() {
    const spreadsheetUrl = spreadsheetUrlInput.value.trim();
    const auditType = auditTypeSelect.value;
    
    if (!spreadsheetUrl) {
      alert('Please enter a Google Sheet URL');
      return;
    }
    
    // Extract the spreadsheet ID from the URL
    let spreadsheetId;
    try {
      // Regex to extract the spreadsheet ID from various Google Sheet URL formats
      const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      const match = spreadsheetUrl.match(regex);
      spreadsheetId = match ? match[1] : null;
      
      if (!spreadsheetId) {
        // If not in standard format, try if they just pasted the ID directly
        if (/^[a-zA-Z0-9-_]+$/.test(spreadsheetUrl)) {
          spreadsheetId = spreadsheetUrl;
        } else {
          throw new Error('Invalid URL format');
        }
      }
      
      console.log('Extracted spreadsheet ID:', spreadsheetId);
    } catch (error) {
      console.error('Error extracting spreadsheet ID:', error);
      alert('Invalid Google Sheet URL. Please check and try again.');
      return;
    }
    
    // Save the spreadsheet URL for future sessions
    chrome.storage.local.set({ spreadsheetUrl: spreadsheetUrl });
    
    // Update UI to show we're starting
    startAuditButton.disabled = true;
    statusDiv.classList.remove('hidden');
    statusText.textContent = 'Initializing audit...';
    progressBar.style.width = '10%';
    recordInfo.textContent = '';
    fieldInfo.textContent = '';
    errorInfo.textContent = '';
    errorInfo.classList.add('hidden');
    
    // Reset current state
    currentAuditState = {
      status: 'in_progress',
      currentRecordIndex: 0,
      recordCount: 0
    };
    
    // Send a message to the background script to start the audit
    chrome.runtime.sendMessage({
      action: 'startAudit',
      spreadsheetId: spreadsheetId,
      auditType: auditType
    });
    
    // Show skip button for manual intervention
    skipRecordButton.classList.remove('hidden');
  });
  
  // Stop Audit button click handler
  stopAuditButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({
      action: 'stopAudit'
    });
    
    statusText.textContent = 'Audit stopped by user.';
    startAuditButton.disabled = false;
    skipRecordButton.classList.add('hidden');
    currentAuditState.status = 'idle';
  });
  
  // Skip Record button click handler (for manual intervention when stuck)
  skipRecordButton.addEventListener('click', function() {
    if (currentAuditState.status !== 'in_progress') {
      return;
    }
    
    chrome.runtime.sendMessage({
      action: 'skipRecord'
    });
    
    // Update UI to show skipping
    statusText.textContent = 'Skipping current record...';
    errorInfo.textContent = 'Manually skipped by user';
    errorInfo.classList.remove('hidden');
  });
  
  // Check audit status on popup opening
  chrome.runtime.sendMessage({ action: 'getAuditState' }, function(response) {
    if (response) {
      currentAuditState = {
        status: response.status,
        currentRecordIndex: response.currentRecordIndex || 0,
        recordCount: response.recordCount || 0
      };
      
      if (response.status === 'in_progress') {
        startAuditButton.disabled = true;
        statusDiv.classList.remove('hidden');
        skipRecordButton.classList.remove('hidden');
        
        // Update UI with current state
        updateStatusUI(response);
      }
    }
  });

  // Helper function to update the status UI
  function updateStatusUI(data) {
    // Main status message
    statusText.textContent = data.message || 'Processing...';
    
    // Record information
    if (data.currentRecord) {
      recordInfo.textContent = `Record: ${data.currentRecord}`;
      recordInfo.style.display = 'block';
    } else {
      recordInfo.style.display = 'none';
    }
    
    // Field information
    if (data.currentField) {
      fieldInfo.textContent = `Field: ${data.currentField}`;
      fieldInfo.style.display = 'block';
    } else {
      fieldInfo.style.display = 'none';
    }
    
    // Error information
    if (data.error) {
      errorInfo.textContent = `Error: ${data.error}`;
      errorInfo.classList.remove('hidden');
    } else {
      errorInfo.classList.add('hidden');
    }
    
    // Progress bar
    if (data.progress !== null && data.progress !== undefined) {
      progressBar.style.width = `${data.progress}%`;
    }
    
    // Status styling
    if (data.status === 'error') {
      statusDiv.classList.add('error');
    } else {
      statusDiv.classList.remove('error');
    }
    
    // Button state
    if (data.status === 'complete' || data.status === 'error' || data.status === 'idle') {
      startAuditButton.disabled = false;
      skipRecordButton.classList.add('hidden');
    } else {
      skipRecordButton.classList.remove('hidden');
    }
  }

  // Listen for status updates from the background script
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.type === 'auditStatus') {
      statusDiv.classList.remove('hidden');
      
      // Update the current audit state
      if (message.status) {
        currentAuditState.status = message.status;
      }
      
      if (message.currentRecordIndex !== undefined) {
        currentAuditState.currentRecordIndex = message.currentRecordIndex;
      }
      
      if (message.recordCount !== undefined) {
        currentAuditState.recordCount = message.recordCount;
      }
      
      // Update the UI
      updateStatusUI(message);
      
      console.log('Status updated:', message.message);
    }
  });
});