// Add passive flag to event listeners to address warnings
(function () {
  // Make all scroll event listeners passive
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type === 'wheel' || type === 'touchstart' || type === 'touchmove') {
      let newOptions = options;
      if (typeof options === 'boolean') {
        newOptions = {capture: options, passive: true};
      } else if (typeof options === 'object') {
        newOptions = Object.assign({}, options, {passive: true});
      } else {
        newOptions = {passive: true};
      }
      return originalAddEventListener.call(this, type, listener, newOptions);
    } else {
      return originalAddEventListener.call(this, type, listener, options);
    }
  };
})();

// State for the content script
let contentState = {
  currentResident: null,
  currentRecord: null,
  currentModule: null,
  currentColumn: null,
  expectedValue: null,
  sheetColumn: null,
  pdfText: null,
  pdfValue: null
};

// Helper function to extract text from PDF viewer
function extractPdfText() {
  // This function will need to be customized based on how Entrata's PDF viewer works
  // For this implementation, we'll assume the PDF content is rendered as text in the DOM

  // Try to find common PDF viewer elements
  const pdfContent = document.querySelector('.pdf-content') ||
    document.querySelector('.pdf-viewer') ||
    document.querySelector('iframe.pdf-viewer')?.contentDocument?.body;

  if (pdfContent) {
    return pdfContent.innerText || pdfContent.textContent;
  }

  // Fallback: just get text from the entire document
  // This is a crude approach, but it may work depending on the layout
  return document.body.innerText || document.body.textContent;
}

// Function to find a value in the PDF text based on a label/selector
function findValueInPdf(selector, pdfText) {
  // This is a simplified implementation - in a real extension, you'd need more robust parsing

  // Look for the selector in the text
  const regex = new RegExp(`${selector}[:\\s]+(.*?)(?=\\n|$)`, 'i');
  const match = pdfText.match(regex);

  if (match && match[1]) {
    // Clean up the value (trim whitespace, remove any non-relevant characters)
    return match[1].trim();
  }

  // If not found with the exact pattern, try more lenient search
  const lines = pdfText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(selector)) {
      // Found a line with the selector, try to extract the value
      const parts = lines[i].split(':');
      if (parts.length > 1) {
        return parts[1].trim();
      }

      // If the value is on the next line
      if (i + 1 < lines.length) {
        return lines[i + 1].trim();
      }
    }
  }

  return null;
}

// Function to scroll to a specific text in the PDF
async function scrollToPdfText(text) {
  // Using the browser's built-in find function
  try {
    window.find(text);
  } catch (e) {
    console.warn('Browser find function failed:', e);
    // Continue to fallback method
  }

  // Fallback: manually find and scroll to the element containing the text
  try {
    // Limit to elements that might contain text to reduce performance impact
    const elements = document.querySelectorAll('p, span, div, td, th, li, a, h1, h2, h3, h4, h5, h6, label');

    for (const element of elements) {
      if (element.textContent && element.textContent.includes(text)) {
        // Use requestAnimationFrame to smooth out scrolling operations
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            element.scrollIntoView({behavior: 'smooth', block: 'center'});

            // Highlight the element temporarily
            const originalBackground = element.style.backgroundColor;
            element.style.backgroundColor = 'yellow';

            // Use requestAnimationFrame for the timeout to avoid forced reflow
            setTimeout(() => {
              requestAnimationFrame(() => {
                element.style.backgroundColor = originalBackground;
                resolve();
              });
            }, 2000);
          });
        });

        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn('Manual scroll to text failed:', e);
    return false;
  }
}

