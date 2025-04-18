/**
 * ColumnHelper - Common utilities for column modules
 * 
 * This file provides helper functions for column modules to use
 */

/**
 * Helper functions for navigating and extracting data in Entrata
 */
const ColumnHelpers = {
  /**
   * Check if a cell has a black fill indicating it should be skipped
   * @param {Object} record - The spreadsheet record
   * @param {string} columnName - The column name to check
   * @returns {boolean} - True if the cell has a black fill and should be skipped
   */
  hasBlackFill(record, columnName) {
    // In a real implementation, this would check for a specific property in the record
    // For now, we'll assume black filled cells are marked with a property like "_blackFill_columnName"
    const blackFillKey = `_blackFill_${columnName}`;
    return record[blackFillKey] === true;
  },

  /**
   * Navigate to a specific page within a resident's profile
   * @param {string} pageName - The page to navigate to (e.g., "Documents", "Household")
   * @returns {Promise<boolean>} - True if navigation was successful
   */
  async navigateToPage(pageName) {
    console.log(`Navigating to ${pageName} page...`);
    
    // Look for the page tab
    const pageElements = Array.from(document.querySelectorAll('a, button, div, li, span, nav a, nav button, nav div, .nav-item, [role="tab"]'))
      .filter(el => el.textContent && 
        (el.textContent.trim() === pageName || 
         el.textContent.trim().includes(pageName)))
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.textContent.trim() === pageName;
        const bExact = b.textContent.trim() === pageName;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Otherwise prioritize shorter text (less likely to be a container)
        return a.textContent.length - b.textContent.length;
      });
    
    if (pageElements.length > 0) {
      const pageTab = pageElements[0];
      console.log(`Found ${pageName} tab:`, pageTab.textContent);
      pageTab.click();
      
      // Wait for the page to load (implement a proper check based on the page)
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
    
    console.log(`${pageName} tab not found`);
    return false;
  },

  /**
   * Find and click on a document in the documents list
   * @param {string} documentPattern - Regex pattern to match the document name
   * @returns {Promise<boolean>} - True if document was found and clicked
   */
  async findAndClickDocument(documentPattern) {
    console.log(`Looking for document matching pattern: ${documentPattern}`);
    
    // Create regex pattern
    const pattern = new RegExp(documentPattern);
    
    // Look for elements containing the pattern in the documents list
    const docRows = Array.from(document.querySelectorAll('tr, div.document-row, a, div, td, span')).filter(el =>
      el.textContent && 
      pattern.test(el.textContent)
    );
    
    console.log(`Found ${docRows.length} potential documents matching pattern "${documentPattern}"`);
    
    if (docRows.length > 0) {
      // Log what we found
      docRows.forEach((row, i) => {
        console.log(`Document ${i + 1}:`, row.textContent?.trim());
      });
    
      // Find the click target within the document row (link, button, etc.)
      const clickTarget = docRows[0].querySelector('a') ||
        docRows[0].querySelector('button') ||
        docRows[0];
      
      console.log('Clicking on:', clickTarget.textContent?.trim());
      clickTarget.click();
      
      // Wait for document to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    }
    
    console.log(`No documents matching "${documentPattern}" pattern found`);
    return false;
  },

  /**
   * Navigate to a specific page in a PDF
   * @param {number} pageNumber - The page number to navigate to
   * @returns {Promise<boolean>} - True if navigation was successful
   */
  async navigateToPdfPage(pageNumber) {
    console.log(`Navigating to PDF page ${pageNumber}...`);
    
    // Look for page input field
    const pageInput = document.querySelector('input[type="text"][aria-label*="Page"], input[type="number"][aria-label*="Page"]');
    
    if (pageInput) {
      // Set value and dispatch events to trigger navigation
      pageInput.value = pageNumber.toString();
      pageInput.dispatchEvent(new Event('change', { bubbles: true }));
      pageInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
    
    // Try using page navigation buttons
    const nextPageButton = document.querySelector('button[aria-label*="Next"], [role="button"][aria-label*="Next"]');
    const prevPageButton = document.querySelector('button[aria-label*="Previous"], [role="button"][aria-label*="Previous"]');
    
    if (nextPageButton || prevPageButton) {
      // Get current page number
      const currentPageText = document.querySelector('span:contains("of"), div:contains("of")');
      let currentPage = 1;
      
      if (currentPageText) {
        const match = currentPageText.textContent.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
          currentPage = parseInt(match[1], 10);
        }
      }
      
      // Navigate to desired page
      while (currentPage < pageNumber && nextPageButton) {
        nextPageButton.click();
        currentPage++;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      while (currentPage > pageNumber && prevPageButton) {
        prevPageButton.click();
        currentPage--;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      await new Promise(resolve => setTimeout(resolve, 700));
      return currentPage === pageNumber;
    }
    
    console.log('PDF page navigation controls not found');
    return false;
  },

  /**
   * Scroll the PDF viewer to show a specific portion of the page
   * @param {string} direction - The direction to scroll ("up", "down", "top", "bottom")
   * @param {number} amount - The amount to scroll (0-1, where 1 is full page height)
   * @returns {Promise<boolean>} - True if scroll was successful
   */
  async scrollPdfViewer(direction, amount = 0.25) {
    console.log(`Scrolling PDF viewer ${direction}...`);
    
    // Find the PDF container
    const pdfContainer = document.querySelector('.pdf-viewer, .pdf-container, iframe.pdf-viewer');
    
    if (pdfContainer) {
      let scrollAmount = 0;
      const containerHeight = pdfContainer.clientHeight;
      
      switch (direction) {
        case 'up':
          scrollAmount = -1 * amount * containerHeight;
          break;
        case 'down':
          scrollAmount = amount * containerHeight;
          break;
        case 'top':
          scrollAmount = -1 * pdfContainer.scrollTop;
          break;
        case 'bottom':
          scrollAmount = pdfContainer.scrollHeight;
          break;
      }
      
      pdfContainer.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
    
    console.log('PDF container not found');
    return false;
  },

  /**
   * Normalize values for comparison (e.g., date formats, currency, etc.)
   * @param {string} value - The value to normalize
   * @param {string} type - The type of value (date, currency, etc.)
   * @returns {string} - The normalized value
   */
  normalizeValue(value, type = 'text') {
    if (!value) return '';
    
    switch (type) {
      case 'date':
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
        break;
      
      case 'currency':
        // Normalize currency values
        if (typeof value === 'string') {
          // Remove currency symbols, commas, and standardize
          const cleanValue = value.replace(/[$,]/g, '').trim();
          const numValue = parseFloat(cleanValue);
          
          if (!isNaN(numValue)) {
            // Return as standard currency format with 2 decimal places
            return numValue.toFixed(2);
          }
        }
        break;
    }
    
    // Basic normalization: lowercase, trim spaces, remove special chars
    return value.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  },

  /**
   * Find a specific text in the PDF and scroll to it
   * @param {string} text - The text to find
   * @returns {Promise<boolean>} - True if text was found and scrolled to
   */
  async findTextInPdf(text) {
    console.log(`Finding text in PDF: "${text}"`);
    
    // Using the browser's built-in find function
    try {
      window.find(text);
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (e) {
      console.warn('Browser find function failed:', e);
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
    } catch (e) {
      console.warn('Manual find and scroll failed:', e);
    }
    
    console.log(`Text "${text}" not found in PDF`);
    return false;
  },

  /**
   * Check if an element with specific text exists on the page
   * @param {string} text - The text to look for
   * @returns {boolean} - True if the text exists on the page
   */
  hasTextOnPage(text) {
    const elements = document.querySelectorAll('p, span, div, td, th, li, a, h1, h2, h3, h4, h5, h6, label');
    
    for (const element of elements) {
      if (element.textContent && element.textContent.includes(text)) {
        return true;
      }
    }
    
    return false;
  }
};

export default ColumnHelpers;