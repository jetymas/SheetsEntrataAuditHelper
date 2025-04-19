// Content script helper functions for testing

function extractPdfText() {
  const pdfContent = document.querySelector('.pdf-content') ||
    document.querySelector('.pdf-viewer') ||
    (document.querySelector('iframe.pdf-viewer') && document.querySelector('iframe.pdf-viewer').contentDocument.body);
  if (pdfContent) {
    return pdfContent.innerText || pdfContent.textContent;
  }
  return document.body.innerText || document.body.textContent;
}

function findValueInPdf(selector, pdfText) {
  const regex = new RegExp(`${selector}[:\\s]+(.*?)(?=\\n|$)`, 'i');
  const match = pdfText.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  const lines = pdfText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(selector)) {
      const parts = lines[i].split(':');
      if (parts.length > 1) {
        return parts[1].trim();
      }
      if (i + 1 < lines.length) {
        return lines[i + 1].trim();
      }
    }
  }
  return null;
}

function clickNextPageButton() {
  const nextButtons = Array.from(document.querySelectorAll('a, button, span, div')).filter(el => {
    if (!el.textContent) return false;
    const text = el.textContent.trim().toLowerCase();
    return (
      text === 'next' || text === 'next page' || text === '>' || text === '>>' ||
      text.includes('next') ||
      (el.getAttribute('aria-label') && el.getAttribute('aria-label').toLowerCase().includes('next'))
    );
  });
  if (nextButtons.length > 0) {
    nextButtons[0].click();
    return true;
  }
  return false;
}

function findClickableParent(el) {
  // For testing, always return null to use direct element
  return null;
}

async function findAndClickResident(firstName, lastName, tryNextPage = true) {
  const exactMatches = Array.from(document.querySelectorAll('a, td, span')).filter(node => {
    if (!node.textContent) return false;
    const text = node.textContent.trim();
    const pattern = new RegExp(`\\b${firstName}\\s+${lastName}\\b`, 'i');
    return pattern.test(text);
  });
  if (exactMatches.length > 0) {
    const elementToClick = findClickableParent(exactMatches[0]) || exactMatches[0];
    elementToClick.click();
    return true;
  }
  const partialMatches = Array.from(document.querySelectorAll('a, td, span')).filter(node =>
    node.textContent && node.textContent.includes(firstName) && node.textContent.includes(lastName)
  );
  if (partialMatches.length > 0) {
    const elementToClick = findClickableParent(partialMatches[0]) || partialMatches[0];
    elementToClick.click();
    return true;
  }
  return false;
}

async function scrollToPdfText(text) {
  // Try built-in find to highlight
  try { window.find(text); } catch {}
  const elements = document.querySelectorAll('p, span, div, td, th, li, a, h1, h2, h3, h4, h5, h6, label');
  for (const element of elements) {
    if (element.textContent && element.textContent.includes(text)) {
      // Scroll into view if available
      try { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
      // Briefly highlight element
      try {
        const original = element.style.backgroundColor;
        element.style.backgroundColor = 'yellow';
        element.style.backgroundColor = original;
      } catch {}
      return true;
    }
  }
  return false;
}

module.exports = {
  extractPdfText,
  findValueInPdf,
  clickNextPageButton,
  findAndClickResident,
  scrollToPdfText
};
