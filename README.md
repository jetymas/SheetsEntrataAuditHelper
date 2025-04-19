# Entrata Lease Audit Assistant

A Chrome extension to streamline lease audits for properties using the Entrata property management system.

## Features

- Automatically navigates Entrata's web interface to find resident profiles and lease documents
- Extracts relevant lease details from PDF documents
- Compares lease data against Google Sheets audit spreadsheet
- Interactive verification workflow with confirmation popups
- Supports both New Lease and Renewal audits
- Automatically updates audit spreadsheet with verification results

## Project Structure & Documentation

- All documentation, guides, trackers, and images are now in the `docs/` folder:
  - `docs/guides/` — How-to guides, process docs, and integration notes
  - `docs/tracking/` — Implementation trackers, test plans, and checklists
  - `docs/images/` — Screenshots and diagrams
  - `docs/design/` — UI/UX and architecture notes
  - `docs/error-logs/` — Error logs (if any)
- Obsolete or historical files are kept in the base-level `archive/` folder for reference
- The former `notes/` and `reference/` folders have been merged or removed as part of the 2025 repo refactor

## Setup Instructions

### Prerequisites

1. Google account with access to Google Sheets
2. Chrome browser
3. Entrata account with access to resident data

### Installation

1. Clone or download this repository
2. In Chrome, navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the root directory of this extension
5. The extension should now appear in your extensions list and toolbar

### Configuration

1. Create a Google Cloud Platform project and enable the Google Sheets API
2. Create OAuth 2.0 credentials for your extension
3. Replace the placeholder in `manifest.json` with your OAuth client ID:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID_HERE",
     "scopes": [
       "https://www.googleapis.com/auth/spreadsheets"
     ]
   }
   ```

## Usage

1. Make sure you are logged into Entrata in your Chrome browser
2. Click the extension icon in your toolbar
3. Paste the URL or ID of your Google Sheets audit spreadsheet
4. Select the audit type (New Lease or Renewal)
5. Click "Start Audit"
6. The extension will guide you through each field verification with popup dialogs
7. Choose to confirm, skip, or flag each field during the verification process
8. The spreadsheet will be updated in real-time with your verification results

## Spreadsheet Format

The extension assumes your Google Sheet follows this structure:
- Header row is on row 8
- Resident data begins on row 9
- Required columns:
  - First Name, Last Name
  - Lease Type (with values "New" or "Renewals")
  - Property
  - Lease Start Date, Lease End Date
  - Base Rate, Total Rate, etc.
  - Checkboxes for verification status

## Technical Details

This extension uses:
- Chrome Extension Manifest V3
- Google Sheets API for spreadsheet integration
- Content scripts for Entrata page interaction
- PDF text parsing for lease data extraction

## Troubleshooting

- Ensure you are logged into Entrata before starting an audit
- If fields are not being found in the PDF, check the field selectors in the configuration
- For Google Sheets authentication issues, verify your OAuth client ID and scopes

## Privacy & Security

- This extension does not store Entrata credentials
- Google authorization is handled securely through Chrome's identity API
- No lease data is stored beyond the current browser session
- All verification results are saved directly to your Google Sheet