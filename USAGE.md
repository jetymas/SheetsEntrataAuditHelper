# Entrata Lease Audit Assistant - Usage Guide

This guide provides detailed instructions on how to use the Entrata Lease Audit Assistant Chrome extension effectively.

## Getting Started

1. **Install the Extension**: Follow the installation steps in the README.md file.

2. **Prepare Your Audit Spreadsheet**: Make sure your Google Sheet follows the required format:

   - Header row on row 8
   - Columns for resident details, lease dates, rent amounts, etc.
   - Columns for verification results (will be updated by the extension)

3. **Log into Entrata**: Before starting an audit, make sure you're logged into your Entrata account in Chrome.

## Running an Audit

1. **Launch the Extension**: Click the extension icon in your Chrome toolbar.

2. **Configure the Audit**:

   - Paste your Google Sheet URL in the "Google Sheet URL" field
   - Select the audit type (New Lease or Renewal)

3. **Start the Audit**: Click the "Start Audit" button.

4. **Authorization**: If this is your first time using the extension with this Google account, you'll be prompted to authorize access to your Google Sheets.

5. **Navigation**: The extension will:

   - Navigate to the Entrata residents page
   - Find the resident from your spreadsheet
   - Open their profile and navigate to the Documents tab
   - Open the lease document

6. **Field Verification**:

   - For each field being verified, a popup will appear showing:
     - The field name (e.g., "Lease Start Date")
     - The value found in the lease document
     - The expected value from your spreadsheet
   - The relevant section of the PDF will be scrolled into view

7. **Verification Actions**:

   - **Confirm**: If both values match and are correct, click "Confirm"
   - **Skip**: If you need to skip this field for any reason, click "Skip" and optionally add a comment
   - **Flag as Mismatch**: If there's a discrepancy between the values, click "Flag as Mismatch" and optionally add a comment

8. **Real-time Updates**: Your Google Sheet will be updated in real-time as you verify each field:

   - Confirmed fields: Checkboxes will be checked (TRUE)
   - Skipped or flagged fields: Comments will be added with your notes

9. **Progress**: The extension popup will show your progress through the audit.

10. **Completion**: When all records have been processed, you'll see a completion message.

## Tips for Effective Auditing

- **Prepare Filters in Advance**: If possible, navigate to the filtered list of residents in Entrata before starting the audit.

- **Multiple Monitors**: Using two monitors (one for Entrata, one for the spreadsheet) can be helpful for tracking progress.

- **Handling Errors**: If the extension can't find a resident or a document, it will log an error and move to the next record.

- **Field Verification Order**: Fields are verified in a logical order, starting with lease dates, then financial information.

- **Session Persistence**: If you need to pause the audit, you can close the extension and resume later. The spreadsheet URL will be saved.

## Troubleshooting

- **Navigation Issues**: If the extension can't find elements on the page, try refreshing the Entrata page and restarting the audit.

- **PDF Extraction Problems**: If text can't be extracted from the PDF viewer, the field will be flagged. Try reopening the document.

- **Authentication Errors**: If you see Google Sheets authorization errors, click the extension icon and try again.

- **Sheet Format Issues**: Make sure your sheet has all the required columns and follows the expected format.

- **Extension Not Responding**: If the extension appears to hang, refresh the page and try again.

## Best Practices

- **Regular Audits**: Run audits frequently to catch discrepancies early.
- **Review Flagged Items**: After an audit completes, review all flagged items in the spreadsheet.

- **Documentation**: Use the comment feature to document reasons for mismatches or skips.

- **Browser Focus**: Keep the Entrata tab as the active tab during the audit process.

- **Internet Connection**: Ensure a stable internet connection for reliable API calls to Google Sheets.
