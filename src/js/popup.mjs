// Import column modules for audit flow
import columnModules from './column-modules/index.mjs';
// Import helpers for navigation and element interactions
import ColumnHelpers from './column-modules/column-helpers.mjs';

// Initialize popup UI after DOM is ready
function initPopup() {
  const startAuditButton = document.getElementById('startAudit');
  const stopAuditButton = document.getElementById('stopAudit');
  const skipRecordButton = document.getElementById('skipRecord');
  const spreadsheetUrlInput = document.getElementById('spreadsheetUrl');
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
  
  // Column modules are available via top-level import
  
  // Orchestrates audit flow by invoking each column module
  async function processAuditFlow(spreadsheetId, auditType) {
    const modules = Object.values(columnModules);
    let count = 0;
    for (const mod of modules) {
      // Call run on module; context could include record data (placeholder here)
      try {
        const result = await mod.run(null, null, { record: {} });
        // Update progress UI
        count++;
        updateStatusUI({ message: result.message || `Processed ${mod.name}`, progress: Math.round((count / modules.length) * 100) });
        // Handle confirmation if needed
        if (result.requiresConfirmation) {
          // Prepare prompt data from module
          const promptData = mod.displayData(row, col, { result, record: {} });
          // Navigate to Documents tab for verification
          await ColumnHelpers.navigateToPage('Documents');
          // Show verification dialog with promptData
          await showVerificationDialog(promptData);
        }
      } catch (e) {
        console.error(`Module ${mod.id} error:`, e);
      }
    }
    // Finalize UI
    statusText.textContent = 'Audit complete';
    startAuditButton.disabled = false;
    skipRecordButton.classList.add('hidden');
  }

  // Start Audit button click handler
  startAuditButton.addEventListener('click', () => {
    const spreadsheetUrl = spreadsheetUrlInput.value.trim();
    // Safely get auditType value; default to empty if element missing
    const auditType = document.getElementById('auditType')?.value || '';
    
    if (!spreadsheetUrl) {
      // Show validation error in UI
      errorInfo.textContent = 'Please enter a Google Sheet URL';
      errorInfo.classList.remove('hidden');
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
      // Show URL format error in UI
      errorInfo.textContent = 'Invalid Google Sheet URL. Please check and try again.';
      errorInfo.classList.remove('hidden');
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
    
    // Notify background to start audit, include callback so tests can verify
    chrome.runtime.sendMessage(
      {
        action: 'startAudit',
        spreadsheetId: spreadsheetId,
        auditType: auditType
      },
      () => {}
    );
    
    // Kick off column modules processing flow asynchronously
    processAuditFlow(spreadsheetId, auditType);
    
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
    // === User Confirmation Workflow ===
    if (message.type === 'fieldVerificationPrompt') {
      showVerificationDialog(message.promptData);
    }
  });

  // --- User Confirmation Dialog for Column Modules ---
  function showVerificationDialog(promptData) {
    // Remove existing dialog if present
    let existing = document.getElementById('ea-popup-verification-dialog');
    if (existing) existing.remove();

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'ea-popup-overlay';
    overlay.id = 'ea-popup-verification-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 10000,
      background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    });

    // Dialog
    const dialog = document.createElement('div');
    dialog.className = 'ea-popup-dialog';
    dialog.id = 'ea-popup-verification-dialog';
    Object.assign(dialog.style, {
      background: '#fff', borderRadius: '8px', padding: '24px', minWidth: '340px', maxWidth: '90vw',
      boxShadow: '0 4px 32px rgba(0,0,0,0.18)', fontFamily: 'inherit', color: '#222'
    });

    // Title
    const title = document.createElement('h2');
    title.textContent = `Verify ${promptData.fieldName || ''}`;
    dialog.appendChild(title);

    // Message
    if (promptData.message) {
      const msg = document.createElement('div');
      msg.textContent = promptData.message;
      msg.style.marginBottom = '16px';
      dialog.appendChild(msg);
    }

    // PDF/Sheet values
    const values = document.createElement('div');
    values.style.display = 'flex';
    values.style.justifyContent = 'space-between';
    values.style.marginBottom = '12px';
    values.innerHTML = `
      <div><b>PDF Value:</b><br>${promptData.pdfValue || 'Not found'}</div>
      <div><b>Expected:</b><br>${promptData.expectedValue || 'N/A'}</div>
    `;
    dialog.appendChild(values);

    // Comment section (hidden until skip/flag)
    const commentSection = document.createElement('div');
    commentSection.style.display = 'none';
    commentSection.style.marginTop = '8px';
    const commentLabel = document.createElement('div');
    commentLabel.textContent = 'Add a comment (optional):';
    commentLabel.style.fontSize = '13px';
    const commentInput = document.createElement('textarea');
    commentInput.style.width = '100%';
    commentInput.style.minHeight = '36px';
    commentInput.style.marginTop = '4px';
    commentInput.style.fontSize = '14px';
    commentInput.id = 'ea-popup-comment-input';
    commentSection.appendChild(commentLabel);
    commentSection.appendChild(commentInput);
    dialog.appendChild(commentSection);

    // Actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '12px';
    actions.style.marginTop = '18px';

    // Confirm
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Mark as Verified';
    btnConfirm.className = 'ea-popup-btn ea-popup-btn-confirm';
    btnConfirm.onclick = function() {
      sendVerificationResult('confirm', '');
    };
    actions.appendChild(btnConfirm);

    // Skip
    const btnSkip = document.createElement('button');
    btnSkip.textContent = 'Skip';
    btnSkip.className = 'ea-popup-btn ea-popup-btn-skip';
    btnSkip.onclick = function() {
      commentSection.style.display = 'block';
      btnSkip.textContent = 'Submit Skip';
      btnSkip.onclick = function() {
        sendVerificationResult('skip', commentInput.value);
      };
    };
    actions.appendChild(btnSkip);

    // Flag
    const btnFlag = document.createElement('button');
    btnFlag.textContent = 'Flag as Mismatch';
    btnFlag.className = 'ea-popup-btn ea-popup-btn-flag';
    btnFlag.onclick = function() {
      commentSection.style.display = 'block';
      btnFlag.textContent = 'Submit Flag';
      btnFlag.onclick = function() {
        sendVerificationResult('flag', commentInput.value);
      };
    };
    actions.appendChild(btnFlag);

    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Helper: send result and close
    function sendVerificationResult(action, comment) {
      chrome.runtime.sendMessage({
        action: 'fieldVerified',
        result: {
          action,
          comment,
          column: promptData.column,
          field: promptData.fieldName,
          pdfValue: promptData.pdfValue,
          sheetValue: promptData.expectedValue
        }
      });
      overlay.remove();
    }
  }
}

// Listen for DOM ready
document.addEventListener('DOMContentLoaded', initPopup);

// Expose initPopup globally for testing
globalThis.initPopup = initPopup;

// Export for unit tests
export default initPopup;
// Named export for unit tests
export { initPopup };