// Function to find and click on a resident in the residents list
async function findAndClickResident(firstName, lastName, tryNextPage = true) {
  console.log(`Searching for resident: ${firstName} ${lastName}`);

  // First, try exact match with firstName and lastName
  const exactMatches = Array.from(document.querySelectorAll('a, td, span')).filter(el => {
    if (!el.textContent) return false;
    const text = el.textContent.trim();
    // Check if the element contains exactly firstName lastName (case insensitive)
    const fullNamePattern = new RegExp(`\\b${firstName}\\s+${lastName}\\b`, 'i');
    return fullNamePattern.test(text);
  });

  if (exactMatches.length > 0) {
    console.log(`Found exact match for ${firstName} ${lastName}`);
    // Click the closest clickable parent or the element itself
    const elementToClick = findClickableParent(exactMatches[0]) || exactMatches[0];
    elementToClick.click();
    return true;
  }

  // If no exact match, try partial match
  const partialMatches = Array.from(document.querySelectorAll('a, td, span')).filter(el =>
    el.textContent && el.textContent.includes(firstName) && el.textContent.includes(lastName)
  );

  if (partialMatches.length > 0) {
    console.log(`Found partial match for ${firstName} ${lastName}`);
    // Click the closest clickable parent or the element itself
    const elementToClick = findClickableParent(partialMatches[0]) || partialMatches[0];
    elementToClick.click();
    return true;
  }

  // If we didn't find the resident and pagination is allowed, try the next page
  if (tryNextPage) {
    console.log(`No match found for ${firstName} ${lastName} on current page. Trying next page...`);
    
    // Find and click the "Next page" button
    if (await clickNextPageButton()) {
      // Wait for the next page to load
      await wait(1500);
      
      // Search for the resident on the new page (without trying next page again to avoid infinite loops)
      return await findAndClickResident(firstName, lastName, false);
    }
  }

  console.log(`No match found for ${firstName} ${lastName} and no more pages to check`);
  return false;
}

// Function to find and click the "Next page" button
async function clickNextPageButton() {
  console.log('Looking for next page button...');
  
  // Find any element that looks like a "Next" button
  const nextButtons = Array.from(document.querySelectorAll('a, button, span, div')).filter(el => {
    if (!el.textContent) return false;
    
    const text = el.textContent.trim().toLowerCase();
    return (
      // Look for common "next page" indicators
      text === 'next' || 
      text === 'next page' || 
      text === '>' || 
      text === '>>' || 
      text.includes('next') ||
      // Also check for aria labels
      el.getAttribute('aria-label')?.toLowerCase().includes('next') ||
      // And for common next page classes
      el.className.includes('next') ||
      // Check for pagination with numbers where the current page is highlighted
      (el.textContent.match(/^\d+$/) && 
       !el.classList.contains('active') && 
       !el.classList.contains('current') &&
       document.querySelector('.pagination') !== null)
    );
  });
  
  console.log(`Found ${nextButtons.length} potential next page buttons`);
  
  // Try to find the most likely "next page" button
  for (const button of nextButtons) {
    // Skip if it's disabled or has a "disabled" class
    if (button.disabled || 
        button.classList.contains('disabled') || 
        button.getAttribute('aria-disabled') === 'true') {
      continue;
    }
    
    console.log('Clicking next page button:', button.textContent);
    button.click();
    return true;
  }
  
  // If we can't find a dedicated "Next" button, try to find numbered pagination
  const paginationElements = document.querySelectorAll('.pagination, [role="pagination"], nav');
  for (const pagination of paginationElements) {
    const currentPage = pagination.querySelector('.active, .current, [aria-current="true"]');
    if (currentPage) {
      // Find the next number after the current page
      const currentNumber = parseInt(currentPage.textContent);
      if (!isNaN(currentNumber)) {
        const nextNumberElement = Array.from(pagination.querySelectorAll('a, button, span'))
          .find(el => parseInt(el.textContent) === currentNumber + 1);
        
        if (nextNumberElement) {
          console.log('Clicking next page number:', nextNumberElement.textContent);
          nextNumberElement.click();
          return true;
        }
      }
    }
  }

  console.log('No next page button found');
  return false;
}

