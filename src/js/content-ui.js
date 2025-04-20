// content-ui.js
// UI and DOM manipulation utilities for Entrata Lease Audit Assistant content script

/**
 * Scroll to a specific text in the PDF/document.
 * @param {string} text
 */
export async function scrollToPdfText(text) {
  // Using the browser's built-in find function
  try {
    window.find(text);
  } catch {
    console.warn("Browser find function failed");
    // Continue to fallback method
  }

  // Fallback: manually find and scroll to the element containing the text
  try {
    // Limit to elements that might contain text to reduce performance impact
    const elements = document.querySelectorAll(
      "p, span, div, td, th, li, a, h1, h2, h3, h4, h5, h6, label"
    );
    for (const el of elements) {
      if (el.textContent && el.textContent.includes(text)) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlighted-text");
        setTimeout(() => el.classList.remove("highlighted-text"), 2000);
        break;
      }
    }
  } catch (e) {
    console.warn("Manual scroll fallback failed", e);
  }
}


/**
 * Find and click a resident in the residents list.
 */
import { wait } from "./content-helpers.js";

export async function findAndClickResident(firstName, lastName, tryNextPage = true) {
  // First, try exact match with firstName and lastName
  const exactMatches = Array.from(
    document.querySelectorAll("a, td, span")
  ).filter((el) => {
    if (!el.textContent) return false;
    const text = el.textContent.trim();
    // Check if the element contains exactly firstName lastName (case insensitive)
    const fullNamePattern = new RegExp(
      `\\b${firstName}\\s+${lastName}\\b`,
      "i",
    );
    return fullNamePattern.test(text);
  });

  if (exactMatches.length > 0) {
    console.log(`Found exact match for ${firstName} ${lastName}`);
    // Click the closest clickable parent or the element itself
    const elementToClick =
      findClickableParent(exactMatches[0]) || exactMatches[0];
    elementToClick.click();
    return true;
  }

  // If no exact match, try partial match
  const partialMatches = Array.from(
    document.querySelectorAll("a, td, span")
  ).filter(
    (el) =>
      el.textContent &&
      el.textContent.includes(firstName) &&
      el.textContent.includes(lastName),
  );

  if (partialMatches.length > 0) {
    console.log(`Found partial match for ${firstName} ${lastName}`);
    // Click the closest clickable parent or the element itself
    const elementToClick =
      findClickableParent(partialMatches[0]) || partialMatches[0];
    elementToClick.click();
    return true;
  }

  // If we didn't find the resident and pagination is allowed, try the next page
  if (tryNextPage) {
    console.log(
      `No match found for ${firstName} ${lastName} on current page. Trying next page...`,
    );

    // Find and click the "Next page" button
    if (await clickNextPageButton()) {
      // Wait for the next page to load
      await wait(1500);

      // Search for the resident on the new page (without trying next page again to avoid infinite loops)
      return await findAndClickResident(firstName, lastName, false);
    }
  }

  console.log(
    `No match found for ${firstName} ${lastName} and no more pages to check`,
  );
  return false;
}


/**
 * Click the "Next page" button in the residents list.
 */
export async function clickNextPageButton() {
  console.log("Looking for next page button...");

  // Find any element that looks like a "Next" button
  const nextButtons = Array.from(
    document.querySelectorAll("a, button, span, div"),
  ).filter((el) => {
    if (!el.textContent) return false;

    const text = el.textContent.trim().toLowerCase();
    return (
      // Look for common "next page" indicators
      text === "next" ||
      text === "next page" ||
      text === ">" ||
      text === ">>" ||
      text.includes("next") ||
      // Also check for aria labels
      el.getAttribute("aria-label")?.toLowerCase().includes("next") ||
      // And for common next page classes
      el.className.includes("next") ||
      // Check for pagination with numbers where the current page is highlighted
      (el.textContent.match(/^\d+$/) &&
        !el.classList.contains("active") &&
        !el.classList.contains("current") &&
        document.querySelector(".pagination") !== null)
    );
  });

  console.log(`Found ${nextButtons.length} potential next page buttons`);

  // Try to find the most likely "next page" button
  for (const button of nextButtons) {
    // Skip if it's disabled or has a "disabled" class
    if (
      button.disabled ||
      button.classList.contains("disabled") ||
      button.getAttribute("aria-disabled") === "true"
    ) {
      continue;
    }

    console.log("Clicking next page button:", button.textContent);
    button.click();
    return true;
  }

  // If we can't find a dedicated "Next" button, try to find numbered pagination
  const paginationElements = document.querySelectorAll(
    ".pagination, [role=\"pagination\"], nav",
  );
  for (const pagination of paginationElements) {
    const currentPage = pagination.querySelector(
      ".active, .current, [aria-current=\"true\"]",
    );
    if (currentPage) {
      // Find the next number after the current page
      const currentNumber = parseInt(currentPage.textContent);
      if (!isNaN(currentNumber)) {
        const nextNumberElement = Array.from(
          pagination.querySelectorAll("a, button, span"),
        ).find((el) => parseInt(el.textContent) === currentNumber + 1);

        if (nextNumberElement) {
          console.log(
            "Clicking next page number:",
            nextNumberElement.textContent,
          );
          nextNumberElement.click();
          return true;
        }
      }
    }
  }

  console.log("No next page button found");
  return false;
}


