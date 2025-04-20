// src/js/sheets.mjs
/**
 * Acquire a Google OAuth token using chrome.identity.
 * @returns {Promise<string>} Auth token string.
 */
async function getAuthToken() {
  if (typeof globalThis !== "undefined" && globalThis.__E2E_TEST__) {
    // E2E test mode: return a fake token
    return "fake-e2e-token";
  }
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!token) {
        reject(new Error("Failed to obtain authentication token"));
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Fetch headers and records from a Google Sheets spreadsheet.
 * @param {string} spreadsheetId - ID of the spreadsheet.
 * @param {string} [sheetName="Lease Audit"] - Sheet name/tab.
 * @param {number} [headerRow=8] - Row number where headers are located.
 * @returns {Promise<{headers: string[], records: object[]}>}
 */
async function fetchSheetData(
  spreadsheetId,
  sheetName = "Lease Audit",
  headerRow = 8,
) {
  const token = await getAuthToken();
  // fetch headers
  const headerRange = `${sheetName}!${headerRow}:${headerRow}`;
  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!headerRes.ok)
    throw new Error(`Failed to fetch headers: ${headerRes.statusText}`);
  const headerJson = await headerRes.json();
  if (!headerJson.values || !headerJson.values[0])
    throw new Error("No header values found");
  const headers = headerJson.values[0];

  // fetch rows
  const dataRange = `${sheetName}!${headerRow + 1}:1000`;
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${dataRange}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!dataRes.ok)
    throw new Error(`Failed to fetch data: ${dataRes.statusText}`);
  const dataJson = await dataRes.json();
  const rows = dataJson.values || [];

  const records = rows.map((row, i) => {
    const record = { _row: (headerRow + 1 + i).toString() };
    headers.forEach((h, idx) => {
      record[h] = row[idx] || "";
    });
    return record;
  });

  return { headers, records };
}

/**
 * Update a single cell in the Google Sheet.
 * @param {string} spreadsheetId - ID of the spreadsheet.
 * @param {string} sheetName - Name of the sheet/tab.
 * @param {string} cellRef - Cell reference (e.g., "A1").
 * @param {string|number} value - Value to set.
 * @returns {Promise<object>} API response JSON.
 */
async function updateSheetCell(spreadsheetId, sheetName, cellRef, value) {
  const token = await getAuthToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${cellRef}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [[value]] }),
    },
  );
  if (!res.ok) throw new Error(`Failed to update cell: ${res.statusText}`);
  return res.json();
}

/**
 * Add a comment to a cell in the Google Sheet via batchUpdate.
 * @param {string} spreadsheetId - ID of the spreadsheet.
 * @param {string} sheetName - Name of the sheet/tab.
 * @param {string} cellRef - Cell reference (e.g., "A1").
 * @param {string} comment - Comment text.
 * @returns {Promise<object>} API response JSON or {success: false, error}.
 */
async function addSheetComment(spreadsheetId, sheetName, cellRef, comment) {
  const token = await getAuthToken();
  // get sheet ID
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!metaRes.ok)
    throw new Error(`Failed to get sheet metadata: ${metaRes.statusText}`);
  const metaJson = await metaRes.json();
  const sheet = metaJson.sheets.find(
    (s) => s.properties.title === sheetName,
  )?.properties;
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  const sheetId = sheet.sheetId;

  // add developer metadata as comment workaround
  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            createDeveloperMetadata: {
              developerMetadata: {
                metadataKey: "comment",
                metadataValue: comment,
                visibility: "DOCUMENT",
                location: {
                  metadataLocation: {
                    dimensionRange: {
                      sheetId: sheetId,
                      dimension: "ROWS",
                      startIndex: parseInt(cellRef.replace(/\D+/g, "")) - 1,
                      endIndex: parseInt(cellRef.replace(/\D+/g, "")),
                    },
                  },
                },
              },
            },
          },
        ],
      }),
    },
  );
  if (!batchRes.ok)
    throw new Error(`Failed to add comment: ${batchRes.statusText}`);
  return batchRes.json();
}

export default {
  getAuthToken,
  fetchSheetData,
  updateSheetCell,
  addSheetComment,
};

// Named exports for Jest
export { getAuthToken, fetchSheetData, updateSheetCell, addSheetComment };