// Helper function to find a clickable parent element
function findClickableParent(element) {
  let current = element;
  const maxDepth = 5; // Avoid infinite loops by setting a max depth
  let depth = 0;

  while (current && depth < maxDepth) {
    // Check if the element is a link, button, or has onclick attribute
    if (current.tagName === 'A' || current.tagName === 'BUTTON' ||
      current.getAttribute('onclick') ||
      current.getAttribute('role') === 'button') {
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

// Function to navigate to Documents tab in resident profile
function navigateToDocumentsTab() {
  console.log('Looking for Documents tab...');

  // Try multiple selectors to find the Documents tab
  const documentsTab = Array.from(document.querySelectorAll('a, button, div, li, span, nav a, nav button, nav div, .nav-item, [role="tab"]'))
    .filter(el => el.textContent &&
      (el.textContent.trim() === 'Documents' ||
        el.textContent.trim().includes('Document') ||
        el.textContent.trim().includes('Doc')))
    .sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.textContent.trim() === 'Documents';
      const bExact = b.textContent.trim() === 'Documents';
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Otherwise prioritize shorter text (less likely to be a container)
      return a.textContent.length - b.textContent.length;
    })[0];

  if (documentsTab) {
    console.log('Found Documents tab:', documentsTab.textContent);
    documentsTab.click();
    return true;
  }

  console.log('Documents tab not found, looking for navigation elements...');

  // Try to find through navigation elements
  const navItems = Array.from(document.querySelectorAll('nav a, .navbar a, .tabs a, .tab, .nav-item, .menu-item, [role="tab"]'));
  console.log('Found ' + navItems.length + ' navigation items');

  for (const item of navItems) {
    console.log('Nav item text:', item.textContent?.trim());
  }

  return false;
}

// Function to find and click on the lease document
function findAndClickLeaseDocument() {
  console.log('Looking for lease document...');

  // Look for elements containing "Lease - Signed" pattern in the documents list
  const leaseRows = Array.from(document.querySelectorAll('tr, div.document-row, a, div, td, span')).filter(el =>
    el.textContent &&
    /\w+ Lease - Signed/.test(el.textContent) &&
    !el.textContent.includes('Application')
  );

  console.log('Found ' + leaseRows.length + ' potential lease documents with pattern "* Lease - Signed"');

  if (leaseRows.length > 0) {
    // Log what we found
    leaseRows.forEach((row, i) => {
      console.log(`Lease document ${i + 1}:`, row.textContent?.trim());
    });

    // Find the click target within the lease row (link, button, etc.)
    const clickTarget = leaseRows[0].querySelector('a') ||
      leaseRows[0].querySelector('button') ||
      leaseRows[0];

    console.log('Clicking on:', clickTarget.textContent?.trim());
    clickTarget.click();
    return true;
  }

  // Fallback to more generic search if specific pattern not found
  console.log('No documents matching "* Lease - Signed" pattern found, trying generic lease search...');

  const fallbackRows = Array.from(document.querySelectorAll('tr, div.document-row, a, div, td, span')).filter(el =>
    el.textContent &&
    el.textContent.includes('Lease') &&
    el.textContent.includes('Signed') &&
    !el.textContent.includes('Application')
  );

  console.log('Found ' + fallbackRows.length + ' potential lease documents with generic search');

  if (fallbackRows.length > 0) {
    // Find the click target within the lease row
    const clickTarget = fallbackRows[0].querySelector('a') ||
      fallbackRows[0].querySelector('button') ||
      fallbackRows[0];

    console.log('Clicking on:', clickTarget.textContent?.trim());
    clickTarget.click();
    return true;
  }

  console.log('No lease documents found');
  return false;
}

// Function to check current page type
function getCurrentPageType() {
  const url = window.location.href;
  console.log('Checking page type for URL:', url);

  // 1. Check for residents list page
  if (url.includes('/residents') && !url.includes('/resident/')) {
    return 'residentsList';
  }
  
  // Additional check for residents list - for Entrata specific URLs
  if (url.includes('customers_system') || url.includes('module=customers')) {
    console.log('URL suggests residents list');
    
    // Look for resident list elements
    const hasResidentList = 
      document.querySelector('.resident-list, .residents-list, [data-testid*="resident"]') ||
      document.querySelector('table.residents, table.list') ||
      Array.from(document.querySelectorAll('h1, h2, .page-title')).some(el => 
        el.textContent && el.textContent.toLowerCase().includes('resident')
      );
    
    if (hasResidentList) {
      console.log('Found resident list UI elements');
      return 'residentsList';
    }
    
    // Log some page info for debugging
    console.log('Page title:', document.title);
    console.log('Main headings:', Array.from(document.querySelectorAll('h1, h2')).map(h => h.textContent).join(', '));
  }

  // 2. Check for resident profile page
  if (url.includes('/resident/')) {
    // Find Documents tab using text content
    const hasDocumentsTab = Array.from(document.querySelectorAll('a, div, button, li, span, nav a'))
      .some(el => el.textContent && 
            (el.textContent.trim() === 'Documents' || 
             el.textContent.trim() === 'Document' ||
             el.textContent.trim() === 'Docs')
      );

    if (hasDocumentsTab) {
      console.log('Found Documents tab in resident profile');
      return 'residentProfile';
    }

    // Find Documents list using broader selectors
    const hasDocumentsList = 
      document.querySelector('.documents-list, .document-table, [data-testid="documents-list"]') ||
      Array.from(document.querySelectorAll('tr, td, div')).some(el =>
        el.textContent && el.textContent.includes('Lease') &&
        (el.textContent.includes('Signed') || el.textContent.includes('e-Sign'))
      );

    if (hasDocumentsList) {
      console.log('Found Documents list in resident profile');
      return 'documentsTab';
    }
  }

  // 3. Check if we're viewing a resident in any other system/way
  const residentProfileIndicators = [
    '.resident-profile',
    '.resident-details',
    '[data-testid*="resident-profile"]',
    '[data-testid*="resident-detail"]'
  ];
  
  for (const selector of residentProfileIndicators) {
    if (document.querySelector(selector)) {
      console.log('Found resident profile indicator:', selector);
      return 'residentProfile';
    }
  }

  // 4. Expanded PDF viewer detection
  const isPdfViewer =
    url.includes('pdf') ||
    document.querySelector('iframe.pdf-viewer, .pdf-content, .pdf-container, [data-testid="pdf-viewer"]') ||
    (document.querySelector('iframe') && document.querySelector('iframe').src &&
      document.querySelector('iframe').src.includes('pdf')) ||
    document.querySelector('embed[type="application/pdf"]') ||
    document.querySelector('object[type="application/pdf"]');

  if (isPdfViewer) {
    console.log('Found PDF viewer');
    return 'pdfViewer';
  }

  // 5. Check for login page
  if (url.includes('login') || document.querySelector('form[name="loginForm"]') ||
      document.querySelector('input[type="password"]')) {
    console.log('On login page');
    return 'loginPage';
  }

  console.log('Unknown page type');
  return 'unknown';
}

// Function to create the verification dialog
function createVerificationDialog(fieldName, pdfValue, expectedValue, match) {
  // Remove any existing dialog
  const existingDialog = document.getElementById('ea-verification-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create the overlay and dialog
  const overlay = document.createElement('div');
  overlay.className = 'ea-overlay';
  overlay.id = 'ea-verification-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'ea-dialog';
  dialog.id = 'ea-verification-dialog';

  // Dialog title
  const title = document.createElement('h2');
  title.className = 'ea-dialog-title';
  title.textContent = `Verify ${fieldName}`;
  dialog.appendChild(title);

  // Field comparison section
  const comparison = document.createElement('div');
  comparison.className = 'ea-field-comparison';

  const fieldLabel = document.createElement('div');
  fieldLabel.className = 'ea-field-label';
  fieldLabel.textContent = fieldName;
  comparison.appendChild(fieldLabel);

  const valuesContainer = document.createElement('div');
  valuesContainer.className = 'ea-values-container';

  // PDF value box
  const pdfValueBox = document.createElement('div');
  pdfValueBox.className = 'ea-value-box';

  const pdfValueLabel = document.createElement('div');
  pdfValueLabel.className = 'ea-value-label';
  pdfValueLabel.textContent = 'Lease Document Value:';
  pdfValueBox.appendChild(pdfValueLabel);

  const pdfValueText = document.createElement('div');
  pdfValueText.className = 'ea-value';
  pdfValueText.textContent = pdfValue || 'Not found';
  pdfValueBox.appendChild(pdfValueText);

  // Expected value box
  const expectedValueBox = document.createElement('div');
  expectedValueBox.className = 'ea-value-box';

  const expectedValueLabel = document.createElement('div');
  expectedValueLabel.className = 'ea-value-label';
  expectedValueLabel.textContent = 'Expected (Sheet) Value:';
  expectedValueBox.appendChild(expectedValueLabel);

  const expectedValueText = document.createElement('div');
  expectedValueText.className = 'ea-value';
  expectedValueText.textContent = expectedValue || 'N/A';
  expectedValueBox.appendChild(expectedValueText);

  // Add match/mismatch indicator
  if (pdfValue && expectedValue) {
    if (match) {
      pdfValueText.classList.add('ea-match');
      expectedValueText.classList.add('ea-match');
    } else {
      pdfValueText.classList.add('ea-mismatch');
      expectedValueText.classList.add('ea-mismatch');
    }
  }

  valuesContainer.appendChild(pdfValueBox);
  valuesContainer.appendChild(expectedValueBox);
  comparison.appendChild(valuesContainer);

  dialog.appendChild(comparison);

  // Comment section (initially hidden)
  const commentSection = document.createElement('div');
  commentSection.className = 'ea-comment-section ea-hidden';
  commentSection.id = 'ea-comment-section';

  const commentLabel = document.createElement('div');
  commentLabel.className = 'ea-comment-label';
  commentLabel.textContent = 'Add a comment (optional):';
  commentSection.appendChild(commentLabel);

  const commentInput = document.createElement('textarea');
  commentInput.className = 'ea-comment-input';
  commentInput.id = 'ea-comment-input';
  commentInput.placeholder = 'Enter comment here...';
  commentSection.appendChild(commentInput);

  dialog.appendChild(commentSection);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'ea-actions';

  const confirmButton = document.createElement('button');
  confirmButton.className = 'ea-button ea-button-confirm';
  confirmButton.textContent = 'Mark as Verified';
  confirmButton.onclick = function () {
    handleVerificationAction('confirm');
  };

  const skipButton = document.createElement('button');
  skipButton.className = 'ea-button ea-button-skip';
  skipButton.textContent = 'Skip';
  skipButton.onclick = function () {
    const commentSection = document.getElementById('ea-comment-section');
    commentSection.classList.remove('ea-hidden');

    // Change button to "Submit Skip"
    skipButton.textContent = 'Submit Skip';
    skipButton.onclick = function () {
      const comment = document.getElementById('ea-comment-input').value;
      handleVerificationAction('skip', comment);
    };
  };

  const flagButton = document.createElement('button');
  flagButton.className = 'ea-button ea-button-flag';
  flagButton.textContent = 'Flag as Mismatch';
  flagButton.onclick = function () {
    const commentSection = document.getElementById('ea-comment-section');
    commentSection.classList.remove('ea-hidden');

    // Change button to "Submit Flag"
    flagButton.textContent = 'Submit Flag';
    flagButton.onclick = function () {
      const comment = document.getElementById('ea-comment-input').value;
      handleVerificationAction('flag', comment);
    };
  };

  actions.appendChild(confirmButton);
  actions.appendChild(skipButton);
  actions.appendChild(flagButton);

  dialog.appendChild(actions);

  // Add dialog to overlay and overlay to page
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// Handle user verification action
function handleVerificationAction(action, comment = '') {
  // Send message to background script with the result
  chrome.runtime.sendMessage({
    action: 'fieldVerified',
    result: {
      action,
      comment,
      column: contentState.currentColumn,
      field: contentState.currentModule,
      pdfValue: contentState.pdfValue,
      sheetValue: contentState.expectedValue
    }
  });

  // Remove the dialog
  const overlay = document.getElementById('ea-verification-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Utility helpers
const wait = ms => new Promise(r => setTimeout(r, ms));
const poll = async (testFn, timeout = 8000, interval = 300) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (testFn()) return true;
    await wait(interval);
  }
  return false;
};

// Setup the audit environment (sort residents, apply filters)
async function setupAudit(auditType) {
  console.log(`Setting up audit environment for ${auditType} leases`);
  
  try {
    // First, verify we're on a valid Entrata page
    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    
    // Check if we're on Entrata
    if (!currentUrl.includes('entrata.com')) {
      console.error('Not on Entrata site');
      return { 
        success: false, 
        error: 'Not on Entrata site' 
      };
    }
    
    // Check if we need to wait for login
    if (currentUrl.includes('login') || document.querySelector('form[name="loginForm"]')) {
      console.log('On login page - user needs to log in first');
      return { 
        success: false, 
        error: 'Please log in to Entrata first' 
      };
    }
    
    // Check if we're on residents page
    const isResidentsPage = currentUrl.includes('customers_system') || 
                           document.querySelector('.resident-list') ||
                           document.querySelector('[data-testid="residents-list"]') ||
                           document.title.toLowerCase().includes('resident');
    
    console.log('Is residents page:', isResidentsPage);
    
    if (!isResidentsPage) {
      console.warn('Not on residents page - attempting to check page content');
      
      // Fallback: check for common Entrata residents page elements
      const potentialResidentElements = document.querySelectorAll('table, tbody, tr, td, div.list');
      console.log(`Found ${potentialResidentElements.length} potential resident elements`);
      
      // Log what we found to help debug
      Array.from(potentialResidentElements).slice(0, 5).forEach((el, idx) => {
        console.log(`Element ${idx}:`, el.tagName, el.className, el.textContent?.substring(0, 50));
      });
    }
    
    // Wait for the page to fully load
    console.log('Waiting for page to fully load...');
    await wait(3000);
    
    console.log('Attempting to set up residents view...');
    
    // 1. Try to get to the first page of results
    await goToFirstPage();
    
    // 2. Try to set up the right view and sorting
    const viewSetupSuccess = await setupResidentsView();
    if (!viewSetupSuccess) {
      console.warn('Could not set up optimal residents view, but continuing...');
    }
    
    // Document what we found for debugging purposes
    const residentRows = document.querySelectorAll('tr, .resident-row, .list-item');
    console.log(`Found ${residentRows.length} potential resident rows`);
    
    // Document a few sample resident names if available
    const sampleNames = Array.from(residentRows).slice(0, 3).map(row => {
      return row.textContent?.trim().substring(0, 30) || 'No text content';
    });
    console.log('Sample resident names:', sampleNames);
    
    return { 
      success: true,
      message: `Setup complete. Found ${residentRows.length} potential residents.` 
    };
  } catch (error) {
    console.error('Error in setupAudit:', error);
    return { 
      success: false, 
      error: error.message || 'Unknown error in setupAudit' 
    };
  }
}

// Function to go to the first page of residents
async function goToFirstPage() {
  console.log('Attempting to go to first page of residents...');
  
  // Look for "First" button or a "1" pagination link
  const firstPageButtons = Array.from(document.querySelectorAll('a, button, span, div')).filter(el => {
    if (!el.textContent) return false;
    
    const text = el.textContent.trim().toLowerCase();
    return (
      text === 'first' || 
      text === '1' || 
      text === '<<' ||
      el.getAttribute('aria-label')?.toLowerCase().includes('first page')
    );
  });
  
  // Try to find the first page button that's not disabled
  for (const button of firstPageButtons) {
    if (!button.disabled && 
        !button.classList.contains('disabled') && 
        button.getAttribute('aria-disabled') !== 'true') {
      
      console.log('Clicking first page button:', button.textContent);
      button.click();
      await wait(1500); // Wait for page to load
      return true;
    }
  }
  
  console.log('No first page button found (might already be on first page)');
  return false;
}

// Function to set up the residents view (sorting, filters, etc.)
async function setupResidentsView() {
  console.log('Setting up residents view...');
  
  // Try to find column headers to sort by name
  const nameHeaders = Array.from(document.querySelectorAll('th, td, div.header')).filter(el => 
    el.textContent && 
    (el.textContent.toLowerCase().includes('name') || 
     el.textContent.toLowerCase().includes('resident'))
  );
  
  if (nameHeaders.length > 0) {
    // Click the most likely name header to sort by name
    console.log('Found name column header, clicking to sort:', nameHeaders[0].textContent);
    nameHeaders[0].click();
    await wait(1000);
    
    // Optional: Click again to toggle sort direction if needed
    // This depends on Entrata's default sort direction
    // nameHeaders[0].click();
    // await wait(1000);
    
    return true;
  }
  
  // If we can't find a name header, look for sort options elsewhere
  const sortOptions = Array.from(document.querySelectorAll('select, button, a')).filter(el =>
    el.textContent && 
    (el.textContent.toLowerCase().includes('sort') || 
     el.id?.toLowerCase().includes('sort'))
  );
  
  if (sortOptions.length > 0) {
    console.log('Found sort option, clicking:', sortOptions[0].textContent);
    sortOptions[0].click();
    await wait(500);
    
    // Look for name option in any dropdown that might have appeared
    const nameOptions = Array.from(document.querySelectorAll('option, li, a, div')).filter(el =>
      el.textContent && 
      (el.textContent.toLowerCase().includes('name') || 
       el.textContent.toLowerCase().includes('resident'))
    );
    
    if (nameOptions.length > 0) {
      console.log('Selecting name sort option:', nameOptions[0].textContent);
      nameOptions[0].click();
      await wait(1000);
      return true;
    }
  }
  
  console.log('Could not set up preferred sorting');
  return false;
}

// Process a resident and navigate to that resident's "Documents" tab
async function processResident(resident, record) {
  contentState.currentResident = resident;
  contentState.currentRecord = record;

  console.log(`▶︎ Processing ${resident.firstName} ${resident.lastName}`);

  /* 1. Make sure we're on the Residents list (or at least *not* in a profile) */
  let pageType = getCurrentPageType();
  if (pageType !== 'residentsList') {
    console.warn('[LeaseAudit] Not on Residents list. Current pageType =', pageType);
    return { success: false, error: 'Expected Residents list' };
  }

  /* 2. Click the resident's name in the list */
  // Now using the async version which checks multiple pages as needed
  const residentFound = await findAndClickResident(resident.firstName, resident.lastName, true);
  if (!residentFound) {
    return { success: false, error: 'Resident not found in list (checked all pages)' };
  }

  /* 3. Wait until Entrata loads the profile page */
  const profileLoaded = await poll(() => {
    const pt = getCurrentPageType();
    return pt === 'residentProfile';
  }, 10000); // Increase timeout to 10 seconds

  if (!profileLoaded) {
    return { success: false, error: 'Resident profile did not load' };
  }
  console.log('✔ Resident profile open.');

  /* 4. Click the "Documents" tab */
  if (!navigateToDocumentsTab()) {
    return { success: false, error: 'Documents tab not found' };
  }

  /* 5. Wait until the Documents list is visible */
  const docsLoaded = await poll(() => getCurrentPageType() === 'documentsTab', 10000);
  if (!docsLoaded) {
    return { success: false, error: 'Documents list did not load' };
  }
  console.log('✔ Documents tab open.');

  /* 6. Find and click on the lease document */
  if (!findAndClickLeaseDocument()) {
    return { success: false, error: 'Lease document not found' };
  }

  /* 7. Wait until the PDF viewer is loaded */
  const pdfLoaded = await poll(() => getCurrentPageType() === 'pdfViewer', 10000);
  if (!pdfLoaded) {
    return { success: false, error: 'PDF viewer did not load' };
  }
  console.log('✔ Lease PDF open.');

  /* 8. Extract PDF text */
  await wait(1500); // Give the PDF a moment to fully render (increased wait time)
  contentState.pdfText = extractPdfText();
  if (!contentState.pdfText) {
    return { success: false, error: 'Failed to extract PDF text' };
  }
  console.log('✔ PDF text extracted:', contentState.pdfText.substring(0, 100) + '...');

  return { success: true };
}

// Verify a field from the lease document
async function verifyField(column, module, expectedValue, sheetColumn) {
  contentState.currentModule = module;
  contentState.currentColumn = column;
  contentState.expectedValue = expectedValue;
  contentState.sheetColumn = sheetColumn;

  // Make sure we're on the PDF viewer page
  if (getCurrentPageType() !== 'pdfViewer') {
    console.error('Not on PDF viewer page');
    chrome.runtime.sendMessage({
      action: 'fieldVerified',
      result: {
        action: 'skip',
        comment: 'Not on PDF viewer page',
        column,
        field: module,
        pdfValue: null,
        sheetValue: expectedValue
      }
    });
    return;
  }

  // If PDF text wasn't extracted yet, do it now
  if (!contentState.pdfText) {
    contentState.pdfText = extractPdfText();
  }

  // Find the value in the PDF
  const pdfValue = findValueInPdf(module.pdfSelector, contentState.pdfText);
  contentState.pdfValue = pdfValue;

  // Scroll to the text in the PDF to highlight it for the user
  if (pdfValue && contentState.pdfText.includes(pdfValue)) {
    await scrollToPdfText(pdfValue);
  } else if (module.pdfSelector) {
    await scrollToPdfText(module.pdfSelector);
  }

  // Determine if values match
  const match = pdfValue && expectedValue && 
                normalizeValue(pdfValue) === normalizeValue(expectedValue);

  // Create the verification dialog
  createVerificationDialog(module.name, pdfValue, expectedValue, match);
}

// Helper function to normalize values for comparison
function normalizeValue(value) {
  if (!value) return '';
  
  // Try to normalize date formats
  if (value.includes('/') || value.includes('-')) {
    try {
      // Remove any non-numeric/slash characters
      const cleanValue = value.replace(/[^\d\/\-]/g, '');
      
      // Try to parse as date
      const date = new Date(cleanValue);
      if (!isNaN(date.getTime())) {
        // Return MM/DD/YYYY format for consistency
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      }
    } catch (e) {
      // If date parsing fails, fall back to basic normalization
    }
  }
  
  // Basic normalization: lowercase, trim spaces, remove special chars
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Install global error listener to ignore cross-origin iframe load errors
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Could not load iframe')) {
    e.preventDefault();
  }
});

// Log the content script initialization for debugging
console.log('===== CONTENT SCRIPT INITIALIZED =====');
console.log('URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('Chrome Extension ID:', chrome.runtime.id);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log('Content script received message:', message?.action);
  
  // Send an immediate acknowledgment to prevent message port closure
  try {
    sendResponse({ received: true, action: message?.action, status: 'processing' });
  } catch (e) {
    console.warn('Could not send initial response acknowledgment', e);
  }
  
  // First verify message is valid
  if (!message || !message.action) {
    console.error('Invalid message received:', message);
    try {
      sendResponse({ success: false, error: 'Invalid message format' });
    } catch (e) {
      console.error('Could not send error response', e);
    }
    return true;
  }
  
  // Set up a "keep-alive" mechanism to ensure Chrome doesn't terminate the message port prematurely
  // Chrome may terminate the message port if it doesn't receive a response within ~5 seconds
  // This is particularly important for async operations
  const keepAliveInterval = setInterval(() => {
    // Send a progress indicator to keep the message channel open
    try {
      sendResponse({ inProgress: true, timestamp: new Date().toISOString() });
    } catch (e) {
      // If we can't send the response, the channel is probably already closed
      console.warn('Keep-alive response failed, clearing interval', e);
      clearInterval(keepAliveInterval);
    }
  }, 1000);
  
  if (message.action === 'setupAudit') {
    console.log('Setting up audit for type:', message.auditType);
    setupAudit(message.auditType)
      .then(result => {
        clearInterval(keepAliveInterval);
        console.log('Setup completed with result:', result);
        sendResponse(result);
      })
      .catch(error => {
        clearInterval(keepAliveInterval);
        console.error('Error setting up audit:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error during setup' });
      });
    return true; // Will respond asynchronously
  }
  else if (message.action === 'processResident') {
    console.log('Processing resident:', message.resident);
    
    // Clear any previous keepAlive interval for this handler
    clearInterval(keepAliveInterval);
    
    // Create a timeout to ensure we always respond
    const timeoutId = setTimeout(() => {
      console.warn('Processing resident timed out - sending error response');
      clearInterval(keepAliveInterval);
      sendResponse({ 
        success: false, 
        error: 'Operation timed out - check console for details' 
      });
    }, 25000);
    
    processResident(message.resident, message.record)
      .then(result => {
        clearTimeout(timeoutId);
        clearInterval(keepAliveInterval);
        console.log('Resident processing completed with result:', result);
        sendResponse(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        clearInterval(keepAliveInterval);
        console.error('Error processing resident:', error);
        sendResponse({ success: false, error: error.message || 'Unknown error processing resident' });
      });
    return true; // Will respond asynchronously
  } 
  else if (message.action === 'verifyField') {
    console.log('Verifying field:', message.column, message.module.id);
    
    // Clear any previous keepAlive interval for this handler
    clearInterval(keepAliveInterval);
    
    // Create a timeout to ensure we always respond
    const timeoutId = setTimeout(() => {
      console.warn('Field verification timed out - sending error response');
      clearInterval(keepAliveInterval);
      sendResponse({ 
        status: 'error', 
        error: 'Field verification timed out' 
      });
    }, 25000);
    
    verifyField(
      message.column,
      message.module,
      message.expectedValue,
      message.sheetColumn
    ).then(() => {
      clearTimeout(timeoutId);
      clearInterval(keepAliveInterval);
      console.log('Field verification in progress');
      sendResponse({ status: 'verifying' });
    }).catch(error => {
      clearTimeout(timeoutId);
      clearInterval(keepAliveInterval);
      console.error('Error verifying field:', error);
      sendResponse({ status: 'error', error: error.message || 'Unknown error during field verification' });
    });
    return true; // Will respond asynchronously
  }
  else if (message.action === 'ping') {
    // Simple ping to verify content script is alive
    clearInterval(keepAliveInterval); // We'll respond immediately, so no need for keepAlive
    console.log('Ping received from background script');
    
    // Include more debugging information in the response
    const debugInfo = {
      url: window.location.href,
      title: document.title,
      pageType: getCurrentPageType(),
      loadState: document.readyState,
      hasFrames: window.frames.length > 0,
      hasHeader: !!document.querySelector('header'),
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending ping response with debug info:', debugInfo);
    sendResponse({ 
      status: 'alive',
      debug: debugInfo
    });
    return true;
  }

  // For other messages
  console.warn('Unknown message action:', message.action);
  return false;
});