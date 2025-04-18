// src/js/sheets.js
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!token) {
        reject(new Error('Failed to obtain authentication token'));
      } else {
        resolve(token);
      }
    });
  });
}

async function fetchSheetData(spreadsheetId, sheetName = 'Lease Audit', headerRow = 8) {
  const token = await getAuthToken();
  // fetch headers
  const headerRange = `${sheetName}!${headerRow}:${headerRow}`;
  const headerRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${headerRange}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!headerRes.ok) throw new Error(`Failed to fetch headers: ${headerRes.statusText}`);
  const headerJson = await headerRes.json();
  if (!headerJson.values || !headerJson.values[0]) throw new Error('No header values found');
  const headers = headerJson.values[0];

  // fetch rows
  const dataRange = `${sheetName}!${headerRow + 1}:1000`;
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${dataRange}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!dataRes.ok) throw new Error(`Failed to fetch data: ${dataRes.statusText}`);
  const dataJson = await dataRes.json();
  const rows = dataJson.values || [];

  const records = rows.map((row, i) => {
    const record = { _row: (headerRow + 1 + i).toString() };
    headers.forEach((h, idx) => {
      record[h] = row[idx] || '';
    });
    return record;
  });

  return { headers, records };
}

async function updateSheetCell(spreadsheetId, sheetName, cellRef, value) {
  const token = await getAuthToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${cellRef}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [[value]] })
    }
  );
  if (!res.ok) throw new Error(`Failed to update cell: ${res.statusText}`);
  return res.json();
}

async function addSheetComment(spreadsheetId, sheetName, cellRef, comment) {
  const token = await getAuthToken();
  // get sheet ID
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!metaRes.ok) throw new Error(`Failed to get sheet metadata: ${metaRes.statusText}`);
  const metaJson = await metaRes.json();
  const sheet = metaJson.sheets.properties.find(s => s.title === sheetName);
  if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
  const sheetId = sheet.sheetId;

  // add developer metadata as comment workaround
  const batchRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            createDeveloperMetadata: {
              developerMetadata: {
                metadataKey: 'comment',
                metadataValue: comment,
                visibility: 'DOCUMENT',
                location: { metadataLocation: { dimensionRange: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: parseInt(cellRef.replace(/\D+/g, '')) - 1,
                  endIndex: parseInt(cellRef.replace(/\D+/g, ''))
                } } }
              }
            }
          }
        ]
      })
    }
  );
  if (!batchRes.ok) throw new Error(`Failed to add comment: ${batchRes.statusText}`);
  return batchRes.json();
}

module.exports = {
  getAuthToken,
  fetchSheetData,
  updateSheetCell,
  addSheetComment
};