/**
 * Find a clickable parent element.
 */
export function findClickableParent(element) {
  let current = element;
  const maxDepth = 5; // Avoid infinite loops by setting a max depth
  let depth = 0;

  while (current && depth < maxDepth) {
    // Check if the element is a link, button, or has onclick attribute
    if (
      current.tagName === "A" ||
      current.tagName === "BUTTON" ||
      current.getAttribute("onclick") ||
      current.getAttribute("role") === "button"
    ) {
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}


/**
 * Navigate to Documents tab in resident profile.
 */
export function navigateToDocumentsTab() {
  console.log("Looking for Documents tab...");

  // Try multiple selectors to find the Documents tab
  const documentsTab = Array.from(
    document.querySelectorAll(
      "a, button, div, li, span, nav a, nav button, nav div, .nav-item, [role=\"tab\"]",
    ),
  )
    .filter(
      (el) =>
        el.textContent &&
        (el.textContent.trim() === "Documents" ||
          el.textContent.trim().includes("Document") ||
          el.textContent.trim().includes("Doc")),
    )
    .sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.textContent.trim() === "Documents";
      const bExact = b.textContent.trim() === "Documents";
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Otherwise prioritize shorter text (less likely to be a container)
      return a.textContent.length - b.textContent.length;
    })[0];

  if (documentsTab) {
    console.log("Found Documents tab:", documentsTab.textContent);
    documentsTab.click();
    return true;
  }
  return false;
}


/**
 * Find and click on the lease document.
 */
export function findAndClickLeaseDocument() {
  // Fallback: try to find any row that looks like a lease document
  const fallbackRows = Array.from(
    document.querySelectorAll("tr, div, li, span"),
  ).filter(
    (el) =>
      el.textContent &&
      el.textContent.toLowerCase().includes("lease") &&
      !el.textContent.includes("Application"),
  );

  console.log(
    "Found " +
      fallbackRows.length +
      " potential lease documents with generic search",
  );

  if (fallbackRows.length > 0) {
    // Find the click target within the lease row
    const clickTarget =
      fallbackRows[0].querySelector("a") ||
      fallbackRows[0].querySelector("button") ||
      fallbackRows[0];

    console.log("Clicking on:", clickTarget.textContent?.trim());
    clickTarget.click();
    return true;
  }

  console.log("No lease documents found");
  return false;
}


/**
 * Go to the first page of residents.
 */
export function goToFirstPage() {
  // Function to go to the first page of residents
  // This is a placeholder; actual logic should be copied from content.mjs if more complex
  const firstPageButton = document.querySelector(
    ".pagination a, .pagination button, [aria-label=\"First page\"]",
  );
  if (firstPageButton) {
    firstPageButton.click();
    return true;
  }
  return false;
}


/**
 * Set up the residents view (sorting, filters, etc.).
 */
export function setupResidentsView() {
  // Function to set up the residents view (sorting, filters, etc.)
  // This is a placeholder; actual logic should be copied from content.mjs if more complex
  // For now, just log action
  console.log("Setting up residents view...");
}


/**
 * Create the verification dialog.
 */
export function createVerificationDialog(fieldName, pdfValue, expectedValue, match) {
  // Remove any existing dialog
  const existingDialog = document.getElementById("ea-verification-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create the overlay and dialog
  const overlay = document.createElement("div");
  overlay.className = "ea-overlay";
  overlay.id = "ea-verification-overlay";

  const dialog = document.createElement("div");
  dialog.className = "ea-dialog";
  dialog.id = "ea-verification-dialog";

  // Dialog title
  const title = document.createElement("h2");
  title.className = "ea-dialog-title";
  title.textContent = `Verify ${fieldName}`;
  dialog.appendChild(title);

  // Field comparison section
  const comparison = document.createElement("div");
  comparison.className = "ea-field-comparison";

  const fieldLabel = document.createElement("div");
  fieldLabel.className = "ea-field-label";
  fieldLabel.textContent = fieldName;
  comparison.appendChild(fieldLabel);

  const valuesContainer = document.createElement("div");
  valuesContainer.className = "ea-values-container";

  // PDF value box
  const pdfValueBox = document.createElement("div");
  pdfValueBox.className = "ea-value-box";

  const pdfValueLabel = document.createElement("div");
  pdfValueLabel.className = "ea-value-label";
  pdfValueLabel.textContent = "Lease Document Value:";
  pdfValueBox.appendChild(pdfValueLabel);

  const pdfValueText = document.createElement("div");
  pdfValueText.className = "ea-value";
  pdfValueText.textContent = pdfValue || "Not found";
  pdfValueBox.appendChild(pdfValueText);

  // Expected value box
  const expectedValueBox = document.createElement("div");
  expectedValueBox.className = "ea-value-box";
  // ...rest of function from content.mjs...
}

